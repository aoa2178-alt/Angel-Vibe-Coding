// Running the fleet well: three operations decisions on top of the cost model, each from a class concept.
//  1. How hot to run it: response time as GPUs get busier (Factory Physics: wait = variability × utilization × time; Little's Law).
//  2. How much to own: own the always-busy base, rent the peaks (flexibility; the newsvendor critical ratio).
//  3. When to retire owned GPUs: running cost vs falling rental prices (capacity retraction; hardware is a sunk cost).
// Pure functions only, like tco.ts.
import { PRICES, type PriceData } from "./prices";
import { HOURS_PER_MONTH, compare, gpusNeeded, maxOwnedGpus, ownCostParts, ownCostPerGpuMonth, type Assumptions, type Workload } from "./tco";

const SECONDS_PER_MONTH = HOURS_PER_MONTH * 3600;

export interface OpsSettings {
  /** Tokens in one request, prompt and answer together */
  requestTokens: number;
  /** How bursty traffic is: the squared coefficient of variation of arrivals (1 = random, like Poisson) */
  burst: number;
  /** The longest acceptable average wait in the queue, seconds */
  waitTargetSec: number;
  /** Hours a day at peak */
  peakHours: number;
  /** On-demand (by the hour) rental price as a multiple of the reserved price */
  onDemandPremium: number;
  /** How much cheaper renting the same capacity gets each year, 0–1 */
  rentalDecline: number;
}

/** Yearly fall in H100 rental prices across the tracked series (first point to latest), 0–1. */
export function rentalDecline(prices: PriceData = PRICES) {
  const pts = (prices.gpu.find((s) => s.id === prices.defaults.gpu) ?? prices.gpu[0])?.points ?? [];
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (!first || !last || first === last) return 0;
  const years = (Date.parse(last.date) - Date.parse(first.date)) / (365.25 * 24 * 3600 * 1000);
  if (!(years > 0) || !(first.value > 0)) return 0;
  return 1 - Math.pow(last.value / first.value, 1 / years);
}

export const BURST_PRESETS = [
  { id: "steady", label: "Steady", value: 0.5, blurb: "Smooth, scheduled traffic" },
  { id: "typical", label: "Typical", value: 1, blurb: "Random arrivals" },
  { id: "spiky", label: "Spiky", value: 3, blurb: "Bursts and launches" },
] as const;

export const DEFAULT_OPS: OpsSettings = {
  requestTokens: 2_000,
  burst: 1,
  waitTargetSec: 1,
  peakHours: 8,
  onDemandPremium: 1.5,
  rentalDecline: Math.round(rentalDecline() * 1000) / 1000,
};

/* ---------- 1. Queueing ---------- */

export interface QueueResult {
  /** GPUs in the fleet (the "machines" at this station) */
  gpus: number;
  /** Share of the fleet's capacity in use, 0–1 */
  busy: number;
  /** Requests arriving per second */
  arrivalsPerSec: number;
  /** Seconds a GPU spends on one request (process time, tₑ) */
  serviceSec: number;
  /** Average seconds waiting before work starts */
  waitSec: number;
  /** Service + wait (cycle time) */
  responseSec: number;
  /** Little's Law: requests in the system on average, L = λ × W */
  inFlight: number;
}

/**
 * Queue time at a station of m parallel machines (Factory Physics, the Kingman / Sakasegawa approximation):
 * wait = V × U × T = (cₐ² + cₑ²)/2 × u^(√(2(m+1)) − 1) / (m(1 − u)) × tₑ, with cₑ² = 1.
 * With one machine it is exactly Kingman's V × u/(1 − u) × tₑ.
 */
export function stationWait(m: number, u: number, serviceSec: number, burst: number) {
  if (u <= 0) return 0;
  if (u >= 1) return Infinity;
  const machines = Math.max(1, Math.round(m));
  return ((burst + 1) / 2) * (Math.pow(u, Math.sqrt(2 * (machines + 1)) - 1) / (machines * (1 - u))) * serviceSec;
}

const serviceSecOf = (a: Assumptions, ops: OpsSettings) => ops.requestTokens / a.gpuTokensPerSec;

