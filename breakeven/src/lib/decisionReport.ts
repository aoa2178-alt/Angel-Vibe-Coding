// "Generate Decision Report": sends the plan's key choices to Angel's n8n workflow, which writes the report.
// Six fields come from the plan as it stands; four (name, current setup, growth, horizon) are asked for next to the button.
import { BURST_PRESETS } from "./operate";
import { landingPlan, callOf } from "./call";
import { VERDICT_LABELS } from "./necessity";
import { planNecessity, stepHref, type Plan } from "./plan";
import { CRITERIA } from "./scorecard";
import { cheapest, compare, facilityKwPerGpu, type OptionId } from "./tco";
import { templateById } from "./roi";

export const REPORT_WEBHOOK = "https://angelvibecoding.app.n8n.cloud/webhook/breakeven-scenario";

export const DEPLOYMENTS = ["Not using AI yet", "Pay-per-token API", "Rented cloud GPUs", "Own GPUs", "A mix"] as const;
export const HORIZONS = [1, 2, 3, 4, 5] as const;

/** The four answers asked for next to the button. */
export interface ReportForm {
  scenarioName: string;
  currentDeployment: string;
  /** Expected growth in monthly volume per year, in percent (e.g. "30"); a string while being typed */
  growthPct: string;
  horizonYears: number;
}

export interface ReportPayload {
  scenario_name: string;
  monthly_tokens: number;
  workload_type: string;
  current_deployment: string;
  demand_pattern: string;
  /** Percent per year, e.g. 30 = 30% */
  expected_annual_growth: number;
  /** Years */
  decision_horizon: number;
  /** Step 2's "Beyond cost" weights, 0–5 */
  cost_priority: number;
  scalability_priority: number;
  privacy_priority: number;
}

/** What the plan is for: the step-1 template, or the product. */
export function workloadType(plan: Plan) {
  if (plan.mode === "product") return "AI product we sell";
  return plan.templateId ? templateById(plan.templateId).label : "General AI workload";
}

/** The step-2 traffic preset, or "Custom" if the burstiness was set by hand. */
export function demandPattern(plan: Plan) {
  return BURST_PRESETS.find((b) => b.value === plan.ops.burst)?.label ?? "Custom";
}

/** The default report name: the same title the Result page shows. */
export function defaultScenarioName(plan: Plan) {
  if (plan.mode === "product") return "Your AI product";
  return plan.templateId ? `AI for ${templateById(plan.templateId).label.toLowerCase()}` : "How to run your AI";
}

/** Checks the form; returns an error per field that needs fixing (empty when ready to send). */
export function validateForm(form: ReportForm) {
  const errors: Partial<Record<keyof ReportForm, string>> = {};
  if (!form.scenarioName.trim()) errors.scenarioName = "Enter a scenario name";
  if (!(DEPLOYMENTS as readonly string[]).includes(form.currentDeployment)) errors.currentDeployment = "Pick how you run AI today";
  const g = Number(form.growthPct);
  if (form.growthPct.trim() === "" || !Number.isFinite(g) || g < -100 || g > 1000) errors.growthPct = "Enter a yearly growth between −100% and 1,000%";
  return errors;
}

export function buildPayload(plan: Plan, form: ReportForm): ReportPayload {
  return {
    scenario_name: form.scenarioName.trim(),
    monthly_tokens: Math.round(plan.workload.tokensM * 1_000_000),
    workload_type: workloadType(plan),
    current_deployment: form.currentDeployment,
    demand_pattern: demandPattern(plan),
    expected_annual_growth: Number(form.growthPct),
    decision_horizon: form.horizonYears,
    cost_priority: plan.weights.cost,
    scalability_priority: plan.weights.flex,
    privacy_priority: plan.weights.control,
  };
}

const OPTION_NAMES: Record<OptionId, string> = { api: "Pay per token (API)", rent: "Rent cloud GPUs", own: "Own GPUs" };
const round = (n: number, digits = 0) => Math.round(n * 10 ** digits) / 10 ** digits;

/**
 * Everything Breakeven worked out, for the n8n report template: costs, crossovers, the recommendation and what would
 * change it, the business case, power, running it, a year-by-year look at the growth the person expects, and the plan.
 */
