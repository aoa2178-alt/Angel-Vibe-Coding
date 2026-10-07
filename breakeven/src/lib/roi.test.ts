import { describe, expect, it } from "vitest";
import { ROI_TEMPLATES, roi, templateById } from "./roi";
import { DEFAULT_ASSUMPTIONS as A, compare } from "./tco";

describe("ROI", () => {
  it("compares people today with escalations + review + compute", () => {
    const r = roi(templateById("support").inputs);
    // 20,000 tasks × 8 min × $40/h
    expect(r.humanCost).toBeCloseTo(106_666.67, 1);
    // 40% still go to a person; the 60% the AI solves get a 1-minute review
    expect(r.escalationCost).toBeCloseTo(42_666.67, 1);
    expect(r.reviewCost).toBeCloseTo(8_000, 1);
    // 120M tokens on the API at 80% × $2 + 20% × $10 = $3.60/M
    expect(r.tokensM).toBeCloseTo(120);
    expect(r.computeOption).toBe("api");
    expect(r.computeCost).toBeCloseTo(432);
    expect(r.savings).toBeCloseTo(106_666.67 - 42_666.67 - 8_000 - 432, 1);
    expect(r.paybackMonths).toBeCloseTo(50_000 / r.savings);
    expect(r.roi12).toBeCloseTo((12 * r.savings - 50_000) / 50_000);
  });

  it("prices compute with the cost model at the task's token volume", () => {
    const r = roi(templateById("coding").inputs);
    // 8,000 tasks × 500K tokens = 4B tokens a month: two rented GPUs beat the API
    expect(r.tokensM).toBeCloseTo(4_000);
    expect(r.costs).toEqual(compare({ tokensM: 4_000, outputShare: 0.25, utilization: 0.6 }, A));
    expect(r.computeOption).toBe("rent");
    expect(r.computeCost).toBeCloseTo(2 * 730 * 2.5);
  });

  it("reports no payback when AI costs more than it saves", () => {
    const r = roi({ ...templateById("support").inputs, aiSuccess: 0 });
    expect(r.savings).toBeLessThan(0);
    expect(r.paybackMonths).toBeNull();
    expect(r.roi12).toBeLessThan(-1);
  });

  it("every template pays off at its own numbers", () => {
    for (const t of ROI_TEMPLATES) expect(roi(t.inputs).paybackMonths).toBeGreaterThan(0);
  });
});
