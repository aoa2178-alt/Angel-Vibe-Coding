// A Keel scenario lives in the URL: changed plan drivers, the review month, and the budget and headcount left for
// initiatives. Only what differs from the defaults is written; anything unreadable is ignored.
import { DEFAULT_SETTINGS, type Settings } from "./model";

export interface Scenario {
  settings: Settings;
  /** The month under review, 1–12 */
  month: number;
  /** Budget left for new initiatives this year, $ */
  budget: number;
  /** Headcount left for new initiatives */
  people: number;
}

export const DEFAULT_SCENARIO: Scenario = { settings: { ...DEFAULT_SETTINGS }, month: 6, budget: 8e6, people: 15 };

const SETTINGS: Record<keyof Settings, { param: string; min: number; max: number }> = {
  developers: { param: "dev", min: 0, max: 1e9 },
  devGrowth: { param: "dg", min: -0.5, max: 0.5 },
  tokensPerDevM: { param: "tpd", min: 0, max: 1e6 },
  pricePerM: { param: "pr", min: 0, max: 1000 },
  computePerM: { param: "cp", min: 0, max: 1000 },
  startingArr: { param: "arr", min: 0, max: 1e12 },
  pipeline: { param: "pipe", min: 0, max: 1e11 },
  winRate: { param: "win", min: 0, max: 1 },
  churn: { param: "churn", min: 0, max: 1 },
  expansion: { param: "exp", min: 0, max: 1 },
  reps: { param: "reps", min: 0, max: 1e5 },
  hiresPerMonth: { param: "hires", min: 0, max: 1e4 },
  quota: { param: "quota", min: 0, max: 1e9 },
  attainment: { param: "att", min: 0, max: 2 },
  rampMonths: { param: "ramp", min: 1, max: 24 },
  repCost: { param: "rc", min: 0, max: 1e7 },
  supportPerRep: { param: "spr", min: 0, max: 20 },
  supportCost: { param: "sc", min: 0, max: 1e7 },
  programs: { param: "prog", min: 0, max: 1e10 },
  enterpriseMargin: { param: "em", min: 0, max: 1 },
};

const num = (params: URLSearchParams, name: string) => {
  const raw = params.get(name);
  const n = raw === null || raw.trim() === "" ? NaN : Number(raw);
  return Number.isFinite(n) ? n : null;
};

export function readScenario(search: string): Scenario {
  const params = new URLSearchParams(search);
  const s: Scenario = { ...DEFAULT_SCENARIO, settings: { ...DEFAULT_SETTINGS } };
  for (const [key, { param, min, max }] of Object.entries(SETTINGS) as [keyof Settings, (typeof SETTINGS)[keyof Settings]][]) {
    const n = num(params, param);
    if (n !== null && n >= min && n <= max) s.settings[key] = n;
  }
  const m = num(params, "m");
  if (m !== null && m >= 1 && m <= 12) s.month = Math.round(m);
  const b = num(params, "budget");
  if (b !== null && b >= 0 && b <= 1e10) s.budget = b;
  const p = num(params, "hc");
  if (p !== null && p >= 0 && p <= 1e4) s.people = Math.round(p);
  return s;
}

export function scenarioQuery(s: Scenario) {
  const params = new URLSearchParams();
  for (const [key, { param }] of Object.entries(SETTINGS) as [keyof Settings, { param: string }][]) {
    if (s.settings[key] !== DEFAULT_SETTINGS[key]) params.set(param, String(s.settings[key]));
  }
  if (s.month !== DEFAULT_SCENARIO.month) params.set("m", String(s.month));
  if (s.budget !== DEFAULT_SCENARIO.budget) params.set("budget", String(s.budget));
  if (s.people !== DEFAULT_SCENARIO.people) params.set("hc", String(s.people));
  const q = params.toString();
  return q ? `?${q}` : "";
}
