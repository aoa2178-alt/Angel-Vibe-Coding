// Step 3: which initiatives to fund to close the gap. Each one moves a driver from some month on; its value is the
// extra revenue it adds to the re-forecast for the rest of the year, times the chance it works. Funding picks the set
// with the most expected value that fits the budget and headcount left (every combination is checked). Pure functions only.
import { MONTHS, simulate, total, type DriverId, type Paths, type Settings } from "./model";
import { reforecastPaths } from "./review";

export interface Effect {
  driver: DriverId;
  /** "mult" scales the driver (1.1 = +10%); "add" adds to it (0.03 = +3 points; 10 = +10 reps) */
  kind: "mult" | "add";
  value: number;
}

export interface Initiative {
  id: string;
  name: string;
  owner: string;
  /** Cost for the rest of the year, $ */
  cost: number;
  /** People it needs */
  headcount: number;
  effects: Effect[];
  /** Months after the review month before it starts to work */
  delay: number;
  /** Chance it delivers, 0–1 */
  confidence: number;
}

export const INITIATIVES: Initiative[] = [
  { id: "eu", name: "EU data residency", owner: "Product", cost: 4e6, headcount: 4, effects: [{ driver: "pipeline", kind: "mult", value: 1.15 }], delay: 3, confidence: 0.6 },
  { id: "upgrade", name: "Self-serve upgrade flow", owner: "Growth", cost: 1.5e6, headcount: 3, effects: [{ driver: "tokensPerDevM", kind: "mult", value: 1.05 }], delay: 2, confidence: 0.7 },
  { id: "marketplace", name: "Cloud marketplace listing", owner: "Partnerships", cost: 1e6, headcount: 2, effects: [{ driver: "pipeline", kind: "mult", value: 1.1 }], delay: 2, confidence: 0.5 },
  { id: "emea", name: "+10 account executives in EMEA", owner: "Sales", cost: 3e6, headcount: 10, effects: [{ driver: "reps", kind: "add", value: 10 }], delay: 1, confidence: 0.8 },
  { id: "dealdesk", name: "Win-rate program: deal desk and sales engineers", owner: "Sales", cost: 2e6, headcount: 4, effects: [{ driver: "winRate", kind: "add", value: 0.03 }], delay: 1, confidence: 0.6 },
  { id: "churn", name: "Customer success churn playbook", owner: "Customer success", cost: 1e6, headcount: 3, effects: [{ driver: "churn", kind: "add", value: -0.003 }], delay: 1, confidence: 0.7 },
  {
    id: "price",
    name: "5% price rise on the top API tier",
    owner: "Pricing",
    cost: 0.2e6,
    headcount: 0,
    effects: [
      { driver: "pricePerM", kind: "mult", value: 1.05 },
      { driver: "developers", kind: "mult", value: 0.98 },
    ],
    delay: 1,
    confidence: 0.5,
  },
  { id: "agents", name: "Agent product beta", owner: "Product", cost: 5e6, headcount: 8, effects: [{ driver: "tokensPerDevM", kind: "mult", value: 1.08 }], delay: 4, confidence: 0.4 },
];

/** Apply an initiative's effects to the re-forecast, from month `from` (0-based) on. */
export function applyEffects(p: Paths, effects: Effect[], from: number): Paths {
  const out = { ...p };
  for (const e of effects) {
    out[e.driver] = p[e.driver].map((v, t) => (t < from ? v : e.kind === "mult" ? v * e.value : v + e.value));
  }
  return out;
}

export interface Scored {
  initiative: Initiative;
  /** Extra revenue this year if it works */
  upside: number;
  /** upside × confidence */
  expected: number;
  /** expected ÷ cost */
  perDollar: number;
}

/** Each initiative's value on its own, as of review month `n`. */
export function score(n: number, plan: Paths, s: Settings, list: Initiative[] = INITIATIVES): Scored[] {
  const base = reforecastPaths(n, plan, s);
  const baseRev = total(simulate(base, s), "revenue");
  return list.map((i) => {
    const from = Math.min(MONTHS, n + i.delay);
    const upside = total(simulate(applyEffects(base, i.effects, from), s), "revenue") - baseRev;
    const expected = upside * i.confidence;
    return { initiative: i, upside, expected, perDollar: i.cost > 0 ? expected / i.cost : Infinity };
  });
}

export interface Portfolio {
  funded: Scored[];
  cut: Scored[];
  cost: number;
  headcount: number;
  expected: number;
}

/** The set with the most expected value within the budget and headcount (all 2ⁿ combinations; n is small). */
export function fund(scored: Scored[], budget: number, people: number): Portfolio {
  let best = { mask: 0, expected: -Infinity };
  for (let mask = 0; mask < 1 << scored.length; mask++) {
    let cost = 0;
    let hc = 0;
    let ev = 0;
    for (let i = 0; i < scored.length; i++) {
      if (!(mask & (1 << i))) continue;
      cost += scored[i]!.initiative.cost;
      hc += scored[i]!.initiative.headcount;
      ev += scored[i]!.expected;
    }
    if (cost <= budget + 1e-6 && hc <= people && ev > best.expected + 1e-6) best = { mask, expected: ev };
  }
  const funded = scored.filter((_, i) => best.mask & (1 << i));
  const cut = scored.filter((_, i) => !(best.mask & (1 << i)));
  return {
    funded,
    cut,
    cost: funded.reduce((a, x) => a + x.initiative.cost, 0),
    headcount: funded.reduce((a, x) => a + x.initiative.headcount, 0),
    expected: funded.reduce((a, x) => a + x.expected, 0),
  };
}
