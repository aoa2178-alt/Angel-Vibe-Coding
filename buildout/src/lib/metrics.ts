// Buildout's measures: totals, growth, run-rate, capex intensity, free cash flow, the depreciation wave, and how much
// of the spenders' capex shows up as the receivers' revenue. Pure functions over the filings.
import { RECEIVERS, SPENDERS, type Company, type Quarter } from "./data";

type Metric = "capex" | "revenue" | "ocf" | "da";

/** Every quarter label from `from` to `to`, inclusive. */
export function quarterRange(from: string, to: string) {
  const idx = (q: string) => Number(q.slice(0, 4)) * 4 + Number(q.slice(5)) - 1;
  const out: string[] = [];
  for (let i = idx(from); i <= idx(to); i++) out.push(`${Math.floor(i / 4)}Q${(i % 4) + 1}`);
  return out;
}

export const valueAt = (c: Company, q: string, m: Metric) => c.quarters.find((x) => x.quarter === q)?.[m] ?? null;

/** The latest quarter every company in `cs` has reported `m` for. */
export function latestCommon(cs: Company[], m: Metric = "capex") {
  const lasts = cs.map((c) => c.quarters.filter((x) => x[m] !== null).at(-1)!.quarter);
  return lasts.sort()[0]!;
}

/** Previous quarter label, `n` back. */
export function back(q: string, n: number) {
  const i = Number(q.slice(0, 4)) * 4 + Number(q.slice(5)) - 1 - n;
  return `${Math.floor(i / 4)}Q${(i % 4) + 1}`;
}

/** Sum of `m` over companies for one quarter; null if any company is missing it. */
export function total(cs: Company[], q: string, m: Metric) {
  let sum = 0;
  for (const c of cs) {
    const v = valueAt(c, q, m);
    if (v === null) return null;
    sum += v;
  }
  return sum;
}

/** Trailing four quarters ending at `q`; null if any value is missing. */
export function ttm(cs: Company[], q: string, m: Metric) {
  let sum = 0;
  for (let i = 0; i < 4; i++) {
    const v = total(cs, back(q, i), m);
    if (v === null) return null;
    sum += v;
  }
  return sum;
}

export const growth = (now: number | null, then: number | null) => (now !== null && then !== null && then !== 0 ? now / then - 1 : null);

/** The headline numbers for the spenders as of the latest quarter they've all reported. */
export function headline(cs: Company[] = SPENDERS) {
  const q = latestCommon(cs);
  const capex = total(cs, q, "capex")!;
  const yearAgo = total(cs, back(q, 4), "capex");
  const ttmCapex = ttm(cs, q, "capex")!;
  const ttmPrior = ttm(cs, back(q, 4), "capex");
  const ttmRevenue = ttm(cs, q, "revenue")!;
  const ttmOcf = ttm(cs, q, "ocf")!;
  const ranked = cs.map((c) => ({ c, capex: valueAt(c, q, "capex")!, yoy: growth(valueAt(c, q, "capex"), valueAt(c, back(q, 4), "capex")) })).sort((a, b) => b.capex - a.capex);
  return {
    quarter: q,
    capex,
    yoy: growth(capex, yearAgo),
    runRate: capex * 4,
    ttmCapex,
    ttmGrowth: growth(ttmCapex, ttmPrior),
    intensity: ttmCapex / ttmRevenue,
    fcf: ttmOcf - ttmCapex,
    capexShareOfOcf: ttmCapex / ttmOcf,
    ranked,
    fastest: [...ranked].filter((r) => r.yoy !== null).sort((a, b) => b.yoy! - a.yoy!)[0]!,
  };
}

/** Per-company trailing-twelve-month intensity, free cash flow and the depreciation wave. */
export function payoff(c: Company, q: string) {
  const capex = ttm([c], q, "capex");
  const revenue = ttm([c], q, "revenue");
  const ocf = ttm([c], q, "ocf");
  const da = ttm([c], q, "da");
  const daYearAgo = ttm([c], back(q, 4), "da");
  return {
    capex,
    revenue,
    intensity: capex !== null && revenue ? capex / revenue : null,
    fcf: capex !== null && ocf !== null ? ocf - capex : null,
    da,
    daGrowth: growth(da, daYearAgo),
    /** Capex ÷ depreciation: above 1, the asset base (and future depreciation) is still growing */
    capexToDa: capex !== null && da ? capex / da : null,
  };
}

/** Quarterly series of trailing intensity for one company. */
export function intensitySeries(c: Company, qs: string[]) {
  return qs.map((q) => {
    const p = payoff(c, q);
    return p.intensity;
  });
}

/**
 * Read-through: the receivers' trailing revenue against the spenders' trailing capex, indexed to a base quarter.
 * The dollar ratio is illustrative: receivers also sell to other customers, and spenders also buy elsewhere.
 */
export function readThrough(base: string, q: string = latestCommon([...SPENDERS, ...RECEIVERS])) {
  const capexNow = ttm(SPENDERS, q, "capex")!;
  const capexBase = ttm(SPENDERS, base, "capex")!;
  const revNow = ttm(RECEIVERS, q, "revenue")!;
  const revBase = ttm(RECEIVERS, base, "revenue")!;
  const addedCapex = capexNow - capexBase;
  const addedRevenue = revNow - revBase;
  return {
    quarter: q,
    base,
    capexGrowth: capexNow / capexBase - 1,
    revenueGrowth: revNow / revBase - 1,
    addedCapex,
    addedRevenue,
    /** Extra receiver revenue per extra dollar of spender capex since the base */
    perDollar: addedCapex > 0 ? addedRevenue / addedCapex : null,
    byReceiver: RECEIVERS.map((c) => {
      const now = ttm([c], q, "revenue");
      const then = ttm([c], base, "revenue");
      return { c, now, then, growth: growth(now, then) };
    }),
  };
}

/** A quarterly series indexed to 100 at `base` (trailing twelve months, to smooth fiscal calendars). */
export function indexed(cs: Company[], m: Metric, qs: string[], base: string) {
  const b = ttm(cs, base, m);
  return qs.map((q) => {
    const v = ttm(cs, q, m);
    return v === null || !b ? null : (v / b) * 100;
  });
}

export type { Quarter };
