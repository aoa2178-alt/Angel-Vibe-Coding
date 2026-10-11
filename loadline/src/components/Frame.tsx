import { ArrowLeft, ArrowRight, Check, ChevronDown, Link2, Menu, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { CAMPUSES, formatMw, phaseItMw, type Campus } from "@/lib/model";
import { readScenario, scenarioQuery, switchCampus, type Scenario } from "@/lib/scenario";

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

/** Loadline's mark: rising power bars under a load line. */
export function Mark({ className = "size-[18px]" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path d="M4 20v-5M9 20v-8M14 20v-11M19 20V4" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M2 10.5h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function Logo() {
  return (
    <a href="/" onClick={linkClick("/")} className="flex shrink-0 items-center gap-2.5" aria-label="Loadline home">
      <span className="grid size-8 place-items-center rounded-[6px] bg-brand text-on-brand">
        <Mark />
      </span>
      <span className="font-display text-[15px] font-bold uppercase tracking-[0.14em]">Loadline</span>
    </a>
  );
}

/* ---------- The steps ---------- */

export type StepRoute = "power" | "timeline" | "delays" | "brief";
export type PageRoute = StepRoute | "sources" | "faq";

export const STEPS: { route: StepRoute; label: string; title: string }[] = [
  { route: "power", label: "Power demand", title: "Power requirement and energy cost" },
  { route: "timeline", label: "Delivery schedule", title: "Delivery schedule and critical path" },
  { route: "delays", label: "Cost of delay", title: "Cost of delay and priorities" },
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
    <nav aria-label="Sections" className="hidden items-stretch gap-6 self-stretch lg:flex">
      {navItems(route, s).map((it) => (
        <a
          key={it.label}
          href={it.href}
          onClick={linkClick(it.href)}
          aria-current={it.current ? "page" : undefined}
          className={`relative flex items-center whitespace-nowrap text-sm transition ${it.current ? "font-semibold text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand" : "text-muted hover:text-ink"}`}
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}

/** Below the large breakpoint the same links live in a menu. */
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
    <div ref={box} className="relative lg:hidden">
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
        <nav aria-label="Sections" className="absolute right-0 top-full z-40 mt-2 w-60 rounded-[7px] border border-line bg-surface p-1.5 shadow-[0_12px_32px_rgb(0_0_0/0.35)]">
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
      <span className="hidden xl:inline">Reset</span>
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
        <span className="hidden xl:inline">{copied ? "Link copied" : "Save scenario"}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </>
  );
}

/** The case study, as a dropdown: switch campus without losing your place. */
export function CampusSelect({ value, onChange, className = "" }: { value: string; onChange: (id: string) => void; className?: string }) {
  return (
    <label className={`relative inline-flex items-center ${className}`}>
      <span className="sr-only">Case study</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-[6px] border border-line bg-surface py-2 pl-3 pr-9 text-sm font-semibold text-ink transition hover:border-brand"
      >
        {CAMPUSES.map((c) => (
          <option key={c.id} value={c.id}>
            {c.company} · {c.site}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-muted" aria-hidden />
    </label>
  );
}

function CaseBar({ s, onSwitch }: { s: Scenario; onSwitch: (id: string) => void }) {
  const c = CAMPUSES.find((x) => x.id === s.campusId) ?? CAMPUSES[0]!;
  const it = c.phases.reduce((n, p) => n + phaseItMw(p), 0);
  return (
    <div className="border-b border-line bg-bg print:hidden">
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-8">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Case study</span>
        <CampusSelect value={c.id} onChange={onSwitch} className="min-w-0 max-w-full sm:w-80" />
        <span className="font-mono text-xs text-muted">
          {formatMw(it)} IT · {c.phases.length} phases · {c.customer}
        </span>
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

export function Frame({
  route,
  s,
  setS,
  children,
}: {
  route: PageRoute;
  s: Scenario;
  setS: (s: Scenario) => void;
  children: ReactNode;
}) {
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
      {route !== "faq" && <CaseBar s={s} onSwitch={(id) => setS({ ...switchCampus(id), hedge: s.hedge, expansion: s.expansion })} />}
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

export function StepHeading({ route, campus, children }: { route: StepRoute; campus: Campus; children?: ReactNode }) {
  const i = STEPS.findIndex((x) => x.route === route);
  return (
    <div className="mb-7 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-8 print:hidden">
      <div>
        <p className="kicker">
          {campus.company} · {campus.site}
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-4xl">{STEPS[i]!.title}</h1>
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
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink-2">Delivery risk for AI data center campuses: power demand, critical path and the cost of delay.</p>
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
            <li>Public disclosures plus labeled assumptions</li>
            <li>
              Related:{" "}
              <a href="https://breakeven-silk.vercel.app" className="underline underline-offset-2 hover:text-ink">
                Breakeven
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-[1320px] px-4 py-5 font-mono text-[11px] uppercase tracking-[0.12em] text-muted sm:px-8">
          © 2026 Loadline · Illustrative model, not company guidance
        </p>
      </div>
    </footer>
  );
}
