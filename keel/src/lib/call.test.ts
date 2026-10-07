import { describe, expect, it } from "vitest";
import { opsCall } from "./call";
import { DEFAULT_SCENARIO } from "./scenario";

describe("The call", () => {
  it("funds the best portfolio and says how much of the gap is left", () => {
    const c = opsCall(DEFAULT_SCENARIO);
    expect(c.p.funded.length).toBeGreaterThan(0);
    expect(c.residual).toBeCloseTo(Math.max(0, c.gap - c.p.expected), 6);
    expect(c.closed).toBeGreaterThan(0);
    expect(c.closed).toBeLessThanOrEqual(1);
  });

  it("flags initiatives that add almost nothing: more reps don't help when pipeline is the constraint", () => {
    const c = opsCall(DEFAULT_SCENARIO);
    expect(c.noValue.map((x) => x.initiative.id)).toContain("emea");
  });

  it("deciding later recovers less", () => {
    const c = opsCall(DEFAULT_SCENARIO);
    expect(c.costOfWaiting).toBeGreaterThan(0);
    expect(c.checks).toHaveLength(4);
  });
});
