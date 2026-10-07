import { describe, expect, it } from "vitest";
import {
  CLUSTER_PRESETS,
  DEFAULT_BRIDGE as B,
  bestStrategy,
  formatMoney,
  facilityKw,
  paysOffFrom,
  rentPremium,
  strategies,
  totalOver,
  winnerStretches,
} from "./speedToPower";
import { BRIDGE_METHODOLOGY } from "./bridgeMethodology";
import { readScenario, scenarioQuery } from "./speedToPowerShare";
import { DEFAULT_ASSUMPTIONS as A, ownCostPerGpuMonth } from "./tco";

const N = 10_240;
const s = strategies(N, A, B);

describe("speed to power", () => {
  it("sizes facility power from GPUs × kW × PUE", () => {
    // 1.3 kW × 1.3 PUE = 1.69 kW per GPU
    expect(CLUSTER_PRESETS.map((p) => Math.round(facilityKw(p.gpus, A)))).toEqual([1_731, 17_306, 173_056]);
  });

  it("prices waiting as renting the whole cluster instead of owning it", () => {
    expect(rentPremium(N, A)).toBeCloseTo(N * (730 * 2.5 - ownCostPerGpuMonth(A)), 0);
    expect(totalOver(s.wait, 24)).toBeCloseTo(24 * rentPremium(N, A), 0);
  });

  it("costs each bridge by hand at a 24-month delay", () => {
    const kwh = 17_305.6 * 730;
    const premium = rentPremium(N, A);
    // Service: rent 6 months, then pay $140 instead of $100 per MWh for 18 months
    expect(totalOver(s.service, 24)).toBeCloseTo(6 * premium + 18 * kwh * 0.04, -2);
    // Own gas: rent 18 months, then half the capex of 20% extra capacity, plus 6 months of fuel and O&M instead of grid power
    const genKw = 17_305.6 * 1.2;
    const perMonth = kwh * ((9_447 * 4) / 1e6 + 0.0057 - 0.1) + (genKw * 9.56) / 12;
    expect(totalOver(s.engines, 24)).toBeCloseTo(18 * premium + genKw * 1_606 * 0.5 + 6 * perMonth, -2);
    // Flexible grid: rent 12 months, then 4 hours of batteries at 30% of $280/kWh; grid power costs nothing extra
    expect(totalOver(s.flex, 24)).toBeCloseTo(12 * premium + 17_305.6 * 4 * 280 * 0.3, -2);
  });

  it("costs nothing extra when the grid is on time", () => {
    for (const id of ["wait", "service", "engines", "flex"] as const) expect(totalOver(s[id], 0)).toBe(0);
  });

  it("treats a bridge that isn't ready before the grid as plain renting", () => {
    expect(totalOver(s.engines, 12)).toBeCloseTo(totalOver(s.wait, 12), 0);
    expect(bestStrategy(s, 6)).toBe("wait");
  });

  it("at the defaults: rent, then bridge power from month 7, batteries from 70, your own gas at 72", () => {
    expect(winnerStretches(s)).toEqual([
      { fromMonth: 0, id: "wait" },
      { fromMonth: 7, id: "service" },
      { fromMonth: 70, id: "flex" },
      { fromMonth: 72, id: "engines" },
    ]);
    expect(paysOffFrom(s, "service")).toBe(7);
    expect(paysOffFrom(s, "engines")).toBe(22);
  });

  it("owned gas wins long waits when faster options aren't on offer", () => {
    const none = strategies(N, A, { ...B, serviceOffered: 0, flexOffered: 0 });
    expect(winnerStretches(none)).toEqual([
      { fromMonth: 0, id: "wait" },
      { fromMonth: 22, id: "engines" },
    ]);
  });

  it("round-trips a scenario through the URL, with calculator assumptions", () => {
    const scenario = { gpus: 2_048, bridge: { ...B, delayMonths: 36, flexOffered: 0 }, assumptions: { ...A, rentPerGpuHour: 3 } };
    expect(readScenario(scenarioQuery(scenario))).toEqual(scenario);
    expect(scenarioQuery(readScenario(""))).toBe("");
    expect(readScenario("?g=-4&d=999&flex_on=7").gpus).toBe(N);
  });
});

describe("speed to power methodology", () => {
  it("documents every setting with an https source", () => {
    const documented = new Set(BRIDGE_METHODOLOGY.flatMap((m) => m.keys));
    for (const key of Object.keys(B)) expect(documented.has(key as keyof typeof B), key).toBe(true);
    for (const m of BRIDGE_METHODOLOGY) {
      expect(m.sources.length, m.label).toBeGreaterThan(0);
      for (const src of m.sources) expect(src.url.startsWith("https://"), src.url).toBe(true);
    }
  });
});

describe("money format", () => {
  it("keeps big totals short and drops trailing zeros", () => {
    expect([437_552, 26_253_107, 50_000_000, 100_000_000, 1_050_124_288, -547_082].map(formatMoney)).toEqual([
      "$438K",
      "$26.3M",
      "$50M",
      "$100M",
      "$1.05B",
      "−$547K",
    ]);
  });
});
