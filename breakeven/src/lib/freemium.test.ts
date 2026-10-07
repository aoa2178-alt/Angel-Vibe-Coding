import { describe, expect, it } from "vitest";
import { PRODUCT_TEMPLATE as P, freemium, productTokensM } from "./freemium";
import { DEFAULT_ASSUMPTIONS as A, DEFAULT_WORKLOAD as W } from "./tco";

describe("freemium", () => {
  it("adds up everyone's tokens", () => {
    // 95,000 free × 200K + 5,000 paid × 5M = 44B tokens a month
    expect(productTokensM(P)).toBeCloseTo(44_000);
  });

  it("prices each user at the cheapest option's cost per token", () => {
    const f = freemium(P, A, W);
    expect(f.costPerFree).toBeCloseTo(0.2 * f.perM);
    expect(f.costPerPaid).toBeCloseTo(5 * f.perM);
    expect(f.revenue).toBe(5_000 * 20);
    expect(f.margin).toBeCloseTo(f.revenue - f.compute);
    expect(f.freePerPaid).toBeCloseTo(19);
  });

  it("finds the paid share where revenue just covers everyone's compute", () => {
    const f = freemium(P, A, W);
    const c = f.breakEvenShare!;
    // At that share (and today's cost per token), revenue per user = compute per user
    expect(c * P.price).toBeCloseTo((1 - c) * f.costPerFree + c * f.costPerPaid);
    expect(c).toBeLessThan(P.paidShare);
  });

  it("has no break-even when a paying user doesn't cover their own compute", () => {
    expect(freemium({ ...P, price: 0.01 }, A, W).breakEvenShare).toBeNull();
    expect(freemium({ ...P, price: 0.01 }, A, W).margin).toBeLessThan(0);
  });
});
