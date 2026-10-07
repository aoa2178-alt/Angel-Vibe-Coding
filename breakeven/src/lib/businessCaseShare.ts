// A business case lives in the URL, like an estimate: the template, any fields changed from it, the weights,
// any scores changed from the defaults, and the step. Anything unreadable falls back to the default.
// The param readers and writers are shared with the whole plan (plan.ts).
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

/** The template (null if none is set), its inputs with any URL changes, and the scorecard weights and scores. */
export function readCaseParams(params: URLSearchParams) {
  const t = params.get("t");
  const found = ROI_TEMPLATES.find((x) => x.id === t);
  const inputs = { ...(found ?? ROI_TEMPLATES[0]).inputs };
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

  return { templateId: found ? found.id : null, inputs, weights, scores };
}

/** Writes the template, changed inputs (except `omit`, which another part of the URL already carries), weights and scores. */
export function writeCaseParams(
  params: URLSearchParams,
  c: { templateId: TemplateId | null; inputs: RoiInputs; weights: Weights; scores: Scores },
  omit: (keyof RoiInputs)[] = [],
) {
  if (c.templateId) {
    params.set("t", c.templateId);
    const base = templateById(c.templateId).inputs;
    for (const [key, { param }] of Object.entries(INPUT_PARAMS) as [keyof RoiInputs, { param: string }][]) {
      if (!omit.includes(key) && c.inputs[key] !== base[key]) params.set(param, String(c.inputs[key]));
    }
  }
  if (CRITERIA.some((cr) => c.weights[cr.id] !== DEFAULT_WEIGHTS[cr.id])) {
    params.set("w", CRITERIA.map((cr) => c.weights[cr.id]).join(","));
  }
  if (SCORED.some((cr) => OPTION_IDS.some((o) => c.scores[cr][o] !== DEFAULT_SCORES[cr][o]))) {
    params.set("s", SCORED.flatMap((cr) => OPTION_IDS.map((o) => c.scores[cr][o])).join(","));
  }
}

export function readCase(search: string): BusinessCaseState {
  const params = new URLSearchParams(search);
  const c = readCaseParams(params);
  const step = num(params.get("step"));
  return {
    ...c,
    templateId: c.templateId ?? ROI_TEMPLATES[0].id,
    step: step !== null && Number.isInteger(step) && step >= 1 && step <= STEP_COUNT ? step : 1,
  };
}

export function caseQuery(state: BusinessCaseState) {
  const params = new URLSearchParams();
  writeCaseParams(params, state);
  if (state.step !== 1) params.set("step", String(state.step));
  return `?${params.toString()}`;
}
