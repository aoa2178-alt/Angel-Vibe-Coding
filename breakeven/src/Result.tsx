import { ArrowRight, Printer } from "lucide-react";
import { useMemo } from "react";
import { STRATEGY_META } from "./PowerIt";
import { linkClick } from "@/components/Brand";
import { OPTIONS } from "@/components/options";
import { CopyLinkButton, PlanFrame, formatKw, usePlan } from "@/components/PlanFrame";
import { SummaryStat, joinLabels, months, percent } from "@/components/ui";
import { clusterGpusOf, ownedClusterGpus, planRoi, roiInputsOf, stepHref, type Plan } from "@/lib/plan";
import { templateById, type RoiInputs, type RoiResult } from "@/lib/roi";
import { OPTION_IDS, advantages, scorecard } from "@/lib/scorecard";
import { bestStrategy, facilityKw, formatMoney, strategies, totalOver } from "@/lib/speedToPower";
import { cheapest, compare, facilityKwPerGpu, formatTokensM, formatUsd, maxOwnedGpus, sensitivity, type OptionId } from "@/lib/tco";

/** The result: all three answers on one printable page, from the same plan the steps share. */
export function Result() {
  const [plan] = usePlan("result");
  const { workload, assumptions, weights, bridge } = plan;
  const costs = useMemo(() => compare(workload, assumptions), [workload, assumptions]);
  const winner = cheapest(costs);
  const card = useMemo(() => scorecard(costs, weights, plan.scores), [costs, weights, plan.scores]);
  const recommended: OptionId = card.winner ?? winner;
  const r = plan.templateId ? planRoi(plan) : null;
  const inputs = roiInputsOf(plan);
  const owned = ownedClusterGpus(plan);
  const ownedKw = owned * facilityKwPerGpu(assumptions);
  const cluster = clusterGpusOf(plan);
  const bridges = strategies(cluster, assumptions, bridge);
  const bestBridge = bestStrategy(bridges, bridge.delayMonths);
  const risks = planRisks(plan, r, winner);
  const step1 = stepHref("worth-it", plan);
  const title = plan.templateId ? `AI for ${templateById(plan.templateId).label.toLowerCase()}` : "How to run your AI";

  return (
    <PlanFrame
      route="result"
      plan={plan}
      actions={
        <>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-2.5 text-xs font-semibold text-ink-2 transition hover:border-brand hover:text-ink"
            aria-label="Print or save as PDF"
          >
            <Printer className="size-3.5" aria-hidden />
            <span className="hidden xl:inline">Print or PDF</span>
          </button>
          <CopyLinkButton />
        </>
      }
    >
      <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="border-b border-line pb-6">
          <p className="kicker">Your AI plan · Breakeven</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">{title}</h1>
          <p className="mt-2 text-sm text-muted">
            Prepared {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {formatTokensM(workload.tokensM)} tokens a
            month · Illustrative estimate, USD
          </p>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          <SummaryStat label="Run it on" value={OPTIONS[recommended].short} />
          <SummaryStat label="AI cost / month" value={formatUsd(costs[recommended].monthly)} />
          <SummaryStat label="Savings / month" value={r ? (r.savings > 0 ? formatUsd(r.savings) : `−${formatUsd(-r.savings)}`) : "Step 1 skipped"} />
          <SummaryStat label="Power if owned" value={formatKw(ownedKw)} />
        </dl>

        <Section n={1} title="Is it worth it?">
          {r ? (
            <p>
              Today {inputs.tasksPerMonth.toLocaleString("en-US")} tasks a month cost {formatUsd(r.humanCost)} in people's time. With AI solving{" "}
              {percent(inputs.aiSuccess)} of them and people reviewing its work and handling the rest, the same work costs {formatUsd(r.aiCost)},
              including {formatUsd(r.computeCost)} of compute.{" "}
              {r.savings > 0
                ? `That saves ${formatUsd(r.savings)} a month and pays back the ${formatUsd(inputs.setupCost)} setup in ${months(r.paybackMonths!)}.`
                : `That costs ${formatUsd(-r.savings)} a month more than today, so the case doesn't hold at these numbers.`}
            </p>
          ) : (
            <p>
              You went straight to the cost comparison.{" "}
              <a href={step1} onClick={linkClick(step1)} className="inline-flex items-center gap-1 font-semibold text-brand-ink underline underline-offset-2">
                Check whether AI pays off for this work <ArrowRight className="size-3.5" aria-hidden />
              </a>
            </p>
          )}
        </Section>

        <Section n={2} title="How should we run it?">
          <div className={`theme-${recommended} win-border rounded-2xl border-2 p-5`}>
            <p className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-ink">
              <span className={`size-3.5 shrink-0 rounded-full ${OPTIONS[recommended].swatch}`} aria-hidden />
              {OPTIONS[recommended].name}
            </p>
            <p className="mt-2">
              {card.winner ? `Scores ${Math.round(card.totals[recommended])} out of 100 on your priorities` : "The cheapest option"} and costs{" "}
              {formatUsd(costs[recommended].monthly)} a month ({formatUsd(costs[recommended].perM, 2)} per million tokens).
              {recommended !== winner &&
                ` ${OPTIONS[winner].name} would be ${formatUsd(costs[recommended].monthly - costs[winner].monthly)} a month cheaper, but scores lower on ${joinLabels(
                  advantages(card, weights, recommended, winner).map((a) => a.label.toLowerCase()),
                )}.`}
            </p>
            <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted">
              {OPTION_IDS.map((id) => (
                <li key={id}>
                  {OPTIONS[id].short} {Math.round(card.totals[id])}/100 · {formatUsd(costs[id].monthly)}/mo
                </li>
              ))}
            </ul>
          </div>
        </Section>

        <Section n={3} title="Can we power it?">
          <p>
            Owning at this volume means {owned.toLocaleString("en-US")} GPUs in whole servers, about {formatKw(ownedKw)} of facility power.{" "}
            {assumptions.powerLimitKw > 0 &&
              `Your ${assumptions.powerLimitKw} kW power budget covers up to ${maxOwnedGpus(assumptions)} owned GPUs; anything above that is rented. `}
            {recommended !== "own" && plan.clusterGpus === null && "Owning isn't the recommendation here, so power only matters if you choose to own. "}
            {plan.clusterGpus === null && ownedKw < 1000 && "At this size a colocation cage can usually power it today; grid delays bite at multi-megawatt scale."}
          </p>
          {bridge.delayMonths > 0 && (plan.clusterGpus !== null || facilityKw(cluster, assumptions) >= 1000) && (
            <p className="mt-3">
              If the grid connection for {cluster.toLocaleString("en-US")} GPUs ({formatKw(facilityKw(cluster, assumptions))}) is{" "}
              {bridge.delayMonths} months late, the cheapest way to bridge the wait is{" "}
              <span className="font-semibold text-ink">{STRATEGY_META[bestBridge].name}</span>, at{" "}
              {formatMoney(totalOver(bridges[bestBridge], bridge.delayMonths))} extra.
            </p>
          )}
        </Section>

        <section className="mt-8">
          <h2 className="kicker">Risks to check</h2>
          <ul className="mt-3 space-y-3">
            {risks.map((risk) => (
              <li key={risk} className="flex gap-3 text-[15px] leading-7 text-ink-2">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {risk}
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          Every number is an editable assumption with a source on the Sources page. Illustrative, not quotes; excludes taxes, egress and
          change-management costs.
        </p>
      </article>
    </PlanFrame>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
        <span className="grid size-7 place-items-center rounded-full bg-brand-soft font-mono text-xs font-semibold text-brand-ink">{n}</span>
        {title}
      </h2>
      <div className="mt-3 text-[16px] leading-8 text-ink-2">{children}</div>
    </section>
  );
}

/** What could make this plan wrong, most important first. */
function planRisks(plan: Plan, r: RoiResult | null, winner: OptionId) {
  const out: string[] = [];
  if (r) out.push(...roiRisks(roiInputsOf(plan), r));
  const flips = sensitivity(plan.workload, plan.assumptions).filter((s) => s.flips);
  for (const f of flips.slice(0, 2)) {
    const lower = f.low.winner !== winner;
    const to = lower ? f.low.winner : f.high.winner;
    out.push(`If ${sentenceCase(f.label)} is 25% ${lower ? "lower" : "higher"} than assumed, ${OPTIONS[to].name} becomes the cheapest way to run it.`);
  }
  if (flips.length === 0) out.push("No single price or hardware assumption moving 25% changes the cheapest way to run it at this volume.");
  if (r) out.push("Template figures are illustrative. Replace them with your own volumes, handling times and pay rates.");
  return out;
}

function roiRisks(inputs: RoiInputs, r: RoiResult) {
  const out: string[] = [];
  if (r.savings <= 0) out.push("At these numbers AI costs more than it saves. Raise the success rate or shorten reviews before investing.");
  else if (r.paybackMonths! > 12) out.push(`Payback takes ${months(r.paybackMonths!)}, longer than a typical one-year budget cycle.`);
  if (inputs.aiSuccess < 0.5) {
    out.push(`The AI solves only ${percent(inputs.aiSuccess)} of tasks, and the savings move with that rate. Measure it in a pilot first.`);
  }
  if (r.savings > 0) {
    // How far the success rate can fall before the savings are gone.
    const perTaskGain = (inputs.humanMinutes - inputs.reviewMinutes) * (inputs.hourlyCost / 60) * inputs.tasksPerMonth;
    const breakEven = perTaskGain > 0 ? inputs.aiSuccess - r.savings / perTaskGain : null;
    if (breakEven !== null && breakEven >= 0.05) out.push(`The savings disappear if the success rate falls below about ${percent(breakEven)}.`);
    else if (breakEven !== null) out.push(`Each task the AI solves saves ${inputs.humanMinutes - inputs.reviewMinutes} of ${inputs.humanMinutes} minutes, so the case holds even at a low success rate.`);
  }
  return out;
}

/** "Electricity" → "electricity", but "GPU throughput" stays as it is. */
function sentenceCase(label: string) {
  return /^[A-Z]{2}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1);
}
