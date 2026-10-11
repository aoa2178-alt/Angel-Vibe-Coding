// The AI necessity test: before adopting AI for a workflow, compare it with the cheaper alternatives and be willing to
// say "don't use AI". Four options are measured against changing nothing, on cash value over three years, in a
// conservative, base and optimistic case, and the result is a decision with its reason and the evidence still missing.
// Deterministic and auditable, like the rest of Breakeven: no figure here comes from a language model.
import { roi, templateById, type RoiInputs, type TemplateId } from "./roi";
import type { Assumptions } from "./tco";

/** The non-AI alternatives and how much of the freed time becomes cash. */
export interface Alternatives {
  /** Process redesign: share of handling time removed without new technology, 0–1 */
  redesignPct: number;
  redesignCost: number;
  /** Rules-based automation: share of tasks handled end to end with no person, 0–1 */
  rulesCoverage: number;
  rulesBuild: number;
  /** Rules maintenance, $ a month */
  rulesMaintenance: number;
  /** Share of freed people-hours that become cash savings (hiring avoided, attrition), 0–1; the rest is capacity */
  cashShare: number;
}

export const DEFAULT_CASH_SHARE = 0.5;
export const HORIZON_MONTHS = 36;
export const DISCOUNT_RATE = 0.1;

/** Illustrative alternatives for each template; every value is editable. */
export const ALT_TEMPLATES: Record<TemplateId, Omit<Alternatives, "cashShare">> = {
  support: { redesignPct: 0.1, redesignCost: 20_000, rulesCoverage: 0.15, rulesBuild: 60_000, rulesMaintenance: 750 },
  documents: { redesignPct: 0.1, redesignCost: 20_000, rulesCoverage: 0.6, rulesBuild: 80_000, rulesMaintenance: 1_000 },
  sales: { redesignPct: 0.1, redesignCost: 15_000, rulesCoverage: 0.05, rulesBuild: 30_000, rulesMaintenance: 400 },
  coding: { redesignPct: 0.05, redesignCost: 15_000, rulesCoverage: 0, rulesBuild: 0, rulesMaintenance: 0 },
};

export const altDefaults = (id: TemplateId | null, cashShare = DEFAULT_CASH_SHARE): Alternatives => ({
  ...ALT_TEMPLATES[id ?? "support"],
  cashShare,
});

/** URL keys, written only when they differ from the template's defaults. */
const KEYS: [keyof Alternatives, string][] = [
  ["redesignPct", "rd"],
  ["redesignCost", "rdc"],
  ["rulesCoverage", "ra"],
  ["rulesBuild", "rac"],
  ["rulesMaintenance", "ram"],
  ["cashShare", "cash"],
];

export function readAlt(params: URLSearchParams, templateId: TemplateId | null): Alternatives {
  const alt = altDefaults(templateId);
  for (const [key, param] of KEYS) {
    const raw = params.get(param);
    if (raw === null) continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) continue;
    const isShare = key === "redesignPct" || key === "rulesCoverage" || key === "cashShare";
    alt[key] = isShare ? Math.min(1, n) : n;
  }
  return alt;
}

export function writeAlt(params: URLSearchParams, alt: Alternatives, templateId: TemplateId | null) {
  const base = altDefaults(templateId);
  for (const [key, param] of KEYS) if (alt[key] !== base[key]) params.set(param, String(alt[key]));
}

export type OptionKey = "none" | "redesign" | "rules" | "ai";
export type CaseKey = "conservative" | "base" | "optimistic";
export const CASES: CaseKey[] = ["conservative", "base", "optimistic"];

export const OPTION_LABELS: Record<OptionKey, string> = {
  none: "No change",
  redesign: "Process redesign",
  rules: "Rules-based automation",
  ai: "AI with human review",
};

export interface OptionCase {
  oneTime: number;
  /** People cost avoided a month, versus no change */
  freed: number;
  /** Non-people running cost a month (compute, maintenance) */
  running: number;
  /** Cash benefit a month: freed × cash share − running */
  cash: number;
  /** People-hours a month freed but not turned into cash */
  capacityHours: number;
  npv: number;
  /** Months to earn back the one-time cost from cash benefit; 0 with no one-time cost; null if never */
  payback: number | null;
}

export interface OptionResult {
  id: OptionKey;
  label: string;
  /** False when the option doesn't apply (e.g. rules automation with no coverage) */
  available: boolean;
  cases: Record<CaseKey, OptionCase>;
}

export type Verdict = "invest" | "pilot" | "defer" | "reject" | "no-ai";

export interface NecessityResult {
  options: OptionResult[];
  verdict: Verdict;
  /** The non-AI option that beats AI, for "no-ai" */
  instead?: OptionKey;
  reason: string;
  missing: { label: string; how: string }[];
}

const monthlyRate = Math.pow(1 + DISCOUNT_RATE, 1 / 12) - 1;
/** Present value of $1 a month for the horizon, at the discount rate. */
export const ANNUITY = (1 - Math.pow(1 + monthlyRate, -HORIZON_MONTHS)) / monthlyRate;

