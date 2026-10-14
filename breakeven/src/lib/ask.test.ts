import { describe, expect, it } from "vitest";
import { scenarioSummary } from "./ask";

describe("scenarioSummary", () => {
  it("describes the default scenario with its costs and winner", () => {
    const s = scenarioSummary("/run-it", "");
    expect(s).toContain("Page: Step 2, Compare compute costs");
    expect(s).toContain("Volume: 2B tokens a month");
    expect(s).toContain("Cheapest: rented cloud GPUs");
    expect(s).toContain("API $8,000");
  });

  it("follows the volume in the link", () => {
    expect(scenarioSummary("/run-it", "?v=30000")).toContain("Cheapest: owned GPUs");
    expect(scenarioSummary("/run-it", "?v=200")).toContain("Cheapest: pay-per-token API");
  });

  it("adds the business case when a template is chosen", () => {
    expect(scenarioSummary("/worth-it", "?t=support")).toMatch(/Business case \(support template\): .*savings/);
  });

  it("stays short enough to send", () => {
    expect(scenarioSummary("/worth-it", "?t=support&v=30000").length).toBeLessThan(1500);
  });
});
