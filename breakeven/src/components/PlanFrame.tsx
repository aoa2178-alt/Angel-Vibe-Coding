import { ArrowLeft, ArrowRight, Check, Link2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { linkClick } from "./Brand";
import { OPTIONS } from "./options";
import { PillBar, SiteFooter } from "./Site";
import { STEPS, ownedClusterGpus, planQuery, readPlan, stepHref, type Plan, type StepRoute } from "@/lib/plan";
import { cheapest, compare, facilityKwPerGpu, formatTokensM } from "@/lib/tco";

export type PageRoute = StepRoute | "sources";

/** The plan for a step page: read from the URL once, and written back to it on every change so it's always shareable. */
export function usePlan(route: PageRoute, init: (p: Plan) => Plan = (p) => p) {
  const [plan, setPlan] = useState(() => init(readPlan(window.location.search)));
  useEffect(() => {
    window.history.replaceState(null, "", `/${route}${planQuery(plan)}${window.location.hash}`);
  }, [route, plan]);
  return [plan, setPlan] as const;
}

export const formatKw = (kw: number) => (kw >= 1000 ? `${(kw / 1000).toFixed(kw >= 10_000 ? 0 : 1)} MW` : `${kw.toFixed(kw >= 100 ? 0 : 1)} kW`);

/** 1 Worth it · 2 Run it · 3 Power it · Result, then Sources. Every link carries the plan. */
function StepTracker({ route, plan, compact = false }: { route: PageRoute; plan: Plan; compact?: boolean }) {
  const sources = `/sources${planQuery(plan)}`;
  return (
    <nav aria-label="Steps" className={compact ? "flex items-center gap-1 overflow-x-auto" : "hidden items-center gap-1 lg:flex"}>
      {STEPS.map((s, i) => {
        const href = stepHref(s.route, plan);
        const current = s.route === route;
        const n = i < 3 ? i + 1 : null;
        return (
          <a
            key={s.route}
            href={href}
            onClick={linkClick(href)}
            aria-current={current ? "step" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition ${
              current ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-sunken hover:text-ink"
            }`}
          >
            {n && (
              <span className={`grid size-5 place-items-center rounded-full font-mono text-[11px] font-semibold ${current ? "bg-brand text-white" : "bg-sunken text-ink-2"}`}>
                {n}
              </span>
            )}
            {s.label}
          </a>
        );
      })}
      <span className="mx-1 h-5 w-px shrink-0 bg-line" aria-hidden />
      <a
        href={sources}
        onClick={linkClick(sources)}
        aria-current={route === "sources" ? "page" : undefined}
        className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition ${route === "sources" ? "bg-brand-soft text-brand-ink" : "text-ink-2 hover:bg-sunken hover:text-ink"}`}
      >
        Sources
      </a>
    </nav>
  );
}

/** The same chain on every step: tokens a month → GPUs → power, and what's cheapest. */
export function WorkloadStrip({ plan, route }: { plan: Plan; route: PageRoute }) {
  const costs = compare(plan.workload, plan.assumptions);
  const winner = cheapest(costs);
  const rented = costs.rent.gpus ?? 0;
  const owned = ownedClusterGpus(plan);
  const kw = owned * facilityKwPerGpu(plan.assumptions);
  const edit = stepHref("run-it", plan);
  return (
    <div className="mx-auto mt-2 flex max-w-[1200px] flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm">
      <span className="font-mono text-ink">
        {formatTokensM(plan.workload.tokensM)} tokens/mo <span className="text-muted">→</span> {rented} GPU{rented === 1 ? "" : "s"}{" "}
        <span className="text-muted">({owned} if owned)</span> <span className="text-muted">→</span> {formatKw(kw)}
      </span>
      <span className="flex items-center gap-1.5 text-ink-2">
        <span className={`size-2.5 rounded-full ${OPTIONS[winner].swatch}`} aria-hidden />
        Cheapest: <span className="font-semibold text-ink">{OPTIONS[winner].name}</span>
      </span>
      {route !== "run-it" && (
        <a href={edit} onClick={linkClick(edit)} className="ml-auto text-xs font-semibold text-brand-ink underline underline-offset-2">
          Edit in step 2
        </a>
      )}
    </div>
  );
}

/** Copies the current URL, which always holds the whole plan. */
export function CopyLinkButton({ label = "Save plan" }: { label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link to your plan:", window.location.href);
    }
  }
  return (
    <>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-ink"
        aria-label={`${label}: copy a link to it`}
      >
        {copied ? <Check className="size-3.5" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />}
        <span className="hidden sm:inline">{copied ? "Link copied" : label}</span>
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? "Link to your plan copied" : ""}
      </span>
    </>
  );
}

/**
 * The frame every step shares: the pill bar with the step tracker, the workload strip, the page, Back/Next, and the footer.
 * Step pages pass their plan so every link carries it.
 */
export function PlanFrame({
  route,
  plan,
  actions,
  strip = true,
  footerNote,
  bare = false,
  children,
}: {
  route: PageRoute;
  plan: Plan;
  actions?: ReactNode;
  strip?: boolean;
  footerNote?: ReactNode;
  /** Full-width page content (no step container or Back/Next), for Sources */
  bare?: boolean;
  children: ReactNode;
}) {
  const i = STEPS.findIndex((s) => s.route === route);
  const prev = i > 0 ? STEPS[i - 1] : null;
  const next = i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null;
  return (
    <div className="min-h-dvh">
      <PillBar
        logoTagline
        center={<StepTracker route={route} plan={plan} />}
        actions={actions ?? <CopyLinkButton />}
        below={
          <div className="mx-auto mt-2 max-w-[1200px] rounded-2xl border border-line bg-surface p-1 lg:hidden print:hidden">
            <StepTracker route={route} plan={plan} compact />
          </div>
        }
      />
      {strip && (
        <div className="px-3 print:hidden">
          <WorkloadStrip plan={plan} route={route} />
        </div>
      )}

      {bare ? (
        <main>{children}</main>
      ) : (
      <main className="mx-auto max-w-[1200px] px-4 pb-16 pt-8 sm:px-6 print:p-0">
        {children}

        {i >= 0 && (
          <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 print:hidden">
            {prev ? (
              <a
                href={stepHref(prev.route, plan)}
                onClick={linkClick(stepHref(prev.route, plan))}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-3 font-semibold transition hover:border-brand"
              >
                <ArrowLeft className="size-4" aria-hidden /> {i - 1 < 3 ? `${i}. ` : ""}
                {prev.label}
              </a>
            ) : (
              <span>{footerNote}</span>
            )}
            {next && (
              <a
                href={stepHref(next.route, plan)}
                onClick={linkClick(stepHref(next.route, plan))}
                className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-ink"
              >
                Next: {i + 1 < 3 ? `${i + 2}. ` : ""}
                {next.label} <ArrowRight className="size-4" aria-hidden />
              </a>
            )}
          </div>
        )}
      </main>
      )}
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}

/** The heading every step opens with: its number, its question, and one line on what it answers. */
export function StepHeading({ route, children }: { route: StepRoute; children?: ReactNode }) {
  const i = STEPS.findIndex((s) => s.route === route);
  const s = STEPS[i]!;
  return (
    <div className="mb-7 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-8 print:hidden">
      <div>
        <p className="kicker">{i < 3 ? `Step ${i + 1} of 3 · ${s.label}` : s.label}</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-none tracking-[-0.035em] sm:text-5xl">{s.question}</h1>
      </div>
      {children && <div className="max-w-md text-base text-ink-2 lg:text-right">{children}</div>}
    </div>
  );
}
