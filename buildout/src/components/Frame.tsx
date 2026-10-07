import { ArrowLeft, ArrowRight, Check, Link2 } from "lucide-react";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { DATA, formatQuarter } from "@/lib/data";
import { latestCommon } from "@/lib/metrics";
import { SPENDERS } from "@/lib/data";
import { readScenario, scenarioQuery, type Scenario } from "@/lib/scenario";

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

export function Logo() {
  return (
    <a href="/" onClick={linkClick("/")} className="flex shrink-0 items-center gap-2.5" aria-label="Buildout home">
      <span className="grid size-9 place-items-center rounded-xl bg-brand" aria-hidden>
        <svg viewBox="0 0 32 32" className="size-6" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
          <path d="M7 25 V17 M13 25 V12 M19 25 V15 M25 25 V7" />
        </svg>
      </span>
      <span className="text-lg font-extrabold tracking-tight">Buildout</span>
    </a>
  );
}

/* ---------- The steps ---------- */

export type StepRoute = "spend" | "payoff" | "receivers" | "note";
export type PageRoute = StepRoute | "sources";

export const STEPS: { route: StepRoute; label: string; question: string }[] = [
  { route: "spend", label: "Spend", question: "How much is Big Tech spending?" },
  { route: "payoff", label: "Payoff", question: "Is it paying off?" },
  { route: "receivers", label: "Receivers", question: "Who is getting the money?" },
  { route: "note", label: "The call", question: "The call: the quarterly note" },
];
const NUMBERED = 3;

export const href = (route: PageRoute, s: Scenario) => `/${route}${scenarioQuery(s)}`;

/** The scenario for a page: read from the URL once, written back on every change so the address is always shareable. */
export function useScenario(route: PageRoute) {
  const [scenario, setScenario] = useState(() => readScenario(window.location.search));
  useEffect(() => {
    window.history.replaceState(null, "", `/${route}${scenarioQuery(scenario)}${window.location.hash}`);
  }, [route, scenario]);
  return [scenario, setScenario] as const;
}

function Tracker({ route, s, compact = false }: { route: PageRoute; s: Scenario; compact?: boolean }) {
  return (
    <nav aria-label="Steps" className={compact ? "flex items-center gap-1 overflow-x-auto" : "hidden items-center gap-1 lg:flex"}>
      {STEPS.map((step, i) => {
        const to = href(step.route, s);
        const current = step.route === route;
        return (
          <a
            key={step.route}
            href={to}
            onClick={linkClick(to)}
            aria-current={current ? "step" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition ${
              current ? "bg-brand text-on-brand" : "text-ink-2 hover:bg-sunken hover:text-ink"
            }`}
          >
            {i < NUMBERED && (
              <span className={`grid size-5 place-items-center rounded-full font-mono text-[11px] font-semibold ${current ? "bg-white/20 text-white" : "bg-sunken text-ink-2"}`}>
                {i + 1}
              </span>
            )}
            {step.label}
          </a>
        );
      })}
      <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden />
      <a
        href={href("sources", s)}
        onClick={linkClick(href("sources", s))}
        aria-current={route === "sources" ? "page" : undefined}
        className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition ${route === "sources" ? "bg-brand text-on-brand" : "text-ink-2 hover:bg-sunken hover:text-ink"}`}
      >
        Sources
      </a>
    </nav>
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
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2.5 text-xs font-semibold text-ink transition hover:border-brand"
        aria-label="Save scenario: copy a link to it"
      >
        {copied ? <Check className="size-3.5" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />}
        <span className="hidden sm:inline">{copied ? "Link copied" : "Save scenario"}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link copied" : ""}
      </span>
    </>
  );
}

/** What the numbers are and how fresh: every step leans on the same filings. */
function DataStrip() {
  return (
    <div className="mx-auto mt-2 flex max-w-[1200px] flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm">
      <p>
        <span className="font-semibold">SEC filings</span> <span className="text-muted">· 10-Q and 10-K figures for ten companies, calendar quarters</span>
      </p>
      <p className="font-mono text-xs text-ink-2">
        through {formatQuarter(latestCommon(SPENDERS))} · retrieved {DATA.retrieved}
      </p>
    </div>
  );
}

export function Frame({ route, s, children }: { route: PageRoute; s: Scenario; setS?: (s: Scenario) => void; children: ReactNode }) {
  const i = STEPS.findIndex((x) => x.route === route);
  const prev = i > 0 ? STEPS[i - 1] : null;
  const next = i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null;
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 px-3 pt-3 print:hidden">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 rounded-full border border-line bg-surface py-2 pl-3 pr-2 sm:pl-4">
          <Logo />
          <Tracker route={route} s={s} />
          <CopyLink />
        </div>
        <div className="mx-auto mt-2 max-w-[1200px] rounded-2xl border border-line bg-surface p-1 lg:hidden">
          <Tracker route={route} s={s} compact />
        </div>
      </header>
      <div className="px-3 print:hidden">
        <DataStrip />
      </div>
      <main className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 sm:px-6 print:p-0">
        {children}
        {i >= 0 && (
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 print:hidden">
            {prev ? (
              <a href={href(prev.route, s)} onClick={linkClick(href(prev.route, s))} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3 font-semibold transition hover:border-brand">
                <ArrowLeft className="size-4" aria-hidden /> {prev.label}
              </a>
            ) : (
              <span />
            )}
            {next && (
              <a href={href(next.route, s)} onClick={linkClick(href(next.route, s))} className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-on-brand transition hover:opacity-90">
                Next: {i + 1 < NUMBERED ? `${i + 2}. ` : ""}
                {next.label} <ArrowRight className="size-4" aria-hidden />
              </a>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export function StepHeading({ route, children }: { route: StepRoute; children?: ReactNode }) {
  const i = STEPS.findIndex((x) => x.route === route);
  return (
    <div className="mb-7 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-8 print:hidden">
      <div>
        <p className="kicker">
          {i < NUMBERED ? `Step ${i + 1} of ${NUMBERED} · ` : ""}
          AI capex, from the filings
        </p>
        <h1 className="mt-2 text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">{STEPS[i]!.question}</h1>
      </div>
      {children && <div className="max-w-md text-base text-ink-2 lg:text-right">{children}</div>}
    </div>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line bg-bg print:hidden">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-10 text-sm text-ink-2 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden text-muted sm:inline">The AI build-out, from the filings.</span>
        </div>
        <p className="text-muted">
          Built by Angel Ade-Oduntan · Figures from public SEC filings; not investment advice. Sister apps:{" "}
          <a href="https://breakeven-silk.vercel.app" className="font-semibold text-ink underline underline-offset-2">
            Breakeven
          </a>{" "}
          ·{" "}
          <a href="https://loadline-weld.vercel.app" className="font-semibold text-ink underline underline-offset-2">
            Loadline
          </a>{" "}
          ·{" "}
          <a href="https://throughline-gilt.vercel.app" className="font-semibold text-ink underline underline-offset-2">
            Throughline
          </a>{" "}
          ·{" "}
          <a href="https://keel-one-rho.vercel.app" className="font-semibold text-ink underline underline-offset-2">
            Keel
          </a>
        </p>
      </div>
    </footer>
  );
}
