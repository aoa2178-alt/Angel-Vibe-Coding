import { describe, expect, it } from "vitest";
import {
  CAMPUSES,
  DATA,
  MILESTONES,
  campusById,
  capacityOverTime,
  defaultSettings,
  formatMonth,
  formatMoney,
  isoFromIndex,
  monthIndex,
  monthlyDelayCost,
  plan,
  resolveFirst,
  schedule,
} from "./model";

const crusoe = campusById("crusoe-abilene");
const s = defaultSettings(crusoe);
const [p1, p2] = crusoe.phases as [(typeof crusoe.phases)[0], (typeof crusoe.phases)[0]];

describe("dates", () => {
  it("round-trips month numbers", () => {
    for (const d of ["2024-06-01", "2025-09-30", "2026-02-28", "2027-12-31"]) expect(isoFromIndex(monthIndex(d))).toBe(d);
    expect(formatMonth(monthIndex("2025-09-30"))).toBe("Sep 2025");
  });
});

describe("power", () => {
  it("turns Crusoe's phase 1 GPU plan into megawatts and a yearly power bill", () => {
    const [a] = plan(crusoe, s);
    // 100,000 GB200 × 2.083 kW = 208 MW of IT, matching the published "200+ MW"
    expect(a!.itMw).toBeCloseTo(208.3, 1);
    // × PUE 1.25 = facility power
    expect(a!.facilityMw).toBeCloseTo(260.4, 1);
    // facility MW × 8,760 h × 85% load × $70.7/MWh (EIA Texas industrial, July 2026)
    expect(a!.annualEnergy).toBeCloseTo(260.375 * 8760 * 0.85 * 70.7, -3);
  });

  it("derives GPUs from IT megawatts when that's what was disclosed", () => {
    const [first] = plan(campusById("coreweave-lancaster"), defaultSettings(campusById("coreweave-lancaster")));
    expect(first!.itMw).toBe(100);
    expect(first!.gpus).toBe(Math.round(100_000 / 2.083));
  });
});

describe("schedule", () => {
  it("goes live after the last dependency plus commissioning, and names it the critical path", () => {
    const sch = schedule(p1);
    expect(sch.critical).toBe("gpus");
    expect(sch.live).toBeCloseTo(monthIndex("2025-08-15") + 1.5, 6);
    // Fitted to the public date: Crusoe's phase 1 went live September 30, 2025
    expect(formatMonth(sch.live)).toBe("Sep 2025");
  });

  it("shows slack for milestones off the critical path", () => {
    const shell = schedule(p1).deps.find((d) => d.id === "shell")!;
    expect(shell.slack).toBeCloseTo(monthIndex("2025-08-15") - monthIndex("2025-04-30"), 6);
    expect(schedule(p1).deps.find((d) => d.id === "gpus")!.slack).toBe(0);
  });

  it("moves go-live only when a slip eats through the slack", () => {
    // The shell has ~3.5 months of slack, so a 3-month slip changes nothing
    expect(schedule(p1, { "p1.shell": 3 }).live).toBeCloseTo(schedule(p1).live, 6);
    // Transformers slipping 3 months now finish after the GPUs and become critical
    const late = schedule(p1, { "p1.electrical": 3 });
    expect(late.critical).toBe("electrical");
    expect(late.live).toBeCloseTo(monthIndex("2025-05-31") + 3 + 1.5, 6);
  });
});

describe("cost of delay", () => {
  it("adds lost lease revenue and the carrying cost of idle capital", () => {
    const m = monthlyDelayCost(p1, s);
    expect(m.revenue).toBeCloseTo(208.3 * 1000 * 150, -4);
    expect(m.carrying).toBeCloseTo((208.3 * 12.5e6 * 0.09) / 12, -4);
  });

  it("prices GPU-hour revenue for a GPU cloud", () => {
    const cw = campusById("coreweave-lancaster");
    const m = monthlyDelayCost(cw.phases[0]!, defaultSettings(cw));
    expect(m.revenue).toBeCloseTo(Math.round(100_000 / 2.083) * 730 * 0.85 * 4, -2);
  });

  it("costs delay months × monthly cost", () => {
    const [a] = plan(crusoe, s, { "p1.gpus": 2 });
    expect(a!.delay).toBeCloseTo(2, 6);
    expect(a!.delayCost).toBeCloseTo(2 * a!.monthly.total, -2);
  });
});

describe("resolve first", () => {
  it("ranks the critical milestone of the biggest phase first", () => {
    const top = resolveFirst(crusoe, s)[0]!;
    expect(top.phaseId).toBe(p2.id);
    expect(top.milestone).toBe("gpus");
    expect(top.delay).toBeCloseTo(3, 6);
  });

  it("gives milestones with more slack than the slip zero cost", () => {
    const shell = resolveFirst(crusoe, s).find((r) => r.phaseId === "p1" && r.milestone === "shell")!;
    expect(shell.cost).toBe(0);
  });
});

describe("capacity over time", () => {
  it("steps up as each phase goes live, and later when slipped", () => {
    const plans = plan(crusoe, s, { "p2.gpus": 3 });
    const series = capacityOverTime(plans);
    const at = (iso: string) => series.find((x) => x.month === Math.floor(monthIndex(iso)))!;
    expect(at("2025-11-01").planned).toBeCloseTo(plans[0]!.facilityMw, 6);
    expect(at("2026-08-01").planned).toBeCloseTo(plans[0]!.facilityMw + plans[1]!.facilityMw, 6);
    expect(at("2026-08-01").now).toBeCloseTo(plans[0]!.facilityMw, 6);
  });
});

describe("case study data", () => {
  it("sources every fact over https with a confidence level", () => {
    for (const c of CAMPUSES) {
      expect(c.facts.length, c.id).toBeGreaterThan(0);
      for (const f of c.facts) {
        expect(f.source.startsWith("https://"), `${c.id}: ${f.source}`).toBe(true);
        expect(["Primary", "Vendor", "Market", "Analyst", "Estimate"]).toContain(f.confidence);
      }
      expect(c.region.priceSource.startsWith("https://")).toBe(true);
    }
    for (const g of Object.values(DATA.gpuProfiles)) expect(g.source.startsWith("https://")).toBe(true);
  });

  it("gives every phase valid dates for every milestone and a known GPU profile", () => {
    for (const c of CAMPUSES) {
      for (const p of c.phases) {
        expect(DATA.gpuProfiles[p.gpuProfile], `${c.id} ${p.id}`).toBeDefined();
        expect(p.start).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        for (const m of MILESTONES) {
          expect(p.milestones[m.id], `${c.id} ${p.id} ${m.id}`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(monthIndex(p.milestones[m.id]) >= monthIndex(p.start), `${c.id} ${p.id} ${m.id} after start`).toBe(true);
        }
      }
    }
  });

  it("formats money and power briefly", () => {
    expect(formatMoney(50_800_000)).toBe("$50.8M");
    expect(formatMoney(137_000_000)).toBe("$137M");
  });
});
