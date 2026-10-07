import { describe, expect, it } from "vitest";
import { FAIRNESS_FLOOR, bestRule, bestServiceLevel, planCall } from "./call";
import { run } from "./run";
import { defaultScenario } from "./scenario";
import { serviceCurve } from "./supply";

describe("The call", () => {
  it("picks the service level with the lowest total cost on the curve", () => {
    const s = defaultScenario("server");
    const r = run(s);
    const best = bestServiceLevel(r.fc.forecast, r.fc.sigma, s.settings);
    for (const p of serviceCurve(r.fc.forecast, r.fc.sigma, s.settings)) expect(best.total).toBeLessThanOrEqual(p.total);
  });

  it("the shortage rule never leaves a region under the fairness floor when a fair option exists", () => {
    const s = defaultScenario("tablet");
    const { pick, options } = bestRule(s);
    if (options.some((o) => o.minFill >= FAIRNESS_FLOOR)) expect(pick.minFill).toBeGreaterThanOrEqual(FAIRNESS_FLOOR);
  });

  it("sharing demand data shrinks the supplier swing", () => {
    const c = planCall(defaultScenario("tablet"));
    expect(c.shared).toBeLessThan(c.notShared);
    expect(c.checks).toHaveLength(4);
  });
});
