import { describe, expect, it } from "vitest";
import {
  DEFAULT_ASSUMPTIONS as A,
  DEFAULT_WORKLOAD as W,
  PRESETS,
  cheapest,
  compare,
  crossovers,
  formatTokensM,
  gpusNeeded,
  ownCostPerGpuMonth,
  powerCapVolumeM,
  ownCostParts,
  ownershipView,
  sensitivity,
} from "./tco";

const at = (tokensM: number) => compare({ ...W, tokensM }, A);

describe("cost model", () => {
  it("prices the API at the blended per-token rate", () => {
    // 75% input at $2 + 25% output at $10 = $4 per million tokens
    expect(at(1_000).api.monthly).toBeCloseTo(4_000);
    expect(at(1_000).api.perM).toBeCloseTo(4);
  });

  it("sizes GPUs from average load and utilization", () => {
    // One GPU at 60% of 1,500 tok/s serves ~2.37B tokens a month
    expect(gpusNeeded({ ...W, tokensM: 2_300 }, A)).toBe(1);
    expect(gpusNeeded({ ...W, tokensM: 2_400 }, A)).toBe(2);
    expect(gpusNeeded({ ...W, tokensM: 1 }, A)).toBe(1);
  });

  it("rents by the GPU but buys whole 8-GPU servers", () => {
    const c = at(30_000);
    expect(c.rent.gpus).toBe(13);
    expect(c.own.gpus).toBe(16);
    expect(c.rent.monthly).toBeCloseTo(13 * 730 * 2.5);
    expect(c.own.monthly).toBeCloseTo(16 * ownCostPerGpuMonth(A));
  });

  it("costs an owned GPU as depreciation + support + electricity + colocation", () => {
    // 35,000/48 + 10% × 35,000/12 + 1.3 kW × 1.3 PUE × 730 h × $0.10 + 1.3 kW × $195
    expect(ownCostPerGpuMonth(A)).toBeCloseTo(729.17 + 291.67 + 123.37 + 253.5, 1);
  });
});

describe("the three presets have three different winners", () => {
  const winner = (id: string) => cheapest(at(PRESETS.find((p) => p.id === id)!.tokensM));
  it("small team → API", () => expect(winner("small")).toBe("api"));
  it("growing startup → rent", () => expect(winner("startup")).toBe("rent"));
  it("scale-up → own", () => expect(winner("scaleup")).toBe("own"));
});

describe("crossovers", () => {
  it("finds where the API stops winning and where owning takes over for good", () => {
    const x = crossovers(W, A);
    // API ($4/M) loses to one rented GPU ($1,825/month) at ~456M tokens
    expect(x.apiUntilM).toBeGreaterThan(420);
    expect(x.apiUntilM).toBeLessThan(500);
    // From 19 GPUs (~43B tokens) up, owning always wins: e.g. 24 owned ($33.5K) beats 19 rented ($34.7K)
    expect(x.ownFromM).toBeGreaterThan(41_000);
    expect(x.ownFromM).toBeLessThan(44_000);
    expect(x.flipFlops).toBe(true);
  });

  it("reports no API window when the API is never cheapest", () => {
    expect(crossovers(W, { ...A, apiInputPerM: 1000, apiOutputPerM: 1000 }).apiUntilM).toBeNull();
  });
});

it("formats token volumes", () => {
  expect(formatTokensM(200)).toBe("200M");
  expect(formatTokensM(2_400)).toBe("2.4B");
  expect(formatTokensM(30_000)).toBe("30B");
});

describe("power budget", () => {
  // Each owned GPU draws 1.3 kW × 1.3 PUE = 1.69 kW of facility power.
  it("has no effect when there is no limit", () => {
    expect(at(30_000).own.overflowGpus).toBe(0);
  });

  it("caps owned GPUs at whole servers and rents the overflow", () => {
    const a = { ...A, powerLimitKw: 25 }; // 25 ÷ 1.69 = 14.8 GPUs → one 8-GPU server
    const c = compare({ ...W, tokensM: 30_000 }, a);
    expect(c.own.gpus).toBe(8);
    expect(c.own.overflowGpus).toBe(5); // 13 needed − 8 owned
    expect(c.own.monthly).toBeCloseTo(8 * ownCostPerGpuMonth(A) + 5 * 730 * 2.5);
  });

  it("rents everything when the budget can't power one server", () => {
    const c = compare({ ...W, tokensM: 30_000 }, { ...A, powerLimitKw: 5 });
    expect(c.own.gpus).toBe(0);
    expect(c.own.overflowGpus).toBe(13);
    expect(c.own.monthly).toBeCloseTo(c.rent.monthly);
  });

  it("finds the volume where the power budget runs out", () => {
    // 8 GPUs × 900 tokens/sec × 2,628,000 seconds ≈ 18.9B tokens a month
    expect(powerCapVolumeM(W, { ...A, powerLimitKw: 25 })).toBeCloseTo(18_921.6, 0);
    expect(powerCapVolumeM(W, A)).toBeNull();
  });
});

describe("ownership view", () => {
  it("puts owned hardware up front and spreads running costs over the depreciation years", () => {
    const v = ownershipView({ ...W, tokensM: 30_000 }, A); // 16 owned GPUs
    const p = ownCostParts(A);
    expect(v.own.parts!.hardware).toBeCloseTo(16 * 35_000);
    expect(v.own.yearOne).toBeCloseTo(16 * 35_000 + 16 * (p.support + p.electricity + p.colocation) * 12);
    expect(v.own.total).toBeCloseTo(16 * 35_000 + 16 * (p.support + p.electricity + p.colocation) * 48);
    // Over the full period, owning costs the same as its monthly figure × 48
    expect(v.own.total).toBeCloseTo(compare({ ...W, tokensM: 30_000 }, A).own.monthly * 48);
    expect(v.rent.yearOne).toBeCloseTo(13 * 730 * 2.5 * 12);
  });
});

describe("sensitivity", () => {
  it("flags the drivers that change the cheapest option", () => {
    const rows = sensitivity({ ...W, tokensM: 30_000 }, A);
    expect(rows).toHaveLength(8);
    // At 30B, owning only narrowly beats renting, so a 25% cheaper rental flips the answer
    const rent = rows.find((r) => r.id === "rent")!;
    expect(rent.flips).toBe(true);
    expect(rent.low.winner).toBe("rent");
    expect(rows[0]!.flips).toBe(true); // flips sort first
  });

  it("finds nothing that flips the answer far from a crossover", () => {
    expect(sensitivity({ ...W, tokensM: 10 }, A).some((r) => r.flips)).toBe(false);
  });
});
