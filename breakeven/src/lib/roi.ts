// Step 1 of the business case: is AI worth it for this task at all?
// People cost today vs people + AI compute tomorrow. Compute is priced with Breakeven's cost model, at the cheapest option.
import { DEFAULT_ASSUMPTIONS, DEFAULT_WORKLOAD, cheapest, compare, type Assumptions, type OptionCost, type OptionId, type Workload } from "./tco";

export interface RoiInputs {
  /** Tasks handled per month */
  tasksPerMonth: number;
  /** Minutes a person spends on one task today */
  humanMinutes: number;
  /** Loaded cost of a person's hour (salary, benefits, overhead) */
  hourlyCost: number;
  /** Share of tasks the AI completes without a person redoing them (0–1) */
  aiSuccess: number;
  /** Minutes a person spends checking a task the AI completed */
  reviewMinutes: number;
  /** Tokens the AI uses per task, prompt and answer together */
  tokensPerTask: number;
  /** Share of those tokens that are output (0–1) */
  outputShare: number;
  /** One-time cost to build and launch */
  setupCost: number;
}

export type TemplateId = "support" | "documents" | "sales" | "coding";

export const ROI_TEMPLATES: { id: TemplateId; label: string; blurb: string; inputs: RoiInputs }[] = [
  {
    id: "support",
    label: "Customer support",
    blurb: "AI answers tickets; people take the ones it can't solve.",
    inputs: { tasksPerMonth: 20_000, humanMinutes: 8, hourlyCost: 40, aiSuccess: 0.6, reviewMinutes: 1, tokensPerTask: 6_000, outputShare: 0.2, setupCost: 50_000 },
  },
  {
    id: "documents",
    label: "Document processing",
    blurb: "AI reads invoices and forms and fills in the fields.",
    inputs: { tasksPerMonth: 50_000, humanMinutes: 5, hourlyCost: 35, aiSuccess: 0.85, reviewMinutes: 0.5, tokensPerTask: 8_000, outputShare: 0.1, setupCost: 40_000 },
  },
  {
    id: "sales",
    label: "Sales emails",
    blurb: "AI drafts personalized outreach; reps edit and send.",
    inputs: { tasksPerMonth: 10_000, humanMinutes: 10, hourlyCost: 60, aiSuccess: 0.7, reviewMinutes: 2, tokensPerTask: 3_000, outputShare: 0.4, setupCost: 20_000 },
  },
  {
    id: "coding",
    label: "Coding agent",
    blurb: "An agent takes small tickets end to end; engineers review.",
    inputs: { tasksPerMonth: 8_000, humanMinutes: 15, hourlyCost: 90, aiSuccess: 0.4, reviewMinutes: 5, tokensPerTask: 500_000, outputShare: 0.25, setupCost: 25_000 },
  },
];

export const templateById = (id: TemplateId) => ROI_TEMPLATES.find((t) => t.id === id) ?? ROI_TEMPLATES[0];

export interface RoiResult {
  /** People cost today, per month */
  humanCost: number;
  /** Tasks a person still has to do because the AI didn't solve them */
  escalatedTasks: number;
  escalationCost: number;
  reviewCost: number;
  /** AI tokens per month, in millions */
  tokensM: number;
  /** The workload handed to the cost model (step 3) */
  workload: Workload;
  costs: Record<OptionId, OptionCost>;
  /** The cheapest way to run the AI at this volume */
  computeOption: OptionId;
  computeCost: number;
  /** People + compute, per month, with AI */
  aiCost: number;
  savings: number;
  /** Months to earn back the setup cost; null when AI doesn't save money */
  paybackMonths: number | null;
  /** (12 × savings − setup) ÷ setup; null when there is no setup cost */
  roi12: number | null;
}

export function roi(i: RoiInputs, a: Assumptions = DEFAULT_ASSUMPTIONS, utilization = DEFAULT_WORKLOAD.utilization): RoiResult {
  const perMinute = i.hourlyCost / 60;
  const humanCost = i.tasksPerMonth * i.humanMinutes * perMinute;
  const escalatedTasks = i.tasksPerMonth * (1 - i.aiSuccess);
  const escalationCost = escalatedTasks * i.humanMinutes * perMinute;
  const reviewCost = i.tasksPerMonth * i.aiSuccess * i.reviewMinutes * perMinute;
  // Every task goes through the AI first, including the ones it fails.
  const tokensM = (i.tasksPerMonth * i.tokensPerTask) / 1e6;
  const workload: Workload = { tokensM, outputShare: i.outputShare, utilization };
  const costs = compare(workload, a);
  const computeOption = cheapest(costs);
  const computeCost = costs[computeOption].monthly;
  const aiCost = escalationCost + reviewCost + computeCost;
  const savings = humanCost - aiCost;
  return {
    humanCost,
    escalatedTasks,
    escalationCost,
    reviewCost,
    tokensM,
    workload,
    costs,
    computeOption,
    computeCost,
    aiCost,
    savings,
    paybackMonths: savings > 0 ? i.setupCost / savings : null,
    roi12: i.setupCost > 0 ? (12 * savings - i.setupCost) / i.setupCost : null,
  };
}
