// A Signal scenario lives in the URL: the country, the price levers (step 2) and the build settings (step 3).
// Only what differs from the defaults is written, so links stay short; anything unreadable is ignored.
import { DEFAULT_AFFORD, type AffordSettings } from "./afford";
import { DEFAULT_BUILD, type BuildSettings } from "./build";
import { byIso } from "./data";

export interface Scenario {
  country: string;
  afford: AffordSettings;
  build: BuildSettings;
}

export const DEFAULT_SCENARIO: Scenario = { country: "NGA", afford: DEFAULT_AFFORD, build: DEFAULT_BUILD };

type Spec<T> = Partial<Record<keyof T, { param: string; min: number; max: number }>>;

const AFFORD: Spec<AffordSettings> = {
  dataPrice: { param: "data", min: 0, max: 500 },
  phonePrice: { param: "phone", min: 0, max: 2000 },
  handsetTax: { param: "htax", min: 0, max: 0.9 },
  handsetTaxCut: { param: "hcut", min: 0, max: 1 },
  dataTax: { param: "dtax", min: 0, max: 0.9 },
  dataTaxCut: { param: "dcut", min: 0, max: 1 },
  dataSubsidy: { param: "sub", min: 0, max: 1 },
  deposit: { param: "dep", min: 0, max: 1 },
  months: { param: "mo", min: 1, max: 60 },
  markup: { param: "mark", min: 0, max: 3 },
  defaultRate: { param: "dflt", min: 0, max: 1 },
};

const BUILD: Spec<BuildSettings> = {
  gap: { param: "gap", min: 0, max: 1 },
  remote: { param: "remote", min: 0, max: 1 },
  adoption: { param: "adopt", min: 0.05, max: 1 },
  years: { param: "yrs", min: 1, max: 30 },
  rate: { param: "rate", min: 0, max: 0.5 },
  fund: { param: "fund", min: 0, max: 1 },
  arpu: { param: "arpu", min: 0, max: 500 },
  margin: { param: "margin", min: 0, max: 1 },
  levy: { param: "levy", min: 0, max: 0.2 },
};

function read<T extends object>(params: URLSearchParams, defaults: T, spec: Spec<T>): T {
  const out = { ...defaults };
  for (const [key, s] of Object.entries(spec) as [keyof T, { param: string; min: number; max: number }][]) {
    const raw = params.get(s.param);
    const n = raw === null || raw.trim() === "" ? NaN : Number(raw);
    if (Number.isFinite(n) && n >= s.min && n <= s.max) (out as Record<keyof T, unknown>)[key] = n;
  }
  return out;
}

function write<T extends object>(params: URLSearchParams, value: T, defaults: T, spec: Spec<T>) {
  for (const [key, s] of Object.entries(spec) as [keyof T, { param: string }][]) {
    if (value[key] !== defaults[key] && value[key] !== null) params.set(s.param, String(value[key]));
  }
}

export function readScenario(search: string): Scenario {
  const params = new URLSearchParams(search);
  const c = params.get("c");
  const afford = read(params, DEFAULT_AFFORD, AFFORD);
  if (params.get("payg") === "1") afford.payg = true;
  return { country: c && byIso(c) ? c : DEFAULT_SCENARIO.country, afford, build: read(params, DEFAULT_BUILD, BUILD) };
}

export function scenarioQuery(s: Scenario) {
  const params = new URLSearchParams();
  if (s.country !== DEFAULT_SCENARIO.country) params.set("c", s.country);
  write(params, s.afford, DEFAULT_AFFORD, AFFORD);
  if (s.afford.payg) params.set("payg", "1");
  write(params, s.build, DEFAULT_BUILD, BUILD);
  const q = params.toString();
  return q ? `?${q}` : "";
}
