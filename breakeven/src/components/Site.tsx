import { ArrowRight, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo, linkClick } from "./Brand";

export interface NavItem {
  href: string;
  label: string;
}

/** In-page anchors ("#faq") scroll normally; site paths ("/methodology") navigate in place. */
function NavLink({ item, className, onNavigate }: { item: NavItem; className: string; onNavigate?: () => void }) {
  const internal = item.href.startsWith("/");
  return (
    <a
      href={item.href}
      onClick={(e) => {
        onNavigate?.();
        if (internal) linkClick(item.href)(e);
      }}
      className={className}
    >
      {item.label}
    </a>
  );
}

/**
 * The floating pill bar every page shares. `actions` replaces the default "Open calculator" button; `center` replaces
 * the section links (the step pages put their tracker there), and `below` adds a row under the bar on small screens.
 */
export function PillBar({
  nav = [],
  actions,
  logoTagline = false,
  center,
  below,
}: {
  nav?: NavItem[];
  actions?: ReactNode;
  logoTagline?: boolean;
  center?: ReactNode;
  below?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-6 px-4 sm:px-8">
        <Logo tagline={logoTagline} />
        {center}
        {!center && nav.length > 0 && (
          <nav aria-label="Sections" className="hidden items-center gap-7 self-stretch lg:flex">
            {nav.map((n) => (
              <NavLink
                key={n.href}
                item={n}
                className="flex h-full items-center text-sm text-muted transition hover:text-ink"
              />
            ))}
          </nav>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {actions ?? (
            <a
              href="/run-it"
              onClick={linkClick("/run-it")}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-brand px-3.5 py-2.5 text-sm sm:px-4 font-semibold text-white transition hover:bg-brand-ink"
            >
              <span className="sm:hidden">Calculator</span>
              <span className="hidden sm:inline">Open calculator</span> <ArrowRight className="size-4" aria-hidden />
            </a>
          )}
          {nav.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid size-10 place-items-center rounded-full border border-line text-ink transition hover:border-brand lg:hidden"
            >
              {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
            </button>
          )}
        </div>
      </div>
      {below}
      {open && (
        <nav id="site-menu" aria-label="Sections" className="mx-auto max-w-[1320px] border-t border-line bg-surface p-2 lg:hidden">
          {nav.map((n) => (
            <NavLink
              key={n.href}
              item={n}
              onNavigate={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-base font-medium text-ink transition hover:bg-sunken"
            />
          ))}
        </nav>
      )}
    </header>
  );
}

export function SiteHeader({ nav }: { nav: NavItem[] }) {
  return <PillBar nav={nav} />;
}

const FOOTER_LINKS: NavItem[] = [
  { href: "/worth-it", label: "1 · Evaluate AI ROI" },
  { href: "/run-it", label: "2 · Compare compute costs" },
  { href: "/power-it", label: "3 · Power planning" },
  { href: "/result", label: "Recommendation" },
  { href: "/sources", label: "Sources" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo tagline={false} />
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink-2">
            Total-cost-of-ownership analysis for running AI: pay-per-token API, rented GPUs or owned infrastructure.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            {FOOTER_LINKS.map((l) => (
              <li key={l.href}>
                <NavLink item={l} className="hover:text-ink" />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">About</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            <li>Built by Angel Ade-Oduntan</li>
            <li>Illustrative estimates, not provider quotes</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1320px] px-4 py-5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted sm:px-6">
          © 2026 Breakeven · Excludes taxes, egress and setup costs
        </p>
      </div>
    </footer>
  );
}
