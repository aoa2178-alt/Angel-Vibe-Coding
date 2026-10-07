// Speed-to-Power: the grid connection for a GPU cluster is late. What's the cheapest way to bridge the wait?
// Every strategy is measured as extra cost over the baseline of owning the cluster on a working grid from day one
// (BreakEven's own-cost model). Until a strategy is ready, you rent cloud GPUs instead.
import { HOURS_PER_MONTH, facilityKwPerGpu, ownCostPerGpuMonth, type Assumptions } from "./tco";

export interface BridgeAssumptions {
  /** Months until the grid connection is ready */
  delayMonths: number;
  /** Natural gas delivered price, $ per MMBtu */
  gasPerMMBtu: number;
  /** On-site gas generation heat rate, Btu per kWh */
  heatRate: number;
  /** Owned on-site gas generation (turbines or engines): capital cost, $ per kW */
  engineCapexPerKw: number;
  engineFixedOmPerKwYear: number;
  engineVarOmPerMwh: number;
  engineLeadMonths: number;
  /** Share of the generators' cost recovered when the grid arrives (kept as backup or resold), percent */
  engineValueKeptPct: number;
  /** Spare generating capacity for redundancy, percent */
  reservePct: number;
  /** Bridge power service: price per MWh delivered by a provider's on-site generation */
  servicePerMwh: number;
  serviceLeadMonths: number;
  /** 1 if a bridge-power provider can serve a cluster this size in time, 0 if not */
  serviceOffered: number;
  /** Batteries for a flexible (curtailable) grid connection */
  batteryPerKwh: number;
  /** Longest curtailment event the batteries must cover, hours */
  batteryHours: number;
  batteryValueKeptPct: number;
  flexLeadMonths: number;
  /** 1 if the utility offers a flexible connection at all, 0 if not */
  flexOffered: number;
}

export const DEFAULT_BRIDGE: BridgeAssumptions = {
  delayMonths: 24,
  gasPerMMBtu: 4,
  heatRate: 9_447,
  engineCapexPerKw: 1_606,
  engineFixedOmPerKwYear: 9.56,
  engineVarOmPerMwh: 5.7,
  engineLeadMonths: 18,
  engineValueKeptPct: 50,
  reservePct: 20,
  servicePerMwh: 140,
  serviceLeadMonths: 6,
  serviceOffered: 1,
  batteryPerKwh: 280,
  batteryHours: 4,
  batteryValueKeptPct: 70,
  flexLeadMonths: 12,
  flexOffered: 1,
};

export const CLUSTER_PRESETS = [
  { id: "enterprise", label: "Enterprise cluster", gpus: 1_024 },
  { id: "neocloud", label: "Neocloud", gpus: 10_240 },
  { id: "campus", label: "AI campus", gpus: 102_400 },
] as const;

export const DEFAULT_GPUS = 10_240;
export const MAX_DELAY_MONTHS = 72;

export type StrategyId = "wait" | "service" | "engines" | "flex";
export const STRATEGY_IDS: StrategyId[] = ["wait", "service", "engines", "flex"];

export interface StrategyCost {
  id: StrategyId;
  /** False when the strategy isn't on offer (no bridge provider, or no flexible connection from the utility) */
  available: boolean;
  /** Months until it's running; until then you rent */
  readyAfter: number;
  /** Paid once, when it starts running */
  oneTime: number;
  /** Extra cost per month once running, versus owning on the grid (negative means cheaper than grid power) */
  monthlyRunning: number;
  /** Extra cost per month while you rent and wait */
  monthlyWaiting: number;
}

export function facilityKw(gpus: number, a: Assumptions) {
  return gpus * facilityKwPerGpu(a);
}

/** Facility energy per month, in kWh. Like the own-cost model, the cluster runs at full power all month. */
export function facilityKwhPerMonth(gpus: number, a: Assumptions) {
  return facilityKw(gpus, a) * HOURS_PER_MONTH;
}

/** Extra cost per month of renting the whole cluster instead of owning it on a working grid. */
export function rentPremium(gpus: number, a: Assumptions) {
  return gpus * (HOURS_PER_MONTH * a.rentPerGpuHour - ownCostPerGpuMonth(a));
}

