// A Loadline scenario lives in the URL: the campus, any slipped milestones, and any changed assumptions.
// Only what differs from the campus's defaults is written, so links stay short; anything unreadable is ignored.
import { CAMPUSES, MILESTONES, campusById, defaultSettings, type Settings, type Slips } from "./model";

export interface Scenario {
  campusId: string;
  slips: Slips;
  settings: Settings;
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
  return { campusId: campus.id, slips, settings };
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
  return `?${params.toString()}`;
}

/** Switching campus keeps nothing campus-specific: slips and assumptions start fresh. */
export const switchCampus = (id: string): Scenario => ({ campusId: id, slips: {}, settings: defaultSettings(campusById(id)) });
