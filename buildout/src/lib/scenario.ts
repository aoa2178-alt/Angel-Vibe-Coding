// A Buildout scenario lives in the URL: the company in focus on the Payoff step, and the base quarter for the read-through.
import { SPENDERS } from "./data";

export interface Scenario {
  /** Ticker in focus on the Payoff step */
  company: string;
  /** Base quarter for indexing and the read-through */
  base: string;
}

export const BASES = [
  { id: "2019Q4", label: "Before COVID (Q4 2019)" },
  { id: "2022Q4", label: "ChatGPT launch (Q4 2022)" },
  { id: "2024Q2", label: "Two years ago (Q2 2024)" },
] as const;

export const DEFAULT_SCENARIO: Scenario = { company: "AMZN", base: "2022Q4" };

export function readScenario(search: string): Scenario {
  const params = new URLSearchParams(search);
  const s = { ...DEFAULT_SCENARIO };
  const co = params.get("co");
  if (co && SPENDERS.some((c) => c.ticker === co)) s.company = co;
  const base = params.get("base");
  if (base && BASES.some((b) => b.id === base)) s.base = base;
  return s;
}

export function scenarioQuery(s: Scenario) {
  const params = new URLSearchParams();
  if (s.company !== DEFAULT_SCENARIO.company) params.set("co", s.company);
  if (s.base !== DEFAULT_SCENARIO.base) params.set("base", s.base);
  const q = params.toString();
  return q ? `?${q}` : "";
}
