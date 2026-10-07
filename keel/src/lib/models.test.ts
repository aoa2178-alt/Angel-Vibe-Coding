import { describe, expect, it } from "vitest";
import { INITIATIVES, applyEffects, fund, score } from "./initiatives";
import { DEFAULT_SETTINGS as S, MONTHS, okrs, planPaths, simulate, total } from "./model";
import { ACTUALS, actualPaths, actualsThrough, bridge, driverRows, reforecastPaths, status } from "./review";
import { DEFAULT_SCENARIO, readScenario, scenarioQuery } from "./scenario";

const plan = planPaths(S);
const year = simulate(plan, S);

describe("the plan", () => {
  it("builds API revenue from developers × tokens × price", () => {
    // Month 1: 50,000 developers × 100M tokens × $4 per M = $20M
    expect(year[0]!.apiRevenue).toBeCloseTo(50_000 * 100 * 4);
    expect(year[0]!.apiCompute).toBeCloseTo(50_000 * 100 * 1.6);
    expect(year[1]!.apiRevenue).toBeCloseTo(50_000 * 1.04 * 100 * 4);
  });

  it("converts pipeline × win rate into new ARR, capped by what the reps can close", () => {
    // $30M × 25% = $7.5M; 60 ramped reps × $2.4M × 80% ÷ 12 = $9.6M, so pipeline binds
    expect(year[0]!.capacity).toBeCloseTo((60 * 2.4e6 * 0.8) / 12);
    expect(year[0]!.newArr).toBeCloseTo(7.5e6);
    expect(year[0]!.arr).toBeCloseTo(300e6 * (1 - 0.01 + 0.015) + 7.5e6);
    const thin = simulate(planPaths({ ...S, reps: 10, hiresPerMonth: 0 }), { ...S, reps: 10, hiresPerMonth: 0 });
    expect(thin[0]!.newArr).toBeCloseTo((10 * 2.4e6 * 0.8) / 12);
  });

  it("ramps new reps linearly over the ramp period", () => {
    // Month 1 hires count 0; by month 5 (4 months later) they count fully
    expect(year[0]!.rampedReps).toBeCloseTo(60);
    expect(year[4]!.rampedReps).toBeCloseTo(60 + 2 * (4 / 4) + 2 * (3 / 4) + 2 * (2 / 4) + 2 * (1 / 4) + 0);
  });

  it("adds opex up from people and programs", () => {
    const reps = plan.reps[0]!;
    expect(year[0]!.opex).toBeCloseTo((reps * 300_000 + reps * 1.5 * 220_000) / 12 + 3e6);
  });

  it("sets OKR targets from the plan, so the plan is on target by definition", () => {
    for (const kr of okrs(year, plan)) expect(kr.measure(year, plan)).toBeCloseTo(kr.target);
  });
});

describe("the review", () => {
  it("has fixed actuals that don't depend on the plan you edit", () => {
    expect(actualPaths()).toEqual(ACTUALS);
    expect(actualsThrough(6, planPaths({ ...S, winRate: 0.3 })).winRate.slice(0, 6)).toEqual(ACTUALS.winRate.slice(0, 6));
  });

  it("rates status green within 5%, amber within 10%, red beyond, and better-than-plan as green", () => {
    expect(status(97, 100)).toBe("green");
    expect(status(92, 100)).toBe("amber");
    expect(status(85, 100)).toBe("red");
    expect(status(120, 100)).toBe("green");
    expect(status(1.12, 1, false)).toBe("red");
  });

  it("splits the variance into driver effects that add up exactly", () => {
    for (const n of [3, 6, 12]) {
      const steps = bridge(n, plan, S);
      const actual = total(simulate(actualsThrough(n, plan), S), "revenue", n);
      const planned = total(year, "revenue", n);
      expect(steps.reduce((a, x) => a + x.effect, 0)).toBeCloseTo(actual - planned, 0);
    }
  });

  it("tells the story: developers ahead of plan, win rate and price behind", () => {
    const rows = driverRows(6, plan);
    expect(rows.find((r) => r.id === "developers")!.status).toBe("green");
    expect(rows.find((r) => r.id === "winRate")!.status).toBe("red");
    expect(rows.find((r) => r.id === "pricePerM")!.actual).toBeLessThan(rows.find((r) => r.id === "pricePerM")!.plan);
  });

  it("re-forecasts with actuals to date, then today's run-rate", () => {
    const f = reforecastPaths(6, plan, S);
    expect(f.winRate.slice(0, 6)).toEqual(ACTUALS.winRate.slice(0, 6));
    expect(f.winRate[11]).toBe(ACTUALS.winRate[5]);
    expect(f.developers[6]).toBeCloseTo(ACTUALS.developers[5]! * (1 + S.devGrowth));
  });
});

describe("initiatives", () => {
  const scored = score(6, plan, S);

  it("values each one by the revenue it adds after its delay, times its confidence", () => {
    const base = reforecastPaths(6, plan, S);
    const i = INITIATIVES.find((x) => x.id === "dealdesk")!;
    const upside = total(simulate(applyEffects(base, i.effects, 7), S), "revenue") - total(simulate(base, S), "revenue");
    const s = scored.find((x) => x.initiative.id === "dealdesk")!;
    expect(s.upside).toBeCloseTo(upside);
    expect(s.expected).toBeCloseTo(upside * 0.6);
  });

  it("funds the best set within the budget and headcount", () => {
    const p = fund(scored, 8e6, 15);
    expect(p.cost).toBeLessThanOrEqual(8e6);
    expect(p.headcount).toBeLessThanOrEqual(15);
    // No single cut initiative could be added without breaking a limit, or it would have been funded
    for (const c of p.cut) {
      const fits = p.cost + c.initiative.cost <= 8e6 && p.headcount + c.initiative.headcount <= 15;
      if (fits) expect(c.expected).toBeLessThanOrEqual(0);
    }
    // More budget never funds less value
    expect(fund(scored, 20e6, 40).expected).toBeGreaterThanOrEqual(p.expected);
    expect(fund(scored, 0, 0).funded.every((x) => x.initiative.cost === 0 && x.initiative.headcount === 0)).toBe(true);
  });
});

describe("scenario links", () => {
  it("round-trips, and stays short when nothing changed", () => {
    const s = { ...DEFAULT_SCENARIO, settings: { ...S, winRate: 0.3, hiresPerMonth: 3 }, month: 9, budget: 12e6, people: 20 };
    expect(readScenario(scenarioQuery(s))).toEqual(s);
    expect(scenarioQuery(DEFAULT_SCENARIO)).toBe("");
    expect(MONTHS).toBe(12);
  });
});
