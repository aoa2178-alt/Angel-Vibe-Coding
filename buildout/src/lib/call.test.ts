import { describe, expect, it } from "vitest";
import { capexCall } from "./call";
import { SPENDERS } from "./data";

describe("The call", () => {
  it("reads five leading indicators from the filings, each with a trigger", () => {
    const c = capexCall();
    expect(c.indicators).toHaveLength(5);
    for (const i of c.indicators) expect(i.trigger).toBeTruthy();
  });

  it("each indicator's status matches its threshold", () => {
    const c = capexCall();
    expect(c.indicators[0]!.holds).toBe(c.h.yoy === null || c.h.yoy >= 0.2);
    expect(c.indicators[1]!.holds).toBe(c.h.intensity <= 0.3);
    expect(c.indicators[2]!.holds).toBe(c.negative.length < 3);
    expect(c.indicators[4]!.holds).toBe(c.waves.length < SPENDERS.length / 2);
  });
});
