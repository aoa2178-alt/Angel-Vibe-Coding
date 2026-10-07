// Loadline's model: pure functions, no UI. A campus is a set of phases; each phase has a GPU plan and the
// milestones it waits on. From that we get power (MW, yearly electricity), a schedule (go-live and its critical
// path), the cost of each month late, and which milestone to resolve first.
import data from "@/data/campuses.json";

export type MilestoneId = "shell" | "electrical" | "grid" | "cooling" | "gpus";
export type Confidence = "Primary" | "Vendor" | "Market" | "Analyst" | "Estimate" | "Assumption";

export interface Fact {
  text: string;
  source: string;
  confidence: Confidence;
}

export interface Phase {
  id: string;
  name: string;
  buildings: number;
  /** Either GPUs (when disclosed) or IT megawatts (when that is what's disclosed) */
  gpus?: number;
  itMw?: number;
  gpuProfile: string;
  /** Construction start */
  start: string;
  target?: { date: string; label: string };
  actual?: { date: string; label: string };
  status?: string;
  /** Planned completion date of each milestone (assumptions unless a fact says otherwise) */
  milestones: Record<MilestoneId, string>;
  commissioningMonths: number;
}

export interface Settings {
  pricePerMwh: number;
  pue: number;
  loadFactor: number;
  revenueBasis: "lease" | "gpu";
  leasePerKwMonth: number;
  gpuHourPrice: number;
  utilization: number;
  /** All-in build cost in $ millions per MW of IT capacity */
  capexPerMw: number;
  costOfCapital: number;
}

export interface Campus {
  id: string;
  company: string;
  site: string;
  tagline: string;
  customer: string;
  region: { state: string; grid: string; pricePerMwh: number; priceSource: string; priceNote: string };
  assumptions: Omit<Settings, "pricePerMwh">;
  facts: Fact[];
  phases: Phase[];
}

export interface GpuProfile {
  label: string;
  kwPerGpu: number;
  why: string;
  source: string;
  confidence: Confidence;
}

/** Months each milestone has slipped, keyed "phaseId.milestoneId" */
export type Slips = Record<string, number>;

export const DATA = data as unknown as {
  checked: string;
  gpuProfiles: Record<string, GpuProfile>;
  milestones: { id: MilestoneId; label: string; help: string }[];
  campuses: Campus[];
};
export const CAMPUSES = DATA.campuses;
export const MILESTONES = DATA.milestones;
export const HOURS_PER_YEAR = 8760;
export const HOURS_PER_MONTH = 730;

export const campusById = (id: string) => CAMPUSES.find((c) => c.id === id) ?? CAMPUSES[0]!;
export const defaultSettings = (c: Campus): Settings => ({ ...c.assumptions, pricePerMwh: c.region.pricePerMwh });

/* ---------- Dates as fractional month numbers, so slips and commissioning add simply ---------- */

/** "2025-09-30" → months since January 2000, with the day as a fraction of the month. */
export function monthIndex(iso: string) {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return (y - 2000) * 12 + (m - 1) + (d - 1) / days;
}

