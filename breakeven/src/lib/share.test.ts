import { describe, expect, it } from "vitest";
import { estimateCsv, estimateQuery, readEstimate } from "./share";
import { DEFAULT_ASSUMPTIONS, DEFAULT_WORKLOAD, breakdown, cheapest, compare, crossovers } from "./tco";

describe("share links", () => {
  it("writes nothing for the defaults", () => {
    expect(estimateQuery(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS)).toBe("");
  });

  it("round-trips changed values", () => {
    const w = { ...DEFAULT_WORKLOAD, tokensM: 30_000, utilization: 0.45 };
    const a = { ...DEFAULT_ASSUMPTIONS, rentPerGpuHour: 3.6 };
    const q = estimateQuery(w, a);
    expect(q).toBe("?v=30000&util=0.45&rent=3.6");
    expect(readEstimate(q)).toEqual({ workload: w, assumptions: a });
  });

  it("ignores unreadable or unsafe values", () => {
    const { workload, assumptions } = readEstimate("?v=abc&util=7&dep=0&tps=-5&rent=2.9");
    expect(workload).toEqual(DEFAULT_WORKLOAD);
    expect(assumptions.depreciationYears).toBe(DEFAULT_ASSUMPTIONS.depreciationYears);
    expect(assumptions.gpuTokensPerSec).toBe(DEFAULT_ASSUMPTIONS.gpuTokensPerSec);
    expect(assumptions.rentPerGpuHour).toBe(2.9);
  });
});

describe("csv and breakdown", () => {
  it("exports the three options with the cheapest marked", () => {
    const costs = compare(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS);
    const csv = estimateCsv(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS, costs, cheapest(costs), crossovers(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS));
    expect(csv).toContain("Rent cloud GPUs,1825.00,0.9125,1,yes");
    expect(csv).toContain("Pay per token (API),8000.00,4.0000,,");
  });

  it("breaks the default estimate into the numbers shown to the user", () => {
    const b = breakdown(DEFAULT_WORKLOAD, DEFAULT_ASSUMPTIONS);
    expect(b.blendedPerM).toBeCloseTo(4);
    expect(b.servedPerGpu).toBeCloseTo(900);
    expect(b.gpusExact).toBeCloseTo(0.8457, 3);
    expect(b.ownDepreciation + b.ownPower + b.ownOps).toBeCloseTo(1252.54, 1);
  });
});