export function buildResults(plan: Plan, form: ReportForm) {
  const call = callOf(plan);
  const { costs, card, recommended, cheapestId, cross, r, product, split, q, hottest } = call;
  const growth = Number(form.growthPct) / 100;
  const years = Array.from({ length: form.horizonYears + 1 }, (_, year) => {
    const tokensM = Math.max(0.001, plan.workload.tokensM * Math.pow(1 + growth, year));
    const c = compare({ ...plan.workload, tokensM }, plan.assumptions);
    return {
      year,
      monthly_tokens: Math.round(tokensM * 1_000_000),
      api: round(c.api.monthly),
      rent: round(c.rent.monthly),
      own: round(c.own.monthly),
      cheapest: OPTION_NAMES[cheapest(c)],
    };
  });
  const nec = plan.mode === "work" && plan.templateId ? planNecessity(plan) : null;
  const ownGpus = costs.own.gpus ?? 0;
  return {
    app_link: `https://breakeven-silk.vercel.app${stepHref("result", plan)}`,
    recommended: OPTION_NAMES[recommended],
    cheapest: OPTION_NAMES[cheapestId],
    best_fit_differs: recommended !== cheapestId,
    options: (["api", "rent", "own"] as OptionId[]).map((id) => ({
      name: OPTION_NAMES[id],
      monthly: round(costs[id].monthly),
      yearly: round(costs[id].monthly * 12),
      per_million_tokens: round(costs[id].perM, 2),
      gpus: costs[id].gpus,
      fit_score: round(card.totals[id]),
    })),
    priorities: CRITERIA.map((c) => ({ name: c.label, weight: plan.weights[c.id] })),
    api_cheapest_until_tokens: cross.apiUntilM === null ? null : Math.round(cross.apiUntilM * 1_000_000),
    own_cheapest_from_tokens: cross.ownFromM === null ? null : Math.round(cross.ownFromM * 1_000_000),
    yearly_change_vs_today: call.versusToday === null ? null : round(call.versusToday),
    what_would_change_it: [...call.checks, ...call.volumeChecks].map((c) => ({
      check: c.label,
      holds: c.holds,
      instead: c.instead ? OPTION_NAMES[c.instead] : null,
    })),
    growth_years: years,
    business_case: r && {
      people_cost_monthly: round(r.humanCost),
      cost_with_ai_monthly: round(r.aiCost),
      compute_monthly: round(r.computeCost),
      savings_monthly: round(r.savings),
      payback_months: r.paybackMonths === null ? null : round(r.paybackMonths, 1),
      roi_12_months_pct: r.roi12 === null ? null : round(r.roi12 * 100),
      ai_success_rate_pct: round(call.inputs.aiSuccess * 100),
    },
    is_ai_the_right_tool: nec && {
      verdict: VERDICT_LABELS[nec.verdict],
      reason: nec.reason,
      options: nec.options
        .filter((o) => o.available)
        .map((o) => ({
          name: o.label,
          npv_conservative: round(o.cases.conservative.npv),
          npv_base: round(o.cases.base.npv),
          npv_optimistic: round(o.cases.optimistic.npv),
          payback_months: o.cases.base.payback === null ? null : round(o.cases.base.payback, 1),
        })),
      evidence_to_gather: nec.missing.map((m) => `${m.label}: ${m.how}`),
    },
    product: product && {
      monthly_revenue: round(product.revenue),
      monthly_compute: round(product.compute),
      margin_pct: product.marginPct === null ? null : round(product.marginPct * 100),
      free_users_per_paying_user: product.freePerPaid === null ? null : round(product.freePerPaid, 1),
      break_even_paid_share_pct: product.breakEvenShare === null ? null : round(product.breakEvenShare * 100, 1),
    },
    power: {
      owned_gpus: ownGpus,
      facility_kw: round(ownGpus * facilityKwPerGpu(plan.assumptions), 1),
      power_cap_kw: plan.assumptions.powerLimitKw || null,
    },
    running_it: {
      response_seconds: round(q.responseSec, 2),
      wait_target_seconds: plan.ops.waitTargetSec,
      hottest_utilization_pct: hottest === null ? null : round(hottest * 100),
      hybrid_best: split.best,
      flexibility_value_monthly: round(split.flexibilityValue),
    },
    plan_30_60_90: landingPlan(recommended).map((step) => ({ when: step.when, actions: step.what })),
  };
}

/**
 * Opens the report: posts the scenario and results to the n8n workflow as a normal form, into a new tab, so the
 * finished page n8n sends back opens there, ready to print or save as PDF.
 */
export function openReport(payload: ReportPayload, results: ReturnType<typeof buildResults>, doc: Document = document) {
  const form = doc.createElement("form");
  form.method = "POST";
  form.action = REPORT_WEBHOOK;
  form.target = "_blank";
  form.style.display = "none";
  const add = (name: string, value: string) => {
    const input = doc.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  };
  // The ten answers as their own fields (what the workflow's sheet logging reads), plus everything in "data".
  for (const [name, value] of Object.entries(payload)) add(name, String(value));
  add("data", JSON.stringify({ ...payload, results }));
  doc.body.appendChild(form);
  form.submit();
  form.remove();
}
