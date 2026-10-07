import { describe, expect, it } from "vitest";
import { defaultSettings, campusById } from "./model";
import { readScenario, scenarioQuery, switchCampus } from "./scenario";

describe("scenario links", () => {
  it("round-trips a campus with slips and changed assumptions", () => {
    const s = {
      campusId: "qts-cedar-rapids",
      slips: { "p1.grid": 3, "p2.electrical": 1.5 },
      settings: { ...defaultSettings(campusById("qts-cedar-rapids")), pricePerMwh: 85, revenueBasis: "gpu" as const },
    };
    expect(readScenario(scenarioQuery(s))).toEqual(s);
  });

  it("keeps an untouched scenario short", () => {
    expect(scenarioQuery(switchCampus("crusoe-abilene"))).toBe("?c=crusoe-abilene");
  });

  it("ignores unknown campuses, phases, milestones and out-of-range values", () => {
    const s = readScenario("?c=nope&slip=p9.gpus:3,p1.nope:2,p1.grid:99&pue=9");
    expect(s.campusId).toBe("crusoe-abilene");
    expect(s.slips).toEqual({});
    expect(s.settings.pue).toBe(defaultSettings(campusById("crusoe-abilene")).pue);
  });
});
