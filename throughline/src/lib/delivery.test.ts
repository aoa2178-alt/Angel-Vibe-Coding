import { describe, expect, it } from "vitest";
import { DELIVERY, MARKETS, MODES, REGION_MARKETS, byMode, combine, onTime, spread, topLateLanes, worstCategories } from "./delivery";

describe("delivery data (DataCo, CC BY 4.0)", () => {
  it("keeps every order: 180,519 across the market × mode cells, region cells, categories and modes", () => {
    const sum = (cells: { orders: number }[]) => cells.reduce((a, c) => a + c.orders, 0);
    expect(DELIVERY.totalOrders).toBe(180_519);
    expect(sum(DELIVERY.marketMode)).toBe(180_519);
    expect(sum(DELIVERY.regionMode)).toBe(180_519);
    expect(sum(DELIVERY.category)).toBe(180_519);
    expect(sum(DELIVERY.mode)).toBe(180_519);
    expect(DELIVERY.source.license).toBe("CC BY 4.0");
  });

  it("weights rates by orders", () => {
    const c = combine([
      { orders: 100, late: 90, daysLate: 100, cancelled: 0, sales: 1000, profit: 100 },
      { orders: 300, late: 30, daysLate: 0, cancelled: 0, sales: 3000, profit: 300 },
    ]);
    expect(c.lateRate).toBeCloseTo(120 / 400);
    expect(c.avgDaysLate).toBeCloseTo(0.25);
    expect(c.margin).toBeCloseTo(0.1);
  });

  it("finds that the shipping promise, not the market, drives lateness", () => {
    const s = spread();
    expect(s.modeRange).toBeGreaterThan(0.5);
    expect(s.marketRange).toBeLessThan(0.02);
    expect(byMode("First Class").lateRate).toBeGreaterThan(0.9);
    expect(byMode("Standard Class").lateRate).toBeLessThan(0.4);
  });

  it("maps every DataCo market to exactly one product region", () => {
    const mapped = Object.values(REGION_MARKETS).flat();
    expect([...mapped].sort()).toEqual([...MARKETS].sort());
    for (const m of MODES) {
      const total = (["americas", "emea", "apac"] as const).reduce((a, r) => a + onTime(r, m).orders, 0);
      expect(total).toBe(byMode(m).orders);
    }
  });

  it("ranks lanes and categories", () => {
    const lanes = topLateLanes(5);
    for (let i = 1; i < lanes.length; i++) expect(lanes[i]!.late).toBeLessThanOrEqual(lanes[i - 1]!.late);
    const cats = worstCategories(5);
    expect(cats.every((c) => c.orders >= 1000)).toBe(true);
    for (let i = 1; i < cats.length; i++) expect(cats[i]!.lateRate).toBeLessThanOrEqual(cats[i - 1]!.lateRate);
  });
});
