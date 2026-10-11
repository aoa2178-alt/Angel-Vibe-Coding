import { describe, expect, it } from "vitest";
import { scenarios } from "@/scenarios";
import { fourWeeksToLaunch } from "@/scenarios/four-weeks-to-launch";
import { CONCEPTS } from "./concepts";
import { END, applyEffects, deriveRun, evaluateDebrief, sanitizeRun, validateScenario } from "./engine";
import { allPaths, endingsOf, pathRows, samePath } from "./paths";
import type { RunState } from "./types";

describe.each(scenarios.map((s) => [s.id, s] as const))("scenario %s", (_, scenario) => {
  it("has no data problems", () => {
    expect(validateScenario(scenario)).toEqual([]);
  });

  it("has nine paths, each reaching the memo with a debrief headline", () => {
    const paths = allPaths(scenario);
    expect(paths).toHaveLength(9);
    for (const p of paths) {
      expect(p.run.timeline.at(-1)?.option.next).toBe(END);
      expect(p.run.currentDecision).toBeNull();
      expect(p.profile).not.toBeNull();
    }
  });

  it("keeps every score between 0 and 100 at every step", () => {
    for (const p of allPaths(scenario)) {
      for (const step of p.run.timeline) {
        for (const v of Object.values(step.after)) {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it("gives at least two different headlines across its paths", () => {
    const titles = new Set(allPaths(scenario).map((p) => p.profile?.title));
    expect(titles.size).toBeGreaterThanOrEqual(2);
  });

  it("describes every metric value in plain words", () => {
    for (const m of scenario.metrics) for (const v of [0, 25, 50, 75, 100]) expect(m.describe(v)).toMatch(/\S/);
  });
});

describe("the new scenarios", () => {
  it("link to a portfolio app and tag their choices with concepts", () => {
    for (const s of scenarios.filter((x) => x.id !== fourWeeksToLaunch.id)) {
      expect(s.app?.href).toMatch(/^https:\/\//);
      for (const d of Object.values(s.decisions)) for (const o of d.options) expect(o.concepts?.length).toBeGreaterThan(0);
    }
  });

  it("only use concepts that have an explainer", () => {
    for (const s of scenarios)
      for (const d of Object.values(s.decisions)) for (const o of d.options) for (const c of o.concepts ?? []) expect(CONCEPTS[c]).toBeDefined();
  });
});

describe("path map", () => {
  it("matches a hand-walked path through Four Weeks to Launch", () => {
    const choices = [
      { decisionId: "immediate", optionId: "expedite" },
      { decisionId: "kestrel_terms", optionId: "sign_exclusive" },
    ];
    const mine = allPaths(fourWeeksToLaunch).find((p) => samePath(p.choices, choices))!;
    // Expedite (+10 timing, +22 cost, +8 risk) then the effects of signing the exclusive, from the starting values.
    const expected = applyEffects(
      applyEffects(fourWeeksToLaunch.initial, fourWeeksToLaunch.decisions.immediate!.options[0]!.effects),
      fourWeeksToLaunch.decisions.kestrel_terms!.options[0]!.effects,
    );
    expect(mine.run.metrics).toEqual(expected);
    expect(mine.profile).toEqual(evaluateDebrief(fourWeeksToLaunch, deriveRun(fourWeeksToLaunch, choices)).profile);
  });

  it("groups paths by first choice, three rows of three", () => {
    for (const s of scenarios) {
      const rows = pathRows(s);
      expect(rows).toHaveLength(3);
      for (const r of rows) expect(r.paths).toHaveLength(3);
    }
  });
});

describe("saved runs", () => {
  it("still load after the update", () => {
    const old: RunState = {
      version: 1,
      scenarioId: fourWeeksToLaunch.id,
      stage: "debrief",
      history: [
        { decisionId: "immediate", optionId: "second_source" },
        { decisionId: "voss_hotspot", optionId: "rework" },
      ],
      memo: { recommendation: "Qualify Voss by week 6" },
      startedAt: 0,
    };
    expect(sanitizeRun(fourWeeksToLaunch, old)).toEqual(old);
  });
});

describe("endings shelf", () => {
  it("lists each scenario's distinct endings, 30 across the five cases", () => {
    for (const s of scenarios) {
      const titles = allPaths(s).map((p) => p.profile!.title);
      expect(endingsOf(s)).toEqual([...new Set(titles)]);
    }
    expect(scenarios.reduce((n, s) => n + endingsOf(s).length, 0)).toBe(30);
  });
});
