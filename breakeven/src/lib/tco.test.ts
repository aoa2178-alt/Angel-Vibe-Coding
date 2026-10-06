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

  it("costs an owned GPU as depreciation + power + ops", () => {
    // 35,000/48 + 1.3 kW × 1.3 PUE × 730 h × $0.10 + 400
    expect(ownCostPerGpuMonth(A)).toBeCloseTo(729.17 + 123.37 + 400, 1);
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
    // From 11 GPUs (~23.7B tokens) up, owning always wins
    expect(x.ownFromM).toBeGreaterThan(22_000);
    expect(x.ownFromM).toBeLessThan(25_000);
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
