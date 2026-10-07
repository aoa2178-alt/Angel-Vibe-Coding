// A Tender scenario lives in the URL: the need-by date, the cost of a month late, supply risk, and the scorecard weights.
// Only what differs from the defaults is written; anything unreadable is ignored.
import { DEFAULT_SETTINGS, type Settings } from "./data";

export type Scenario = Settings;

type NumKey = Exclude<keyof Settings, "weights">;
const NUMS: Record<NumKey, { param: string; min: number; max: number }> = {
  needByMonths: { param: "need", min: 1, max: 60 },
  leasePerKwMonth: { param: "lease", min: 0, max: 2000 },
  capexPerMw: { param: "capex", min: 0, max: 200 },
  costOfCapital: { param: "coc", min: 0, max: 0.5 },
  disruption: { param: "risk", min: 0, max: 0.9 },
  disruptionMonths: { param: "slip", min: 0, max: 60 },
};
const WEIGHTS = ["cost", "delivery", "quality", "risk", "capacity"] as const;

const num = (params: URLSearchParams, name: string) => {
  const raw = params.get(name);
  const n = raw === null || raw.trim() === "" ? NaN : Number(raw);
  return Number.isFinite(n) ? n : null;
};

export function readScenario(search: string): Scenario {
  const params = new URLSearchParams(search);
  const s: Scenario = { ...DEFAULT_SETTINGS, weights: { ...DEFAULT_SETTINGS.weights } };
  for (const [key, { param, min, max }] of Object.entries(NUMS) as [NumKey, (typeof NUMS)[NumKey]][]) {
    const n = num(params, param);
    if (n !== null && n >= min && n <= max) s[key] = n;
  }
  const w = (params.get("w") ?? "").split(",").map(Number);
  if (w.length === WEIGHTS.length && w.every((x) => Number.isFinite(x) && x >= 0 && x <= 100)) WEIGHTS.forEach((k, i) => (s.weights[k] = w[i]!));
  return s;
}

export function scenarioQuery(s: Scenario) {
  const params = new URLSearchParams();
  for (const [key, { param }] of Object.entries(NUMS) as [NumKey, { param: string }][]) {
    if (s[key] !== DEFAULT_SETTINGS[key]) params.set(param, String(s[key]));
  }
  if (WEIGHTS.some((k) => s.weights[k] !== DEFAULT_SETTINGS.weights[k])) params.set("w", WEIGHTS.map((k) => s.weights[k]).join(","));
  const q = params.toString();
  return q ? `?${q}` : "";
}
