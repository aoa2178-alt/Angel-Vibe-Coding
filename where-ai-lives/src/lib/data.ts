// The data: AI data centers (Epoch AI), power prices (EIA), grid-connection waits (LBNL) and state shapes (us-atlas).
// Built by scripts/build-data.mjs; see the Sources page for licenses.
import gridJson from "@/data/grid.json";
import mapJson from "@/data/map.json";
import sitesJson from "@/data/sites.json";

export interface Site {
  name: string;
  owner: string;
  project: string | null;
  users: string | null;
  state: string;
  place: string;
  /** How the map point was found: the street address, the ZIP code's center, or the town */
  located: "address" | "zip" | "town";
  lon: number;
  lat: number;
  /** Position on the 975 × 610 Albers USA map */
  x: number;
  y: number;
  /** IT power today (Epoch's "current power"), MW */
  itMw: number;
  h100: number;
  /** Capital cost so far, 2025 $ billions */
  capexB: number;
  /** Facility power over time: [date, MW], a step at each change (Epoch's satellite and permit timeline) */
  series: [string, number][];
}

export interface PriceRow {
  commercial: number | null;
  industrial: number | null;
  commercialPrior: number | null;
  industrialPrior: number | null;
}

export interface Region {
  activeGw: number;
  /** Median years from interconnection request to operation, for plants that came online 2021–2025 */
  waitYears: number | null;
  p25: number | null;
  p75: number | null;
  n: number;
}

export interface MapState {
  code: string;
  name: string;
  d: string;
  cx: number;
  cy: number;
}

export const SITES = (sitesJson as unknown as { retrieved: string; sites: Site[] }).sites;
export const RETRIEVED = (sitesJson as { retrieved: string }).retrieved;

const grid = gridJson as unknown as {
  prices: { period: string; prior: string; unit: string; states: Record<string, PriceRow> };
  grid: { years: string; regions: Record<string, Region>; stateRegion: Record<string, { region: string; share: number }> };
};
export const PRICES = grid.prices;
export const REGIONS = grid.grid.regions;
export const STATE_REGION = grid.grid.stateRegion;
export const WAIT_YEARS = grid.grid.years;

export const MAP = mapJson as unknown as { width: number; height: number; states: MapState[]; borders: string };
export const stateName = (code: string) => MAP.states.find((s) => s.code === code)?.name ?? code;

/** Region labels as LBNL names them, spelled out once. */
export const REGION_LABEL: Record<string, string> = {
  ERCOT: "ERCOT (most of Texas)",
  PJM: "PJM (Mid-Atlantic and Ohio Valley)",
  MISO: "MISO (Midwest and Mississippi Valley)",
  SPP: "SPP (Great Plains)",
  CAISO: "CAISO (California)",
  NYISO: "NYISO (New York)",
  "ISO-NE": "ISO-NE (New England)",
  Southeast: "Southeast utilities (no ISO)",
  West: "West utilities (no ISO)",
};

/* ---------- Owners ---------- */

/** The owners shown as filters, biggest planned power first; everyone else is "Others". */
export const OWNERS = ["Oracle", "Meta", "Google", "Microsoft", "Amazon", "SpaceXAI", "QTS", "CoreWeave"] as const;
export const ownerLabel = (o: string) => (o === "SpaceXAI" ? "xAI (SpaceX)" : o);
export const ownerGroup = (o: string) => ((OWNERS as readonly string[]).includes(o) ? o : "Others");

/* ---------- Power over time ---------- */

/** Facility power (MW) a site draws on a date: the last timeline step on or before it. */
export function mwAt(site: Site, date: string) {
  let mw = 0;
  for (const [d, v] of site.series) {
    if (d > date) break;
    mw = v;
  }
  return mw;
}

/** Full planned facility power, and when the timeline says it arrives. */
export function planned(site: Site) {
  return site.series.reduce((best, [d, v]) => (v > best.mw ? { mw: v, date: d } : best), { mw: 0, date: "" });
}

/* ---------- Formatting ---------- */

export const formatMw = (mw: number) => (mw >= 1000 ? `${(mw / 1000).toFixed(mw >= 10_000 ? 0 : 1)} GW` : `${Math.round(mw)} MW`);
export const cents = (c: number | null) => (c === null ? "–" : `${c.toFixed(1)}¢`);
export const years = (y: number | null) => (y === null ? "–" : `${y.toFixed(1)} yrs`);
export const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;
/** "2027-11-11" → "Nov 2027" */
export function formatMonth(date: string) {
  const [y, m] = date.split("-");
  return `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][Number(m) - 1]} ${y}`;
}
