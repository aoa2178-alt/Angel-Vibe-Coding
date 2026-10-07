import { describe, expect, it } from "vitest";
import { DEFAULT_EXPANSION as E, expansion } from "./expansion";
import { campusById, defaultSettings, type Campus } from "./model";

const crusoe = campusById("crusoe-abilene");
const s = defaultSettings(crusoe);

describe("build it all now, or phase it", () => {
  it("doesn't apply to a one-phase campus", () => {
    const one: Campus = { ...crusoe, phases: [crusoe.phases[0]!] };
    expect(expansion(one, s, E).applies).toBe(false);
  });

  it("brings the later phases live sooner when built now", () => {
    const r = expansion(crusoe, s, E);
    // Phase 2 started 9 months after phase 1 (June 2024 → March 2025)
    expect(r.monthsEarlier).toBeCloseTo(9, 0);
  });

  it("weighs strong and weak demand by their chances", () => {
    const r = expansion(crusoe, s, E);
    expect(r.allNow.expected).toBeCloseTo(E.pStrong * r.allNow.strong + (1 - E.pStrong) * r.allNow.weak);
    expect(r.phased.expected).toBeCloseTo(E.pStrong * r.phased.strong + (1 - E.pStrong) * r.phased.weak);
    // Strong demand rewards building now; weak demand rewards waiting
    expect(r.allNow.strong).toBeGreaterThan(r.phased.strong);
    expect(r.allNow.weak).toBeLessThan(r.phased.weak);
  });

  it("finds the chance of strong demand where both are worth the same", () => {
    const r = expansion(crusoe, s, E);
    const p = r.breakEvenP!;
    expect(p).toBeGreaterThan(0);
    expect(p).toBeLessThan(1);
    const at = expansion(crusoe, s, { ...E, pStrong: p });
    expect(at.advantage / Math.abs(at.allNow.expected)).toBeCloseTo(0, 6);
    expect(expansion(crusoe, s, { ...E, pStrong: 1 }).advantage).toBeGreaterThan(0);
    expect(expansion(crusoe, s, { ...E, pStrong: 0 }).advantage).toBeLessThan(0);
  });
});
