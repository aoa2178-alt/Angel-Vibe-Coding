// Shareable links and CSV export. An estimate lives in the URL's query string, so "save" is just a link:
// only values that differ from the defaults are written, and anything unreadable falls back to the default.
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_WORKLOAD,
  VOLUME_MAX_M,
  type Assumptions,
  type Crossovers,
  type OptionCost,
  type OptionId,
  type Workload,
} from "./tco";

const WORKLOAD_KEYS: Record<keyof Workload, { param: string; min: number; max: number }> = {
  tokensM: { param: "v", min: 0.001, max: VOLUME_MAX_M * 10 },
  outputShare: { param: "out", min: 0, max: 1 },
  utilization: { param: "util", min: 0.01, max: 1 },
};

const ASSUMPTION_PARAMS: Record<keyof Assumptions, string> = {
  apiInputPerM: "api_in",
  apiOutputPerM: "api_out",
  gpuTokensPerSec: "tps",
  rentPerGpuHour: "rent",
  hardwarePerGpu: "hw",
  depreciationYears: "dep",
  kwPerGpu: "kw",
  pue: "pue",
  electricityPerKwh: "kwh",
  opsPerGpuMonth: "ops",
  gpusPerServer: "server",
  powerLimitKw: "kw_cap",
};

// Values that would break the model (dividing by zero) must be positive.
const MUST_BE_POSITIVE = new Set<keyof Assumptions>(["gpuTokensPerSec", "depreciationYears", "gpusPerServer"]);

function num(params: URLSearchParams, name: string) {
  const raw = params.get(name);
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function readEstimate(search: string): { workload: Workload; assumptions: Assumptions } {
  const params = new URLSearchParams(search);
  const workload = { ...DEFAULT_WORKLOAD };
  for (const [key, { param, min, max }] of Object.entries(WORKLOAD_KEYS) as [keyof Workload, (typeof WORKLOAD_KEYS)[keyof Workload]][]) {
    const n = num(params, param);
    if (n !== null && n >= min && n <= max) workload[key] = n;
  }
  const assumptions = { ...DEFAULT_ASSUMPTIONS };
  for (const [key, param] of Object.entries(ASSUMPTION_PARAMS) as [keyof Assumptions, string][]) {
    const n = num(params, param);
    if (n !== null && n >= 0 && n < 1e9 && (!MUST_BE_POSITIVE.has(key) || n > 0)) assumptions[key] = n;
  }
  return { workload, assumptions };
}

export function estimateQuery(workload: Workload, assumptions: Assumptions) {
  const params = new URLSearchParams();
  for (const [key, { param }] of Object.entries(WORKLOAD_KEYS) as [keyof Workload, { param: string }][]) {
    if (workload[key] !== DEFAULT_WORKLOAD[key]) params.set(param, String(workload[key]));
  }
  for (const [key, param] of Object.entries(ASSUMPTION_PARAMS) as [keyof Assumptions, string][]) {
    if (assumptions[key] !== DEFAULT_ASSUMPTIONS[key]) params.set(param, String(assumptions[key]));
  }
  const q = params.toString();
  return q ? `?${q}` : "";
}

const LABELS: Record<OptionId, string> = { api: "Pay per token (API)", rent: "Rent cloud GPUs", own: "Own GPUs" };

export function estimateCsv(
  workload: Workload,
  assumptions: Assumptions,
  costs: Record<OptionId, OptionCost>,
  winner: OptionId,
  cross: Crossovers,
) {
  const rows: (string | number)[][] = [
    ["Breakeven estimate", new Date().toISOString().slice(0, 10)],
    [],
    ["Workload", "Value"],
    ["Tokens per month (millions)", workload.tokensM],
    ["Output share", workload.outputShare],
    ["GPU utilization", workload.utilization],
    [],
    ["Assumption", "Value"],
    ...(Object.keys(ASSUMPTION_PARAMS) as (keyof Assumptions)[]).map((k) => [k, assumptions[k]]),
    [],
    ["Option", "Monthly cost (USD)", "Cost per million tokens (USD)", "GPUs", "Cheapest"],
    ...(["api", "rent", "own"] as const).map((id) => [
      LABELS[id],
      costs[id].monthly.toFixed(2),
      costs[id].perM.toFixed(4),
      costs[id].gpus ?? "",
      id === winner ? "yes" : "",
    ]),
    [],
    ["API cheapest below (M tokens/month)", cross.apiUntilM === null ? "" : Math.round(cross.apiUntilM)],
    ["Owning cheapest from (M tokens/month)", cross.ownFromM === null ? "" : Math.round(cross.ownFromM)],
    [],
    ["Illustrative estimate. Excludes taxes, egress and setup costs."],
  ];
  return rows.map((r) => r.map((c) => (/[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : String(c))).join(",")).join("\n") + "\n";
}
