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
      <svg viewBox="0 0 32 28" width="30" height="26" fill="none" className="shrink-0 text-ink" aria-hidden>
        <path d="M2 25V3m0 19 8-8 6 5L29 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="leading-tight">
        <span className="block text-[19px] font-bold tracking-[-0.04em]">breakeven</span>
        {tagline && <span className="sr-only">AI compute cost of ownership</span>}
      </span>
    </a>
  );
}
