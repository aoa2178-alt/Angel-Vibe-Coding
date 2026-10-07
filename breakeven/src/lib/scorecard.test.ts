import { describe, expect, it } from "vitest";
import { roi, templateById } from "./roi";
import { DEFAULT_WEIGHTS, WEIGHT_PRESETS, advantages, costScores, scorecard } from "./scorecard";
import type { OptionCost, OptionId } from "./tco";

const costs = (api: number, rent: number, own: number): Record<OptionId, OptionCost> => ({
  api: { id: "api", monthly: api, perM: 0, gpus: null },
  rent: { id: "rent", monthly: rent, perM: 0, gpus: 1 },
  own: { id: "own", monthly: own, perM: 0, gpus: 8 },
});
const preset = (id: string) => WEIGHT_PRESETS.find((p) => p.id === id)!.weights;
const support = roi(templateById("support").inputs).costs;

describe("scorecard", () => {
  it("scores the cheapest option 5 and the rest by cost ratio", () => {
    const s = costScores(costs(1_000, 2_000, 4_000));
    expect(s.api).toBe(5);
    expect(s.rent).toBeCloseTo(3);
    expect(s.own).toBeCloseTo(2);
  });

  it("totals out of 100, whatever the weight scale", () => {
    const top = scorecard(costs(1, 1, 1), DEFAULT_WEIGHTS, {
      control: { api: 5, rent: 1, own: 1 },
      launch: { api: 5, rent: 1, own: 1 },
      quality: { api: 5, rent: 1, own: 1 },
      ease: { api: 5, rent: 1, own: 1 },
      flex: { api: 5, rent: 1, own: 1 },
    });
    expect(top.totals.api).toBeCloseTo(100);
    const doubled = Object.fromEntries(Object.entries(DEFAULT_WEIGHTS).map(([k, v]) => [k, v * 2])) as typeof DEFAULT_WEIGHTS;
    expect(scorecard(support, doubled).totals).toEqual(scorecard(support, DEFAULT_WEIGHTS).totals);
  });

  it("has no winner when every weight is zero", () => {
    const zero = { cost: 0, control: 0, launch: 0, quality: 0, ease: 0, flex: 0 };
    const r = scorecard(support, zero);
    expect(r.winner).toBeNull();
    expect(r.totals.api).toBe(0);
  });

  it("customer support: the API fits best on balanced weights, renting when data control dominates", () => {
    expect(scorecard(support, DEFAULT_WEIGHTS).winner).toBe("api");
    const regulated = scorecard(support, preset("regulated"));
    expect(regulated.winner).toBe("rent");
    expect(advantages(regulated, preset("regulated"), "rent", "api")[0].id).toBe("control");
  });
});
