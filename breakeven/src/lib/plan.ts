// One plan, entered once, shared by every step: the workload and prices (step 2), what the AI is for (step 1),
// priorities (step 2's "beyond cost"), and power (step 3). It lives in the URL, so every step link carries it.
// Volume has one source of truth, tokens a month (v); step 1's "tokens per task" is derived from it.
import { readCase, readCaseParams, writeCaseParams } from "./businessCaseShare";
import { PRODUCT_TEMPLATE, freemium, productTokensM, type ProductInputs } from "./freemium";
import type { OpsSettings } from "./operate";
import { readMode, readOps, readProduct, writeOps, writeProduct, type Mode } from "./opsShare";
import { roi, templateById, type RoiInputs, type TemplateId } from "./roi";
import type { Scores, Weights } from "./scorecard";
import { estimateQuery, readEstimate } from "./share";
import { DEFAULT_GPUS, type BridgeAssumptions } from "./speedToPower";
import { readBridge, readClusterGpus, writeBridge } from "./speedToPowerShare";
import { VOLUME_MAX_M, gpusNeeded, type Assumptions, type Workload } from "./tco";

export type StepRoute = "worth-it" | "run-it" | "power-it" | "result";

export const STEPS: { route: StepRoute; label: string; question: string }[] = [
  { route: "worth-it", label: "Worth it", question: "Is AI worth it for this work?" },
  { route: "run-it", label: "Run it", question: "How should we run it?" },
  { route: "power-it", label: "Power it", question: "Can we power it?" },
  { route: "result", label: "The call", question: "The call: how to run it, and is it worth it?" },
];

export interface Plan {
  workload: Workload;
  assumptions: Assumptions;
  /** The step-1 template; null until step 1 has been used */
  templateId: TemplateId | null;
  /** Step-1 inputs. Tokens per task and output share are derived from the workload, so their values here are ignored. */
  roi: RoiInputs;
  weights: Weights;
  scores: Scores;
  /** A "what if you grow" cluster size for step 3; null means the GPUs you'd own at your volume */
  clusterGpus: number | null;
  bridge: BridgeAssumptions;
  /** Step 2's "Running it well" settings */
  ops: OpsSettings;
  /** Step 1: work the company does today ("work"), or an AI product it sells ("product") */
  mode: Mode;
  product: ProductInputs;
  /** How the company runs AI today, for the call's "versus today" (unset until chosen) */
  current?: Current;
}

export type Current = "none" | "api" | "rent" | "own" | "mix";
export const CURRENTS: { id: Current; label: string }[] = [
  { id: "none", label: "Not using AI yet" },
  { id: "api", label: "Pay-per-token API" },
  { id: "rent", label: "Rented cloud GPUs" },
  { id: "own", label: "Own GPUs" },
  { id: "mix", label: "A mix" },
];
const readCurrent = (params: URLSearchParams) => CURRENTS.find((c) => c.id === params.get("now"))?.id;

export function readPlan(search: string): Plan {
  const params = new URLSearchParams(search);
  const { workload, assumptions } = readEstimate(search);
  const c = readCaseParams(params);
  return {
    workload,
    assumptions,
    templateId: c.templateId,
    roi: c.inputs,
    weights: c.weights,
    scores: c.scores,
    clusterGpus: readClusterGpus(params),
    bridge: readBridge(params),
    ops: readOps(params),
    mode: readMode(params),
    product: readProduct(params),
    current: readCurrent(params),
  };
}

export function planQuery(plan: Plan) {
  const params = new URLSearchParams(estimateQuery(plan.workload, plan.assumptions));
  writeCaseParams(params, { templateId: plan.templateId, inputs: plan.roi, weights: plan.weights, scores: plan.scores }, ["tokensPerTask", "outputShare"]);
  if (plan.clusterGpus !== null) params.set("g", String(plan.clusterGpus));
  writeBridge(params, plan.bridge);
  writeOps(params, plan.ops);
  writeProduct(params, plan.mode, plan.product);
  if (plan.current) params.set("now", plan.current);
  const q = params.toString();
  return q ? `?${q}` : "";
}

export const stepHref = (route: StepRoute, plan: Plan) => `/${route}${planQuery(plan)}`;

const clampVolume = (m: number) => Math.min(VOLUME_MAX_M * 10, Math.max(0.001, m));

