// The fleet-operations settings (step 2's "Running it well") and step 1's product inputs in the URL.
// Like the other readers: only values that differ from the defaults are written, and anything unreadable falls back.
import { PRODUCT_TEMPLATE, type ProductInputs } from "./freemium";
import { DEFAULT_OPS, type OpsSettings } from "./operate";

const OPS_PARAMS: Record<keyof OpsSettings, { param: string; min: number; max: number }> = {
  requestTokens: { param: "rq", min: 1, max: 10_000_000 },
  burst: { param: "burst", min: 0, max: 20 },
  waitTargetSec: { param: "wt", min: 0.01, max: 3_600 },
  peakHours: { param: "pkh", min: 0, max: 24 },
  onDemandPremium: { param: "od", min: 0.1, max: 10 },
  rentalDecline: { param: "decl", min: -1, max: 0.99 },
};

const PRODUCT_PARAMS: Record<keyof ProductInputs, { param: string; min: number; max: number }> = {
  users: { param: "users", min: 1, max: 1e10 },
  paidShare: { param: "paid", min: 0.0001, max: 1 },
  price: { param: "price", min: 0, max: 1e6 },
  freeTokens: { param: "tf", min: 0, max: 1e10 },
  paidTokens: { param: "tp", min: 0, max: 1e10 },
};

export type Mode = "work" | "product";

function num(params: URLSearchParams, name: string) {
  const raw = params.get(name);
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function readInto<T extends object>(params: URLSearchParams, defaults: T, spec: Record<keyof T, { param: string; min: number; max: number }>): T {
  const out = { ...defaults };
  for (const [key, { param, min, max }] of Object.entries(spec) as [keyof T, { param: string; min: number; max: number }][]) {
    const n = num(params, param);
    if (n !== null && n >= min && n <= max) (out as Record<keyof T, number>)[key] = n;
  }
  return out;
}

function writeFrom<T extends object>(params: URLSearchParams, value: T, defaults: T, spec: Record<keyof T, { param: string }>) {
  for (const [key, { param }] of Object.entries(spec) as [keyof T, { param: string }][]) {
    if (value[key] !== defaults[key]) params.set(param, String(value[key]));
  }
}

export const readOps = (params: URLSearchParams): OpsSettings => readInto(params, DEFAULT_OPS, OPS_PARAMS);
export const writeOps = (params: URLSearchParams, ops: OpsSettings) => writeFrom(params, ops, DEFAULT_OPS, OPS_PARAMS);

export const readMode = (params: URLSearchParams): Mode => (params.get("mode") === "product" ? "product" : "work");
export const readProduct = (params: URLSearchParams): ProductInputs => readInto(params, PRODUCT_TEMPLATE, PRODUCT_PARAMS);

export function writeProduct(params: URLSearchParams, mode: Mode, product: ProductInputs) {
  if (mode !== "product") return;
  params.set("mode", "product");
  writeFrom(params, product, PRODUCT_TEMPLATE, PRODUCT_PARAMS);
}
