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
  /** Space, staff and maintenance per owned GPU, $ per month */
  opsPerGpuMonth: number;
  /** Owned GPUs come in servers of this many */
  gpusPerServer: number;
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
  opsPerGpuMonth: 400,
  gpusPerServer: 8,
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
}

/** GPUs needed to serve the average load at the target utilization (at least one). */
export function gpusNeeded(w: Workload, a: Assumptions) {
  const avgTokensPerSec = (w.tokensM * 1e6) / SECONDS_PER_MONTH;
  return Math.max(1, Math.ceil(avgTokensPerSec / (a.gpuTokensPerSec * w.utilization) - 1e-9));
}

/** Monthly cost of one owned GPU: depreciation + power + space/staff/maintenance. */
export function ownCostPerGpuMonth(a: Assumptions) {
  const depreciation = a.hardwarePerGpu / (a.depreciationYears * 12);
  const power = a.kwPerGpu * a.pue * HOURS_PER_MONTH * a.electricityPerKwh;
  return depreciation + power + a.opsPerGpuMonth;
}

export function compare(w: Workload, a: Assumptions): Record<OptionId, OptionCost> {
  const blendedPerM = (1 - w.outputShare) * a.apiInputPerM + w.outputShare * a.apiOutputPerM;
  const rentGpus = gpusNeeded(w, a);
  const server = Math.max(1, Math.round(a.gpusPerServer));
  const ownGpus = Math.ceil(rentGpus / server) * server;

  const api = w.tokensM * blendedPerM;
  const rent = rentGpus * HOURS_PER_MONTH * a.rentPerGpuHour;
  const own = ownGpus * ownCostPerGpuMonth(a);
  const perM = (monthly: number) => (w.tokensM > 0 ? monthly / w.tokensM : 0);

  return {
    api: { id: "api", monthly: api, perM: perM(api), gpus: null },
    rent: { id: "rent", monthly: rent, perM: perM(rent), gpus: rentGpus },
    own: { id: "own", monthly: own, perM: perM(own), gpus: ownGpus },
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
    ownDepreciation: a.hardwarePerGpu / (a.depreciationYears * 12),
    ownPower: a.kwPerGpu * a.pue * HOURS_PER_MONTH * a.electricityPerKwh,
    ownOps: a.opsPerGpuMonth,
  };
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
