import { ArrowUp, Loader2, Mail, MessageCircleQuestion, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AskError, DAILY_LIMIT, MAX_QUESTION, askClaude, scenarioSummary, type Turn } from "@/lib/ask";
import { FAQ_GROUPS } from "@/lib/faq";

export const CONTACT_EMAIL = "aoa2178@columbia.edu";

const ALL = FAQ_GROUPS.flatMap((g) => g.items);
/** Shown before anyone asks: the questions people ask most at a demo. */
const STARTERS = ["why-not-api", "volume-grows", "defaults", "current-prices"];

/** A pre-filled email to Angel that carries the scenario being looked at, so the question arrives with its context. */
export function contactHref(question = "") {
  const page = typeof window === "undefined" ? "https://breakeven-silk.vercel.app" : window.location.href;
  const subject = "Breakeven question";
  const body = `${question ? `${question}\n\n` : "Hi Angel,\n\n"}\n\n---\nThe scenario I was looking at: ${page}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** The built-in answers closest to a question (the common ones when there is no question yet). */
function closest(query: string) {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  if (!words.length) return STARTERS.map((id) => ALL.find((i) => i.id === id)).filter((i): i is (typeof ALL)[number] => !!i);
  return ALL.map((item) => {
    const text = `${item.q} ${item.a}`.toLowerCase();
    return { item, score: words.reduce((n, w) => n + (item.q.toLowerCase().includes(w) ? 3 : 0) + (text.includes(w) ? 1 : 0), 0) };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.item);
}

type Status = "idle" | "thinking" | "unavailable" | "limit";

/**
 * "Questions?": a corner button that opens a small panel. Ask anything and Claude answers using the scenario on screen;
 * the built-in answers stay underneath (and stand in if Claude can't be reached), and Angel can be emailed.
 */
export function HelpDesk() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [thread, setThread] = useState<Turn[]>([]);
  const [pending, setPending] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const latest = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (panel.current && !panel.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  useEffect(() => {
    // Keep the newest question in view, from its top, so an answer is read from the start.
    // (Set on the panel itself, so the page behind it never scrolls.)
    if (latest.current && scroller.current) scroller.current.scrollTop = latest.current.offsetTop - 12;
  }, [thread, status]);

  const lastQuestion = pending || thread.at(-1)?.q || "";
  const matches = useMemo(() => closest(query.trim() || lastQuestion), [query, lastQuestion]);

  async function ask(question: string) {
    const q = question.trim().slice(0, MAX_QUESTION);
    if (!q || status === "thinking") return;
    setQuery("");
    setPending(q);
    setStatus("thinking");
    try {
      const a = await askClaude(q, thread, scenarioSummary(window.location.pathname, window.location.search));
      setThread((t) => [...t, { q, a }]);
      setStatus("idle");
      setPending("");
    } catch (e) {
      setStatus(e instanceof AskError ? e.kind : "unavailable");
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void ask(query);
  };

  const failed = status === "unavailable" || status === "limit";

  return (
    <div ref={panel} className="fixed bottom-4 right-4 z-40 print:hidden">
      {open && (
        <div role="dialog" aria-label="Questions about Breakeven" className="mb-3 flex max-h-[min(620px,80vh)] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_18px_50px_rgb(26_39_48/0.18)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold">Questions?</p>
            <div className="flex items-center gap-1">
              {(thread.length > 0 || failed) && (
                <button
                  type="button"
                  onClick={() => {
                    setThread([]);
                    setPending("");
                    setStatus("idle");
                  }}
                  className="rounded-full px-2.5 py-1 text-xs font-semibold text-ink-2 hover:bg-sunken"
                >
                  New question
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-8 place-items-center rounded-full text-ink-2 hover:bg-sunken">
                <X className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          <div ref={scroller} className="relative min-h-0 flex-1 overflow-y-auto px-4 py-3" aria-live="polite">
            {thread.map((t, i) => (
              <div key={i} ref={!pending && i === thread.length - 1 ? latest : undefined} className="mb-4">
                <p className="ml-8 rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-sm text-white">{t.q}</p>
                <div className="mt-2 rounded-2xl rounded-bl-sm border border-line bg-bg px-3 py-2.5">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                    <Sparkles className="size-3.5" aria-hidden /> Answered by Claude
                  </p>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink">{t.a}</p>
                </div>
              </div>
            ))}
            {pending && (
              <div ref={latest} className="mb-4">
                <p className="ml-8 rounded-2xl rounded-br-sm bg-brand px-3 py-2 text-sm text-white">{pending}</p>
                {status === "thinking" && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                    <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> Thinking…
                  </p>
                )}
                {failed && (
                  <p className="mt-2 rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink-2">
                    {status === "limit"
                      ? `That's today's limit of ${DAILY_LIMIT} questions. The closest built-in answers are below, or send it to Angel.`
                      : "Claude isn't available right now. The closest built-in answers are below, or send it to Angel."}
                  </p>
                )}
              </div>
            )}

            <p className="kicker">{thread.length || pending || query.trim() ? "Related answers" : "Common questions"}</p>
            {matches.length ? (
              <div className="mt-2 space-y-2">
                {matches.map((item) => (
                  <details key={item.id} className="group rounded-xl border border-line bg-bg px-3 py-2">
                    <summary className="cursor-pointer list-none text-sm font-semibold marker:hidden">{item.q}</summary>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-2">{item.a}</p>
                  </details>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-2">No built-in answer matches. Ask Claude below, or send it to Angel.</p>
            )}
          </div>

          <form onSubmit={submit} className="border-t border-line px-4 pt-3">
            <label className="relative block">
              <span className="sr-only">Ask a question about Breakeven</span>
              <input
                ref={input}
                value={query}
                maxLength={MAX_QUESTION}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything, e.g. why not the API?"
                className="w-full rounded-full border border-line bg-bg py-2.5 pl-4 pr-11 text-sm outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={!query.trim() || status === "thinking"}
                aria-label="Ask Claude"
                className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-ink disabled:opacity-40"
              >
                <ArrowUp className="size-4" aria-hidden />
              </button>
            </label>
            <p className="mt-1.5 text-[11px] leading-4 text-muted">Answers come from Claude using this page's numbers; check key figures on Sources. Your question and this scenario are sent to Anthropic to answer.</p>
          </form>

          <div className="mt-3 border-t border-line bg-bg px-4 py-3">
            <a
              href={contactHref(lastQuestion || query.trim())}
              className="flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand"
            >
              <Mail className="size-4" aria-hidden /> Message Angel
            </a>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="ml-auto flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgb(26_39_48/0.25)] transition hover:bg-brand-ink"
      >
        <MessageCircleQuestion className="size-4" aria-hidden /> Questions?
      </button>
    </div>
  );
}
