// A Speed-to-Power scenario lives in the URL, like an estimate. GPU, rent and power prices use the calculator's own
// parameters (so a link from the calculator carries its assumptions over); the bridge settings add their own.
import { DEFAULT_BRIDGE, DEFAULT_GPUS, MAX_DELAY_MONTHS, type BridgeAssumptions } from "./speedToPower";
import { estimateQuery, readEstimate } from "./share";
import { DEFAULT_WORKLOAD, type Assumptions } from "./tco";

const BRIDGE_PARAMS: Record<keyof BridgeAssumptions, { param: string; min: number; max: number }> = {
  delayMonths: { param: "d", min: 0, max: MAX_DELAY_MONTHS },
  gasPerMMBtu: { param: "gas", min: 0, max: 100 },
  heatRate: { param: "hr", min: 3_000, max: 30_000 },
  engineCapexPerKw: { param: "eng_capex", min: 0, max: 20_000 },
  engineFixedOmPerKwYear: { param: "eng_fom", min: 0, max: 1_000 },
  engineVarOmPerMwh: { param: "eng_vom", min: 0, max: 1_000 },
  engineLeadMonths: { param: "eng_lead", min: 0, max: MAX_DELAY_MONTHS },
  engineValueKeptPct: { param: "eng_kept", min: 0, max: 100 },
  reservePct: { param: "reserve", min: 0, max: 200 },
  servicePerMwh: { param: "svc", min: 0, max: 2_000 },
  serviceLeadMonths: { param: "svc_lead", min: 0, max: MAX_DELAY_MONTHS },
  serviceOffered: { param: "svc_on", min: 0, max: 1 },
  batteryPerKwh: { param: "bat", min: 0, max: 5_000 },
  batteryHours: { param: "bat_h", min: 0, max: 48 },
  batteryValueKeptPct: { param: "bat_kept", min: 0, max: 100 },
  flexLeadMonths: { param: "flex_lead", min: 0, max: MAX_DELAY_MONTHS },
  flexOffered: { param: "flex_on", min: 0, max: 1 },
};

export interface Scenario {
  gpus: number;
  bridge: BridgeAssumptions;
  assumptions: Assumptions;
}

function num(params: URLSearchParams, name: string) {
  const raw = params.get(name);
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** The bridge settings in the URL, each falling back to its default. Shared with the whole plan (plan.ts). */
export function readBridge(params: URLSearchParams): BridgeAssumptions {
  const bridge = { ...DEFAULT_BRIDGE };
  for (const [key, { param, min, max }] of Object.entries(BRIDGE_PARAMS) as [keyof BridgeAssumptions, (typeof BRIDGE_PARAMS)[keyof BridgeAssumptions]][]) {
    const n = num(params, param);
    if (n !== null && n >= min && n <= max) bridge[key] = n;
  }
  return bridge;
}

export function writeBridge(params: URLSearchParams, bridge: BridgeAssumptions) {
  for (const [key, { param }] of Object.entries(BRIDGE_PARAMS) as [keyof BridgeAssumptions, { param: string }][]) {
    if (bridge[key] !== DEFAULT_BRIDGE[key]) params.set(param, String(bridge[key]));
  }
}

/** A cluster size from the URL ("g"), or null if none is set or it's unreadable. */
export function readClusterGpus(params: URLSearchParams) {
  const g = num(params, "g");
  return g !== null && Number.isInteger(g) && g >= 1 && g <= 10_000_000 ? g : null;
}

export function readScenario(search: string): Scenario {
  const params = new URLSearchParams(search);
  return {
    gpus: readClusterGpus(params) ?? DEFAULT_GPUS,
    bridge: readBridge(params),
    assumptions: readEstimate(search).assumptions,
  };
}

export function scenarioQuery(s: Scenario) {
  const params = new URLSearchParams();
  if (s.gpus !== DEFAULT_GPUS) params.set("g", String(s.gpus));
  writeBridge(params, s.bridge);
  // The calculator's assumption parameters; its workload parameters don't apply here.
  for (const [k, v] of new URLSearchParams(estimateQuery(DEFAULT_WORKLOAD, s.assumptions))) params.set(k, v);
  const q = params.toString();
  return q ? `?${q}` : "";
}
