import { describe, expect, it } from "vitest";
import { DEFAULT_OPS, hybrid, stationWait, maxUtilizationFor, queueFor, rentalDecline, responseTime, retirement, utilizationCurve } from "./operate";
import { DEFAULT_ASSUMPTIONS as A, DEFAULT_WORKLOAD, compare, ownCostPerGpuMonth } from "./tco";

const ops = DEFAULT_OPS;

describe("queueing", () => {
  const s = ops.requestTokens / A.gpuTokensPerSec; // 1.33 s of GPU time per request

  it("is Kingman's V × U × T with one GPU, and the Sakasegawa formula with more", () => {
    expect(stationWait(1, 0.75, s, 1)).toBeCloseTo((0.75 / 0.25) * s);
    // Two GPUs at 50%: 0.5^(√6 − 1) ÷ (2 × 0.5) × tₑ
    expect(stationWait(2, 0.5, s, 1)).toBeCloseTo(Math.pow(0.5, Math.sqrt(6) - 1) * s);
    expect(stationWait(3, 1, s, 1)).toBe(Infinity);
  });

  it("follows Little's Law", () => {
    const q = queueFor(1, 0.5 / s, A, ops);
    expect(q.busy).toBeCloseTo(0.5);
    expect(q.inFlight).toBeCloseTo(q.arrivalsPerSec * q.responseSec);
  });

  it("waits explode as the fleet nears full, and burstier traffic waits longer", () => {
    const curve = utilizationCurve(1, A, ops);
    const at = (b: number) => curve.find((p) => p.busy >= b - 1e-9)!.waitSec;
    expect(at(0.95)).toBeGreaterThan(4 * at(0.8));
    const spiky = utilizationCurve(1, A, { ...ops, burst: 3 });
    expect(spiky.at(-1)!.waitSec).toBeCloseTo(2 * curve.at(-1)!.waitSec);
  });

  it("pools: the same busy share waits far less on a bigger fleet", () => {
    expect(stationWait(20, 0.9, s, 1)).toBeLessThan(stationWait(1, 0.9, s, 1) / 10);
  });

  it("finds the hottest utilization setting that still meets the wait target", () => {
    // 2B tokens on one GPU is 51% busy and waits about 1.4 s, over the 1 s target: meeting it takes a second GPU
    const w = { ...DEFAULT_WORKLOAD, tokensM: 2_000 };
    expect(responseTime(w, A, ops).waitSec).toBeGreaterThan(ops.waitTargetSec);
    const u = maxUtilizationFor(w, A, ops)!;
    expect(responseTime({ ...w, utilization: u }, A, ops).waitSec).toBeLessThanOrEqual(ops.waitTargetSec);
    expect(responseTime({ ...w, utilization: u + 0.01 }, A, ops).waitSec).toBeGreaterThan(ops.waitTargetSec);
    // A big fleet pools its traffic and can run hot
    expect(maxUtilizationFor({ ...w, tokensM: 30_000 }, A, ops)).toBe(0.95);
  });
});

describe("own the base, rent the peaks", () => {
  const w = { ...DEFAULT_WORKLOAD, tokensM: 30_000 };

  it("sizes the off-peak need so the day averages the plan's utilization", () => {
    const h = hybrid(w, A, { ...ops, peakHours: 8 });
    // 60% average with a third of the day at peak: off-peak needs (0.6 − 1/3) ÷ (2/3) = 40% of the fleet
    expect(h.offPeakShare).toBeCloseTo(0.4);
    expect(h.peakShare * 1 + (1 - h.peakShare) * h.offPeakShare).toBeCloseTo(w.utilization);
  });

  it("never costs more than all-rented or all-owned", () => {
    for (const peakHours of [2, 8, 16, 22]) {
      const h = hybrid(w, A, { ...ops, peakHours });
      expect(h.hybrid).toBeLessThanOrEqual(h.allRent + 1e-6);
      expect(h.hybrid).toBeLessThanOrEqual(h.allOwn + 1e-6);
      expect(h.allRent).toBeCloseTo(compare(w, A).rent.monthly);
    }
  });

  it("rents the peak by the hour when it's busy less than the critical ratio, and owns it when busy more", () => {
    // One-GPU servers, so whole-server rounding doesn't blur the rule
    const a1 = { ...A, gpusPerServer: 1 };
    const short = hybrid(w, a1, { ...ops, peakHours: 2 });
    expect(short.criticalRatio).toBeCloseTo(ownCostPerGpuMonth(a1) / (730 * A.rentPerGpuHour * ops.onDemandPremium));
    expect(short.peakShare).toBeLessThan(short.criticalRatio);
    expect(short.peak.choice).toBe("on-demand");
    expect(short.base.choice).toBe("own");
    expect(short.flexibilityValue).toBeGreaterThan(0);
    const long = hybrid(w, a1, { ...ops, peakHours: 22 });
    expect(long.peakShare).toBeGreaterThan(long.criticalRatio);
    expect(long.peak.choice).toBe("own");
  });
});

describe("when to retire owned GPUs", () => {
  it("measures the H100 rental decline from the price tracker", () => {
    // $8.00 in July 2023 to $2.82 in October 2026: about −27% a year
    expect(rentalDecline()).toBeGreaterThan(0.25);
    expect(rentalDecline()).toBeLessThan(0.3);
  });

  it("retires when renting the same capacity costs less than keeping it running (hardware is sunk)", () => {
    const r = retirement(A, ops);
    expect(r.keepMonthly).toBeCloseTo(3500 / 12 + 1.3 * 1.3 * 730 * 0.1 + 1.3 * 195);
    expect(r.rentMonthly).toBeCloseTo(730 * 2.5);
    const month = r.retireAfterMonths!;
    expect(r.rentMonthly * Math.pow(1 - ops.rentalDecline, month / 12)).toBeCloseTo(r.keepMonthly);
    expect(month).toBeGreaterThan(30);
    expect(r.beforeWriteOff).toBe(true);
  });

  it("never retires if rental prices don't fall, and retires now if renting is already cheaper", () => {
    expect(retirement(A, { ...ops, rentalDecline: 0 }).retireAfterMonths).toBeNull();
    expect(retirement({ ...A, rentPerGpuHour: 0.5 }, ops).retireAfterMonths).toBe(0);
  });
});
