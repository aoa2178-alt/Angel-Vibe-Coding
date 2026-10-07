// "Generate Decision Report": sends the plan's key choices to Angel's n8n workflow, which writes the report.
// Six fields come from the plan as it stands; four (name, current setup, growth, horizon) are asked for next to the button.
import { BURST_PRESETS } from "./operate";
import type { Plan } from "./plan";
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

/** POSTs the payload as JSON. Resolves on a 2xx answer; throws a friendly message otherwise. */
export async function sendReport(payload: ReportPayload, fetchImpl: typeof fetch = fetch, timeoutMs = 30_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(REPORT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
  } catch {
    throw new Error("The decision report couldn't be generated right now. Check your connection and try again in a moment.");
  } finally {
    clearTimeout(timer);
  }
}
