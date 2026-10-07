// "The call" for Where AI Lives: which states to shortlist for the next AI data center, and whether that survives other
// reasonable ways of reading the data.
import { cents, stateName, years } from "./data";
import { frontier } from "./dea";
import { byState, siteScores, type Sector, type WaitKey } from "./metrics";

export function frontierOf(sector: Sector, wait: WaitKey = "waitYears", exclude: string[] = []) {
  const { units, results } = siteScores(sector, wait, exclude);
  return frontier(units, results).map((u) => u.id);
}

export function siteCall(sector: Sector, at: string) {
  const { units, results } = siteScores(sector);
  const front = frontier(units, results);
  const totals = byState(at);
  const scored = units.map((u, k) => ({ unit: u, result: results[k]!, mw: totals.get(u.id)?.mw ?? 0 }));
  const hubs = scored.filter((p) => p.mw > 0).sort((a, b) => b.mw - a.mw).slice(0, 5);
  const worstHub = hubs.reduce<(typeof hubs)[number] | null>((lo, p) => (!lo || p.result.theta < lo.result.theta ? p : lo), null);
  const base = front.map((u) => u.id).sort().join(",");
  const same = (ids: string[]) => ids.slice().sort().join(",") === base;
  const named = (ids: string[]) => ids.map(stateName).join(" and ");

  const alt = [
    { label: "Use commercial instead of industrial prices", ids: frontierOf(sector === "industrial" ? "commercial" : "industrial") },
    { label: "Judge each region by its slower projects (75th-percentile wait)", ids: frontierOf(sector, "p75") },
    { label: "Judge each region by its faster projects (25th-percentile wait)", ids: frontierOf(sector, "p25") },
    ...front.map((u) => ({ label: `Rule out ${stateName(u.id)} (e.g. a grid-reliability or permitting concern)`, ids: frontierOf(sector, "waitYears", [u.id]), dropped: u.id })),
  ];
  // Ruling out a frontier state always changes the list, so those checks report who takes its place.
  const checks = alt.map((x) => ({ label: x.label, holds: !("dropped" in x) && same(x.ids), outcome: `the frontier becomes ${named(x.ids)}.` }));
  const describe = (id: string) => {
    const u = units.find((x) => x.id === id)!;
    return `${stateName(id)} (${cents(u.x1)}/kWh, ${years(u.x2)})`;
  };
  // How often each state makes the frontier across the base case and the alternative readings (not the rule-outs).
  const runs = [front.map((u) => u.id), ...alt.filter((x) => !("dropped" in x)).map((x) => x.ids)];
  const count = new Map<string, number>();
  for (const ids of runs) for (const id of ids) count.set(id, (count.get(id) ?? 0) + 1);
  const shortlist = [...count.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({ id, n, of: runs.length }));
  return { front, hubs, worstHub, checks, describe, shortlist };
}