/** A fleet of `gpus` serving `arrivalsPerSec` requests a second. */
export function queueFor(gpus: number, arrivalsPerSec: number, a: Assumptions, ops: OpsSettings): QueueResult {
  const serviceSec = serviceSecOf(a, ops);
  const busy = (arrivalsPerSec * serviceSec) / Math.max(1, gpus);
  const waitSec = stationWait(gpus, busy, serviceSec, ops.burst);
  const responseSec = serviceSec + waitSec;
  return { gpus, busy, arrivalsPerSec, serviceSec, waitSec, responseSec, inFlight: arrivalsPerSec * responseSec };
}

const arrivals = (w: Workload, ops: OpsSettings) => (w.tokensM * 1e6) / SECONDS_PER_MONTH / ops.requestTokens;

/** The plan's fleet (GPUs sized at its utilization setting) and how long answers take on it. */
export function responseTime(w: Workload, a: Assumptions, ops: OpsSettings) {
  return queueFor(gpusNeeded(w, a), arrivals(w, ops), a, ops);
}

/** Response time on a fixed fleet as traffic grows until it's `busy` full: the hockey stick. */
export function utilizationCurve(gpus: number, a: Assumptions, ops: OpsSettings, from = 0.05, to = 0.97, steps = 92) {
  const serviceSec = serviceSecOf(a, ops);
  return Array.from({ length: steps + 1 }, (_, i) => {
    const busy = from + ((to - from) * i) / steps;
    const waitSec = stationWait(gpus, busy, serviceSec, ops.burst);
    return { busy, waitSec, responseSec: serviceSec + waitSec };
  });
}

/** The highest utilization setting (sizing target) whose fleet keeps the average wait within the target; null if none does. */
export function maxUtilizationFor(w: Workload, a: Assumptions, ops: OpsSettings) {
  for (let pct = 95; pct >= 20; pct--) {
    const q = responseTime({ ...w, utilization: pct / 100 }, a, ops);
    if (q.waitSec <= ops.waitTargetSec) return pct / 100;
  }
  return null;
}

/* ---------- 2. Own the base, rent the peaks ---------- */

export type LayerChoice = "own" | "rent" | "on-demand";

export interface HybridResult {
  /** GPUs needed at peak (the fleet sized at the plan's utilization) */
  peakGpus: number;
  /** GPUs needed off-peak */
  baseGpus: number;
  /** baseGpus as a share of peakGpus, before rounding */
  offPeakShare: number;
  /** Own cost of one GPU ÷ what renting it on demand for a whole month would cost: own a GPU if it's busy more than this share of the day */
  criticalRatio: number;
  /** Share of the day at peak */
  peakShare: number;
  allRent: number;
  allOwn: number;
  hybrid: number;
  /** "split" when owning the base and handling the peak separately beats both pure options */
  best: "split" | "own" | "rent";
  base: { choice: "own" | "rent"; gpus: number; monthly: number };
  peak: { choice: LayerChoice; gpus: number; monthly: number };
  /** Cheaper of all-rented and all-owned, minus the hybrid: what flexibility is worth a month */
  flexibilityValue: number;
}

