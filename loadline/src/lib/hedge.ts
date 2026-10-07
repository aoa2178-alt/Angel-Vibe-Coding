// Hedging the long-lead items: why transformers take years (factory physics), and how many spares to hold (newsvendor).
// Pure functions only, like model.ts.
import { facilityMw, monthlyDelayCost, type Campus, type Settings } from "./model";

export interface HedgeSettings {
  /** How busy transformer factories are, 0–1 */
  supplierLoad: number;
  /** Months of factory work to build one large transformer, with no queue */
  buildMonths: number;
  /** Variability of orders and build times, (cₐ² + cₑ²)/2 */
  variability: number;
  /** Chance any one unit fails testing, arrives damaged or slips badly before go-live */
  failShare: number;
  /** Facility MW one transformer serves */
  unitMw: number;
  /** Price per transformer, $ millions */
  priceM: number;
  /** Share of a spare's price you keep if it's never needed (it stays as a fleet spare or is resold) */
  valueKept: number;
}

export const DEFAULT_HEDGE: HedgeSettings = {
  supplierLoad: 0.9,
  buildMonths: 3,
  variability: 1,
  failShare: 0.03,
  unitMw: 90,
  priceM: 8,
  valueKept: 0.5,
};

/* ---------- Why transformers take years ---------- */

/** Kingman (VUT) at one station: lead time = build time × (variability × u/(1 − u) + 1). */
export function leadTime(buildMonths: number, load: number, variability = 1) {
  if (load >= 1) return Infinity;
  const u = Math.max(0, load);
  return buildMonths * (variability * (u / (1 - u)) + 1);
}

export function leadTimeCurve(h: HedgeSettings, from = 0.5, to = 0.97, steps = 47) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const load = from + ((to - from) * i) / steps;
    return { load, months: leadTime(h.buildMonths, load, h.variability) };
  });
}

/* ---------- How many spares ---------- */

/** P(X ≤ k) for a Poisson count with mean λ. */
export function poissonCdf(k: number, lambda: number) {
  if (k < 0) return 0;
  let term = Math.exp(-lambda);
  let sum = term;
  for (let i = 1; i <= k; i++) {
    term *= lambda / i;
    sum += term;
  }
  return Math.min(1, sum);
}

const poissonPmf = (k: number, lambda: number) => poissonCdf(k, lambda) - poissonCdf(k - 1, lambda);

export interface SparesResult {
  /** Transformers across the campus */
  units: number;
  /** Expected shortages across the campus (Poisson mean) */
  expectedShort: number;
  leadMonths: number;
  /** Cost of being one transformer short: its share of a phase's cost per month late × the replacement lead time */
  underage: number;
  /** Cost of a spare that's never needed: price × (1 − value kept) */
  overage: number;
  criticalRatio: number;
  /** The fewest spares with P(shortages ≤ spares) ≥ the critical ratio */
  best: number;
  /** Expected cost of holding 0–4 spares (overage on unused spares + underage on uncovered shortages) */
  table: { spares: number; covered: number; expectedCost: number }[];
}

export function transformerUnits(c: Campus, s: Settings, unitMw: number) {
  return c.phases.map((p) => Math.max(1, Math.ceil(facilityMw(p, s) / Math.max(1, unitMw) - 1e-9)));
}

/** One shared pool of spares for the whole campus: shortages are Poisson with mean units × fail share. */
export function spares(c: Campus, s: Settings, h: HedgeSettings): SparesResult {
  const counts = transformerUnits(c, s, h.unitMw);
  const units = counts.reduce((a, b) => a + b, 0);
  const lambda = units * h.failShare;
  const leadMonths = leadTime(h.buildMonths, h.supplierLoad, h.variability);
  // Average cost per short unit, weighting each phase by its units: Σ phase cost per month × lead ÷ units.
  const monthlyTotal = c.phases.reduce((sum, p) => sum + monthlyDelayCost(p, s).total, 0);
  const underage = (monthlyTotal * leadMonths) / units;
  const overage = h.priceM * 1e6 * (1 - h.valueKept);
  const criticalRatio = underage + overage > 0 ? underage / (underage + overage) : 0;

  const expectedCost = (k: number) => {
    let over = 0;
    let under = 0;
    // Truncate the Poisson sum well past where it matters.
    const top = Math.max(k + 20, Math.ceil(lambda + 10 * Math.sqrt(lambda + 1)));
    for (let d = 0; d <= top; d++) {
      const pd = poissonPmf(d, lambda);
      over += pd * Math.max(0, k - d);
      under += pd * Math.max(0, d - k);
    }
    return over * overage + under * underage;
  };

  let best = 0;
  while (poissonCdf(best, lambda) < criticalRatio && best < 50) best++;
  return {
    units,
    expectedShort: lambda,
    leadMonths,
    underage,
    overage,
    criticalRatio,
    best,
    table: [0, 1, 2, 3, 4].map((k) => ({ spares: k, covered: poissonCdf(k, lambda), expectedCost: expectedCost(k) })),
  };
}