export function isoFromIndex(i: number) {
  const whole = Math.floor(i + 1e-9);
  const y = 2000 + Math.floor(whole / 12);
  const m = (whole % 12) + 1;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const d = Math.min(days, Math.floor((i - whole) * days + 1e-6) + 1);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const formatMonth = (i: number) => {
  const whole = Math.floor(i + 1e-9);
  return `${MONTHS[whole % 12]} ${2000 + Math.floor(whole / 12)}`;
};

/* ---------- Power ---------- */

const profileOf = (p: Phase) => DATA.gpuProfiles[p.gpuProfile]!;
export const phaseItMw = (p: Phase) => p.itMw ?? ((p.gpus ?? 0) * profileOf(p).kwPerGpu) / 1000;
export const phaseGpus = (p: Phase) => p.gpus ?? Math.round(((p.itMw ?? 0) * 1000) / profileOf(p).kwPerGpu);
export const facilityMw = (p: Phase, s: Settings) => phaseItMw(p) * s.pue;
/** Yearly electricity bill at full build: facility MW × hours × load factor × $/MWh */
export const annualEnergyCost = (p: Phase, s: Settings) => facilityMw(p, s) * HOURS_PER_YEAR * s.loadFactor * s.pricePerMwh;

/* ---------- Schedule ---------- */

export interface Dependency {
  id: MilestoneId;
  /** When it's done, with any slip applied */
  at: number;
  slip: number;
  /** Months it could slip before it moves go-live */
  slack: number;
}

export interface Schedule {
  deps: Dependency[];
  /** The dependency that finishes last: the critical path */
  critical: MilestoneId;
  /** Go-live = the last dependency + commissioning */
  live: number;
}

export function schedule(p: Phase, slips: Slips = {}): Schedule {
  const raw = MILESTONES.map((m) => {
    const slip = slips[`${p.id}.${m.id}`] ?? 0;
    return { id: m.id, at: monthIndex(p.milestones[m.id]) + slip, slip };
  });
  const latest = raw.reduce((a, b) => (b.at > a.at ? b : a));
  return {
    deps: raw.map((d) => ({ ...d, slack: latest.at - d.at })),
    critical: latest.id,
    live: latest.at + p.commissioningMonths,
  };
}

/* ---------- Cost of delay ---------- */

/** What one month late costs: revenue not earned plus the carrying cost of capital that's built but idle. */
export function monthlyDelayCost(p: Phase, s: Settings) {
  const revenue =
    s.revenueBasis === "lease" ? phaseItMw(p) * 1000 * s.leasePerKwMonth : phaseGpus(p) * HOURS_PER_MONTH * s.utilization * s.gpuHourPrice;
  const carrying = (phaseItMw(p) * s.capexPerMw * 1e6 * s.costOfCapital) / 12;
  return { revenue, carrying, total: revenue + carrying };
}

export interface PhasePlan {
  phase: Phase;
  itMw: number;
  facilityMw: number;
  gpus: number;
  annualEnergy: number;
  base: Schedule;
  now: Schedule;
  /** Months later than planned, because of the slips */
  delay: number;
  monthly: ReturnType<typeof monthlyDelayCost>;
  delayCost: number;
}

export function plan(c: Campus, s: Settings, slips: Slips = {}): PhasePlan[] {
  return c.phases.map((p) => {
    const base = schedule(p);
    const now = schedule(p, slips);
    const monthly = monthlyDelayCost(p, s);
    const delay = Math.max(0, now.live - base.live);
    return {
      phase: p,
      itMw: phaseItMw(p),
      facilityMw: facilityMw(p, s),
      gpus: phaseGpus(p),
      annualEnergy: annualEnergyCost(p, s),
      base,
      now,
      delay,
      monthly,
      delayCost: delay * monthly.total,
    };
  });
}

/** Facility MW online each month, planned and with slips, from the first construction start to after the last go-live. */
export function capacityOverTime(plans: PhasePlan[]) {
  const from = Math.floor(Math.min(...plans.map((p) => monthIndex(p.phase.start))));
  const to = Math.ceil(Math.max(...plans.map((p) => Math.max(p.now.live, p.base.live)))) + 4;
  const out: { month: number; planned: number; now: number }[] = [];
  for (let m = from; m <= to; m++) {
    out.push({
      month: m,
      planned: plans.reduce((sum, p) => sum + (p.base.live <= m ? p.facilityMw : 0), 0),
      now: plans.reduce((sum, p) => sum + (p.now.live <= m ? p.facilityMw : 0), 0),
    });
  }
  return out;
}

export interface Risk {
  phaseId: string;
  phaseName: string;
  milestone: MilestoneId;
  /** Months go-live moves if this milestone slips by `bump` more months */
  delay: number;
  cost: number;
  slack: number;
}

/** Slip each milestone by `bump` months on top of today's slips, and rank by what it would cost. */
export function resolveFirst(c: Campus, s: Settings, slips: Slips = {}, bump = 3): Risk[] {
  const current = plan(c, s, slips);
  const out: Risk[] = [];
  for (const p of current) {
    for (const d of p.now.deps) {
      const key = `${p.phase.id}.${d.id}`;
      const bumped = schedule(p.phase, { ...slips, [key]: (slips[key] ?? 0) + bump });
      const delay = Math.max(0, bumped.live - p.now.live);
      out.push({ phaseId: p.phase.id, phaseName: p.phase.name, milestone: d.id, delay, cost: delay * p.monthly.total, slack: d.slack });
    }
  }
  return out.sort((a, b) => b.cost - a.cost || a.slack - b.slack);
}

export function formatMoney(n: number) {
  const a = Math.abs(n);
  const sign = n < -0.5 ? "−" : "";
  const fmt = (v: number, d: number) => v.toFixed(d).replace(/\.0+$/, "");
  if (a >= 1e9) return `${sign}$${fmt(a / 1e9, a >= 1e10 ? 1 : 2)}B`;
  if (a >= 1e6) return `${sign}$${fmt(a / 1e6, a >= 1e8 ? 0 : 1)}M`;
  if (a >= 1e3) return `${sign}$${Math.round(a / 1e3)}K`;
  return `${sign}$${Math.round(a)}`;
}

export const formatMw = (mw: number) => (mw >= 1000 ? `${(mw / 1000).toFixed(2).replace(/0$/, "")} GW` : `${Math.round(mw)} MW`);

/** "Grid energization" → "grid energization", but "GPUs delivered" keeps its capitals. */
export const lowerFirst = (s: string) => (/^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

/** 1 → "1 month", 1.5 → "1.5 months" */
export const months = (n: number) => `${n} month${n === 1 ? "" : "s"}`;
