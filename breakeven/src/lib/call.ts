// "The call": Breakeven's answer as a strategist would write it. The recommendation and its value versus what the company
// does today, the checks that would change it, how to land it, and how we'd know it worked.
import { hybrid, maxUtilizationFor, responseTime } from "./operate";
import { planFreemium, planRoi, roiInputsOf, type Current, type Plan } from "./plan";
import { scorecard } from "./scorecard";
import { cheapest, compare, crossovers, formatTokensM, sensitivity, type OptionId } from "./tco";

export interface Check {
  label: string;
  holds: boolean;
  /** What wins instead, when it doesn't hold */
  instead?: OptionId;
}

export function callOf(plan: Plan) {
  const costs = compare(plan.workload, plan.assumptions);
  const cheapestId = cheapest(costs);
  const card = scorecard(costs, plan.weights, plan.scores);
  const recommended: OptionId = card.winner ?? cheapestId;
  const split = hybrid(plan.workload, plan.assumptions, plan.ops);
  const product = plan.mode === "product" ? planFreemium(plan) : null;
  const r = plan.templateId && !product ? planRoi(plan) : null;
  const cross = crossovers(plan.workload, plan.assumptions);

  /** Yearly saving from moving today's setup to the recommendation (negative = it costs more). */
  const current: Current | undefined = plan.current;
  const versusToday = current === "api" || current === "rent" || current === "own" ? (costs[current].monthly - costs[recommended].monthly) * 12 : null;

  // What would change my mind: each price or hardware driver 25% either way, plus the volume flip points.
  const checks: Check[] = sensitivity(plan.workload, plan.assumptions).map((s) => {
    const lowerFlips = s.low.winner !== cheapestId;
    const instead = lowerFlips ? s.low.winner : s.high.winner;
    return s.flips
      ? { label: `${s.label} ${lowerFlips ? "25% lower" : "25% higher"} than assumed`, holds: false, instead }
      : { label: `${s.label} 25% higher or lower`, holds: true };
  });
  const volumeChecks: Check[] = [];
  const v = plan.workload.tokensM;
  if (cross.apiUntilM !== null) {
    volumeChecks.push(
      v < cross.apiUntilM
        ? { label: `Volume grows past about ${formatTokensM(cross.apiUntilM)} tokens a month`, holds: false, instead: cheapest(compare({ ...plan.workload, tokensM: cross.apiUntilM * 1.2 }, plan.assumptions)) }
        : { label: `Volume falls below about ${formatTokensM(cross.apiUntilM)} tokens a month`, holds: false, instead: "api" },
    );
  }
  if (cross.ownFromM !== null && v < cross.ownFromM && (cross.apiUntilM === null || cross.ownFromM > cross.apiUntilM * 1.5)) {
    volumeChecks.push({ label: `Volume grows past about ${formatTokensM(cross.ownFromM)} tokens a month`, holds: false, instead: "own" });
  }

  const q = responseTime(plan.workload, plan.assumptions, plan.ops);
  const hottest = maxUtilizationFor(plan.workload, plan.assumptions, plan.ops);
  const inputs = roiInputsOf(plan);
  return { costs, cheapestId, card, recommended, split, product, r, cross, versusToday, current, checks, volumeChecks, q, hottest, inputs };
}

export type Call = ReturnType<typeof callOf>;

/** The 30/60/90-day plan for landing each recommendation. */
export function landingPlan(id: OptionId): { when: string; what: string[] }[] {
  if (id === "api")
    return [
      { when: "First 30 days", what: ["Pick the model by testing 2–3 on 100 of your real tasks", "Set a monthly budget, alerts and prompt caching", "Agree who reviews AI output, and how"] },
      { when: "60 days", what: ["Pilot on one workflow", "Measure the AI's success rate and review time against the plan", "Track cost per finished task, not per token"] },
      { when: "90 days", what: ["Scale or stop, on the measured numbers", "Negotiate committed-use pricing", "Set the volume that triggers a rent-or-own review"] },
    ];
  if (id === "rent")
    return [
      { when: "First 30 days", what: ["Test an open-weight model against a frontier API on your own tasks", "Reserve GPUs month to month; don't commit yet", "Name an owner for running the model"] },
      { when: "60 days", what: ["Load-test to the response-time target", "Autoscale for peaks; rent peak hours on demand", "Track utilization weekly"] },
      { when: "90 days", what: ["Sign a 6–12 month reservation if utilization holds", "Set the volume that triggers an own review", "Keep an API fallback for overflow"] },
    ];
  return [
    { when: "First 30 days", what: ["Order servers now: lead times run months", "Book colocation space and power", "Hire or contract the team that will run it"] },
    { when: "60 days", what: ["Rent the same capacity while hardware arrives", "Test the model and the serving stack", "Plan for spares and support contracts"] },
    { when: "90 days", what: ["Move traffic to owned GPUs; keep renting the peaks", "Track utilization: owning only pays when they're busy", "Set the retire-and-replace date"] },
  ];
}
