import { describe, expect, it } from "vitest";
import {
  applyTemplate,
  clusterGpusOf,
  legacyRedirect,
  ownedClusterGpus,
  planQuery,
  planRoi,
  readPlan,
  roiInputsOf,
  setMode,
  startPlan,
  updateProduct,
  updateRoi,
} from "./plan";
import { DEFAULT_OPS } from "./operate";
import { DEFAULT_WEIGHTS } from "./scorecard";
import { DEFAULT_BRIDGE } from "./speedToPower";
import { DEFAULT_ASSUMPTIONS, DEFAULT_WORKLOAD } from "./tco";

const empty = readPlan("");

describe("one plan", () => {
  it("starts empty: the calculator's default workload and no step-1 template", () => {
    expect(empty.workload).toEqual(DEFAULT_WORKLOAD);
    expect(empty.templateId).toBeNull();
    expect(planQuery(empty)).toBe("");
  });

  it("step 1 starts from Customer support, which sets the volume to 120M tokens", () => {
    const p = startPlan(empty);
    expect(p.templateId).toBe("support");
    expect(p.workload.tokensM).toBeCloseTo(120);
    expect(p.workload.outputShare).toBe(0.2);
    expect(planRoi(p).computeOption).toBe("api");
  });

  it("links tokens per task and volume both ways", () => {
    const p = startPlan(empty);
    // Doubling tokens per task doubles the volume
    expect(updateRoi(p, { tokensPerTask: 12_000 }).workload.tokensM).toBeCloseTo(240);
    // More tasks at the same tokens per task raises the volume too
    expect(updateRoi(p, { tasksPerMonth: 40_000 }).workload.tokensM).toBeCloseTo(240);
    // Changing the volume in step 2 shows up as tokens per task in step 1
    const moved = { ...p, workload: { ...p.workload, tokensM: 600 } };
    expect(roiInputsOf(moved).tokensPerTask).toBeCloseTo(30_000);
  });

  it("round-trips the operations settings and product mode, and switching modes moves the volume", () => {
    const p = setMode({ ...empty, ops: { ...DEFAULT_OPS, requestTokens: 4_000, peakHours: 12, waitTargetSec: 2 } }, "product");
    expect(p.workload.tokensM).toBeCloseTo(44_000);
    const q = updateProduct(p, { users: 20_000 });
    expect(q.workload.tokensM).toBeCloseTo(8_800);
    const back = readPlan(planQuery(q));
    expect(back.mode).toBe("product");
    expect(back.product).toEqual(q.product);
    expect(back.ops).toEqual(q.ops);
    expect(back.workload.tokensM).toBeCloseTo(8_800);
    expect(setMode(q, "work").workload.tokensM).toBeCloseTo(120);
    expect(readPlan(planQuery(setMode(q, "work"))).mode).toBe("work");
  });

  it("round-trips a full plan through the URL", () => {
    const p = {
      ...applyTemplate(empty, "coding"),
      assumptions: { ...DEFAULT_ASSUMPTIONS, rentPerGpuHour: 3.2 },
      weights: { ...DEFAULT_WEIGHTS, control: 5 },
      clusterGpus: 10_240,
      bridge: { ...DEFAULT_BRIDGE, delayMonths: 36, flexOffered: 0 },
    };
    const back = readPlan(planQuery(p));
    expect(back.workload).toEqual(p.workload);
    expect(back.assumptions).toEqual(p.assumptions);
    expect(back.templateId).toBe("coding");
    expect(back.roi.tasksPerMonth).toBe(p.roi.tasksPerMonth);
    expect(back.weights).toEqual(p.weights);
    expect(back.clusterGpus).toBe(10_240);
    expect(back.bridge).toEqual(p.bridge);
  });

  it("sizes step 3's cluster from step 2's volume, in whole servers, unless overridden", () => {
    const at30B = { ...empty, workload: { ...empty.workload, tokensM: 30_000 } };
    expect(ownedClusterGpus(at30B)).toBe(16);
    expect(clusterGpusOf(at30B)).toBe(16);
    expect(clusterGpusOf({ ...at30B, clusterGpus: 1_024 })).toBe(1_024);
    expect(ownedClusterGpus(empty)).toBe(8);
  });

  it("opens old links on the new routes with the same plan", () => {
    expect(legacyRedirect("/calculator", "?v=30000", "#projection")).toBe("/run-it?v=30000#projection");
    expect(legacyRedirect("/", "?v=200", "")).toBe("/run-it?v=200");
    expect(legacyRedirect("/methodology", "", "#speed-to-power")).toBe("/sources#speed-to-power");
    expect(legacyRedirect("/speed-to-power", "?d=36", "")).toBe("/power-it?d=36&g=10240");
    expect(legacyRedirect("/", "", "")).toBeNull();

    const bc = legacyRedirect("/business-case", "?t=support&step=4", "")!;
    expect(bc.startsWith("/result?")).toBe(true);
    const plan = readPlan(bc.slice(bc.indexOf("?")));
    expect(plan.templateId).toBe("support");
    expect(plan.workload.tokensM).toBeCloseTo(120);
    expect(legacyRedirect("/business-case", "?t=sales&step=2", "")!.startsWith("/run-it?")).toBe(true);
  });
});
