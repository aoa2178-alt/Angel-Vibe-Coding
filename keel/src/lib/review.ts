// Step 2: the monthly business review. Actuals are fictional but fixed: built once from the default plan with a
// story baked in (developers beat plan, a price cut lands in April, win rate slips, churn creeps up, hiring lags).
// Editing the plan never changes the actuals, just as in a real company. Pure functions only.
import { DEFAULT_SETTINGS, DRIVERS, MONTHS, planPaths, simulate, total, type DriverId, type MonthResult, type Paths, type Settings } from "./model";

/** A small, seeded random generator so the "actuals" are the same on every visit. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function actualPaths(): Paths {
  const base = planPaths(DEFAULT_SETTINGS);
  const rand = mulberry32(20261007);
  const noise = (spread: number) => 1 + (rand() * 2 - 1) * spread;
  const m = Array.from({ length: MONTHS }, (_, t) => t);
  const d0 = DEFAULT_SETTINGS.developers;
  return {
    // Developers grow 4.6% a month instead of 4%
    developers: m.map((t) => d0 * Math.pow(1.046, t) * noise(0.01)),
    tokensPerDevM: m.map((t) => base.tokensPerDevM[t]! * noise(0.04)),
    // A competitive price cut of 10% lands in April
    pricePerM: m.map((t) => base.pricePerM[t]! * (t >= 3 ? 0.9 : 1)),
    pipeline: m.map((t) => base.pipeline[t]! * noise(0.08) * (t >= 2 ? 0.97 : 1)),
    // Win rate slips to about 21% from March as a rival enters enterprise deals
    winRate: m.map((t) => (t >= 2 ? 0.21 : 0.245) * noise(0.03)),
    churn: m.map((t) => base.churn[t]! * (t >= 4 ? 1.25 : 1) * noise(0.05)),
    expansion: m.map((t) => base.expansion[t]! * noise(0.05)),
    // Hiring runs a month behind
    reps: m.map((t) => DEFAULT_SETTINGS.reps + DEFAULT_SETTINGS.hiresPerMonth * t),
  };
}

export const ACTUALS = actualPaths();

export type Status = "green" | "amber" | "red";

/** Within 5% of plan is green, within 10% amber, beyond red; "better than plan" is always green. */
export function status(actual: number, plan: number, higherBetter = true): Status {
  if (plan === 0) return "green";
  const gap = (actual - plan) / Math.abs(plan);
  const bad = higherBetter ? -gap : gap;
  return bad <= 0.05 ? "green" : bad <= 0.1 ? "amber" : "red";
}

/** Keep the first `n` months from `a` and the rest from `b`. */
const splice = (a: number[], b: number[], n: number) => [...a.slice(0, n), ...b.slice(n)];

/** Actuals for the first `n` months, plan after. */
export function actualsThrough(n: number, plan: Paths): Paths {
  const out = {} as Paths;
  for (const d of DRIVERS) out[d.id] = splice(ACTUALS[d.id], plan[d.id], n);
  return out;
}

/**
 * The re-forecast as of month `n`: actuals to date, then the rest of the year at today's run-rate. Rates hold at the
 * latest actual; developers keep growing at the plan's rate from where they actually are; hiring follows the plan.
 */
export function reforecastPaths(n: number, plan: Paths, s: Settings): Paths {
  const k = Math.max(1, Math.min(MONTHS, n));
  const hold = (id: DriverId) => {
    const v = ACTUALS[id][k - 1]!;
    return Array.from({ length: MONTHS }, (_, t) => (t < k ? ACTUALS[id][t]! : v));
  };
  const lastDevs = ACTUALS.developers[k - 1]!;
  const repGap = ACTUALS.reps[k - 1]! - plan.reps[k - 1]!;
  return {
    developers: Array.from({ length: MONTHS }, (_, t) => (t < k ? ACTUALS.developers[t]! : lastDevs * Math.pow(1 + s.devGrowth, t - k + 1))),
    tokensPerDevM: hold("tokensPerDevM"),
    pricePerM: hold("pricePerM"),
    pipeline: hold("pipeline"),
    winRate: hold("winRate"),
    churn: hold("churn"),
    expansion: hold("expansion"),
    reps: Array.from({ length: MONTHS }, (_, t) => (t < k ? ACTUALS.reps[t]! : plan.reps[t]! + repGap)),
  };
}

export interface BridgeStep {
  id: DriverId;
  label: string;
  /** Change in year-to-date revenue from swapping this driver to actual */
  effect: number;
}

/**
 * Variance bridge by sequential substitution: start from the plan, swap one driver at a time to its actual path,
 * and record how much year-to-date revenue moves at each swap. The steps add up exactly to actual − plan.
 */
export function bridge(n: number, plan: Paths, s: Settings, measure: (r: MonthResult[]) => number = (r) => total(r, "revenue", n)): BridgeStep[] {
  const actual = actualsThrough(n, plan);
  let current: Paths = { ...plan };
  let prev = measure(simulate(current, s));
  return DRIVERS.map((d) => {
    current = { ...current, [d.id]: actual[d.id] };
    const now = measure(simulate(current, s));
    const step = { id: d.id, label: d.label, effect: now - prev };
    prev = now;
    return step;
  });
}

export interface DriverRow {
  id: DriverId;
  label: string;
  segment: "API" | "Enterprise";
  plan: number;
  actual: number;
  status: Status;
}

/** Each driver in the month under review, actual vs plan (churn is better when lower). */
export function driverRows(n: number, plan: Paths): DriverRow[] {
  const k = Math.max(1, Math.min(MONTHS, n));
  return DRIVERS.map((d) => {
    const pl = plan[d.id][k - 1]!;
    const ac = ACTUALS[d.id][k - 1]!;
    return { id: d.id, label: d.label, segment: d.segment, plan: pl, actual: ac, status: status(ac, pl, d.id !== "churn") };
  });
}
