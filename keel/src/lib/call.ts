// "The call" for Keel: what to fund, what to stop, and what to tell leadership about the gap that's left.
import { formatMoney } from "./model";
import { run } from "./run";
import type { Scenario } from "./scenario";

/** "Agent product beta" → "agent product beta", but "API tier" keeps its capitals. */
const lowerFirst = (x: string) => (/^[A-Z][A-Z]/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1));

export function opsCall(s: Scenario) {
  const r = run(s);
  const p = r.portfolio;
  const gap = Math.max(0, r.fy.gap);
  const closed = gap > 0 ? Math.min(1, p.expected / gap) : 1;
  const residual = Math.max(0, gap - p.expected);
  const drag = [...r.bridge].sort((a, b) => a.effect - b.effect)[0];
  // Cut initiatives that add (almost) nothing, and why.
  const noValue = p.cut.filter((x) => x.expected < 0.05 * x.initiative.cost);
  const ids = (sc: Scenario) => run(sc).portfolio.funded.map((x) => x.initiative.id).sort().join(",");
  const base = p.funded.map((x) => x.initiative.id).sort().join(",");
  const rerun = (label: string, sc: Scenario) => {
    const r2 = run(sc);
    const same = ids(sc) === base;
    const names = r2.portfolio.funded.map((x) => lowerFirst(x.initiative.name));
    return { label, holds: same, outcome: `fund ${names.length ? names.join(", ") : "nothing"} instead (${formatMoney(r2.portfolio.expected)} expected).` };
  };
  const checks = [
    rerun("The budget is cut by a quarter", { ...s, budget: s.budget * 0.75 }),
    rerun("The budget is a quarter bigger", { ...s, budget: s.budget * 1.25 }),
    rerun("We have five fewer people", { ...s, people: Math.max(0, s.people - 5) }),
    rerun("We decide three months later", { ...s, month: Math.min(11, s.month + 3) }),
  ];
  // What waiting costs: the same decision three months later recovers less, because initiatives have less of the year to work.
  const later = s.month < 11 ? run({ ...s, month: Math.min(11, s.month + 3) }).portfolio.expected : p.expected;
  return { r, p, gap, closed, residual, drag, noValue, checks, costOfWaiting: Math.max(0, p.expected - later) };
}
