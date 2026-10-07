// Joins and totals: sites by state and owner, each state's power price and grid region, and the DEA site scores.
import { MAP, PRICES, REGIONS, SITES, STATE_REGION, mwAt, ownerGroup, type Site } from "./data";
import { dea, type DeaResult, type Unit } from "./dea";

export type Sector = "industrial" | "commercial";

/** Sites matching an owner filter ("all", one of OWNERS, or "Others"). */
export const sitesFor = (owner: string, sites: Site[] = SITES) => (owner === "all" ? sites : sites.filter((s) => ownerGroup(s.owner) === owner));

export interface StateTotal {
  code: string;
  mw: number;
  sites: number;
}

/** Facility MW and site count per state on a date (sites drawing no power yet don't count). */
export function byState(date: string, owner = "all"): Map<string, StateTotal> {
  const out = new Map<string, StateTotal>();
  for (const s of sitesFor(owner)) {
    const mw = mwAt(s, date);
    if (mw <= 0) continue;
    const t = out.get(s.state) ?? { code: s.state, mw: 0, sites: 0 };
    t.mw += mw;
    t.sites += 1;
    out.set(s.state, t);
  }
  return out;
}

/** Facility MW per owner group on a date. */
export function byOwner(date: string) {
  const out = new Map<string, number>();
  for (const s of SITES) out.set(ownerGroup(s.owner), (out.get(ownerGroup(s.owner)) ?? 0) + mwAt(s, date));
  return [...out.entries()].map(([owner, mw]) => ({ owner, mw })).sort((a, b) => b.mw - a.mw);
}

export const totalMw = (date: string, owner = "all") => sitesFor(owner).reduce((sum, s) => sum + mwAt(s, date), 0);

/** Quarter-start dates from one year to another, for the "power online over time" line. */
export function quarterDates(from = 2023, to = 2029) {
  const out: string[] = [];
  for (let y = from; y <= to; y++) for (const m of ["01", "04", "07", "10"]) out.push(`${y}-${m}-01`);
  return out.filter((d) => d <= `${to}-01-01`);
}

export interface StateRow {
  code: string;
  name: string;
  price: number | null;
  region: string | null;
  /** Share of the state's interconnection requests in its main region (1 = all in one region) */
  regionShare: number | null;
  wait: number | null;
  queueGw: number | null;
}

export type WaitKey = "waitYears" | "p25" | "p75";

/** Every mapped state with its power price (cents/kWh, year to date) and its main grid region's connection wait. */
export function stateRows(sector: Sector, wait: WaitKey = "waitYears"): StateRow[] {
  return MAP.states
    .filter((s) => s.code)
    .map((s) => {
      const r = STATE_REGION[s.code];
      const region = r ? REGIONS[r.region] : undefined;
      return {
        code: s.code,
        name: s.name,
        price: PRICES.states[s.code]?.[sector] ?? null,
        region: r?.region ?? null,
        regionShare: r?.share ?? null,
        wait: region?.[wait] ?? null,
        queueGw: region?.activeGw ?? null,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** DEA units: states with both a price and a wait (no wait figure for New England; Alaska and Hawaii aren't in LBNL's data). */
export function deaUnits(sector: Sector, wait: WaitKey = "waitYears", exclude: string[] = []): Unit[] {
  return stateRows(sector, wait)
    .filter((r) => r.price !== null && r.wait !== null && !exclude.includes(r.code))
    .map((r) => ({ id: r.code, x1: r.price!, x2: r.wait! }));
}

export function siteScores(sector: Sector, wait: WaitKey = "waitYears", exclude: string[] = []): { units: Unit[]; results: DeaResult[] } {
  const units = deaUnits(sector, wait, exclude);
  return { units, results: dea(units) };
}

/** Power-weighted average of a per-state value over where AI power sits on a date. */
export function powerWeighted(date: string, value: (code: string) => number | null) {
  let num = 0;
  let den = 0;
  for (const t of byState(date).values()) {
    const v = value(t.code);
    if (v === null) continue;
    num += v * t.mw;
    den += t.mw;
  }
  return den ? num / den : null;
}
