import { describe, expect, it } from "vitest";
import { caseQuery, readCase } from "./businessCaseShare";
import { templateById } from "./roi";
import { DEFAULT_SCORES, DEFAULT_WEIGHTS } from "./scorecard";

describe("business case links", () => {
  it("round-trips a changed case", () => {
    const state = {
      templateId: "documents" as const,
      inputs: { ...templateById("documents").inputs, tasksPerMonth: 75_000, aiSuccess: 0.9 },
      weights: { ...DEFAULT_WEIGHTS, control: 5, launch: 0 },
      scores: { ...DEFAULT_SCORES, quality: { api: 5, rent: 5, own: 5 } },
      step: 3,
    };
    expect(readCase(caseQuery(state))).toEqual(state);
  });

  it("keeps an untouched case short", () => {
    const state = readCase("?t=sales");
    expect(caseQuery(state)).toBe("?t=sales");
  });

  it("ignores unreadable values", () => {
    const state = readCase("?t=nope&tasks=-5&ok=2&w=9,9&s=0,1&step=7");
    expect(state.templateId).toBe("support");
    expect(state.inputs).toEqual(templateById("support").inputs);
    expect(state.weights).toEqual(DEFAULT_WEIGHTS);
    expect(state.scores).toEqual(DEFAULT_SCORES);
    expect(state.step).toBe(1);
  });
});
