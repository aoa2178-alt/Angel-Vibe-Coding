(() => {
  // Per-viewer conveniences only. Guidelines, examples and history live on the server, shared by the team.
  const LOCAL = { key: "draft-rewriter.apiKey", access: "draft-rewriter.accessCode", profile: "draft-rewriter.profileId" };
  const UNDO_LIMIT = 30;
  const HISTORY_LIMIT = 200;
  const SAMPLES = window.DEMO_SAMPLES || [];
  const VARIANT_LABELS = [["short", "Short"], ["punchy", "Punchy"], ["formal", "Formal"]];

  // Shared principles from the Vercel / Ramp / Shopify research. Only loaded when someone asks.
  const RESEARCH_PRINCIPLES =
`- Lead with the reader's outcome, not the feature.
- Be specific: use numbers instead of adjectives, and name real customers instead of "teams everywhere".
- Back every big claim with proof right next to it, and cite the source of any statistic.
- Keep sentences short, one idea each. Paired contrasts work well for headlines.
- Write to "you", in active voice. Buttons start with a verb and say exactly what happens (never "Continue", "Submit" or "Click here").
- Use the reader's own words: don't explain what they already know, and don't use jargon they don't.
- Name the reader's pain concretely before offering the fix.
- Answer the reader's likely objection in the copy (price, effort, risk).
- Be confident, not hyped: no absolutes ("every", "all", "guaranteed"), and at most one exclamation mark per page.
- Use one term for each concept, everywhere.
- Error messages say what happened, why, and how to fix it, without blaming the reader.`;

  // ---------- Elements ----------
  const $ = (id) => document.getElementById(id);
  const fields = { guidelines: $("guidelines"), examples: $("examples"), draft: $("draft") };
  const apiKey = $("apiKey"), rememberKey = $("rememberKey"), modePill = $("modePill"), keybar = $("keybar");
  const profileSelect = $("profileSelect"), newProfileBtn = $("newProfileBtn"), renameProfileBtn = $("renameProfileBtn"), deleteProfileBtn = $("deleteProfileBtn");
  const saveStatus = $("saveStatus"), conflictBanner = $("conflictBanner"), conflictText = $("conflictText");
  const gate = $("gate"), gateForm = $("gateForm"), gateCode = $("gateCode"), gateError = $("gateError");
  const rewriteBtn = $("rewriteBtn"), stopBtn = $("stopBtn"), clearBtn = $("clearBtn");
  const copyBtn = $("copyBtn"), useBtn = $("useBtn");
  const result = $("result"), notice = $("notice"), meta = $("meta"), resultCount = $("resultCount");
  const original = $("original"), originalCount = $("originalCount");
  const analysisEl = $("analysis"), issuesList = $("issuesList"), issuesCount = $("issuesCount");
  const changesList = $("changesList"), changesCount = $("changesCount");
  const variantsSection = $("variantsSection"), variantsEl = $("variants");
  const feedback = $("feedback"), rateUp = $("rateUp"), rateDown = $("rateDown"), rateSaved = $("rateSaved");
  const fbComment = $("fbComment"), fbSubmit = $("fbSubmit"), fbResult = $("fbResult");
  const undoBtn = $("undoBtn"), downloadBtn = $("downloadBtn"), seedBtn = $("seedBtn");
  const historyList = $("historyList"), historyCount = $("historyCount");

  let config = null;        // { model, claude: "server" | "byok", storage: "blob" | "file" | "none" }
  let profiles = [];        // [{ id, name, updatedAt }]
  let profile = null;       // the open profile, including unsaved local edits
  let activeSample = SAMPLES[0];
  let controller = null;
  let outputText = "";
  let lastRun = null;       // { draft, output, demo, rating }
  let fbBusy = false;

  // ---------- Helpers ----------
  const words = (s) => (s.trim().match(/\S+/g) || []).length;
  const fmtCount = (s) => { const w = words(s); return w ? `${w} word${w === 1 ? "" : "s"}` : ""; };
  const hasClaude = () => config?.claude === "server" || (config?.claude === "byok" && apiKey.value.trim() !== "");
  const isBusy = () => !!controller || fbBusy;

  function storage(fn) { try { return fn(); } catch { return null; } }

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") node.className = v;
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) node.append(c.nodeType ? c : String(c));
    return node;
  }

  function updateCounts() {
    document.querySelectorAll("[data-count-for]").forEach((n) => {
      n.textContent = fmtCount(fields[n.dataset.countFor].value);
    });
    const empty = !fields.guidelines.value.trim();
    document.querySelectorAll(".seed-only").forEach((n) => n.classList.toggle("hidden", !empty || !profile));
  }

  function updateMode() {
    if (!config) return;
    keybar.classList.toggle("hidden", config.claude !== "byok");
    const label = config.claude === "server" ? `Team key · ${config.model}`
      : hasClaude() ? `Your key · ${config.model}`
      : "Demo mode · sample answers";
    modePill.textContent = label;
    modePill.classList.toggle("live", hasClaude());
    modePill.title = config.storage === "blob" ? "Profiles are shared with the team." : config.storage === "file" ? "Profiles are saved on this computer (local development)." : "";
  }

  function setNotice(text, kind) {
    if (!text) { notice.classList.add("hidden"); return; }
    notice.textContent = text;
    notice.className = "notice" + (kind ? ` ${kind}` : "");
  }

  function setBusy(busy) {
    rewriteBtn.disabled = busy;
    rewriteBtn.textContent = busy ? "Rewriting…" : "Rewrite";
    stopBtn.classList.toggle("hidden", !busy);
    Object.values(fields).forEach((f) => (f.readOnly = busy));
    refreshProfileControls();
  }

  // ---------- Server API ----------
  function requestHeaders() {
    const h = { "content-type": "application/json" };
    const code = storage(() => localStorage.getItem(LOCAL.access));
    if (code) h["x-access-code"] = code;
    if (config?.claude === "byok" && apiKey.value.trim()) h["x-anthropic-key"] = apiKey.value.trim();
    return h;
  }

  // JSON calls return parsed data; streaming responses come back as the raw Response.
  async function api(path, { method = "GET", body, signal } = {}) {
    let res;
    try {
      res = await fetch(path, { method, signal, headers: requestHeaders(), body: body === undefined ? undefined : JSON.stringify(body) });
    } catch (err) {
      if (err.name === "AbortError") throw err;
      throw new Error("Couldn't reach the server. Check your connection and try again.");
    }
    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    if (res.ok && !isJson) return res;
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok) {
      if (data?.error?.type === "access_denied") showGate(data.error.message);
      const err = new Error(data?.error?.message || `The request failed (status ${res.status}).`);
      err.status = res.status;
      err.type = data?.error?.type;
      err.data = data;
      throw err;
    }
    return data;
  }

  // ---------- Access gate ----------
  function showGate(message) {
    gate.classList.remove("hidden");
    const tried = !!storage(() => localStorage.getItem(LOCAL.access));
    gateError.textContent = message || "";
    gateError.classList.toggle("hidden", !tried || !message);
    setTimeout(() => gateCode.focus(), 0);
  }

  gateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const code = gateCode.value.trim();
    if (!code) return;
    storage(() => localStorage.setItem(LOCAL.access, code));
    gate.classList.add("hidden");
    boot();
  });

  // ---------- Profiles ----------
  function setSaveStatus(state, message) {
    const where = config?.storage === "file" ? "on this computer" : "for the team";
    const text = { saved: `Saved ${where}`, saving: "Saving…", dirty: "Unsaved changes", error: `Couldn't save: ${message}`, conflict: "Not saved: see the message above" }[state] || "";
    saveStatus.textContent = text;
    saveStatus.classList.toggle("error", state === "error" || state === "conflict");
  }

  function refreshProfileControls() {
    const ready = !!profile && !isBusy();
    profileSelect.disabled = !ready;
    newProfileBtn.disabled = !config || isBusy();
    renameProfileBtn.disabled = !ready;
    deleteProfileBtn.disabled = !ready || profiles.length <= 1;
    deleteProfileBtn.title = profiles.length <= 1 ? "You can't delete the only profile." : "";
  }

  function renderProfileOptions() {
    profileSelect.replaceChildren(...profiles.map((p) => el("option", { value: p.id }, p.name)));
    if (profile) profileSelect.value = profile.id;
    refreshProfileControls();
  }

  async function loadProfiles(preferredId) {
    const data = await api("/api/profiles");
    profiles = data.profiles;
    const saved = storage(() => localStorage.getItem(LOCAL.profile));
    const pick = [preferredId, profile?.id, saved].find((id) => id && profiles.some((p) => p.id === id)) || profiles[0]?.id;
    renderProfileOptions();
    if (pick) await openProfile(pick);
  }

  async function openProfile(id) {
    if (profile && id !== profile.id) await flushSave();
    const data = await api(`/api/profile?id=${encodeURIComponent(id)}`);
    setProfile(data.profile);
  }

  function setProfile(p) {
    const switching = profile?.id !== p.id;
    profile = { ...p, history: p.history || [], undo: p.undo || [] };
    dirty = 0; savedDirty = 0;
    fields.guidelines.value = profile.guidelines;
    fields.examples.value = profile.examples;
    storage(() => localStorage.setItem(LOCAL.profile, profile.id));
    const i = profiles.findIndex((x) => x.id === p.id);
    if (i >= 0) profiles[i] = { id: p.id, name: p.name, updatedAt: p.updatedAt };
    renderProfileOptions();
    updateCounts();
    renderHistory();
    refreshUndo();
    hideConflict();
    setSaveStatus("saved");
    if (switching) {
      setOutput(""); setNotice(""); meta.textContent = "";
      resetResults(); resetFeedback(null);
    }
  }

  // ---------- Saving (debounced, with conflict detection) ----------
  // Storage writes are metered (Vercel Blob's free plan includes 2,000 a month), so typing is
  // saved once it pauses for a few seconds, or as soon as the box loses focus.
  const SAVE_DELAY = 4000;
  let dirty = 0, savedDirty = 0, saveTimer = null, saving = null, conflict = null;

  function markDirty({ now = false } = {}) {
    if (!profile) return;
    dirty++;
    if (conflict) { setSaveStatus("conflict"); return; }
    setSaveStatus("dirty");
    clearTimeout(saveTimer);
    if (now) saveNow();
    else saveTimer = setTimeout(saveNow, SAVE_DELAY);
  }

  function saveNow() {
    clearTimeout(saveTimer);
    if (!profile || conflict || dirty === savedDirty) return saving || Promise.resolve();
    if (saving) return saving.then(saveNow);
    const target = dirty;
    const snapshot = { ...profile };
    setSaveStatus("saving");
    saving = (async () => {
      try {
        const data = await api(`/api/profile?id=${encodeURIComponent(snapshot.id)}`, {
          method: "PUT",
          body: { version: snapshot.version, name: snapshot.name, guidelines: snapshot.guidelines, examples: snapshot.examples, history: snapshot.history, undo: snapshot.undo }
        });
        if (profile?.id !== snapshot.id) return;
        profile.version = data.profile.version;
        profile.updatedAt = data.profile.updatedAt;
        savedDirty = target;
        setSaveStatus(dirty === savedDirty ? "saved" : "dirty");
        // Edits made while this save was in flight go out in the next one.
        if (dirty !== savedDirty) saveTimer = setTimeout(saveNow, SAVE_DELAY);
      } catch (err) {
        if (err.status === 409 && err.data?.current) showConflict(err.data.current);
        else if (err.status === 404) setSaveStatus("error", "this profile was deleted");
        else setSaveStatus("error", err.message);
      } finally {
        saving = null;
      }
    })();
    return saving;
  }

  async function flushSave() {
    if (saving) await saving;
    if (dirty !== savedDirty && !conflict) await saveNow();
  }

  function showConflict(theirs) {
    conflict = theirs;
    conflictText.textContent = `A teammate changed “${theirs.name}” while you were editing, so your latest edits weren't saved. Load latest drops your unsaved edits. Keep mine saves your version over theirs.`;
    conflictBanner.classList.remove("hidden");
    setSaveStatus("conflict");
  }

  function hideConflict() {
    conflict = null;
    conflictBanner.classList.add("hidden");
  }

  $("loadLatestBtn").addEventListener("click", () => { if (conflict) setProfile(conflict); });
  $("keepMineBtn").addEventListener("click", () => {
    if (!conflict || !profile) return;
    profile.version = conflict.version;
    hideConflict();
    markDirty({ now: true });
  });

  // ---------- Profile actions ----------
  profileSelect.addEventListener("change", async () => {
    const id = profileSelect.value;
    try { await openProfile(id); }
    catch (err) { setSaveStatus("error", err.message); if (profile) profileSelect.value = profile.id; }
  });

  newProfileBtn.addEventListener("click", async () => {
    const name = (prompt("Name the new voice profile (for example, Investor updates):") || "").trim();
    if (!name) return;
    try {
      await flushSave();
      const data = await api("/api/profiles", { method: "POST", body: { name } });
      await loadProfiles(data.profile.id);
      fields.guidelines.focus();
    } catch (err) { setSaveStatus("error", err.message); }
  });

  renameProfileBtn.addEventListener("click", () => {
    if (!profile) return;
    const name = (prompt("Rename this voice profile:", profile.name) || "").trim();
    if (!name || name === profile.name) return;
    profile.name = name;
    const i = profiles.findIndex((p) => p.id === profile.id);
    if (i >= 0) profiles[i].name = name;
    renderProfileOptions();
    markDirty({ now: true });
  });

  deleteProfileBtn.addEventListener("click", async () => {
    if (!profile || profiles.length <= 1) return;
    if (!confirm(`Delete “${profile.name}” for the whole team? Its guidelines, examples and history will be gone.`)) return;
    try {
      clearTimeout(saveTimer);
      await api(`/api/profile?id=${encodeURIComponent(profile.id)}`, { method: "DELETE" });
      profile = null;
      await loadProfiles();
    } catch (err) { setSaveStatus("error", err.message); }
  });

  // ---------- Guidelines: undo & history ----------
  function refreshUndo() { undoBtn.disabled = !profile || profile.undo.length === 0; }

  function logHistory(entry) {
    if (!profile) return;
    profile.history.unshift({ at: new Date().toISOString(), ...entry });
    profile.history = profile.history.slice(0, HISTORY_LIMIT);
    renderHistory();
  }

  function renderHistory() {
    const h = profile?.history || [];
    historyCount.textContent = h.length;
    historyList.replaceChildren(...h.map((e) => {
      const when = new Date(e.at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      return el("li", {},
        el("div", { class: "h-when" }, when),
        el("div", { class: "h-what" }, e.summary),
        e.rules?.length ? el("ul", { style: "margin:3px 0 0;padding-left:18px" }, e.rules.map((r) => el("li", { style: "border:none;padding:0" }, r))) : null,
        e.comment ? el("div", { class: "h-from" }, `From feedback: “${e.comment}”`) : null
      );
    }));
  }

  // Replace the guidelines with a new version, keeping the old one for undo, and save right away.
  function applyGuidelines(next, entry) {
    if (!profile) return;
    profile.undo = [...profile.undo, profile.guidelines].slice(-UNDO_LIMIT);
    profile.guidelines = next;
    fields.guidelines.value = next;
    logHistory(entry);
    updateCounts();
    refreshUndo();
    fields.guidelines.classList.remove("flash");
    void fields.guidelines.offsetWidth;
    fields.guidelines.classList.add("flash");
    markDirty({ now: true });
  }

  function undoGuidelines() {
    if (!profile || !profile.undo.length) return;
    profile.guidelines = profile.undo.pop();
    fields.guidelines.value = profile.guidelines;
    logHistory({ kind: "undo", summary: "Undid the last change to the guidelines." });
    updateCounts();
    refreshUndo();
    markDirty({ now: true });
  }

  // ---------- Output rendering ----------
  function setOutput(text, { streaming = false } = {}) {
    outputText = text;
    result.textContent = text || (streaming ? "" : "Your rewrite will appear here.");
    result.classList.toggle("empty", !text && !streaming);
    result.classList.toggle("cursor", streaming);
    resultCount.textContent = fmtCount(text);
    const has = !!text.trim() && !streaming;
    copyBtn.disabled = !has;
    useBtn.disabled = !has;
  }

  // Original pane: the draft as submitted, with each broken-guideline phrase highlighted and numbered.
  function renderOriginal(text, issues = []) {
    originalCount.textContent = fmtCount(text || "");
    if (!text) {
      original.textContent = "Your draft will appear here.";
      original.classList.add("empty");
      return;
    }
    original.classList.remove("empty");
    const ranges = [];
    issues.forEach((issue, i) => {
      const phrase = issue.phrase || "";
      if (!phrase) return;
      let from = 0, at;
      while ((at = text.indexOf(phrase, from)) !== -1) {
        const end = at + phrase.length;
        if (!ranges.some((r) => at < r.end && end > r.start)) { ranges.push({ start: at, end, n: i + 1, guideline: issue.guideline }); break; }
        from = at + 1;
      }
    });
    ranges.sort((a, b) => a.start - b.start);
    const nodes = [];
    let pos = 0;
    for (const r of ranges) {
      if (r.start > pos) nodes.push(text.slice(pos, r.start));
      nodes.push(el("mark", { class: "flag", title: r.guideline, "data-n": r.n }, text.slice(r.start, r.end), el("sup", {}, r.n)));
      pos = r.end;
    }
    nodes.push(text.slice(pos));
    original.replaceChildren(...nodes);
  }

  function highlightIssue(n, on) {
    original.querySelectorAll(`mark[data-n="${n}"]`).forEach((m) => m.classList.toggle("active", on));
  }

  function renderAnalysis(data) {
    analysisEl.classList.remove("hidden");
    if (!data) {
      issuesCount.textContent = changesCount.textContent = "";
      issuesList.replaceChildren(el("li", { class: "placeholder" }, "Checking the draft against your guidelines…"));
      changesList.replaceChildren(el("li", { class: "placeholder" }, "Listing the changes…"));
      return;
    }
    const issues = data.broken_guidelines || [];
    const changes = data.changes || [];
    issuesCount.textContent = issues.length ? String(issues.length) : "";
    changesCount.textContent = changes.length ? String(changes.length) : "";

    issuesList.replaceChildren(...(issues.length ? issues.map((issue, i) => {
      const found = original.querySelector(`mark[data-n="${i + 1}"]`);
      return el("li", {
        class: "issue",
        onmouseenter: () => highlightIssue(i + 1, true),
        onmouseleave: () => highlightIssue(i + 1, false)
      },
        el("span", { class: "num" }, i + 1),
        el("div", {},
          el("div", { class: "quote" }, `“${issue.phrase}”`),
          el("div", { class: "rule" }, issue.guideline, found ? null : " (phrase not found in the original)")
        )
      );
    }) : [el("li", { class: "placeholder" }, fields.guidelines.value.trim() ? "The draft didn't break any guidelines." : "Add guidelines to check the draft against them.")]));

    changesList.replaceChildren(...(changes.length ? changes.map((c) => el("li", {},
      el("div", { class: "change-edit" },
        c.before ? el("span", { class: "before" }, c.before) : el("span", { class: "reason" }, "Added"),
        el("span", { class: "arrow", "aria-hidden": "true" }, "→"),
        c.after ? el("span", { class: "after" }, c.after) : el("span", { class: "reason" }, "Removed")
      ),
      el("div", { class: "reason" }, c.reason)
    )) : [el("li", { class: "placeholder" }, "No changes listed.")]));
  }

  function renderVariants(variants) {
    variantsSection.classList.remove("hidden");
    variantsEl.replaceChildren(...VARIANT_LABELS.map(([key, label]) => {
      const text = variants?.[key] || "";
      const copy = el("button", { class: "btn small", type: "button", disabled: !text }, "Copy");
      copy.addEventListener("click", () => copyText(text, copy));
      const use = el("button", { class: "btn small", type: "button", disabled: !text, title: "Replace the draft with this variant" }, "Use as draft");
      use.addEventListener("click", () => { fields.draft.value = text; updateCounts(); fields.draft.focus(); });
      return el("div", { class: "variant" },
        el("div", { class: "variant-head" }, el("strong", {}, label), el("span", { class: "count" }, fmtCount(text))),
        variants ? el("div", { class: "body" }, text) : el("div", { class: "body placeholder" }, "Writing…"),
        el("div", { class: "row" }, copy, use)
      );
    }));
  }

  function resetResults() {
    renderOriginal("");
    analysisEl.classList.add("hidden");
    variantsSection.classList.add("hidden");
  }

  async function copyText(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = el("textarea", { style: "position:fixed;opacity:0" });
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
    const label = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => (btn.textContent = label), 1400);
  }

  // Pull a top-level string field out of a JSON document that is still streaming in.
  function partialStringField(json, key) {
    const k = json.indexOf(`"${key}"`);
    if (k === -1) return null;
    const colon = json.indexOf(":", k + key.length + 2);
    if (colon === -1) return null;
    const open = json.indexOf('"', colon + 1);
    if (open === -1) return "";
    const esc = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f" };
    let out = "";
    for (let i = open + 1; i < json.length; i++) {
      const ch = json[i];
      if (ch === '"') return out;
      if (ch !== "\\") { out += ch; continue; }
      const nx = json[i + 1];
      if (nx === undefined) break;
      if (nx === "u") {
        if (i + 6 > json.length) break;
        out += String.fromCharCode(parseInt(json.slice(i + 2, i + 6), 16));
        i += 5;
      } else {
        out += esc[nx] ?? nx;
        i += 1;
      }
    }
    return out;
  }

  // ---------- Samples & demo ----------
  function loadSample(sample) {
    activeSample = sample;
    fields.draft.value = sample.draft;
    document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c.dataset.id === sample.id)));
    updateCounts();
    setOutput("");
    setNotice("");
    meta.textContent = "";
    resetResults();
    resetFeedback(null);
  }

  function matchingSample() {
    const d = fields.draft.value.trim();
    return SAMPLES.find((s) => s.draft.trim() === d) || null;
  }

  async function runDemo(signal) {
    let sample = matchingSample();
    if (!fields.draft.value.trim()) {
      loadSample(activeSample);
      sample = activeSample;
    }
    if (sample) {
      setNotice("Demo mode: this is a pre-written sample answer. Add a Claude API key to rewrite your own text.");
    } else {
      sample = activeSample;
      setNotice(`Demo mode: without an API key your text isn't sent anywhere, so here's the sample answer for the "${sample.label}" draft instead. Add a Claude API key to rewrite your own draft.`);
    }
    renderOriginal(sample.draft.trim());
    renderAnalysis(null);
    renderVariants(null);
    await new Promise((r) => setTimeout(r, 550));
    const tokens = sample.rewrite.match(/\s+|[^\s]+/g) || [];
    let text = "";
    for (const t of tokens) {
      if (signal.aborted) break;
      text += t;
      setOutput(text, { streaming: true });
      if (/\S/.test(t)) await new Promise((r) => setTimeout(r, 14 + Math.random() * 22));
    }
    const data = { rewrite: sample.rewrite, broken_guidelines: sample.broken_guidelines, changes: sample.changes, variants: sample.variants };
    return { text, data: signal.aborted ? null : data, original: sample.draft.trim(), stopped: signal.aborted, demo: true };
  }

  // ---------- Live rewrite (streamed from /api/rewrite) ----------
  async function runLive(signal) {
    let res;
    try {
      res = await api("/api/rewrite", {
        method: "POST",
        signal,
        body: { guidelines: fields.guidelines.value, examples: fields.examples.value, draft: fields.draft.value }
      });
    } catch (err) {
      if (err.name === "AbortError") return { text: "", data: null, stopped: true, usage: {} };
      throw err;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "", json = "", text = "", stopReason = null, model = config.model, usage = {};

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const dataLine = chunk.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trim()).join("");
          if (!dataLine) continue;
          let evt;
          try { evt = JSON.parse(dataLine); } catch { continue; }

          if (evt.type === "message_start") {
            model = evt.message?.model || model;
            usage = { ...usage, ...evt.message?.usage };
          } else if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
            json += evt.delta.text;
            const partial = partialStringField(json, "rewrite");
            if (partial !== null && partial !== text) {
              text = partial;
              setOutput(text, { streaming: true });
            }
          } else if (evt.type === "message_delta") {
            stopReason = evt.delta?.stop_reason ?? stopReason;
            usage = { ...usage, ...evt.usage };
          } else if (evt.type === "error") {
            throw new Error(evt.error?.type === "overloaded_error"
              ? "The Claude API is overloaded right now. Try again in a moment."
              : `The rewrite stopped partway through: ${evt.error?.message || "unknown error"}.`);
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return { text, data: null, stopped: true, model, usage };
      throw err;
    }
    let data = null;
    try { data = JSON.parse(json); } catch {}
    if (data && typeof data.rewrite === "string") text = data.rewrite;
    return { text, data, stopReason, model, usage };
  }

  async function rewrite() {
    if (isBusy() || !config) return;
    if (hasClaude() && !fields.draft.value.trim()) {
      setNotice("Paste a draft to rewrite first.", "error");
      fields.draft.focus();
      return;
    }

    controller = new AbortController();
    setBusy(true);
    setNotice("");
    meta.textContent = "";
    resetFeedback(null);
    resetResults();
    setOutput("", { streaming: true });
    const submitted = fields.draft.value.trim();
    if (hasClaude()) {
      renderOriginal(submitted);
      renderAnalysis(null);
      renderVariants(null);
    }
    const started = performance.now();

    try {
      const r = hasClaude() ? await runLive(controller.signal) : await runDemo(controller.signal);
      setOutput(r.text);
      const secs = ((performance.now() - started) / 1000).toFixed(1);
      const originalText = r.original ?? submitted;

      if (r.data) {
        renderOriginal(originalText, r.data.broken_guidelines);
        renderAnalysis(r.data);
        renderVariants(r.data.variants);
      } else {
        renderOriginal(originalText);
        analysisEl.classList.add("hidden");
        variantsSection.classList.add("hidden");
      }

      if (r.stopped) {
        meta.textContent = "Stopped.";
      } else if (r.demo) {
        meta.textContent = "Sample answer · no API call made";
      } else {
        if (r.stopReason === "refusal") {
          setNotice("Claude declined to rewrite this draft. Try rephrasing the draft or guidelines.", "error");
        } else if (r.stopReason === "max_tokens") {
          setNotice("The rewrite hit the length limit and was cut off.", "error");
        } else if (!r.text.trim()) {
          setNotice("Claude returned an empty response. Try again.", "error");
        } else if (!r.data) {
          setNotice("The rewrite came through, but the guideline check and variants couldn't be read. Try again to get them.", "error");
        }
        const inT = (r.usage.input_tokens || 0) + (r.usage.cache_read_input_tokens || 0) + (r.usage.cache_creation_input_tokens || 0);
        const outT = r.usage.output_tokens;
        meta.textContent = [r.model, `${secs}s`, inT ? `${inT.toLocaleString()} in` : "", outT ? `${outT.toLocaleString()} out tokens` : ""].filter(Boolean).join(" · ");
      }
      if (r.text.trim() && !r.stopped) {
        resetFeedback({ draft: originalText, output: r.text, demo: !!r.demo, rating: null });
      }
    } catch (err) {
      setOutput(outputText);
      analysisEl.classList.add("hidden");
      variantsSection.classList.add("hidden");
      setNotice(err.message || String(err), "error");
    } finally {
      controller = null;
      setBusy(false);
    }
  }

  // ---------- Feedback: rating ----------
  function resetFeedback(run) {
    lastRun = run;
    feedback.classList.toggle("hidden", !run);
    rateUp.setAttribute("aria-pressed", "false");
    rateDown.setAttribute("aria-pressed", "false");
    rateSaved.textContent = "";
    fbComment.value = "";
    fbResult.replaceChildren();
    updateFbSubmit();
  }

  function rate(value) {
    if (!lastRun) return;
    const next = lastRun.rating === value ? null : value;
    lastRun.rating = next;
    rateUp.setAttribute("aria-pressed", String(next === "great"));
    rateDown.setAttribute("aria-pressed", String(next === "not_great"));
    if (next) {
      logHistory({ kind: "rating", summary: `Rated a rewrite ${next === "great" ? "great" : "not great"}${lastRun.demo ? " (demo)" : ""}.` });
      markDirty();
      rateSaved.textContent = next === "not_great" ? "Saved. Tell Claude what to fix below." : "Saved.";
      if (next === "not_great") fbComment.focus();
    } else {
      rateSaved.textContent = "";
    }
  }

  function updateFbSubmit() {
    fbSubmit.disabled = isBusy() || !fbComment.value.trim();
  }

  function setFbBusy(busy) {
    fbBusy = busy;
    updateFbSubmit();
    refreshProfileControls();
    rewriteBtn.disabled = busy || !!controller;
  }

  // ---------- Feedback: comment -> guideline ----------
  function panel(kind, ...children) { return el("div", { class: `panel ${kind || ""}` }, ...children); }

  function showWorking(text) {
    fbResult.replaceChildren(panel("", el("p", { style: "margin:0" }, el("span", { class: "spinner", "aria-hidden": "true" }), text)));
  }

  function showError(message) {
    fbResult.replaceChildren(el("div", { class: "notice error", style: "margin:0" }, message));
  }

  function rewriteAgainButton() {
    return el("button", { class: "btn small", type: "button", onclick: () => rewrite() }, "Rewrite again with updated guidelines");
  }

  function showAdded(rules, message, isDemo) {
    fbResult.replaceChildren(panel("ok",
      el("h3", {}, isDemo ? "Demo: this is what an added rule looks like" : `Added to “${profile.name}”`),
      rules.length ? el("ul", { class: "rules" }, rules.map((r) => el("li", {}, r))) : null,
      message ? el("p", {}, message) : null,
      el("div", { class: "row" },
        isDemo ? null : rewriteAgainButton(),
        isDemo ? null : el("button", { class: "btn small", type: "button", onclick: () => { undoGuidelines(); fbResult.replaceChildren(el("div", { class: "notice", style: "margin:0" }, "Change undone. The guidelines are back to how they were.")); } }, "Undo")
      )
    ));
  }

  function showConflicts(analysis, comment, isDemo) {
    const groups = analysis.conflicts.map((c, i) => {
      const name = `conflict-${Date.now()}-${i}`;
      return el("div", { class: "conflict" },
        el("div", { class: "why" }, c.reason),
        el("label", { class: "choice" },
          el("input", { type: "radio", name, value: "keep_existing" }),
          el("span", {}, el("span", { class: "tag" }, "Keep existing"), c.existing)),
        el("label", { class: "choice" },
          el("input", { type: "radio", name, value: "use_new" }),
          el("span", {}, el("span", { class: "tag" }, "Use new"), c.proposed))
      );
    });

    const applyBtn = el("button", { class: "btn small", type: "button", disabled: true }, "Apply my choices");
    const cancelBtn = el("button", { class: "btn small", type: "button", onclick: () => fbResult.replaceChildren(el("div", { class: "notice", style: "margin:0" }, "Nothing changed. The guidelines are as they were.")) }, "Cancel");

    const readChoices = () => groups.map((g) => g.querySelector("input:checked")?.value || null);
    groups.forEach((g) => g.addEventListener("change", () => { applyBtn.disabled = readChoices().some((v) => !v); }));

    applyBtn.addEventListener("click", async () => {
      const choices = readChoices();
      if (isDemo) {
        fbResult.replaceChildren(el("div", { class: "notice", style: "margin:0" },
          "Demo: with a Claude API key, Claude would now update the guidelines using your choices. Nothing was changed."));
        return;
      }
      await resolveConflicts(analysis, choices, comment);
    });

    fbResult.replaceChildren(panel("warn",
      el("h3", {}, isDemo
        ? "Demo: this is what a conflict looks like"
        : `This clashes with ${analysis.conflicts.length === 1 ? "an existing guideline" : `${analysis.conflicts.length} existing guidelines`}. Which should we keep?`),
      isDemo ? el("p", {}, "Add a Claude API key to check your own feedback. The guidelines weren't changed.") : null,
      groups,
      el("div", { class: "row" }, applyBtn, cancelBtn)
    ));
  }

  async function resolveConflicts(analysis, choices, comment) {
    setFbBusy(true);
    showWorking("Updating the guidelines…");
    try {
      const decisions = analysis.conflicts.map((c, i) => ({ existing: c.existing, proposed: c.proposed, decision: choices[i] }));
      const out = await api("/api/feedback", {
        method: "POST",
        body: { action: "resolve", guidelines: fields.guidelines.value, newRules: analysis.new_rules, decisions }
      });
      const kept = decisions.filter((d) => d.decision === "use_new").map((d) => d.proposed);
      applyGuidelines(out.updated_guidelines.trim(), { kind: "resolved", summary: out.summary, rules: kept, comment });
      showAdded(kept, out.summary, false);
    } catch (err) {
      showError(err.message || String(err));
    } finally {
      setFbBusy(false);
    }
  }

  const DEMO_ANALYSIS = {
    status: "conflict",
    new_rules: ["Use sentence case for headings and buttons."],
    conflicts: [{
      existing: "Use Title Case for headings and buttons.",
      proposed: "Use sentence case for headings and buttons.",
      reason: "Your feedback asks for sentence case, but an existing guideline asks for Title Case. Both can't apply."
    }],
    duplicate_of: [],
    message: "",
    updated_guidelines: ""
  };

  async function submitFeedback() {
    const comment = fbComment.value.trim();
    if (!comment || !lastRun || isBusy()) return;

    if (!hasClaude()) {
      showWorking("Checking against the guidelines…");
      await new Promise((r) => setTimeout(r, 700));
      showConflicts(DEMO_ANALYSIS, comment, true);
      return;
    }

    setFbBusy(true);
    showWorking("Turning your feedback into a rule and checking it against the guidelines…");
    try {
      const rating = lastRun.rating === "great" ? "great" : lastRun.rating === "not_great" ? "not great" : "not rated";
      const a = await api("/api/feedback", {
        method: "POST",
        body: { action: "analyze", guidelines: fields.guidelines.value, draft: lastRun.draft, rewrite: lastRun.output, rating, comment }
      });

      if (a.status === "add" && a.updated_guidelines.trim()) {
        applyGuidelines(a.updated_guidelines.trim(), { kind: "added", summary: a.message || "Added a rule from feedback.", rules: a.new_rules, comment });
        showAdded(a.new_rules, a.message, false);
        fbComment.value = "";
      } else if (a.status === "conflict" && a.conflicts.length) {
        showConflicts(a, comment, false);
      } else if (a.status === "duplicate") {
        fbResult.replaceChildren(panel("",
          el("h3", {}, "Already covered, so nothing changed"),
          a.duplicate_of.length ? el("ul", { class: "rules" }, a.duplicate_of.map((r) => el("li", {}, r))) : null,
          a.message ? el("p", {}, a.message) : null,
          el("div", { class: "row" }, rewriteAgainButton())
        ));
      } else {
        fbResult.replaceChildren(panel("warn",
          el("h3", {}, "Can you say a bit more?"),
          el("p", {}, a.message || "This feedback couldn't be turned into a general rule. Try describing what should change in future writing.")
        ));
        fbComment.focus();
      }
    } catch (err) {
      showError(err.message || String(err));
    } finally {
      setFbBusy(false);
    }
  }

  // ---------- Wire up ----------
  const samplesEl = $("samples");
  SAMPLES.forEach((s) => {
    samplesEl.appendChild(el("button", { type: "button", class: "chip", "data-id": s.id, "aria-pressed": "false", onclick: () => { if (!controller) loadSample(s); } }, s.label));
  });

  const savedKey = storage(() => localStorage.getItem(LOCAL.key));
  if (savedKey) { apiKey.value = savedKey; rememberKey.checked = true; }

  function persistKey() {
    storage(() => {
      if (rememberKey.checked && apiKey.value.trim()) localStorage.setItem(LOCAL.key, apiKey.value.trim());
      else localStorage.removeItem(LOCAL.key);
    });
  }

  apiKey.addEventListener("input", () => { updateMode(); persistKey(); });
  rememberKey.addEventListener("change", persistKey);
  $("toggleKey").addEventListener("click", (e) => {
    const show = apiKey.type === "password";
    apiKey.type = show ? "text" : "password";
    e.currentTarget.textContent = show ? "Hide" : "Show";
    e.currentTarget.setAttribute("aria-label", show ? "Hide key" : "Show key");
  });

  Object.values(fields).forEach((f) => f.addEventListener("input", updateCounts));
  fields.guidelines.addEventListener("input", () => { if (profile) { profile.guidelines = fields.guidelines.value; markDirty(); } });
  fields.examples.addEventListener("input", () => { if (profile) { profile.examples = fields.examples.value; markDirty(); } });

  // A hand edit to the guidelines becomes one undo step and one history entry when the box loses focus.
  let editSnapshot = null;
  fields.guidelines.addEventListener("focus", () => { editSnapshot = fields.guidelines.value; });
  fields.guidelines.addEventListener("blur", () => {
    if (profile && editSnapshot !== null && editSnapshot !== fields.guidelines.value) {
      profile.undo = [...profile.undo, editSnapshot].slice(-UNDO_LIMIT);
      logHistory({ kind: "manual", summary: "Edited the guidelines by hand." });
      refreshUndo();
      markDirty({ now: true });
    }
    editSnapshot = null;
  });
  fields.examples.addEventListener("blur", () => { if (profile && dirty !== savedDirty) saveNow(); });

  undoBtn.addEventListener("click", undoGuidelines);
  seedBtn.addEventListener("click", () => {
    applyGuidelines(RESEARCH_PRINCIPLES, { kind: "seed", summary: "Started from the 11 research principles (Vercel, Ramp, Shopify)." });
  });
  downloadBtn.addEventListener("click", () => {
    const name = profile?.name || "Writing";
    const blob = new Blob([`# ${name} guidelines\n\n${fields.guidelines.value.trim()}\n`], { type: "text/markdown" });
    const a = el("a", { href: URL.createObjectURL(blob), download: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-guidelines.md` });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  rewriteBtn.addEventListener("click", rewrite);
  stopBtn.addEventListener("click", () => controller?.abort());
  clearBtn.addEventListener("click", () => {
    if (controller) return;
    fields.draft.value = "";
    document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", "false"));
    updateCounts(); setOutput(""); setNotice(""); meta.textContent = ""; resetResults(); resetFeedback(null);
    fields.draft.focus();
  });

  copyBtn.addEventListener("click", () => copyText(outputText, copyBtn));
  useBtn.addEventListener("click", () => {
    fields.draft.value = outputText;
    updateCounts();
    fields.draft.focus();
  });

  rateUp.addEventListener("click", () => rate("great"));
  rateDown.addEventListener("click", () => rate("not_great"));
  fbComment.addEventListener("input", updateFbSubmit);
  fbSubmit.addEventListener("click", submitFeedback);
  fbComment.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); e.stopPropagation(); submitFeedback(); }
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && e.target !== fbComment) { e.preventDefault(); rewrite(); }
  });

  window.addEventListener("beforeunload", (e) => {
    if (profile && dirty !== savedDirty) { saveNow(); e.preventDefault(); }
  });

  // ---------- Start ----------
  async function boot() {
    try {
      config = await api("/api/config");
    } catch (err) {
      if (err.type !== "access_denied") {
        modePill.textContent = "Can't connect";
        setNotice(err.message, "error");
      }
      return;
    }
    updateMode();
    if (config.storage === "none") {
      setSaveStatus("error", "no storage is connected");
      setNotice("Profiles can't be saved: this deployment has no storage connected. Add a private Vercel Blob store to the project (Storage → Create → Blob, then connect it to this project) and redeploy.", "error");
      return;
    }
    try {
      await loadProfiles();
    } catch (err) {
      setSaveStatus("error", err.message);
      setNotice(err.message, "error");
    }
  }

  updateCounts();
  refreshProfileControls();
  boot();
})();
