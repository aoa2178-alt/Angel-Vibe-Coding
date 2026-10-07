// Breakeven's cost model: what one month of AI inference costs on a pay-per-token API, on rented cloud GPUs,
// or on GPUs you own. Pure functions only, so the UI and the tests share one source of truth.

export const HOURS_PER_MONTH = 730;
const SECONDS_PER_MONTH = HOURS_PER_MONTH * 3600;

export interface Assumptions {
  /** API price per million input tokens, $ */
  apiInputPerM: number;
  /** API price per million output tokens, $ */
  apiOutputPerM: number;
  /** Blended tokens per second one GPU serves for the chosen model size */
  gpuTokensPerSec: number;
  /** Cloud rental, $ per GPU-hour */
  rentPerGpuHour: number;
  /** Purchase price per GPU including its share of the server and networking, $ */
  hardwarePerGpu: number;
  /** Years over which owned hardware is depreciated */
  depreciationYears: number;
  /** Power per GPU including its share of the server, kW */
  kwPerGpu: number;
  /** Data center power usage effectiveness (total facility power ÷ IT power) */
  pue: number;
  /** Electricity, $ per kWh */
  electricityPerKwh: number;
  /** Colocation (space, cooling and facility services), $ per kW of IT load per month */
  colocationPerKwMonth: number;
  /** Support and maintenance contracts, % of hardware cost per year */
  supportPctPerYear: number;
  /** Owned GPUs come in servers of this many */
  gpusPerServer: number;
  /** Facility power available for owned GPUs, kW. 0 means no limit. Above it, the overflow is rented. */
  powerLimitKw: number;
}

export interface Workload {
  /** Tokens per month, in millions */
  tokensM: number;
  /** Share of tokens that are output, 0–1 */
  outputShare: number;
  /** Average share of GPU capacity you can keep busy, 0–1 */
  utilization: number;
}

// Illustrative defaults (checked October 2026; every one is editable in the app):
// - API: Claude Sonnet 5.5 list price, $2 input / $10 output per million tokens.
// - Rent: H100 on GPU-focused clouds runs about $2–3/hr; the market average is about $3.6 and hyperscalers about $7.
// - Hardware: an 8× H100 server runs about $250–320K, about $35K per GPU all-in.
// - Power: H100 SXM is 700 W; with its share of the server, about 1.3 kW per GPU.
// - Throughput: ~1,500 tokens/sec per GPU for a 70B-class open-weight model with batching (conservative).
// - Colocation: CBRE reports about $195 per kW per month across North America in 2025.
// - Support: annual hardware support and maintenance runs roughly 10–20% of purchase price; 10% here.
// Sources for every default are on the methodology page (src/lib/methodology.ts).
export const DEFAULT_ASSUMPTIONS: Assumptions = {
  apiInputPerM: 2,
  apiOutputPerM: 10,
  gpuTokensPerSec: 1500,
  rentPerGpuHour: 2.5,
  hardwarePerGpu: 35000,
  depreciationYears: 4,
  kwPerGpu: 1.3,
  pue: 1.3,
  electricityPerKwh: 0.1,
  colocationPerKwMonth: 195,
  supportPctPerYear: 10,
  gpusPerServer: 8,
  powerLimitKw: 0,
};

export const PRESETS = [
  { id: "small", label: "Small team", blurb: "An internal assistant for a few hundred people", tokensM: 200 },
  { id: "startup", label: "Growing startup", blurb: "An AI feature inside a product with real traction", tokensM: 2_000 },
  { id: "scaleup", label: "Scale-up", blurb: "AI at the core of a large product", tokensM: 30_000 },
] as const;

export const DEFAULT_WORKLOAD: Workload = { tokensM: 2_000, outputShare: 0.25, utilization: 0.6 };

export type OptionId = "api" | "rent" | "own";

export interface OptionCost {
  id: OptionId;
  monthly: number;
  perM: number;
  /** GPUs needed (rent) or bought (own); null for the API */
  gpus: number | null;
  /** Own only: GPUs rented on top because the power budget caps owned capacity (0 when not capped) */
  overflowGpus?: number;
}

/** GPUs needed to serve the average load at the target utilization (at least one). */
export function gpusNeeded(w: Workload, a: Assumptions) {
  const avgTokensPerSec = (w.tokensM * 1e6) / SECONDS_PER_MONTH;
  return Math.max(1, Math.ceil(avgTokensPerSec / (a.gpuTokensPerSec * w.utilization) - 1e-9));
}

/** Facility kW one owned GPU draws: its own power times the data center overhead (PUE). */
export function facilityKwPerGpu(a: Assumptions) {
  return a.kwPerGpu * a.pue;
}

/** The most GPUs the power budget can run, in whole servers. Infinity when there is no limit. */
export function maxOwnedGpus(a: Assumptions) {
  if (!(a.powerLimitKw > 0)) return Infinity;
  const server = Math.max(1, Math.round(a.gpusPerServer));
  const perGpu = facilityKwPerGpu(a);
  if (!(perGpu > 0)) return Infinity;
  return Math.floor(a.powerLimitKw / perGpu / server) * server;
}

