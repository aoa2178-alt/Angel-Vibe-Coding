// Everything a page needs, computed once from the scenario: the plan, the actuals and re-forecast as of the review
// month, the variance bridge, driver status, OKRs, and the initiative portfolio.
import { fund, score } from "./initiatives";
import { MONTH_NAMES, okrs, planPaths, simulate, total } from "./model";
import { actualsThrough, bridge, driverRows, reforecastPaths, status, type Status } from "./review";
import type { Scenario } from "./scenario";

export function run(s: Scenario) {
  const n = s.month;
  const planP = planPaths(s.settings);
  const plan = simulate(planP, s.settings);
  const actualP = actualsThrough(n, planP);
  const actual = simulate(actualP, s.settings);
  const forecastP = reforecastPaths(n, planP, s.settings);
  const forecast = simulate(forecastP, s.settings);
  const krs = okrs(plan, planP).map((k) => {
    const value = k.measure(forecast, forecastP);
    return { ...k, value, status: status(value, k.target, k.higherBetter) as Status };
  });
  const scored = score(n, planP, s.settings).sort((a, b) => b.expected - a.expected);
  const portfolio = fund(scored, s.budget, s.people);
  const planFy = total(plan, "revenue");
  const forecastFy = total(forecast, "revenue");
  return {
    n,
    monthName: MONTH_NAMES[n - 1]!,
    planP,
    plan,
    actual,
    forecastP,
    forecast,
    ytd: { plan: total(plan, "revenue", n), actual: total(actual, "revenue", n) },
    fy: { plan: planFy, forecast: forecastFy, gap: planFy - forecastFy },
    bridge: bridge(n, planP, s.settings),
    rows: driverRows(n, planP),
    krs,
    scored,
    portfolio,
  };
}

export type Run = ReturnType<typeof run>;

export const STATUS_WORD: Record<Status, string> = { green: "On track", amber: "Watch", red: "Off track" };
export const STATUS_COLOR: Record<Status, string> = { green: "var(--green)", amber: "var(--amber)", red: "var(--red)" };
