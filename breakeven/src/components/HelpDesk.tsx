import { Mail, MessageCircleQuestion, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FAQ_GROUPS } from "@/lib/faq";

export const CONTACT_EMAIL = "aoa2178@columbia.edu";

const ALL = FAQ_GROUPS.flatMap((g) => g.items);
/** Shown before anyone types: the questions people ask most at a demo. */
const STARTERS = ["why-not-api", "volume-grows", "defaults", "current-prices"];

/** A pre-filled email to Angel that carries the scenario being looked at, so the question arrives with its context. */
export function contactHref(question = "") {
  const page = typeof window === "undefined" ? "https://breakeven-silk.vercel.app" : window.location.href;
  const subject = "Breakeven question";
  const body = `${question ? `${question}\n\n` : "Hi Angel,\n\n"}\n\n---\nThe scenario I was looking at: ${page}`;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * "Questions?": a corner button that opens a small panel. Search the FAQ for an answer, or message Angel by email.
 * Nothing is sent from the app itself; the email opens in the visitor's own mail app.
 */
export function HelpDesk() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

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

  const matches = useMemo(() => {
    const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
    if (!words.length) return STARTERS.map((id) => ALL.find((i) => i.id === id)).filter((i): i is (typeof ALL)[number] => !!i);
    return ALL.map((item) => {
      const text = `${item.q} ${item.a}`.toLowerCase();
      return { item, score: words.reduce((n, w) => n + (item.q.toLowerCase().includes(w) ? 3 : 0) + (text.includes(w) ? 1 : 0), 0) };
    })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((x) => x.item);
  }, [query]);

  return (
    <div ref={panel} className="fixed bottom-4 right-4 z-40 print:hidden">
      {open && (
        <div role="dialog" aria-label="Questions about Breakeven" className="mb-3 flex max-h-[min(560px,80vh)] w-[min(360px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_18px_50px_rgb(26_39_48/0.18)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-semibold">Questions?</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid size-8 place-items-center rounded-full text-ink-2 hover:bg-sunken">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="px-4 pt-3">
            <label className="relative block">
              <span className="sr-only">Search common questions</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                ref={input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question, e.g. why not the API?"
                className="w-full rounded-full border border-line bg-bg py-2 pl-9 pr-3 text-sm outline-none focus:border-brand"
              />
            </label>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <p className="kicker">{query.trim() ? "Closest answers" : "Common questions"}</p>
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
              <p className="mt-2 text-sm text-ink-2">No ready answer for that one. Send it to Angel below.</p>
            )}
          </div>
          <div className="border-t border-line bg-bg px-4 py-3">
            <a
              href={contactHref(query.trim())}
              className="flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-ink"
            >
              <Mail className="size-4" aria-hidden /> Message Angel
            </a>
            <p className="mt-1.5 text-center text-[11px] text-muted">Opens your email app, with this scenario's link included.</p>
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
