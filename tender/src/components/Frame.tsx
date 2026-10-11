import { ArrowLeft, ArrowRight, Check, Link2, Menu, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { BUYER, formatMoney, monthlyDelayCost } from "@/lib/data";
import { readScenario, scenarioQuery, type Scenario } from "@/lib/scenario";

export const COMPANY = BUYER.name;

/* ---------- Navigation without a router ---------- */

export function navigate(to: string) {
  window.history.pushState(null, "", to);
  window.dispatchEvent(new PopStateEvent("popstate"));
  window.scrollTo({ top: 0 });
}

export function linkClick(to: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  };
}

/** Tender's mark: a price tag, for what the deal should cost. */
export function Mark({ className = "size-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M3 11.5V4h7.5L21 14.5 13.5 22z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <circle cx="7.5" cy="8.5" r="1.8" fill="var(--accent)" />
    </svg>
  );
}

export function Logo() {
  return (
    <a href="/" onClick={linkClick("/")} className="flex shrink-0 items-center gap-2.5" aria-label="Tender home">
      <span className="grid size-8 place-items-center text-ink">
        <Mark className="size-6" />
      </span>
      <span className="font-serif text-[21px] font-medium tracking-[-0.02em]">Tender</span>
    </a>
  );
}

/* ---------- The steps ---------- */

export type StepRoute = "spend" | "should-cost" | "bids" | "negotiate" | "brief";
export type PageRoute = StepRoute | "sources" | "faq";

export const STEPS: { route: StepRoute; label: string; title: string }[] = [
  { route: "spend", label: "Spend", title: "Spend analysis" },
  { route: "should-cost", label: "Should-cost", title: "Should-cost model" },
  { route: "bids", label: "Bid evaluation", title: "Bid evaluation on total cost" },
  { route: "negotiate", label: "Negotiation", title: "Negotiation strategy" },
  { route: "brief", label: "Recommendation", title: "Recommendation" },
];

export const href = (route: PageRoute, s: Scenario) => `/${route}${scenarioQuery(s)}`;

/** The scenario for a page: read from the URL once, written back on every change so the address is always shareable. */
export function useScenario(route: PageRoute) {
  const [scenario, setScenario] = useState(() => readScenario(window.location.search));
  useEffect(() => {
    window.history.replaceState(null, "", `/${route}${scenarioQuery(scenario)}${window.location.hash}`);
  }, [route, scenario]);
  return [scenario, setScenario] as const;
}

function navItems(route: PageRoute, s: Scenario) {
  return [
    ...STEPS.map((st) => ({ href: href(st.route, s), label: st.label, current: st.route === route })),
    { href: href("sources", s), label: "Sources", current: route === "sources" },
    { href: href("faq", s), label: "FAQ", current: route === "faq" },
  ];
}

