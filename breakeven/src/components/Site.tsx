import { ArrowRight } from "lucide-react";
import { Logo, linkClick } from "./Brand";

export interface NavItem {
  href: string;
  label: string;
}

/** In-page anchors ("#faq") scroll normally; site paths ("/methodology") navigate in place. */
function NavLink({ item, className }: { item: NavItem; className: string }) {
  const internal = item.href.startsWith("/");
  return (
    <a href={item.href} onClick={internal ? linkClick(item.href) : undefined} className={className}>
      {item.label}
    </a>
  );
}

export function SiteHeader({ nav }: { nav: NavItem[] }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Logo tagline={false} />
        <nav aria-label="Sections" className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <NavLink
              key={n.href}
              item={n}
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-2 transition hover:bg-sunken hover:text-ink"
            />
          ))}
        </nav>
        <a
          href="/calculator"
          onClick={linkClick("/calculator")}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-ink"
        >
          Open calculator <ArrowRight className="size-4" aria-hidden />
        </a>
      </div>
    </header>
  );
}

const FOOTER_LINKS: NavItem[] = [
  { href: "/calculator", label: "Calculator" },
  { href: "/calculator#projection", label: "Cost projection" },
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