/** How each strategy is costed. Grid electricity is already inside the own-cost baseline, so on-site power only adds the difference. */
export function strategies(gpus: number, a: Assumptions, b: BridgeAssumptions): Record<StrategyId, StrategyCost> {
  const premium = rentPremium(gpus, a);
  const kwh = facilityKwhPerMonth(gpus, a);
  const gridPerKwh = a.electricityPerKwh;
  const engineKw = facilityKw(gpus, a) * (1 + b.reservePct / 100);
  const fuelPerKwh = (b.heatRate * b.gasPerMMBtu) / 1e6 + b.engineVarOmPerMwh / 1000;
  const batteryKwh = facilityKw(gpus, a) * b.batteryHours;
  const base = { available: true, monthlyWaiting: premium };
  return {
    wait: { ...base, id: "wait", readyAfter: 0, oneTime: 0, monthlyRunning: premium },
    service: {
      ...base,
      id: "service",
      available: b.serviceOffered > 0,
      readyAfter: b.serviceLeadMonths,
      oneTime: 0,
      monthlyRunning: kwh * (b.servicePerMwh / 1000 - gridPerKwh),
    },
    engines: {
      ...base,
      id: "engines",
      readyAfter: b.engineLeadMonths,
      oneTime: engineKw * b.engineCapexPerKw * (1 - b.engineValueKeptPct / 100),
      monthlyRunning: kwh * (fuelPerKwh - gridPerKwh) + (engineKw * b.engineFixedOmPerKwYear) / 12,
    },
    flex: {
      ...base,
      id: "flex",
      available: b.flexOffered > 0,
      readyAfter: b.flexLeadMonths,
      oneTime: batteryKwh * b.batteryPerKwh * (1 - b.batteryValueKeptPct / 100),
      monthlyRunning: 0,
    },
  };
}

/** Total extra cost of a strategy over a grid delay of `months`. It is only put in place if the wait outlasts its lead time. */
export function totalOver(s: StrategyCost, months: number) {
  const waiting = Math.min(months, s.readyAfter);
  const running = Math.max(0, months - s.readyAfter);
  return waiting * s.monthlyWaiting + (running > 0 ? s.oneTime + running * s.monthlyRunning : 0);
}

/** Cheapest available strategy for a delay. Ties go to the simplest option (renting), then in list order. */
export function bestStrategy(all: Record<StrategyId, StrategyCost>, months: number): StrategyId {
  let best: StrategyId = "wait";
  for (const id of STRATEGY_IDS) {
    if (!all[id].available) continue;
    if (totalOver(all[id], months) < totalOver(all[best], months) - 1e-6) best = id;
  }
  return best;
}

/** Which strategy is cheapest across delays 0..max: a list of stretches, each with the month it starts. */
export function winnerStretches(all: Record<StrategyId, StrategyCost>, max = MAX_DELAY_MONTHS) {
  const out: { fromMonth: number; id: StrategyId }[] = [];
  for (let m = 0; m <= max; m++) {
    const id = bestStrategy(all, m);
    if (out.length === 0 || out[out.length - 1].id !== id) out.push({ fromMonth: m, id });
  }
  return out;
}

/** The first delay (whole months) at which a strategy costs less in total than renting the whole time; null if never within max. */
export function paysOffFrom(all: Record<StrategyId, StrategyCost>, id: StrategyId, max = MAX_DELAY_MONTHS) {
  if (id === "wait" || !all[id].available) return null;
  for (let m = 0; m <= max; m++) if (totalOver(all[id], m) < totalOver(all.wait, m) - 1e-6) return m;
  return null;
}

/** Short money format for big totals: $437K, $26.3M, $1.05B. Negative values (savings) get a minus sign. */
export function formatMoney(n: number) {
  return money(n).replace(/\.0+(?=[MB])/, "");
}

function money(n: number) {
  const a = Math.abs(n);
  const sign = n < -0.5 ? "−" : "";
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(a >= 1e10 ? 1 : 2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(a >= 1e8 ? 0 : 1)}M`;
  if (a >= 1e3) return `${sign}$${Math.round(a / 1e3)}K`;
  return `${sign}$${Math.round(a)}`;
}
