import { describe, expect, it } from "vitest";
import { programCall } from "./call";
import { CAMPUSES } from "./model";
import { readScenario } from "./scenario";

describe("The call", () => {
  it("names the costliest milestone to slip, for every campus", () => {
    for (const c of CAMPUSES) {
      const k = programCall(readScenario(`?c=${c.id}`));
      expect(k.top).not.toBeNull();
      for (const r of k.risks) expect(r.cost).toBeLessThanOrEqual(k.top!.cost);
    }
  });

  it("a later grid date makes the grid the thing to chase", () => {
    const k = programCall(readScenario(`?c=${CAMPUSES[0]!.id}`));
    const grid = k.checks.find((x) => x.label.includes("grid date"))!;
    expect(grid.holds).toBe(false);
    expect(grid.outcome).toContain("grid");
  });
});
