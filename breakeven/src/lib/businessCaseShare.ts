// A business case lives in the URL, like an estimate: the template, any fields changed from it, the weights,
// any scores changed from the defaults, and the step. Anything unreadable falls back to the default.
import { ROI_TEMPLATES, templateById, type RoiInputs, type TemplateId } from "./roi";
import { CRITERIA, DEFAULT_SCORES, DEFAULT_WEIGHTS, OPTION_IDS, SCORED, type Scores, type Weights } from "./scorecard";

export interface BusinessCaseState {
  templateId: TemplateId;
  inputs: RoiInputs;
  weights: Weights;
  scores: Scores;
  step: number;
}

export const STEP_COUNT = 4;

const INPUT_PARAMS: Record<keyof RoiInputs, { param: string; min: number; max: number }> = {
  tasksPerMonth: { param: "tasks", min: 1, max: 1e9 },
  humanMinutes: { param: "min", min: 0, max: 10_000 },
  hourlyCost: { param: "rate", min: 0, max: 10_000 },
  aiSuccess: { param: "ok", min: 0, max: 1 },
  reviewMinutes: { param: "rev", min: 0, max: 10_000 },
  tokensPerTask: { param: "tok", min: 0, max: 1e8 },
  outputShare: { param: "out", min: 0, max: 1 },
  setupCost: { param: "setup", min: 0, max: 1e10 },
};

const num = (raw: string | null) => {
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

/** "3,3,3" → numbers, only if there are exactly n of them and all are within [min, max]. */
function list(raw: string | null, n: number, min: number, max: number) {
  if (!raw) return null;
  const parts = raw.split(",").map((p) => num(p));
  return parts.length === n && parts.every((p) => p !== null && p >= min && p <= max) ? (parts as number[]) : null;
}

export function readCase(search: string): BusinessCaseState {
  const params = new URLSearchParams(search);
  const t = params.get("t");
  const template = ROI_TEMPLATES.find((x) => x.id === t) ?? ROI_TEMPLATES[0];

  const inputs = { ...template.inputs };
  for (const [key, { param, min, max }] of Object.entries(INPUT_PARAMS) as [keyof RoiInputs, (typeof INPUT_PARAMS)[keyof RoiInputs]][]) {
    const n = num(params.get(param));
    if (n !== null && n >= min && n <= max) inputs[key] = n;
  }

  const w = list(params.get("w"), CRITERIA.length, 0, 5);
  const weights = { ...DEFAULT_WEIGHTS };
  if (w) CRITERIA.forEach((c, i) => (weights[c.id] = w[i]));

  const s = list(params.get("s"), SCORED.length * OPTION_IDS.length, 1, 5);
  const scores = structuredClone(DEFAULT_SCORES);
  if (s) SCORED.forEach((c, i) => OPTION_IDS.forEach((o, j) => (scores[c][o] = s[i * OPTION_IDS.length + j])));

  const step = num(params.get("step"));
  return {
    templateId: template.id,
    inputs,
    weights,
    scores,
    step: step !== null && Number.isInteger(step) && step >= 1 && step <= STEP_COUNT ? step : 1,
  };
}

export function caseQuery(state: BusinessCaseState) {
  const params = new URLSearchParams();
  params.set("t", state.templateId);
  const base = templateById(state.templateId).inputs;
  for (const [key, { param }] of Object.entries(INPUT_PARAMS) as [keyof RoiInputs, { param: string }][]) {
    if (state.inputs[key] !== base[key]) params.set(param, String(state.inputs[key]));
  }
  if (CRITERIA.some((c) => state.weights[c.id] !== DEFAULT_WEIGHTS[c.id])) {
    params.set("w", CRITERIA.map((c) => state.weights[c.id]).join(","));
  }
  if (SCORED.some((c) => OPTION_IDS.some((o) => state.scores[c][o] !== DEFAULT_SCORES[c][o]))) {
    params.set("s", SCORED.flatMap((c) => OPTION_IDS.map((o) => state.scores[c][o])).join(","));
  }
  if (state.step !== 1) params.set("step", String(state.step));
  return `?${params.toString()}`;
}
