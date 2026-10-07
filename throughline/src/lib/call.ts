// "The call" for Throughline: the supply plan to sign this month, the allocation rule to agree before supply runs short,
// and the upstream and delivery fixes, with checks on what would change them.
import { RULES, allocate, type Rule } from "./allocate";
import { bullwhip } from "./bullwhip";
import { MODES, byMode } from "./delivery";
import { productById } from "./products";
import { run } from "./run";
import type { Scenario } from "./scenario";
import { serviceCurve } from "./supply";

/** No region should get less than this share of what it ordered: the line between "prioritize" and "abandon". */
export const FAIRNESS_FLOOR = 0.5;

/** The service level with the lowest total cost (holding + ordering + expected shortages). */
export function bestServiceLevel(forecast: number[], sigma: number, s: Scenario["settings"]) {
  return serviceCurve(forecast, sigma, s).reduce((a, b) => (b.total < a.total ? b : a));
}

/** The most margin without leaving any region below the fairness floor; fair share if nothing else qualifies. */
export function bestRule(s: Scenario, cut = s.cut) {
  const r = run(s);
  const p = productById(s.productId);
  const options = RULES.map((x) => {
    const a = allocate(p, s.settings, r.nextDemand, r.nextDemand * (1 - cut), x.id as Rule, s.order);
    return { rule: x, margin: a.margin, minFill: Math.min(...a.regions.map((g) => g.fillRate)) };
  });
  const fair = options.filter((o) => o.minFill >= FAIRNESS_FLOOR);
  const pick = (fair.length ? fair : options.filter((o) => o.rule.id === "proportional")).reduce((a, b) => (b.margin > a.margin ? b : a));
  const most = options.reduce((a, b) => (b.margin > a.margin ? b : a));
  return { pick, most, options };
}

export function planCall(s: Scenario) {
  const r = run(s);
  const best = bestServiceLevel(r.fc.forecast, r.fc.sigma, s.settings);
  const current = serviceCurve(r.fc.forecast, r.fc.sigma, s.settings).find((x) => Math.abs(x.serviceLevel - s.settings.serviceLevel) < 1e-9) ?? null;
  const rule = bestRule(s);
  const shared = bullwhip(r.units, { ...s.bullwhip, share: true }).ratios.at(-1)!;
  const notShared = bullwhip(r.units, { ...s.bullwhip, share: false }).ratios.at(-1)!;
  const ship = byMode(s.ship);
  const modes = MODES.map((m) => ({ mode: m, ...byMode(m) }));
  const bestMode = modes.reduce((a, b) => (b.lateRate < a.lateRate ? b : a));

  const level = (sc: Scenario, sigmaMult = 1) => bestServiceLevel(r.fc.forecast, r.fc.sigma * sigmaMult, sc.settings).serviceLevel;
  const checks = [
    { label: "Forecast error is 50% bigger than measured", sl: level(s, 1.5) },
    { label: "Supplier lead time is two months longer", sl: level({ ...s, settings: { ...s.settings, leadMonths: s.settings.leadMonths + 2 } }) },
    { label: "Holding stock costs twice as much", sl: level({ ...s, settings: { ...s.settings, holdPerMonth: s.settings.holdPerMonth * 2 } }) },
  ].map((c) => ({ label: c.label, holds: c.sl === best.serviceLevel, outcome: `plan for a ${(c.sl * 100).toFixed(1)}% service level instead.` }));
  const deeper = bestRule(s, Math.min(0.9, s.cut + 0.2));
  checks.push({
    label: `Supply falls ${Math.round((s.cut + 0.2) * 100)}% short instead of ${Math.round(s.cut * 100)}%`,
    holds: deeper.pick.rule.id === rule.pick.rule.id,
    outcome: `switch to the ${deeper.pick.rule.label.toLowerCase()} rule.`,
  });
  return { r, best, current, rule, shared, notShared, ship, bestMode, checks };
}