/** The four parts of one owned GPU's monthly cost. */
export function ownCostParts(a: Assumptions) {
  return {
    hardware: a.hardwarePerGpu / (a.depreciationYears * 12),
    support: (a.hardwarePerGpu * a.supportPctPerYear) / 100 / 12,
    electricity: a.kwPerGpu * a.pue * HOURS_PER_MONTH * a.electricityPerKwh,
    colocation: a.kwPerGpu * a.colocationPerKwMonth,
  };
}

/** Monthly cost of one owned GPU: depreciation + support + electricity (with PUE) + colocation. */
export function ownCostPerGpuMonth(a: Assumptions) {
  const p = ownCostParts(a);
  return p.hardware + p.support + p.electricity + p.colocation;
}

export function compare(w: Workload, a: Assumptions): Record<OptionId, OptionCost> {
  const blendedPerM = (1 - w.outputShare) * a.apiInputPerM + w.outputShare * a.apiOutputPerM;
  const rentGpus = gpusNeeded(w, a);
  const server = Math.max(1, Math.round(a.gpusPerServer));
  // Own whole servers, up to what the power budget allows; anything beyond that is rented.
  const wanted = Math.ceil(rentGpus / server) * server;
  const ownGpus = Math.min(wanted, maxOwnedGpus(a));
  const overflowGpus = ownGpus < wanted ? Math.max(0, rentGpus - ownGpus) : 0;

  const api = w.tokensM * blendedPerM;
  const rent = rentGpus * HOURS_PER_MONTH * a.rentPerGpuHour;
  const own = ownGpus * ownCostPerGpuMonth(a) + overflowGpus * HOURS_PER_MONTH * a.rentPerGpuHour;
  const perM = (monthly: number) => (w.tokensM > 0 ? monthly / w.tokensM : 0);

  return {
    api: { id: "api", monthly: api, perM: perM(api), gpus: null },
    rent: { id: "rent", monthly: rent, perM: perM(rent), gpus: rentGpus },
    own: { id: "own", monthly: own, perM: perM(own), gpus: ownGpus, overflowGpus },
  };
}

/** The intermediate numbers behind compare(), for showing the calculation step by step. */
export function breakdown(w: Workload, a: Assumptions) {
  const blendedPerM = (1 - w.outputShare) * a.apiInputPerM + w.outputShare * a.apiOutputPerM;
  const avgTokensPerSec = (w.tokensM * 1e6) / SECONDS_PER_MONTH;
  const servedPerGpu = a.gpuTokensPerSec * w.utilization;
  return {
    blendedPerM,
    avgTokensPerSec,
    servedPerGpu,
    gpusExact: avgTokensPerSec / servedPerGpu,
    own: ownCostParts(a),
    maxOwned: maxOwnedGpus(a),
    facilityKwPerGpu: facilityKwPerGpu(a),
  };
}

/** Monthly volume (M tokens) at which the power budget runs out of owned GPUs; null when there is no limit. */
export function powerCapVolumeM(w: Workload, a: Assumptions) {
  const max = maxOwnedGpus(a);
  if (!Number.isFinite(max)) return null;
  return (max * a.gpuTokensPerSec * w.utilization * SECONDS_PER_MONTH) / 1e6;
}

/** The cheapest option; ties go API → rent → own (least commitment first). */
export function cheapest(costs: Record<OptionId, OptionCost>): OptionId {
  return (["api", "rent", "own"] as const).reduce((best, id) => (costs[id].monthly < costs[best].monthly - 1e-6 ? id : best));
}

export const VOLUME_MIN_M = 10;
export const VOLUME_MAX_M = 100_000;

export interface Crossovers {
  /** Above this volume (M tokens/month) the API is never cheapest again; null if the API always wins or never does. */
  apiUntilM: number | null;
  /** From this volume up, owning is always cheapest; null if that never happens in range. */
  ownFromM: number | null;
  /** True when renting and owning trade places in between (owned GPUs come in whole servers). */
  flipFlops: boolean;
}

/** Scans volumes on a log scale to find where the cheapest option changes. */
export function crossovers(w: Workload, a: Assumptions, steps = 400): Crossovers {
  const winners: { m: number; id: OptionId }[] = [];
  for (let i = 0; i <= steps; i++) {
    const m = VOLUME_MIN_M * Math.pow(VOLUME_MAX_M / VOLUME_MIN_M, i / steps);
    winners.push({ m, id: cheapest(compare({ ...w, tokensM: m }, a)) });
  }
  const lastApi = winners.findLastIndex((x) => x.id === "api");
  const lastNotOwn = winners.findLastIndex((x) => x.id !== "own");
  const apiUntilM = lastApi === -1 || lastApi === winners.length - 1 ? null : winners[lastApi + 1]!.m;
  const ownFromM = lastNotOwn === winners.length - 1 ? null : winners[lastNotOwn + 1]!.m;
  const between = winners.slice(lastApi + 1, lastNotOwn + 1);
  const flipFlops = between.some((x) => x.id === "own") && between.some((x) => x.id === "rent");
  return { apiUntilM, ownFromM, flipFlops };
}

