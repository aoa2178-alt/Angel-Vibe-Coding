import { describe, expect, it } from "vitest";
import { callOf, landingPlan } from "./call";
import { applyTemplate, planQuery, readPlan } from "./plan";
import { compare } from "./tco";

describe("The call", () => {
  it("values a switch from today's setup as the yearly cost difference", () => {
    const plan = { ...readPlan("?v=30000"), current: "api" as const };
    const c = callOf(plan);
    const costs = compare(plan.workload, plan.assumptions);
    expect(c.recommended).not.toBe("api");
    expect(c.versusToday).toBeCloseTo((costs.api.monthly - costs[c.recommended].monthly) * 12, 6);
    expect(c.versusToday!).toBeGreaterThan(0);
  });

  it("has no switch value when today's setup is unknown, none or a mix", () => {
    for (const current of [undefined, "none", "mix"] as const) expect(callOf({ ...readPlan("?v=2000"), current }).versusToday).toBeNull();
  });

  it("names the volume where the answer flips, and what wins beyond it", () => {
    const c = callOf(applyTemplate(readPlan(""), "support")); // 120M tokens: the API wins
    expect(c.cheapestId).toBe("api");
    const grow = c.volumeChecks.find((x) => x.label.startsWith("Volume grows"));
    expect(grow?.holds).toBe(false);
    expect(grow?.instead).not.toBe("api");
  });

  it("every check that fails names a different winner", () => {
    const c = callOf(readPlan("?v=2000"));
    for (const x of c.checks.filter((k) => !k.holds)) expect(x.instead).not.toBe(c.cheapestId);
  });

  it("each option has a three-step landing plan", () => {
    for (const id of ["api", "rent", "own"] as const) expect(landingPlan(id).map((s) => s.when)).toEqual(["First 30 days", "60 days", "90 days"]);
  });

  it("today's setup round-trips through the link", () => {
    const plan = { ...readPlan("?v=2000"), current: "rent" as const };
    expect(readPlan(planQuery(plan)).current).toBe("rent");
    expect(readPlan("?now=bogus").current).toBeUndefined();
  });
});
