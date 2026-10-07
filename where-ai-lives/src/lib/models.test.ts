import { describe, expect, it } from "vitest";
import { PRICES, REGIONS, SITES, STATE_REGION, mwAt, planned } from "./data";
import { dea, frontier, scoreOne } from "./dea";
import { byState, deaUnits, siteScores, stateRows, totalMw } from "./metrics";
import { DEFAULT_SCENARIO, readScenario, scenarioQuery } from "./scenario";

describe("DEA, by hand", () => {
  // A (2,8), B (4,4), C (8,2) sit on the frontier; D (6,6) is beaten by the mix ½B + ½C = (6,3)… and by B alone (4,4).
  const units = [
    { id: "A", x1: 2, x2: 8 },
    { id: "B", x1: 4, x2: 4 },
    { id: "C", x1: 8, x2: 2 },
    { id: "D", x1: 6, x2: 6 },
  ];
  const r = Object.fromEntries(dea(units).map((x) => [x.id, x]));

  it("frontier units score 1", () => {
    for (const id of ["A", "B", "C"]) {
      expect(r[id]!.theta).toBeCloseTo(1, 9);
      expect(r[id]!.efficient).toBe(true);
    }
  });

  it("a dominated unit scores below 1, at the radial projection onto the frontier", () => {
    // Ray from the origin through D (6,6) is the 45° line; it meets the frontier at B (4,4): θ = 4/6.
    expect(r.D!.theta).toBeCloseTo(2 / 3, 9);
    expect(r.D!.efficient).toBe(false);
    expect(r.D!.target.x1).toBeCloseTo(4, 9);
    expect(r.D!.peers.map((p) => p.id)).toEqual(["B"]);
  });

  it("the projection can land between two peers", () => {
    // E (5,7): the ray s·(5,7) meets segment A–B, (2+2t, 8−4t), where 2+2t = 5s and 8−4t = 7s → s = 12/17 ≈ 0.706.
    const e = scoreOne({ id: "E", x1: 5, x2: 7 }, [...units, { id: "E", x1: 5, x2: 7 }]);
    expect(e.theta).toBeCloseTo(12 / 17, 9);
    expect(e.peers.map((p) => p.id).sort()).toEqual(["A", "B"]);
    expect(e.peers.reduce((s, p) => s + p.weight, 0)).toBeCloseTo(1, 9);
  });

  it("weakly efficient units (same wait, higher price) are not on the frontier", () => {
    const res = dea([...units, { id: "F", x1: 10, x2: 2 }]);
    const f = res.find((x) => x.id === "F")!;
    expect(f.theta).toBeCloseTo(1, 9); // radially nothing shrinks it…
    expect(f.efficient).toBe(false); // …but C is cheaper at the same wait
    expect(frontier([...units, { id: "F", x1: 10, x2: 2 }], res).map((u) => u.id)).toEqual(["A", "B", "C"]);
  });

  it("rejects non-positive inputs", () => {
    expect(() => dea([{ id: "Z", x1: 0, x2: 1 }])).toThrow();
  });
});

describe("Data", () => {
  it("has the 77 US sites in Epoch's table, each with a state, map point and timeline", () => {
    expect(SITES).toHaveLength(77);
    for (const s of SITES) {
      expect(s.state).toMatch(/^[A-Z]{2}$/);
      expect(s.x).toBeGreaterThan(0);
      expect(s.x).toBeLessThan(975);
      expect(s.y).toBeGreaterThan(0);
      expect(s.y).toBeLessThan(610);
      expect(s.series.length).toBeGreaterThan(0);
    }
  });

  it("current IT power matches Epoch's column total, and H100s and cost are carried over", () => {
    expect(SITES.reduce((a, s) => a + s.itMw, 0)).toBeCloseTo(11851.3, 0);
    expect(SITES.reduce((a, s) => a + s.h100, 0)).toBe(12622040);
  });

  it("timelines step up to their planned power, and facility power is at least IT power today", () => {
    for (const s of SITES) {
      expect(planned(s).mw).toBeGreaterThanOrEqual(mwAt(s, "2026-10-07"));
      if (s.itMw > 0) expect(mwAt(s, "2026-10-07")).toBeGreaterThanOrEqual(s.itMw - 1);
    }
  });

  it("every state with a site has a power price and a grid region with a wait", () => {
    for (const st of new Set(SITES.map((s) => s.state))) {
      expect(PRICES.states[st]?.industrial, st).toBeGreaterThan(0);
      const region = STATE_REGION[st]?.region;
      expect(region, st).toBeTruthy();
      expect(REGIONS[region!]!.waitYears, st).toBeGreaterThan(0);
    }
  });

  it("Texas's industrial price matches EIA's table (6.72¢ year to date) and ERCOT is its region", () => {
    expect(PRICES.states.TX!.industrial).toBe(6.72);
    expect(STATE_REGION.TX!.region).toBe("ERCOT");
  });
});

describe("Totals and joins", () => {
  it("state totals add up to the national total on any date", () => {
    for (const d of ["2025-01-01", "2026-10-07", "2028-12-31"]) {
      const sum = [...byState(d).values()].reduce((a, t) => a + t.mw, 0);
      expect(sum).toBeCloseTo(totalMw(d), 6);
    }
  });

  it("the owner filter only keeps that owner's sites", () => {
    const meta = byState("2026-10-07", "Meta");
    const metaStates = new Set(SITES.filter((s) => s.owner === "Meta" && mwAt(s, "2026-10-07") > 0).map((s) => s.state));
    expect(new Set(meta.keys())).toEqual(metaStates);
  });

  it("DEA units are exactly the states with both a price and a wait", () => {
    const rows = stateRows("industrial");
    expect(deaUnits("industrial")).toHaveLength(rows.filter((r) => r.price !== null && r.wait !== null).length);
    const { results } = siteScores("industrial");
    expect(results.some((r) => r.efficient)).toBe(true);
    for (const r of results) expect(r.theta).toBeLessThanOrEqual(1 + 1e-9);
  });
});

describe("Scenario", () => {
  it("round-trips through the URL and keeps the default link empty", () => {
    expect(scenarioQuery(DEFAULT_SCENARIO)).toBe("");
    const s = { owner: "Meta", at: "2028-01-01", sector: "commercial" as const, state: "TX" };
    expect(readScenario(scenarioQuery(s))).toEqual(s);
  });

  it("ignores unreadable values", () => {
    expect(readScenario("?own=Nobody&at=2099-01-01&price=retail&st=ZZ")).toEqual(DEFAULT_SCENARIO);
  });
});

describe("The call", () => {
  it("reruns the frontier under each alternative reading and counts how often each state makes it", async () => {
    const { siteCall } = await import("./call");
    const c = siteCall("industrial", "2026-10-07");
    expect(c.checks).toHaveLength(3 + c.front.length);
    expect(c.shortlist[0]!.n).toBeLessThanOrEqual(c.shortlist[0]!.of);
    for (const f of c.front) expect(c.shortlist.some((x) => x.id === f.id)).toBe(true);
    // Ruling out a frontier state never "holds": the list always changes.
    expect(c.checks.filter((k) => k.label.startsWith("Rule out")).every((k) => !k.holds)).toBe(true);
  });
});
