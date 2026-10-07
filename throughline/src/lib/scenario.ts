// A Throughline scenario lives in the URL: the product, any changed assumptions, the forecast method, the supply cut and
// allocation rule, and the bullwhip settings. Only what differs from the defaults is written; anything unreadable is ignored.
import { DEFAULT_BULLWHIP, type BullwhipSettings } from "./bullwhip";
import { METHODS, type MethodId } from "./forecast";
import { PRODUCTS, productById, type ProductId, type RegionId, type Settings } from "./products";
import { RULES, type Rule } from "./allocate";

export interface Scenario {
  productId: ProductId;
  settings: Settings;
  /** null = use the most accurate method */
  method: MethodId | null;
  /** Share of next month's demand that can't be supplied, 0–1 */
  cut: number;
  rule: Rule;
  /** Priority order for the "priority" rule */
  order: RegionId[];
  bullwhip: BullwhipSettings;
}

export const DEFAULT_CUT = 0.3;

const SETTINGS: Record<keyof Settings, { param: string; min: number; max: number }> = {
  price: { param: "price", min: 0, max: 1e7 },
  unitCost: { param: "cost", min: 0, max: 1e7 },
  holdPerMonth: { param: "hold", min: 0, max: 1 },
  orderCost: { param: "setup", min: 0, max: 1e9 },
  leadMonths: { param: "lead", min: 0, max: 24 },
  serviceLevel: { param: "sl", min: 0.5, max: 0.9999 },
  salvageShare: { param: "salv", min: 0, max: 1 },
};

const num = (params: URLSearchParams, name: string) => {
  const raw = params.get(name);
  const n = raw === null || raw.trim() === "" ? NaN : Number(raw);
  return Number.isFinite(n) ? n : null;
};

export function defaultScenario(id: ProductId): Scenario {
  const p = productById(id);
  return { productId: p.id, settings: { ...p.defaults }, method: null, cut: DEFAULT_CUT, rule: "proportional", order: p.regions.map((r) => r.id), bullwhip: { ...DEFAULT_BULLWHIP } };
}

export function readScenario(search: string): Scenario {
  const params = new URLSearchParams(search);
  const s = defaultScenario(productById(params.get("p") ?? PRODUCTS[0]!.id).id);
  for (const [key, { param, min, max }] of Object.entries(SETTINGS) as [keyof Settings, (typeof SETTINGS)[keyof Settings]][]) {
    const n = num(params, param);
    if (n !== null && n >= min && n <= max) s.settings[key] = n;
  }
  const m = params.get("m");
  if (METHODS.some((x) => x.id === m)) s.method = m as MethodId;
  const cut = num(params, "cut");
  if (cut !== null && cut >= 0 && cut <= 1) s.cut = cut;
  const rule = params.get("rule");
  if (RULES.some((r) => r.id === rule)) s.rule = rule as Rule;
  const order = (params.get("order") ?? "").split(",").filter((x): x is RegionId => s.order.includes(x as RegionId));
  if (order.length === s.order.length && new Set(order).size === order.length) s.order = order;
  const bl = num(params, "bl");
  if (bl !== null && bl >= 0 && bl <= 12) s.bullwhip.leadMonths = bl;
  const bw = num(params, "bw");
  if (bw !== null && bw >= 1 && bw <= 24) s.bullwhip.window = bw;
  if (params.get("share") === "1") s.bullwhip.share = true;
  return s;
}

export function scenarioQuery(s: Scenario) {
  const base = defaultScenario(s.productId);
  const params = new URLSearchParams();
  params.set("p", s.productId);
  for (const [key, { param }] of Object.entries(SETTINGS) as [keyof Settings, { param: string }][]) {
    if (s.settings[key] !== base.settings[key]) params.set(param, String(s.settings[key]));
  }
  if (s.method) params.set("m", s.method);
  if (s.cut !== base.cut) params.set("cut", String(s.cut));
  if (s.rule !== base.rule) params.set("rule", s.rule);
  if (s.order.join(",") !== base.order.join(",")) params.set("order", s.order.join(","));
  if (s.bullwhip.leadMonths !== base.bullwhip.leadMonths) params.set("bl", String(s.bullwhip.leadMonths));
  if (s.bullwhip.window !== base.bullwhip.window) params.set("bw", String(s.bullwhip.window));
  if (s.bullwhip.share) params.set("share", "1");
  return `?${params.toString()}`;
}

/** Switching product starts its assumptions fresh but keeps the bullwhip settings. */
export const switchProduct = (s: Scenario, id: ProductId): Scenario => ({ ...defaultScenario(id), bullwhip: s.bullwhip });