/** Step 1's inputs with tokens per task and output share filled in from the workload. */
export function roiInputsOf(plan: Plan): RoiInputs {
  return {
    ...plan.roi,
    tokensPerTask: (plan.workload.tokensM * 1e6) / plan.roi.tasksPerMonth,
    outputShare: plan.workload.outputShare,
  };
}

export const planRoi = (plan: Plan) => roi(roiInputsOf(plan), plan.assumptions, plan.workload.utilization);

/** Picking a template sets step 1's inputs and the volume they imply. */
export function applyTemplate(plan: Plan, id: TemplateId): Plan {
  const t = templateById(id).inputs;
  return {
    ...plan,
    templateId: id,
    roi: { ...t },
    workload: { ...plan.workload, tokensM: clampVolume((t.tasksPerMonth * t.tokensPerTask) / 1e6), outputShare: t.outputShare },
  };
}

/** Step 1 starts from the Customer support template if it hasn't been used yet. */
export const startPlan = (plan: Plan) =>
  plan.mode === "product" ? updateProduct(plan, {}) : plan.templateId ? plan : applyTemplate(plan, "support");

/** Switching step 1 to "a product we sell" sets the volume from its users; back to "work" restores the task template's. */
export function setMode(plan: Plan, mode: Mode): Plan {
  if (mode === "product") return updateProduct({ ...plan, mode }, {});
  return applyTemplate({ ...plan, mode, product: { ...PRODUCT_TEMPLATE } }, plan.templateId ?? "support");
}

/** Edits to the product inputs move the volume. */
export function updateProduct(plan: Plan, patch: Partial<ProductInputs>): Plan {
  const product = { ...plan.product, ...patch };
  return { ...plan, product, workload: { ...plan.workload, tokensM: clampVolume(productTokensM(product)) } };
}

export const planFreemium = (plan: Plan) => freemium(plan.product, plan.assumptions, plan.workload);

/** Edits from step 1. Tasks and tokens per task move the volume; output share is the workload's. */
export function updateRoi(plan: Plan, patch: Partial<RoiInputs>): Plan {
  const current = roiInputsOf(plan);
  const tasks = patch.tasksPerMonth ?? current.tasksPerMonth;
  const perTask = patch.tokensPerTask ?? current.tokensPerTask;
  const rest = { ...patch };
  delete rest.tokensPerTask;
  delete rest.outputShare;
  return {
    ...plan,
    roi: { ...plan.roi, ...rest },
    workload: {
      ...plan.workload,
      tokensM: clampVolume((tasks * perTask) / 1e6),
      outputShare: patch.outputShare ?? plan.workload.outputShare,
    },
  };
}

/** The GPUs you'd own at your volume: what you need, in whole servers. */
export function ownedClusterGpus(plan: Plan) {
  const per = plan.assumptions.gpusPerServer;
  return Math.max(per, Math.ceil(gpusNeeded(plan.workload, plan.assumptions) / per) * per);
}

export const clusterGpusOf = (plan: Plan) => plan.clusterGpus ?? ownedClusterGpus(plan);

/** Old links (before the three steps) open the same plan on the new route. Null if the path isn't an old one. */
export function legacyRedirect(pathname: string, search: string, hash: string): string | null {
  if (pathname === "/" && search) return `/run-it${search}${hash}`;
  if (pathname.startsWith("/calculator")) return `/run-it${search}${hash}`;
  if (pathname.startsWith("/methodology")) return `/sources${search}${hash}`;
  if (pathname.startsWith("/speed-to-power")) {
    // Speed-to-Power used to default to a 10,240-GPU cluster; keep that for old links.
    const params = new URLSearchParams(search);
    if (!params.has("g")) params.set("g", String(DEFAULT_GPUS));
    return `/power-it?${params}${hash}`;
  }
  if (pathname.startsWith("/business-case")) {
    const c = readCase(search);
    const plan: Plan = {
      ...readPlan(search),
      templateId: c.templateId,
      roi: c.inputs,
    };
    plan.workload = { ...plan.workload, tokensM: clampVolume((c.inputs.tasksPerMonth * c.inputs.tokensPerTask) / 1e6), outputShare: c.inputs.outputShare };
    const route: StepRoute = c.step === 1 ? "worth-it" : c.step === 4 ? "result" : "run-it";
    return `${stepHref(route, plan)}${hash}`;
  }
  return null;
}
