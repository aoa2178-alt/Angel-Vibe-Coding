import { describe, expect, it } from "vitest";
import { allocate } from "./allocate";
import { bullwhip } from "./bullwhip";
import { forecastWith, holtWinters, runForecast, score } from "./forecast";
import { DATA, PRODUCTS, history, productById } from "./products";
import { defaultScenario, readScenario, scenarioQuery } from "./scenario";
import { launchQuantity, normCdf, normInv, normLoss, supplyPlan } from "./supply";

const tablet = productById("tablet");
const server = productById("server");

describe("data", () => {
  it("has 120 months for each product, in order, with no gaps or negatives", () => {
    for (const p of PRODUCTS) {
      const pts = p.series.points;
      expect(pts).toHaveLength(120);
      expect(pts.every((x) => x.value >= 0)).toBe(true);
      for (let i = 1; i < pts.length; i++) {
        const [y0, m0] = pts[i - 1]!.month.split("-").map(Number) as [number, number];
        const [y1, m1] = pts[i]!.month.split("-").map(Number) as [number, number];
        expect(y1 * 12 + m1 - (y0 * 12 + m0)).toBe(1);
      }
    }
    expect(DATA.retrieved).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("rescales history so the last 12 months average the base volume", () => {
    const h = history(tablet).slice(-12);
    expect(h.reduce((a, x) => a + x.units, 0) / 12).toBeCloseTo(tablet.baseUnits);
  });
});

describe("forecast", () => {
  const y = Array.from({ length: 48 }, (_, t) => 100 + t + (t % 12 === 11 ? 50 : 0));

  it("seasonal naive repeats last year; moving average repeats the last three months", () => {
    expect(forecastWith("seasonal-naive", y, 3)).toEqual(y.slice(36, 39));
    expect(forecastWith("moving-average", y, 2)).toEqual([(y[45]! + y[46]! + y[47]!) / 3, (y[45]! + y[46]! + y[47]!) / 3]);
  });

  it("Holt-Winters tracks a trend with a season", () => {
    const f = holtWinters(y, 12).forecast;
    // December spike shows up, and the level keeps rising
    expect(f[11]! - f[10]!).toBeGreaterThan(30);
    expect(f[10]!).toBeGreaterThan(y[46]!);
  });

  it("scores WAPE and bias on the last 12 months", () => {
    const s = score("seasonal-naive", y);
    // Each month is 12 higher than the year before, so seasonal naive under-forecasts by 12 every month
    const actual = y.slice(-12).reduce((a, b) => a + b, 0);
    expect(s.wape).toBeCloseTo((12 * 12) / actual);
    expect(s.bias).toBeCloseTo(-(12 * 12) / actual);
    expect(s.rmse).toBeCloseTo(12);
  });

  it("picks the most accurate method unless one is chosen", () => {
    const r = runForecast(history(tablet).map((x) => x.units));
    expect(r.scores.find((s) => s.method === r.best)!.wape).toBe(Math.min(...r.scores.map((s) => s.wape)));
    expect(runForecast(history(tablet).map((x) => x.units), "moving-average").method).toBe("moving-average");
  });
});

describe("supply plan", () => {
  it("has accurate normal helpers", () => {
    expect(normInv(0.95)).toBeCloseTo(1.6449, 3);
    expect(normCdf(1.6449)).toBeCloseTo(0.95, 3);
    expect(normLoss(0)).toBeCloseTo(0.3989, 3);
  });

  it("sets safety stock, EOQ and reorder point by hand", () => {
    const s = { ...tablet.defaults, leadMonths: 3, serviceLevel: 0.95, holdPerMonth: 0.02, unitCost: 300, orderCost: 50_000 };
    const p = supplyPlan(Array(12).fill(10_000), 1_000, s);
    expect(p.safetyStock).toBeCloseTo(normInv(0.95) * 1_000 * 2);
    // EOQ = √(2 × 120,000 × 50,000 ÷ (300 × 0.02 × 12)) = √(166.7M) ≈ 12,910
    expect(p.eoq).toBeCloseTo(Math.sqrt((2 * 120_000 * 50_000) / 72));
    expect(p.reorderPoint).toBeCloseTo(30_000 + p.safetyStock);
  });

  it("projects inventory that balances: on hand changes by receipts − demand", () => {
    const f = history(tablet).slice(-12).map((x) => x.units);
    const p = supplyPlan(f, 5_000, tablet.defaults);
    let prev = p.safetyStock + p.eoq / 2;
    for (const m of p.months) {
      expect(m.endingInventory).toBeCloseTo(prev + m.receipts - m.demand);
      // After the lead time, planned receipts keep stock at or above safety stock
      if (m.index >= tablet.defaults.leadMonths) expect(m.endingInventory).toBeGreaterThanOrEqual(p.safetyStock - 1e-6);
      prev = m.endingInventory;
    }
    // Every planned receipt was ordered one lead time earlier
    const L = tablet.defaults.leadMonths;
    expect(p.months.slice(0, -L).map((m) => m.orders)).toEqual(p.months.slice(L).map((m) => m.receipts));
  });

  it("costs more inventory and less shortage as the service level rises", () => {
    const f = Array(12).fill(10_000);
    const low = supplyPlan(f, 2_000, { ...tablet.defaults, serviceLevel: 0.9 });
    const high = supplyPlan(f, 2_000, { ...tablet.defaults, serviceLevel: 0.99 });
    expect(high.holdingCost).toBeGreaterThan(low.holdingCost);
    expect(high.shortageCost).toBeLessThan(low.shortageCost);
    expect(high.fillRate).toBeGreaterThan(low.fillRate);
  });

  it("builds the newsvendor launch quantity at the critical ratio", () => {
    const l = launchQuantity([10_000, 10_000, 10_000], 1_000, { ...tablet.defaults, price: 500, unitCost: 300, salvageShare: 0.5 });
    expect(l.criticalRatio).toBeCloseTo(200 / (200 + 150));
    expect(l.quantity).toBeCloseTo(30_000 + normInv(200 / 350) * 1_000 * Math.sqrt(3));
  });
});

describe("allocation", () => {
  it("fair share gives every region the same fill rate", () => {
    const a = allocate(tablet, tablet.defaults, 100_000, 70_000, "proportional");
    for (const r of a.regions) expect(r.fillRate).toBeCloseTo(0.7);
  });

  it("priority fills in order, and most-margin fills the best region first", () => {
    const pr = allocate(tablet, tablet.defaults, 100_000, 70_000, "priority", ["apac", "americas", "emea"]);
    expect(pr.regions.find((r) => r.id === "apac")!.fillRate).toBe(1);
    expect(pr.regions.find((r) => r.id === "americas")!.fillRate).toBe(1);
    expect(pr.regions.find((r) => r.id === "emea")!.allocated).toBeCloseTo(0);
    const mg = allocate(tablet, tablet.defaults, 100_000, 70_000, "margin");
    expect(mg.regions.find((r) => r.id === "emea")!.fillRate).toBe(1);
    expect(mg.margin).toBeGreaterThanOrEqual(allocate(tablet, tablet.defaults, 100_000, 70_000, "proportional").margin);
  });

  it("fills everyone when supply covers demand", () => {
    const a = allocate(server, server.defaults, 1_500, 2_000, "margin");
    for (const r of a.regions) expect(r.fillRate).toBe(1);
    expect(a.marginLost).toBeCloseTo(0);
  });
});

describe("bullwhip", () => {
  const demand = history(tablet).map((x) => x.units);

  it("amplifies variability at every tier up the chain", () => {
    const r = bullwhip(demand, { leadMonths: 2, window: 4, share: false });
    expect(r.ratios[0]!).toBeGreaterThan(1);
    for (let i = 1; i < r.ratios.length; i++) expect(r.ratios[i]!).toBeGreaterThan(r.ratios[i - 1]!);
  });

  it("shrinks when every tier sees customer demand", () => {
    const off = bullwhip(demand, { leadMonths: 2, window: 4, share: false });
    const on = bullwhip(demand, { leadMonths: 2, window: 4, share: true });
    expect(on.ratios.at(-1)!).toBeLessThan(off.ratios.at(-1)!);
  });
});

describe("scenario links", () => {
  it("round-trips a full scenario", () => {
    const s = {
      ...defaultScenario("server"),
      settings: { ...server.defaults, serviceLevel: 0.99, leadMonths: 8 },
      method: "holt-winters" as const,
      cut: 0.4,
      rule: "priority" as const,
      order: ["emea", "apac", "americas"] as ("americas" | "emea" | "apac")[],
      bullwhip: { leadMonths: 3, window: 6, share: true },
    };
    expect(readScenario(scenarioQuery(s))).toEqual(s);
    expect(scenarioQuery(defaultScenario("tablet"))).toBe("?p=tablet");
  });
});
