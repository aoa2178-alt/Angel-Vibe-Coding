import { describe, expect, it } from "vitest";
import { sourcingCall } from "./call";
import { DEFAULT_SETTINGS } from "./data";

describe("The call", () => {
  it("leads with the best all-in bid, not the cheapest quote, and values the difference", () => {
    const c = sourcingCall(DEFAULT_SETTINGS);
    expect(c.leader.bid.supplier).not.toBe(c.cheapestQuote.bid.supplier);
    expect(c.avoided).toBeCloseTo(c.cheapestQuote.total - c.leader.total, 6);
    expect(c.avoided).toBeGreaterThan(0);
  });

  it("the need-by date is what swings the award; delay value and supplier risk don't change the lead", () => {
    const c = sourcingCall(DEFAULT_SETTINGS);
    expect(c.checks).toHaveLength(5);
    const byLabel = (t: string) => c.checks.find((k) => k.label.includes(t))!;
    expect(byLabel("6 months later").holds).toBe(false);
    expect(byLabel("half as much").holds).toBe(true);
    expect(byLabel("twice as likely").holds).toBe(true);
  });
});