/** "850M" / "2.4B" / "30B" tokens. */
export function formatTokensM(m: number) {
  if (m >= 1000) {
    const b = m / 1000;
    return `${b >= 10 ? Math.round(b) : Math.round(b * 10) / 10}B`;
  }
  return `${m >= 100 ? Math.round(m / 10) * 10 : Math.round(m)}M`;
}

export function formatUsd(n: number, digits = 0) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export interface OwnershipView {
  id: OptionId;
  /** Cash spent in the first year, including any hardware bought up front */
  yearOne: number;
  /** Total spent over the whole ownership period */
  total: number;
  /** For owning: the parts of the total */
  parts?: { hardware: number; support: number; electricity: number; colocation: number; rentedOverflow: number };
}

/** Cash view over the ownership period (the depreciation years): owning pays for hardware up front. */
export function ownershipView(w: Workload, a: Assumptions): Record<OptionId, OwnershipView> {
  const c = compare(w, a);
  const months = a.depreciationYears * 12;
  const p = ownCostParts(a);
  const owned = c.own.gpus ?? 0;
  const overflowMonthly = (c.own.overflowGpus ?? 0) * HOURS_PER_MONTH * a.rentPerGpuHour;
  const hardware = owned * a.hardwarePerGpu;
  const runMonthly = owned * (p.support + p.electricity + p.colocation) + overflowMonthly;
  return {
    api: { id: "api", yearOne: c.api.monthly * 12, total: c.api.monthly * months },
    rent: { id: "rent", yearOne: c.rent.monthly * 12, total: c.rent.monthly * months },
    own: {
      id: "own",
      yearOne: hardware + runMonthly * 12,
      total: hardware + runMonthly * months,
      parts: {
        hardware,
        support: owned * p.support * months,
        electricity: owned * p.electricity * months,
        colocation: owned * p.colocation * months,
        rentedOverflow: overflowMonthly * months,
      },
    },
  };
}

export const SENSITIVITY_DRIVERS: {
  id: string;
  label: string;
  apply: (a: Assumptions, f: number) => Assumptions;
  workload?: (w: Workload, f: number) => Workload;
}[] = [
  { id: "api", label: "API price", apply: (a, f) => ({ ...a, apiInputPerM: a.apiInputPerM * f, apiOutputPerM: a.apiOutputPerM * f }) },
  { id: "rent", label: "Cloud GPU rental", apply: (a, f) => ({ ...a, rentPerGpuHour: a.rentPerGpuHour * f }) },
  { id: "hardware", label: "Hardware cost", apply: (a, f) => ({ ...a, hardwarePerGpu: a.hardwarePerGpu * f }) },
  { id: "throughput", label: "GPU throughput", apply: (a, f) => ({ ...a, gpuTokensPerSec: a.gpuTokensPerSec * f }) },
  { id: "utilization", label: "GPU utilization", apply: (a) => a, workload: (w, f) => ({ ...w, utilization: Math.min(1, w.utilization * f) }) },
  { id: "electricity", label: "Electricity", apply: (a, f) => ({ ...a, electricityPerKwh: a.electricityPerKwh * f }) },
  { id: "colocation", label: "Colocation", apply: (a, f) => ({ ...a, colocationPerKwMonth: a.colocationPerKwMonth * f }) },
  { id: "support", label: "Support & maintenance", apply: (a, f) => ({ ...a, supportPctPerYear: a.supportPctPerYear * f }) },
];

export interface SensitivityRow {
  id: string;
  label: string;
  low: { winner: OptionId; monthly: number };
  high: { winner: OptionId; monthly: number };
  /** How far the cheapest monthly cost moves between low and high */
  swing: number;
  /** True when the cheapest option changes at either end */
  flips: boolean;
}

/** Moves each driver down and up by step (0.25 = ±25%) and reports the cheapest option at each end, flips and biggest swings first. */
export function sensitivity(w: Workload, a: Assumptions, step = 0.25): SensitivityRow[] {
  const base = cheapest(compare(w, a));
  return SENSITIVITY_DRIVERS.map((d) => {
    const at = (f: number) => {
      const c = compare(d.workload ? d.workload(w, f) : w, d.apply(a, f));
      const winner = cheapest(c);
      return { winner, monthly: c[winner].monthly };
    };
    const low = at(1 - step);
    const high = at(1 + step);
    return { id: d.id, label: d.label, low, high, swing: Math.abs(high.monthly - low.monthly), flips: low.winner !== base || high.winner !== base };
  }).sort((x, y) => Number(y.flips) - Number(x.flips) || y.swing - x.swing);
}
