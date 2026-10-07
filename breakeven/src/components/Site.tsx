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

/** The floating pill bar every page shares. `actions` replaces the default "Open calculator" button. */
export function PillBar({ nav = [], actions, logoTagline = false }: { nav?: NavItem[]; actions?: ReactNode; logoTagline?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 px-3 pt-3 print:hidden">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 rounded-full border border-line bg-surface py-2 pl-3 pr-2 sm:pl-4">
        <Logo tagline={logoTagline} />
        {nav.length > 0 && (
          <nav aria-label="Sections" className="hidden items-center gap-0.5 lg:flex">
            {nav.map((n) => (
              <NavLink
                key={n.href}
                item={n}
                className="rounded-full px-3 py-2 text-sm font-medium text-ink-2 transition hover:bg-sunken hover:text-ink"
              />
            ))}
          </nav>
        )}
        <div className="flex shrink-0 items-center gap-2">
          {actions ?? (
            <a
              href="/calculator"
              onClick={linkClick("/calculator")}
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
      {open && (
        <nav id="site-menu" aria-label="Sections" className="mx-auto mt-2 max-w-[1200px] rounded-3xl border border-line bg-surface p-2 lg:hidden">
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
  { href: "/calculator", label: "Calculator" },
  { href: "/calculator#projection", label: "Cost projection" },
  { href: "/business-case", label: "Build a business case" },
  { href: "/speed-to-power", label: "Speed-to-Power" },
  { href: "/methodology", label: "Methodology & sources" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo tagline={false} />
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink-2">
            An AI compute cost-of-ownership calculator: pay per token, rent cloud GPUs, or own the hardware.
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
        <p className="mx-auto max-w-[1200px] px-4 py-5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted sm:px-6">
          © 2026 Breakeven · Excludes taxes, egress and setup costs
        </p>
      </div>
    </footer>
  );
}
