// Checks on the tracked prices. The weekly price watcher must pass these before it pushes a proposal.
import { describe, expect, it } from "vitest";
import { PRICES, blended, changeLog, drift, isStale, latest, withLatest, type PriceData } from "./prices";
import { DEFAULT_ASSUMPTIONS } from "./tco";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const today = new Date().toISOString().slice(0, 10);

/** Every series, as plain points with one comparable number each (blended $/M tokens, or $/GPU-hour). */
const allSeries = (d: PriceData) => [
  ...d.api.map((s) => ({ s, values: s.points.map((p) => blended(p)), bounds: [0.01, 200] as const })),
  ...d.gpu.map((s) => ({ s, values: s.points.map((p) => p.value), bounds: [0.1, 30] as const })),
];

describe("tracked prices", () => {
  it("has the series the calculator's defaults point at", () => {
    expect(PRICES.api.some((s) => s.id === PRICES.defaults.api)).toBe(true);
    expect(PRICES.gpu.some((s) => s.id === PRICES.defaults.gpu)).toBe(true);
  });

  it("gives every point a valid date, an https source and a checked date, in order and never in the future", () => {
    for (const { s } of allSeries(PRICES)) {
      let prev = "";
      for (const p of s.points as { date: string; source: string; checked: string }[]) {
        expect(p.date, `${s.id} date`).toMatch(ISO);
        expect(p.checked, `${s.id} checked`).toMatch(ISO);
        expect(p.source.startsWith("https://"), `${s.id} ${p.date} source`).toBe(true);
        expect(p.date >= prev, `${s.id} ${p.date} is in date order`).toBe(true);
        expect(p.date <= today && p.checked <= today, `${s.id} ${p.date} is not in the future`).toBe(true);
        expect(p.checked >= p.date, `${s.id} ${p.date} was checked on or after its date`).toBe(true);
        prev = p.date;
      }
    }
  });

  it("keeps prices within sane bounds, with input never above output", () => {
    for (const { s, values, bounds } of allSeries(PRICES)) {
      for (const v of values) {
        expect(v, s.id).toBeGreaterThanOrEqual(bounds[0]);
        expect(v, s.id).toBeLessThanOrEqual(bounds[1]);
      }
    }
    for (const s of PRICES.api) for (const p of s.points) expect(p.input <= p.output, `${s.id} ${p.model}`).toBe(true);
  });

  it("explains any jump of more than 50% from the previous point", () => {
    for (const { s, values } of allSeries(PRICES)) {
      values.forEach((v, i) => {
        if (i === 0) return;
        const change = Math.abs(v / values[i - 1]! - 1);
        const p = s.points[i] as { date: string; note?: string };
        if (change > 0.5) expect(p.note, `${s.id} ${p.date} moved ${Math.round(change * 100)}% and needs a note`).toBeTruthy();
      });
    }
  });
});

describe("using the latest prices", () => {
  it("compares the plan with the market and applies the latest points", () => {
    const l = latest();
    const d = drift(DEFAULT_ASSUMPTIONS);
    expect(d.rent).toBeCloseTo(l.gpu.point.value / DEFAULT_ASSUMPTIONS.rentPerGpuHour - 1);
    const updated = withLatest(DEFAULT_ASSUMPTIONS);
    expect(updated.rentPerGpuHour).toBe(l.gpu.point.value);
    expect(updated.apiInputPerM).toBe(l.api.point.input);
    expect(isStale(updated)).toBe(false);
    // Only prices change; everything else in the plan stays.
    expect({ ...updated, apiInputPerM: 0, apiOutputPerM: 0, rentPerGpuHour: 0 }).toEqual({ ...DEFAULT_ASSUMPTIONS, apiInputPerM: 0, apiOutputPerM: 0, rentPerGpuHour: 0 });
  });

  it("lists every point newest first", () => {
    const log = changeLog();
    expect(log.length).toBe(PRICES.api.reduce((n, s) => n + s.points.length, 0) + PRICES.gpu.reduce((n, s) => n + s.points.length, 0));
    expect(log[0]!.date >= log[log.length - 1]!.date).toBe(true);
  });
});
