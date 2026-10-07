// Step 2 of the business case: which way to run the AI fits your priorities, not only your budget?
// Each option gets a 1–5 score per criterion; your 0–5 weights turn them into one score out of 100.
import type { OptionCost, OptionId } from "./tco";

export const OPTION_IDS: OptionId[] = ["api", "rent", "own"];

export type CriterionId = "cost" | "control" | "launch" | "quality" | "ease" | "flex";

/** Criteria you score yourself. Cost isn't one of them: it comes from the cost model. */
export type ScoredCriterion = Exclude<CriterionId, "cost">;

export const CRITERIA: { id: CriterionId; label: string; question: string }[] = [
  { id: "cost", label: "Cost", question: "How cheap is it at your volume? From the cost comparison above." },
  { id: "control", label: "Data control", question: "Does your data stay inside systems you control?" },
  { id: "launch", label: "Time to launch", question: "How fast can you go live?" },
  { id: "quality", label: "Model quality", question: "Can you use the strongest models?" },
  { id: "ease", label: "Ease of running", question: "How little does your team have to operate?" },
  { id: "flex", label: "Flexibility", question: "How easily can you switch models or providers later?" },
];

export const SCORED: ScoredCriterion[] = ["control", "launch", "quality", "ease", "flex"];

export type Scores = Record<ScoredCriterion, Record<OptionId, number>>;
export type Weights = Record<CriterionId, number>;

export const DEFAULT_SCORES: Scores = {
  control: { api: 2, rent: 4, own: 5 },
  launch: { api: 5, rent: 3, own: 1 },
  quality: { api: 5, rent: 4, own: 4 },
  ease: { api: 5, rent: 3, own: 1 },
  flex: { api: 2, rent: 4, own: 3 },
};

/** Why each default score is what it is. Shown next to the score so it can be challenged. */
export const SCORE_REASONS: Record<ScoredCriterion, Record<OptionId, string>> = {
  control: {
    api: "Prompts go to the provider, usually under a no-training, limited-retention agreement.",
    rent: "Runs on GPUs reserved for you in your cloud account.",
    own: "Data never leaves your hardware.",
  },
  launch: {
    api: "Sign up and call it today.",
    rent: "Days to set up serving software on rented GPUs.",
    own: "Months: buy servers, wait for delivery, find space and power.",
  },
  quality: {
    api: "Frontier models such as Claude and GPT are API-only.",
    rent: "Open-weight models, close to the frontier but not at it.",
    own: "Same open-weight models as renting.",
  },
  ease: {
    api: "Nothing to operate.",
    rent: "You run the serving stack; the cloud runs the hardware.",
    own: "You run everything, down to failed GPUs.",
  },
  flex: {
    api: "Prompts get tuned to one provider's models.",
    rent: "Change models or clouds with a redeploy.",
    own: "Any open model, but the hardware is a 4-year commitment.",
  },
};

export const WEIGHT_PRESETS: { id: string; label: string; weights: Weights }[] = [
  { id: "balanced", label: "Balanced", weights: { cost: 3, control: 3, launch: 3, quality: 3, ease: 3, flex: 3 } },
  { id: "fast", label: "Move fast", weights: { cost: 2, control: 1, launch: 5, quality: 4, ease: 4, flex: 2 } },
  { id: "regulated", label: "Regulated data", weights: { cost: 2, control: 5, launch: 1, quality: 2, ease: 1, flex: 3 } },
  { id: "cost", label: "Cost first", weights: { cost: 5, control: 1, launch: 1, quality: 2, ease: 2, flex: 1 } },
];

export const DEFAULT_WEIGHTS = WEIGHT_PRESETS[0].weights;

/** Cheapest option scores 5; the others fall toward 1 in proportion to how much more they cost. */
export function costScores(costs: Record<OptionId, OptionCost>): Record<OptionId, number> {
  const min = Math.min(...OPTION_IDS.map((id) => costs[id].monthly));
  const out = {} as Record<OptionId, number>;
  for (const id of OPTION_IDS) out[id] = costs[id].monthly > 0 ? 1 + 4 * (min / costs[id].monthly) : 5;
  return out;
}

export interface ScorecardResult {
  /** Every criterion's score per option, cost included */
  scores: Record<CriterionId, Record<OptionId, number>>;
  /** Weighted score out of 100 */
  totals: Record<OptionId, number>;
  /** Best overall fit; null when every weight is zero */
  winner: OptionId | null;
}

export function scorecard(costs: Record<OptionId, OptionCost>, weights: Weights, scores: Scores = DEFAULT_SCORES): ScorecardResult {
  const all: Record<CriterionId, Record<OptionId, number>> = { cost: costScores(costs), ...scores };
  const weightSum = CRITERIA.reduce((s, c) => s + weights[c.id], 0);
  const totals = {} as Record<OptionId, number>;
  for (const id of OPTION_IDS) {
    const points = CRITERIA.reduce((s, c) => s + weights[c.id] * all[c.id][id], 0);
    totals[id] = weightSum > 0 ? (points / (weightSum * 5)) * 100 : 0;
  }
  const winner = weightSum > 0 ? OPTION_IDS.reduce((best, id) => (totals[id] > totals[best] ? id : best)) : null;
  return { scores: all, totals, winner };
}

/** The criteria where `a` beats `b` most, weighted: why the best fit is worth more than the cheapest option. */
export function advantages(result: ScorecardResult, weights: Weights, a: OptionId, b: OptionId, n = 2) {
  return CRITERIA.map((c) => ({ ...c, gain: weights[c.id] * (result.scores[c.id][a] - result.scores[c.id][b]) }))
    .filter((c) => c.gain > 0)
    .sort((x, y) => y.gain - x.gain)
    .slice(0, n);
}
