import { describe, expect, it } from "vitest";
import { ANNUITY, altDefaults, necessity, readAlt, writeAlt } from "./necessity";
import { templateById } from "./roi";
import { DEFAULT_ASSUMPTIONS } from "./tco";

const support = templateById("support").inputs;
const run = (inputs = support, alt = altDefaults("support"), id: Parameters<typeof altDefaults>[0] = "support") => necessity(inputs, alt, DEFAULT_ASSUMPTIONS, 0.6, id);
const opt = (r: ReturnType<typeof run>, id: string) => r.options.find((o) => o.id === id)!;
const noAlternatives = { ...altDefaults("support"), redesignPct: 0, rulesCoverage: 0 };

describe("necessity test", () => {
  it("discounts 36 months at 10% a year", () => {
    // (1 − 1.1^−3) ÷ (1.1^(1/12) − 1)
    expect(ANNUITY).toBeCloseTo(31.19, 1);
  });

  it("prices each option by hand for the support template", () => {
    const r = run();
    const people = 20_000 * 8 * (40 / 60); // $106,667 a month today
    const redesign = opt(r, "redesign").cases.base;
    expect(redesign.freed).toBeCloseTo(people * 0.1, 6);
    expect(redesign.cash).toBeCloseTo(people * 0.1 * 0.5, 6);
    expect(redesign.npv).toBeCloseTo(-20_000 + people * 0.05 * ANNUITY, 4);
    const rules = opt(r, "rules").cases.base;
    expect(rules.cash).toBeCloseTo(people * 0.15 * 0.5 - 750, 6);
    // AI frees everything except escalations (40% of tasks, in full) and review (60% × 1 minute).
    const ai = opt(r, "ai").cases.base;
    expect(ai.freed).toBeCloseTo(people - 8_000 * 8 * (40 / 60) - 12_000 * 1 * (40 / 60), 6);
    expect(opt(r, "none").cases.base.npv).toBe(0);
  });

  it("invests when AI wins and survives the conservative case", () => {
    const r = run();
    expect(r.verdict).toBe("invest");
    expect(opt(r, "ai").cases.conservative.npv).toBeGreaterThan(0);
  });

  it("says don't use AI when rules automation creates more value", () => {
    const docs = templateById("documents").inputs;
    const r = run(docs, { ...altDefaults("documents"), rulesCoverage: 0.85 }, "documents");
    expect(r.verdict).toBe("no-ai");
    expect(r.instead).toBe("rules");
  });

  it("pilots when AI is positive in the base case only", () => {
    const r = run({ ...support, setupCost: 600_000 });
    expect(opt(r, "ai").cases.base.npv).toBeGreaterThan(0);
    expect(opt(r, "ai").cases.conservative.npv).toBeLessThan(0);
    expect(r.verdict).toBe("pilot");
  });

  it("defers when only the optimistic case pays, and rejects when none does", () => {
    expect(run({ ...support, setupCost: 900_000 }, noAlternatives).verdict).toBe("defer");
    expect(run({ ...support, setupCost: 2_000_000 }, noAlternatives).verdict).toBe("reject");
  });

  it("separates cash savings from freed capacity", () => {
    const full = opt(run(support, { ...altDefaults("support"), cashShare: 1 }), "ai").cases.base;
    const quarter = opt(run(support, { ...altDefaults("support"), cashShare: 0.25 }), "ai").cases.base;
    expect(full.freed).toBeCloseTo(quarter.freed, 6);
    expect(quarter.cash).toBeLessThan(full.cash);
    expect(full.capacityHours).toBe(0);
    expect(quarter.capacityHours).toBeGreaterThan(0);
  });

  it("marks rules automation unavailable when it covers nothing", () => {
    const coding = templateById("coding").inputs;
    expect(opt(run(coding, altDefaults("coding"), "coding"), "rules").available).toBe(false);
  });

  it("lists only the evidence still at template defaults", () => {
    const labels = (r: ReturnType<typeof run>) => r.missing.map((m) => m.label);
    expect(labels(run())).toContain("AI resolution rate");
    expect(labels(run({ ...support, aiSuccess: 0.7 }))).not.toContain("AI resolution rate");
    expect(labels(run(support, { ...altDefaults("support"), cashShare: 0.3 }))).not.toContain("Cash share");
  });

  it("round-trips the alternatives through the URL, writing only changes", () => {
    const params = new URLSearchParams();
    writeAlt(params, altDefaults("documents"), "documents");
    expect(params.toString()).toBe("");
    const changed = { ...altDefaults("documents"), rulesCoverage: 0.85, cashShare: 0.25 };
    writeAlt(params, changed, "documents");
    expect(readAlt(params, "documents")).toEqual(changed);
  });
});