/** The section links, left-aligned beside the logo, with an underline on the current page. */
function NavLinks({ route, s }: { route: PageRoute; s: Scenario }) {
  return (
    <nav aria-label="Sections" className="hidden items-stretch gap-6 self-stretch xl:flex">
      {navItems(route, s).map((it) => (
        <a
          key={it.label}
          href={it.href}
          onClick={linkClick(it.href)}
          aria-current={it.current ? "page" : undefined}
          className={`relative flex items-center whitespace-nowrap text-sm transition ${it.current ? "font-semibold text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent" : "text-muted hover:text-ink"}`}
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}

/** Below the extra-large breakpoint the same links live in a menu. */
function NavMenu({ route, s }: { route: PageRoute; s: Scenario }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: globalThis.MouseEvent) => box.current && !box.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", esc);
    };
  }, [open]);
  return (
    <div ref={box} className="relative xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={open ? "Close menu" : "Open menu"}
        className="grid size-9 place-items-center rounded-[6px] border border-line bg-surface text-ink transition hover:border-brand"
      >
        {open ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
      </button>
      {open && (
        <nav aria-label="Sections" className="absolute right-0 top-full z-40 mt-2 w-60 rounded-[7px] border border-line bg-surface p-1.5 shadow-[0_12px_32px_rgb(17_17_17/0.12)]">
          {navItems(route, s).map((it) => (
            <a
              key={it.label}
              href={it.href}
              onClick={(e) => {
                setOpen(false);
                linkClick(it.href)(e);
              }}
              aria-current={it.current ? "page" : undefined}
              className={`block rounded-[5px] px-3 py-2.5 text-sm transition ${it.current ? "bg-brand-soft font-semibold text-brand-ink" : "text-ink hover:bg-sunken"}`}
            >
              {it.label}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}

/** Back to the example case: shown only once something differs from it. */
export function ResetScenario({ s }: { s: Scenario }) {
  if (!scenarioQuery(s)) return null;
  return (
    <button
      type="button"
      onClick={() => window.location.assign(window.location.pathname)}
      className="inline-flex items-center gap-1.5 rounded-[6px] border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition hover:border-brand"
      aria-label="Reset to the example case"
      title="Reset to the example case"
    >
      <RotateCcw className="size-3.5" aria-hidden />
      <span className="hidden 2xl:inline">Reset</span>
    </button>
  );
}

export function CopyLink() {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link to your scenario:", window.location.href);
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-[6px] bg-brand px-3 py-2 text-xs font-semibold text-on-brand transition hover:opacity-90"
        aria-label="Save scenario: copy a link to it"
      >
        {copied ? <Check className="size-3.5" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />}
        <span className="hidden 2xl:inline">{copied ? "Link copied" : "Save scenario"}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </>
  );
}

/** The project being sourced, its deadline, and what a month late costs: the numbers every step leans on. */
function CaseBar({ s }: { s: Scenario }) {
  return (
    <div className="border-b border-line bg-bg print:hidden">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 text-sm sm:px-8">
        <p>
          <span className="font-semibold">{COMPANY}</span> <span className="text-muted">· {BUYER.project}, a {BUYER.itMw} MW AI data hall · fictional buyer</span>
        </p>
        <p className="font-mono text-xs text-ink-2">
          transformers needed in {s.needByMonths} months · a month late costs {formatMoney(monthlyDelayCost(s).total)}
        </p>
      </div>
    </div>
  );
}

export function Header({ route, s, actions }: { route?: PageRoute; s?: Scenario; actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur-sm print:hidden">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center gap-3 px-4 sm:gap-10 sm:px-8">
        <Logo />
        {route && s && <NavLinks route={route} s={s} />}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {actions}
          {route && s && <NavMenu route={route} s={s} />}
        </div>
      </div>
    </header>
  );
}

export function Frame({ route, s, children }: { route: PageRoute; s: Scenario; setS?: (s: Scenario) => void; children: ReactNode }) {
  const i = STEPS.findIndex((x) => x.route === route);
  const prev = i > 0 ? STEPS[i - 1] : null;
  const next = i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null;
  return (
    <div className="min-h-dvh">
      <Header
        route={route}
        s={s}
        actions={
          <>
            <ResetScenario s={s} />
            <CopyLink />
          </>
        }
      />
      {route !== "faq" && <CaseBar s={s} />}
      <main className="mx-auto max-w-[1320px] px-4 pb-16 pt-8 sm:px-8 print:p-0">
        {children}
        {i >= 0 && (
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 print:hidden">
            {prev ? (
              <a href={href(prev.route, s)} onClick={linkClick(href(prev.route, s))} className="inline-flex items-center gap-2 rounded-[6px] border border-line bg-surface px-4 py-2.5 text-sm font-semibold transition hover:border-brand">
                <ArrowLeft className="size-4" aria-hidden /> {prev.label}
              </a>
            ) : (
              <span />
            )}
            {next && (
              <a href={href(next.route, s)} onClick={linkClick(href(next.route, s))} className="inline-flex items-center gap-2 rounded-[6px] bg-brand px-4 py-2.5 text-sm font-semibold text-on-brand transition hover:opacity-90">
                Next: {next.label} <ArrowRight className="size-4" aria-hidden />
              </a>
            )}
          </div>
        )}
      </main>
      <Footer s={s} />
    </div>
  );
}

export function StepHeading({ route, children }: { route: StepRoute; children?: ReactNode }) {
  const i = STEPS.findIndex((x) => x.route === route);
  return (
    <div className="mb-7 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-8 print:hidden">
      <div>
        <p className="kicker">
          {COMPANY} · {BUYER.project}
        </p>
        <h1 className="mt-2 text-4xl leading-[1.05] tracking-[-0.025em] sm:text-5xl">{STEPS[i]!.title}</h1>
      </div>
      {children && <div className="max-w-md text-[15px] leading-6 text-ink-2 lg:text-right">{children}</div>}
    </div>
  );
}

export function Footer({ s }: { s?: Scenario }) {
  const links = [
    ...STEPS.map((st) => ({ label: st.label, to: s ? href(st.route, s) : `/${st.route}` })),
    { label: "Sources", to: s ? href("sources", s) : "/sources" },
    { label: "FAQ", to: s ? href("faq", s) : "/faq" },
  ];
  return (
    <footer className="border-t border-line bg-bg print:hidden">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-4 py-12 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink-2">Strategic sourcing for AI data center equipment: spend, should-cost, bids on total cost and negotiation.</p>
        </div>
        <div>
          <p className="text-sm font-semibold">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.to} onClick={linkClick(l.to)} className="hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold">About</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-2">
            <li>Built by Angel Ade-Oduntan</li>
            <li>Public commodity and price data; fictional buyer and suppliers</li>
            <li>
              Related:{" "}
              <a href="https://breakeven-silk.vercel.app" className="underline underline-offset-2 hover:text-ink">
                Breakeven
              </a>{" "}
              ·{" "}
              <a href="https://loadline-weld.vercel.app" className="underline underline-offset-2 hover:text-ink">
                Loadline
              </a>{" "}
              ·{" "}
              <a href="https://buildout-three.vercel.app" className="underline underline-offset-2 hover:text-ink">
                Buildout
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1320px] px-4 py-5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted sm:px-8">
          © 2026 Tender · Illustrative model with labeled assumptions
        </p>
      </div>
    </footer>
  );
}
