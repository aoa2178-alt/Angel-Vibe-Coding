// Everything a page needs, computed once from the scenario: history, forecast, plan, launch, allocation and bullwhip.
import { allocate } from "./allocate";
import { bullwhip } from "./bullwhip";
import { HOLDOUT, runForecast } from "./forecast";
import { DATA, addMonths, history, productById } from "./products";
import type { Scenario } from "./scenario";
import { launchQuantity, serviceCurve, supplyPlan } from "./supply";

export function run(s: Scenario) {
  const product = productById(s.productId);
  const hist = history(product);
  const units = hist.map((h) => h.units);
  const fc = runForecast(units, s.method ?? undefined);
  const lastMonth = hist[hist.length - 1]!.month;
  const futureMonths = Array.from({ length: 12 }, (_, i) => addMonths(lastMonth, i + 1));
  const plan = supplyPlan(fc.forecast, fc.sigma, s.settings);
  const curve = serviceCurve(fc.forecast, fc.sigma, s.settings);
  const launch = launchQuantity(fc.forecast, fc.sigma, s.settings);
  const nextDemand = fc.forecast[0]!;
  const allocation = allocate(product, s.settings, nextDemand, nextDemand * (1 - s.cut), s.rule, s.order);
  const ripple = bullwhip(units, s.bullwhip);
  return {
    product,
    hist,
    units,
    fc,
    holdoutStart: hist.length - HOLDOUT,
    lastMonth,
    futureMonths,
    plan,
    curve,
    launch,
    nextDemand,
    allocation,
    ripple,
    retrieved: DATA.retrieved,
  };
}

export type Run = ReturnType<typeof run>;
