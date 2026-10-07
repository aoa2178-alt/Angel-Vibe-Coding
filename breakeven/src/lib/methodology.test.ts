import { describe, expect, it } from "vitest";
import { METHODOLOGY } from "./methodology";
import { DEFAULT_ASSUMPTIONS } from "./tco";

describe("methodology", () => {
  it("documents every price, power and throughput assumption", () => {
    const documented = new Set(METHODOLOGY.map((m) => m.key));
    // gpusPerServer is a hardware fact and powerLimitKw is off by default; apiOutputPerM shares the API entry.
    const skip = new Set(["gpusPerServer", "powerLimitKw", "apiOutputPerM"]);
    for (const key of Object.keys(DEFAULT_ASSUMPTIONS)) {
      if (!skip.has(key)) expect(documented.has(key as keyof typeof DEFAULT_ASSUMPTIONS), key).toBe(true);
    }
  });

  it("gives every entry at least one https source", () => {
    for (const m of METHODOLOGY) {
      expect(m.sources.length, m.label).toBeGreaterThan(0);
      for (const s of m.sources) expect(s.url.startsWith("https://"), s.url).toBe(true);
    }
  });

  it("shows the calculator's actual default values", () => {
    const rent = METHODOLOGY.find((m) => m.key === "rentPerGpuHour")!;
    expect(rent.value).toContain(DEFAULT_ASSUMPTIONS.rentPerGpuHour.toFixed(2));
  });
});
