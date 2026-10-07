import { describe, expect, it } from "vitest";
import { DEFAULT_HEDGE as H, leadTime, poissonCdf, spares, transformerUnits } from "./hedge";
import { campusById, defaultSettings, facilityMw, monthlyDelayCost } from "./model";

const crusoe = campusById("crusoe-abilene");
const s = defaultSettings(crusoe);

describe("why transformers take years", () => {
  it("is Kingman's VUT at one station", () => {
    // 90% busy, variability 1: wait 9 × build time, plus the build itself = 10 × 3 months
    expect(leadTime(3, 0.9, 1)).toBeCloseTo(30);
    // 70% busy: 3 × (7/3 + 1) = 10 months
    expect(leadTime(3, 0.7, 1)).toBeCloseTo(10);
    expect(leadTime(3, 0.9, 2)).toBeCloseTo(57);
    expect(leadTime(3, 1)).toBe(Infinity);
  });
});

describe("how many spares", () => {
  it("adds up Poisson probabilities by hand", () => {
    expect(poissonCdf(0, 0.5)).toBeCloseTo(Math.exp(-0.5));
    expect(poissonCdf(1, 0.5)).toBeCloseTo(Math.exp(-0.5) * 1.5);
    expect(poissonCdf(-1, 0.5)).toBe(0);
  });

  it("counts transformers per phase from facility power", () => {
    const units = transformerUnits(crusoe, s, 90);
    crusoe.phases.forEach((p, i) => expect(units[i]).toBe(Math.ceil(facilityMw(p, s) / 90)));
  });

  it("prices a shortage at the campus's cost per month late × the lead time, per unit", () => {
    const r = spares(crusoe, s, H);
    const monthly = crusoe.phases.reduce((n, p) => n + monthlyDelayCost(p, s).total, 0);
    expect(r.leadMonths).toBeCloseTo(30);
    expect(r.underage).toBeCloseTo((monthly * 30) / r.units);
    expect(r.overage).toBeCloseTo(8e6 * 0.5);
    expect(r.criticalRatio).toBeCloseTo(r.underage / (r.underage + r.overage));
  });

  it("holds the fewest spares that meet the critical ratio, and that minimizes expected cost", () => {
    const r = spares(crusoe, s, H);
    expect(poissonCdf(r.best, r.expectedShort)).toBeGreaterThanOrEqual(r.criticalRatio);
    if (r.best > 0) expect(poissonCdf(r.best - 1, r.expectedShort)).toBeLessThan(r.criticalRatio);
    const cheapest = r.table.reduce((a, b) => (b.expectedCost < a.expectedCost ? b : a));
    expect(cheapest.spares).toBe(r.best);
  });

  it("holds fewer spares when a shortage costs less (factories less busy) or spares cost more", () => {
    const base = spares(crusoe, s, H).best;
    expect(spares(crusoe, s, { ...H, supplierLoad: 0.5, priceM: 200 }).best).toBeLessThan(base);
  });
});
