// A Where AI Lives scenario lives in the URL: the owner filter, the date on the map, the power price used, and the
// state in focus. Only what differs from the defaults is written, so links stay short; anything unreadable is ignored.
import { MAP, OWNERS, RETRIEVED } from "./data";
import type { Sector } from "./metrics";

export interface Scenario {
  /** "all", one of OWNERS, or "Others" */
  owner: string;
  /** Map date, YYYY-MM-DD */
  at: string;
  sector: Sector;
  /** State code in focus, or "" */
  state: string;
}

export const DEFAULT_SCENARIO: Scenario = { owner: "all", at: RETRIEVED, sector: "industrial", state: "" };

export const DATE_MIN = "2023-01-01";
export const DATE_MAX = "2029-01-01";

export function readScenario(search: string): Scenario {
  const params = new URLSearchParams(search);
  const s = { ...DEFAULT_SCENARIO };
  const owner = params.get("own");
  if (owner && ([...OWNERS, "Others"] as string[]).includes(owner)) s.owner = owner;
  const at = params.get("at");
  if (at && /^\d{4}-\d{2}-\d{2}$/.test(at) && at >= DATE_MIN && at <= DATE_MAX) s.at = at;
  if (params.get("price") === "commercial") s.sector = "commercial";
  const st = params.get("st");
  if (st && MAP.states.some((m) => m.code === st)) s.state = st;
  return s;
}

export function scenarioQuery(s: Scenario) {
  const params = new URLSearchParams();
  if (s.owner !== DEFAULT_SCENARIO.owner) params.set("own", s.owner);
  if (s.at !== DEFAULT_SCENARIO.at) params.set("at", s.at);
  if (s.sector !== DEFAULT_SCENARIO.sector) params.set("price", s.sector);
  if (s.state) params.set("st", s.state);
  const q = params.toString();
  return q ? `?${q}` : "";
}
