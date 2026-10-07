import { describe, expect, it } from "vitest";
import { COMPANIES, SPENDERS, byTicker } from "./data";
import { back, headline, indexed, latestCommon, payoff, quarterRange, readThrough, total, ttm } from "./metrics";
import { calendarQuarter, deriveQuarters } from "./quarters.js";

describe("quarters from year-to-date filings", () => {
  it("maps period ends to calendar quarters across fiscal years", () => {
    expect(calendarQuarter("2026-03-31")).toBe("2026Q1"); // calendar-year companies
    expect(calendarQuarter("2026-06-30")).toBe("2026Q2"); // Microsoft's fiscal year end
    expect(calendarQuarter("2026-08-31")).toBe("2026Q3"); // Oracle's fiscal Q1
    expect(calendarQuarter("2026-04-26")).toBe("2026Q1"); // NVIDIA's fiscal Q1
  });

  it("derives Q2 = six months − Q1 and Q4 = full year − nine months, preferring direct three-month values", () => {
    const facts = [
      { start: "2025-07-01", end: "2025-09-30", val: 10, form: "10-Q", filed: "2025-10-30" },
      { start: "2025-07-01", end: "2025-12-31", val: 25, form: "10-Q", filed: "2026-01-30" },
      { start: "2025-07-01", end: "2026-03-31", val: 45, form: "10-Q", filed: "2026-04-30" },
      { start: "2026-01-01", end: "2026-03-31", val: 20, form: "10-Q", filed: "2026-04-30" },
      { start: "2025-07-01", end: "2026-06-30", val: 70, form: "10-K", filed: "2026-07-30" },
    ];
    const q = deriveQuarters(facts);
    expect(q.map((x) => [x.quarter, x.value])).toEqual([
      ["2025Q3", 10],
      ["2025Q4", 15],
      ["2026Q1", 20],
      ["2026Q2", 25],
    ]);
  });

  it("keeps the latest filing when a period is restated", () => {
    const q = deriveQuarters([
      { start: "2026-01-01", end: "2026-03-31", val: 10, form: "10-Q", filed: "2026-04-30" },
      { start: "2026-01-01", end: "2026-03-31", val: 12, form: "10-K", filed: "2027-02-01" },
    ]);
    expect(q[0]!.value).toBe(12);
  });
});

describe("the filings", () => {
  it("has ten companies with continuous quarters and no negative capex", () => {
    expect(COMPANIES).toHaveLength(10);
    for (const c of COMPANIES) {
      const qs = c.quarters.map((x) => x.quarter);
      expect(qs).toEqual(quarterRange(qs[0]!, qs.at(-1)!));
      expect(c.quarters.every((x) => x.capex === null || x.capex >= 0)).toBe(true);
    }
  });

  it("matches the filings on spot checks", () => {
    expect(byTicker("MSFT")!.quarters.find((x) => x.quarter === "2026Q1")!.capex).toBe(30_876);
    expect(byTicker("AMZN")!.quarters.find((x) => x.quarter === "2026Q2")!.capex).toBe(54_208);
  });
});

describe("metrics", () => {
  it("adds up totals, trailing twelve months and growth", () => {
    const q = latestCommon(SPENDERS);
    const h = headline();
    expect(h.capex).toBe(total(SPENDERS, q, "capex"));
    expect(h.ttmCapex).toBe([0, 1, 2, 3].reduce((a, i) => a + total(SPENDERS, back(q, i), "capex")!, 0));
    expect(h.yoy).toBeCloseTo(h.capex / total(SPENDERS, back(q, 4), "capex")! - 1);
    expect(h.runRate).toBe(h.capex * 4);
    expect(h.intensity).toBeCloseTo(h.ttmCapex / ttm(SPENDERS, q, "revenue")!);
    expect(h.fcf).toBeCloseTo(ttm(SPENDERS, q, "ocf")! - h.ttmCapex);
  });

  it("computes per-company payoff by hand", () => {
    const amzn = byTicker("AMZN")!;
    const q = "2026Q2";
    const p = payoff(amzn, q);
    expect(p.intensity).toBeCloseTo(ttm([amzn], q, "capex")! / ttm([amzn], q, "revenue")!);
    expect(p.capexToDa).toBeGreaterThan(1);
  });

  it("indexes to 100 at the base, and the read-through adds up", () => {
    const qs = quarterRange("2022Q4", "2026Q2");
    expect(indexed(SPENDERS, "capex", qs, "2022Q4")[0]).toBeCloseTo(100);
    const r = readThrough("2022Q4");
    expect(r.perDollar).toBeCloseTo(r.addedRevenue / r.addedCapex);
    expect(r.capexGrowth).toBeGreaterThan(0);
  });
});