/** How each case moves the uncertain inputs. The base case uses them as entered. */
const SCENARIOS: Record<CaseKey, { ai: number; review: number; coverage: number; redesign: number; compute: number; oneTime: number }> = {
  conservative: { ai: -0.15, review: 1.5, coverage: 0.75, redesign: 0.5, compute: 1.25, oneTime: 1.3 },
  base: { ai: 0, review: 1, coverage: 1, redesign: 1, compute: 1, oneTime: 1 },
  optimistic: { ai: 0.1, review: 0.75, coverage: 1.15, redesign: 1.25, compute: 0.8, oneTime: 0.9 },
};

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

function optionCase(oneTime: number, freed: number, running: number, cashShare: number, hourly: number): OptionCase {
  const cash = freed * cashShare - running;
  return {
    oneTime,
    freed,
    running,
    cash,
    capacityHours: hourly > 0 ? (Math.max(0, freed) * (1 - cashShare)) / hourly : 0,
    npv: -oneTime + cash * ANNUITY,
    payback: oneTime <= 0 ? (cash >= 0 ? 0 : null) : cash > 0 ? oneTime / cash : null,
  };
}

/** Run the necessity test for a workflow. */
export function necessity(inputs: RoiInputs, alt: Alternatives, a: Assumptions, utilization: number, templateId: TemplateId | null = null): NecessityResult {
  const people = inputs.tasksPerMonth * inputs.humanMinutes * (inputs.hourlyCost / 60);
  const opts: Record<OptionKey, Record<CaseKey, OptionCase>> = { none: {} as never, redesign: {} as never, rules: {} as never, ai: {} as never };

  for (const c of CASES) {
    const s = SCENARIOS[c];
    opts.none[c] = optionCase(0, 0, 0, alt.cashShare, inputs.hourlyCost);
    opts.redesign[c] = optionCase(alt.redesignCost * s.oneTime, people * clamp01(alt.redesignPct * s.redesign), 0, alt.cashShare, inputs.hourlyCost);
    opts.rules[c] = optionCase(alt.rulesBuild * s.oneTime, people * clamp01(alt.rulesCoverage * s.coverage), alt.rulesMaintenance, alt.cashShare, inputs.hourlyCost);
    const r = roi({ ...inputs, aiSuccess: clamp01(inputs.aiSuccess + s.ai), reviewMinutes: inputs.reviewMinutes * s.review }, a, utilization);
    opts.ai[c] = optionCase(inputs.setupCost * s.oneTime, people - (r.escalationCost + r.reviewCost), r.computeCost * s.compute, alt.cashShare, inputs.hourlyCost);
  }

  const options: OptionResult[] = (["ai", "rules", "redesign", "none"] as const).map((id) => ({
    id,
    label: OPTION_LABELS[id],
    available: id !== "rules" || alt.rulesCoverage > 0,
    cases: opts[id],
  }));
  const ai = opts.ai;
  const alternatives = options.filter((o) => o.available && (o.id === "redesign" || o.id === "rules"));
  const bestAlt = alternatives.sort((x, y) => y.cases.base.npv - x.cases.base.npv)[0];

  let verdict: Verdict;
  let instead: OptionKey | undefined;
  let reason: string;
  if (bestAlt && bestAlt.cases.base.npv > 0 && bestAlt.cases.base.npv > ai.base.npv) {
    verdict = "no-ai";
    instead = bestAlt.id;
    reason = `${bestAlt.label} delivers more three-year value than AI.`;
  } else if (ai.conservative.npv > 0) {
    verdict = "invest";
    reason = "AI leads and stays positive in the conservative case.";
  } else if (ai.base.npv > 0) {
    verdict = "pilot";
    reason = "AI leads in the base case but not the conservative case. Pilot to confirm the resolution rate.";
  } else if (ai.optimistic.npv > 0) {
    verdict = "defer";
    reason = "AI pays off only in the optimistic case.";
  } else {
    verdict = "reject";
    reason = "AI is negative in every case.";
  }

  // Evidence still resting on template defaults.
  const t = templateById(templateId ?? "support").inputs;
  const altBase = altDefaults(templateId);
  const missing: { label: string; how: string }[] = [];
  if (inputs.aiSuccess === t.aiSuccess) missing.push({ label: "AI resolution rate", how: "measure in a pilot" });
  if (inputs.reviewMinutes === t.reviewMinutes) missing.push({ label: "Review time", how: "time reviewers in the pilot" });
  if (alt.rulesCoverage === altBase.rulesCoverage && alt.rulesCoverage > 0) missing.push({ label: "Rules coverage", how: "test on last month's tasks" });
  if (alt.cashShare === altBase.cashShare) missing.push({ label: "Cash share", how: "agree with finance" });

  return { options, verdict, instead, reason, missing };
}

export const VERDICT_LABELS: Record<Verdict, string> = {
  invest: "Invest",
  pilot: "Pilot",
  defer: "Defer",
  reject: "Reject",
  "no-ai": "Don't use AI",
};
