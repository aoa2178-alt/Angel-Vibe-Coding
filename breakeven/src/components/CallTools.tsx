import { Check, Copy, Sparkles } from "lucide-react";
import { useState, type RefObject } from "react";

/** "GPU throughput" stays as is; "Phones cost more" becomes "phones cost more". */
const lowerFirst = (t: string) => (/^[A-Z]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));

/** How many settings in the address differ from the example case (the scenario writes only non-defaults). */
export function changedSettings() {
  return [...new URLSearchParams(window.location.search).keys()].length;
}

/**
 * "How solid is this call?": what the recommendation rests on, shown as checks rather than a feeling.
 * Stress tests come from "What would change my mind"; inputs count what the reader has made their own.
 */
export function HowSolid({ checks }: { checks: { label: string; holds: boolean }[] }) {
  const changed = changedSettings();
  const holds = checks.filter((c) => c.holds).length;
  const flips = checks.filter((c) => !c.holds);
  const verdict = changed === 0 ? "Example case" : flips.length === 0 ? "Robust" : "Sensitive";
  return (
    <section data-call-text className="mt-4 rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-label="How solid is this recommendation?">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="kicker">How solid is this recommendation?</p>
        <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink">{verdict}</span>
      </div>
      <dl className="mt-3 grid gap-3 text-sm leading-6 sm:grid-cols-3">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Stress tests</dt>
          <dd className="mt-1 text-ink-2">
            <span className="font-semibold text-ink">
              Holds in {holds} of {checks.length}
            </span>
            {flips.length > 0 ? `. Flips if: ${flips.map((f) => lowerFirst(f.label)).join("; ")}.` : ": none of them change the answer."}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Your inputs</dt>
          <dd className="mt-1 text-ink-2">
            {changed === 0 ? (
              <>
                <span className="font-semibold text-ink">None yet.</span> This is the example case: change the inputs to make it yours.
              </>
            ) : (
              <>
                <span className="font-semibold text-ink">
                  {changed} setting{changed === 1 ? "" : "s"}
                </span>{" "}
                changed from the example. The rest are defaults, listed on Sources.
              </>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">Evidence</dt>
          <dd className="mt-1 text-ink-2">
            Headline numbers are tagged <span className="font-semibold text-ink">Data</span> (public source), <span className="font-semibold text-ink">Modeled</span> or{" "}
            <span className="font-semibold text-ink">Assumption</span>.
          </dd>
        </div>
      </dl>
    </section>
  );
}

const ASK =
  "Please challenge it: what is the strongest case against this recommendation, which assumptions matter most, and what would you check before acting on it?";

/** The call as plain text: every part of the page marked data-call-text, plus the link to this exact scenario. */
function callText(root: HTMLElement | null) {
  const app = document.title.split("·")[0].trim();
  const parts = root ? [...root.querySelectorAll<HTMLElement>("[data-call-text]")].map((e) => e.innerText.trim()) : [];
  return { app, body: `${app}: recommendation\n${window.location.href}\n\n${parts.join("\n\n")}` };
}

/** Copy the call as text, or hand it to an AI assistant to argue with. */
export function CallShare({ root }: { root: RefObject<HTMLElement | null> }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const { body } = callText(root.current);
    try {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy the recommendation:", body);
    }
  };
  const ask = (site: string) => {
    const { app, body } = callText(root.current);
    const prompt = `I'm reviewing a recommendation from ${app}, a decision tool.\n\n${body.slice(0, 2600)}\n\n${ASK}`;
    window.open(`${site}${encodeURIComponent(prompt)}`, "_blank", "noopener");
  };
  const btn = "inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition hover:border-brand";
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden">
      <button type="button" onClick={copy} className={btn}>
        {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        {copied ? "Copied" : "Copy as text"}
      </button>
      <span className="ml-1 text-xs text-muted">
        <Sparkles className="mr-1 inline size-3.5 align-[-2px]" aria-hidden />
        Ask AI to challenge it:
      </span>
      <button type="button" onClick={() => ask("https://chatgpt.com/?q=")} className={btn}>
        ChatGPT ↗
      </button>
      <button type="button" onClick={() => ask("https://claude.ai/new?q=")} className={btn}>
        Claude ↗
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </div>
  );
}
