import type { MouseEvent } from "react";

/** In-app navigation without a router: update the URL and tell the app to re-render. */
export function navigate(to: string) {
  window.history.pushState(null, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0 });
}

/** A normal link that navigates in place (and still opens in a new tab with Ctrl/Cmd-click). */
export function linkClick(to: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  };
}

export function Logo({ tagline = true }: { tagline?: boolean }) {
  return (
    <a href="/" onClick={linkClick("/")} className="flex min-w-0 items-center gap-3 rounded-xl" aria-label="Breakeven home">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
          <path d="M3 18 L21 6" />
          <path d="M3 9 C9 9 13 13 21 14" />
          <circle cx="12.1" cy="11.9" r="2" fill="white" stroke="none" />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-lg font-extrabold tracking-tight">Breakeven</span>
        {tagline && <span className="kicker hidden !text-[10px] sm:block">AI compute cost of ownership</span>}
      </span>
    </a>
  );
}