/** Splits the fleet into an always-busy base and a peak layer, and runs each layer the cheapest way. */
export function hybrid(w: Workload, a: Assumptions, ops: OpsSettings): HybridResult {
  const costs = compare(w, a);
  const peakGpus = costs.rent.gpus ?? 1;
  const server = Math.max(1, Math.round(a.gpusPerServer));
  const own = ownCostPerGpuMonth(a);
  const reserved = HOURS_PER_MONTH * a.rentPerGpuHour;
  const peakShare = Math.min(1, Math.max(0, ops.peakHours / 24));
  const onDemandMonth = HOURS_PER_MONTH * a.rentPerGpuHour * ops.onDemandPremium;

  // Base layer: busy all day. Own it in whole servers (within any power cap), or rent it reserved.
  // Peak layer: what's left, busy only at peak hours. Own it, rent it reserved all day, or rent it by the hour at peak.
  // The two are chosen together, because spare GPUs in an owned server also cover part of the peak.
  // The fleet is sized so it's fully busy at peak and averages the plan's utilization, so off-peak it needs
  // (utilization − peak share) ÷ (1 − peak share) of itself.
  const offPeakShare = peakShare >= 1 ? 1 : Math.min(1, Math.max(0, (w.utilization - peakShare) / (1 - peakShare)));
  const baseGpus = Math.min(peakGpus, Math.ceil(peakGpus * offPeakShare - 1e-9));
  const cap = maxOwnedGpus(a);
  const ownedBase = Math.min(Math.ceil(baseGpus / server) * server, cap);
  type Layer = { choice: LayerChoice; gpus: number; monthly: number };
  const peakOptions = (ownedSoFar: number, covered: number): Layer[] => {
    const layer = Math.max(0, peakGpus - covered);
    if (layer === 0) return [{ choice: "on-demand", gpus: 0, monthly: 0 }];
    const ownMore = Math.max(0, Math.min(Math.ceil((ownedSoFar + layer) / server) * server, cap) - ownedSoFar);
    const short = Math.max(0, layer - ownMore);
    return [
      { choice: "on-demand", gpus: layer, monthly: layer * onDemandMonth * peakShare },
      { choice: "rent", gpus: layer, monthly: layer * reserved },
      { choice: "own", gpus: ownMore, monthly: ownMore * own + short * onDemandMonth * peakShare },
    ];
  };
  const bases: { base: { choice: "own" | "rent"; gpus: number; monthly: number }; owned: number; covered: number }[] = [
    { base: { choice: "rent", gpus: baseGpus, monthly: baseGpus * reserved }, owned: 0, covered: baseGpus },
  ];
  if (baseGpus > 0 && ownedBase > 0) {
    bases.push({
      base: { choice: "own", gpus: ownedBase, monthly: ownedBase * own + Math.max(0, baseGpus - ownedBase) * reserved },
      owned: ownedBase,
      covered: Math.max(baseGpus, ownedBase),
    });
  }
  let base = bases[0]!.base;
  let peak: Layer = { choice: "on-demand", gpus: 0, monthly: Infinity };
  for (const b of bases) {
    for (const p of peakOptions(b.owned, b.covered)) {
      if (b.base.monthly + p.monthly < base.monthly + peak.monthly - 1e-6) {
        base = b.base;
        peak = p;
      }
    }
  }

  const allRent = costs.rent.monthly;
  const allOwn = costs.own.monthly;
  const split = base.monthly + peak.monthly;
  const best: HybridResult["best"] = split < Math.min(allRent, allOwn) - 1e-6 ? "split" : allOwn < allRent ? "own" : "rent";
  const hybridCost = Math.min(split, allRent, allOwn);
  return {
    best,
    peakGpus,
    baseGpus,
    offPeakShare,
    criticalRatio: onDemandMonth > 0 ? own / onDemandMonth : Infinity,
    peakShare,
    allRent,
    allOwn,
    hybrid: hybridCost,
    base,
    peak,
    flexibilityValue: Math.max(0, Math.min(allRent, allOwn) - hybridCost),
  };
}

/* ---------- 3. When to retire owned GPUs ---------- */

export interface RetirementResult {
  /** Cash to keep one owned GPU running a month: support + electricity + colocation (the hardware is already paid for) */
  keepMonthly: number;
  /** Renting the same capacity today, a month */
  rentMonthly: number;
  /** Months from now until renting is cheaper than keeping; 0 = already; null = not while prices fall this slowly */
  retireAfterMonths: number | null;
  /** True when that comes before the hardware is written off */
  beforeWriteOff: boolean;
}

/** Sunk-cost view: keep an owned GPU while its running cash is below what renting the same capacity would cost that month. */
export function retirement(a: Assumptions, ops: OpsSettings): RetirementResult {
  const p = ownCostParts(a);
  const keepMonthly = p.support + p.electricity + p.colocation;
  const rentMonthly = HOURS_PER_MONTH * a.rentPerGpuHour;
  let retireAfterMonths: number | null;
  if (rentMonthly <= keepMonthly) retireAfterMonths = 0;
  else if (!(ops.rentalDecline > 0) || ops.rentalDecline >= 1) retireAfterMonths = ops.rentalDecline >= 1 ? 0 : null;
  else retireAfterMonths = (12 * Math.log(keepMonthly / rentMonthly)) / Math.log(1 - ops.rentalDecline);
  return {
    keepMonthly,
    rentMonthly,
    retireAfterMonths,
    beforeWriteOff: retireAfterMonths !== null && retireAfterMonths < a.depreciationYears * 12,
  };
}
