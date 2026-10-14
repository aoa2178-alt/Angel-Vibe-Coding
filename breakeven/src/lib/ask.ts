// "Ask Claude" in the Questions panel: the scenario summary sent with a question, the call to /api/ask, and a soft
// per-browser daily limit. The server (api/ask.js) holds the API key and enforces its own limits.
import { planRoi, readPlan } from "./plan";
import { cheapest, compare, crossovers, formatTokensM, formatUsd } from "./tco";

export const DAILY_LIMIT = 20;
export const MAX_QUESTION = 400;

const PAGES: Record<string, string> = {
  "/": "Home page",
  "/worth-it": "Step 1, Evaluate AI ROI (the business case)",
  "/run-it": "Step 2, Compare compute costs",
  "/power-it": "Step 3, Power planning",
  "/result": "Recommendation",
  "/report": "Decision report",
  "/sources": "Sources",
  "/faq": "FAQ",
};

const NAMES = { api: "pay-per-token API", rent: "rented cloud GPUs", own: "owned GPUs" } as const;

/** A few plain lines describing the scenario on screen, so Claude can answer with the visitor's own numbers. */
export function scenarioSummary(pathname: string, search: string): string {
  const plan = readPlan(search);
  const costs = compare(plan.workload, plan.assumptions);
  const win = cheapest(costs);
  const cross = crossovers(plan.workload, plan.assumptions);
  const lines = [
    `Page: ${PAGES[pathname] ?? pathname}`,
    `Volume: ${formatTokensM(plan.workload.tokensM)} tokens a month; AI writes ${Math.round(plan.workload.outputShare * 100)}% of tokens; GPUs run ${Math.round(plan.workload.utilization * 100)}% busy`,
    `Monthly cost: API ${formatUsd(costs.api.monthly)}, rent ${formatUsd(costs.rent.monthly)} (${costs.rent.gpus} GPUs), own ${formatUsd(costs.own.monthly)} (${costs.own.gpus} GPUs)`,
    `Cheapest: ${NAMES[win]}`,
    `Where it changes (at these assumptions): API cheapest until about ${cross.apiUntilM ? formatTokensM(cross.apiUntilM) : "n/a"}; owning cheapest for good from about ${cross.ownFromM ? formatTokensM(cross.ownFromM) : "n/a"}`,
    `Assumptions: API $${plan.assumptions.apiInputPerM} in / $${plan.assumptions.apiOutputPerM} out per M tokens; rent $${plan.assumptions.rentPerGpuHour}/GPU-hour; hardware $${plan.assumptions.hardwarePerGpu.toLocaleString("en-US")}/GPU`,
  ];
  if (plan.mode === "product") lines.push("Use case: an AI product the company sells (freemium)");
  else if (plan.templateId) {
    const r = planRoi(plan);
    lines.push(
      `Business case (${plan.templateId} template): people today ${formatUsd(r.humanCost)}/month, with AI ${formatUsd(r.aiCost)}/month, savings ${formatUsd(r.savings)}/month, payback ${r.paybackMonths === null ? "none" : `${r.paybackMonths.toFixed(1)} months`}`,
    );
  }
  return lines.join("\n");
}

export interface Turn {
  q: string;
  a: string;
}

const COUNT_KEY = "breakeven-ask";
const today = () => new Date().toISOString().slice(0, 10);

/** Questions asked today on this browser. */
export function askedToday(): number {
  try {
    const saved = JSON.parse(localStorage.getItem(COUNT_KEY) ?? "null") as { day: string; n: number } | null;
    return saved?.day === today() ? saved.n : 0;
  } catch {
    return 0;
  }
}

function countAsk() {
  try {
    localStorage.setItem(COUNT_KEY, JSON.stringify({ day: today(), n: askedToday() + 1 }));
  } catch {
    // Storage blocked: the server's own limit still applies.
  }
}

export class AskError extends Error {
  constructor(public kind: "limit" | "unavailable") {
    super(kind);
  }
}

/** Sends a question (with the scenario and the last few turns) to Claude through /api/ask. */
export async function askClaude(question: string, history: Turn[], context: string): Promise<string> {
  if (askedToday() >= DAILY_LIMIT) throw new AskError("limit");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question: question.slice(0, MAX_QUESTION), history: history.slice(-3), context }),
      signal: controller.signal,
    });
    if (res.status === 429) throw new AskError("limit");
    if (!res.ok) throw new AskError("unavailable");
    const data = (await res.json()) as { answer?: string };
    if (!data.answer) throw new AskError("unavailable");
    countAsk();
    return data.answer;
  } catch (e) {
    throw e instanceof AskError ? e : new AskError("unavailable");
  } finally {
    clearTimeout(timer);
  }
}
