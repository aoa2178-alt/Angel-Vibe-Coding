// A Loadline scenario lives in the URL: the campus, any slipped milestones, and any changed assumptions.
// Only what differs from the campus's defaults is written, so links stay short; anything unreadable is ignored.
import { DEFAULT_EXPANSION, type ExpansionSettings } from "./expansion";
import { DEFAULT_HEDGE, type HedgeSettings } from "./hedge";
import { CAMPUSES, MILESTONES, campusById, defaultSettings, type Settings, type Slips } from "./model";

export interface Scenario {
  campusId: string;
  slips: Slips;
  settings: Settings;
  /** Step 3's long-lead hedging: supplier load, spares */
  hedge: HedgeSettings;
  /** Step 2's build-now-or-phase decision */
  expansion: ExpansionSettings;
}

const HEDGE_PARAMS: Record<keyof HedgeSettings, { param: string; min: number; max: number }> = {
  supplierLoad: { param: "fl", min: 0, max: 0.99 },
  buildMonths: { param: "fb", min: 0.1, max: 60 },
  variability: { param: "fv", min: 0, max: 20 },
  failShare: { param: "fp", min: 0, max: 1 },
  unitMw: { param: "fsz", min: 1, max: 2000 },
  priceM: { param: "fprice", min: 0, max: 1000 },
  valueKept: { param: "fkeep", min: 0, max: 1 },
};

const EXPANSION_PARAMS: Record<keyof ExpansionSettings, { param: string; min: number; max: number }> = {
  pStrong: { param: "dp", min: 0, max: 1 },
  weakShare: { param: "dw", min: 0, max: 1 },
  scaleSaving: { param: "scale", min: 0, max: 0.9 },
  horizonYears: { param: "yrs", min: 1, max: 40 },
};

function readNumbers<T extends object>(params: URLSearchParams, defaults: T, spec: Record<keyof T, { param: string; min: number; max: number }>): T {
  const out = { ...defaults };
  for (const [key, { param, min, max }] of Object.entries(spec) as [keyof T, { param: string; min: number; max: number }][]) {
    const raw = params.get(param);
    const n = raw === null || raw.trim() === "" ? NaN : Number(raw);
    if (Number.isFinite(n) && n >= min && n <= max) (out as Record<keyof T, number>)[key] = n;
  }
  return out;
}

function writeNumbers<T extends object>(params: URLSearchParams, value: T, defaults: T, spec: Record<keyof T, { param: string }>) {
  for (const [key, { param }] of Object.entries(spec) as [keyof T, { param: string }][]) {
    if (value[key] !== defaults[key]) params.set(param, String(value[key]));
  }
}

const NUMERIC: Record<Exclude<keyof Settings, "revenueBasis">, { param: string; min: number; max: number }> = {
  pricePerMwh: { param: "price", min: 0, max: 1000 },
  pue: { param: "pue", min: 1, max: 3 },
  loadFactor: { param: "load", min: 0.05, max: 1 },
  leasePerKwMonth: { param: "lease", min: 0, max: 2000 },
  gpuHourPrice: { param: "gpuhr", min: 0, max: 100 },
  utilization: { param: "util", min: 0.05, max: 1 },
  capexPerMw: { param: "capex", min: 0, max: 200 },
  costOfCapital: { param: "coc", min: 0, max: 0.5 },
};

export const MAX_SLIP = 24;

export function readScenario(search: string): Scenario {
  const params = new URLSearchParams(search);
  const campus = campusById(params.get("c") ?? CAMPUSES[0]!.id);
  const settings = defaultSettings(campus);
  for (const [key, { param, min, max }] of Object.entries(NUMERIC) as [keyof typeof NUMERIC, (typeof NUMERIC)[keyof typeof NUMERIC]][]) {
    const raw = params.get(param);
    const n = raw === null || raw.trim() === "" ? NaN : Number(raw);
    if (Number.isFinite(n) && n >= min && n <= max) settings[key] = n;
  }
  const basis = params.get("basis");
  if (basis === "lease" || basis === "gpu") settings.revenueBasis = basis;

  // Slips: "p1.gpus:3,p2.grid:1.5"
  const slips: Slips = {};
  const phaseIds = new Set(campus.phases.map((p) => p.id));
  const milestoneIds = new Set<string>(MILESTONES.map((m) => m.id));
  for (const part of (params.get("slip") ?? "").split(",")) {
    const [key, value] = part.split(":");
    const [phase, milestone] = (key ?? "").split(".");
    const n = Number(value);
    if (phase && milestone && phaseIds.has(phase) && milestoneIds.has(milestone) && Number.isFinite(n) && n > 0 && n <= MAX_SLIP) {
      slips[`${phase}.${milestone}`] = n;
    }
  }
  return {
    campusId: campus.id,
    slips,
    settings,
    hedge: readNumbers(params, DEFAULT_HEDGE, HEDGE_PARAMS),
    expansion: readNumbers(params, DEFAULT_EXPANSION, EXPANSION_PARAMS),
  };
}

export function scenarioQuery(s: Scenario) {
  const params = new URLSearchParams();
  params.set("c", s.campusId);
  const base = defaultSettings(campusById(s.campusId));
  for (const [key, { param }] of Object.entries(NUMERIC) as [keyof typeof NUMERIC, { param: string }][]) {
    if (s.settings[key] !== base[key]) params.set(param, String(s.settings[key]));
  }
  if (s.settings.revenueBasis !== base.revenueBasis) params.set("basis", s.settings.revenueBasis);
  const slips = Object.entries(s.slips)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}:${v}`)
    .join(",");
  if (slips) params.set("slip", slips);
  writeNumbers(params, s.hedge, DEFAULT_HEDGE, HEDGE_PARAMS);
  writeNumbers(params, s.expansion, DEFAULT_EXPANSION, EXPANSION_PARAMS);
  return `?${params.toString()}`;
}

/** Switching campus keeps nothing campus-specific: slips and assumptions start fresh. */
export const switchCampus = (id: string): Scenario => ({
  campusId: id,
  slips: {},
  settings: defaultSettings(campusById(id)),
  hedge: { ...DEFAULT_HEDGE },
  expansion: { ...DEFAULT_EXPANSION },
});
