// The two fictional products, and their demand history: the shape of a real public US series, rescaled to units.
// Company and product names are made up; the demand pattern is real (Census data via FRED, see src/data/demand.json).
import data from "@/data/demand.json";

export type ProductId = "tablet" | "server";
export type RegionId = "americas" | "emea" | "apac";

export interface Region {
  id: RegionId;
  label: string;
  /** Share of demand, 0–1 (an assumption) */
  share: number;
  /** Selling price there, $ */
  price: number;
}

export interface Settings {
  /** Selling price at list, $ (regional prices scale with it) */
  price: number;
  /** Cost to build one, $ */
  unitCost: number;
  /** Holding cost, share of unit cost per month */
  holdPerMonth: number;
  /** Fixed cost of one production run or order, $ */
  orderCost: number;
  /** Months from placing an order to having the units */
  leadMonths: number;
  /** Target chance of not running out in a replenishment cycle, 0–1 */
  serviceLevel: number;
  /** What an unsold unit fetches at the end, share of unit cost */
  salvageShare: number;
}

export interface Product {
  id: ProductId;
  name: string;
  company: string;
  kind: string;
  tagline: string;
  /** Average monthly units over the last 12 months of history */
  baseUnits: number;
  regions: Region[];
  defaults: Settings;
  /** Which public series lends this product its demand pattern */
  series: { id: string; title: string; unit: string; publisher: string; source: string; points: { month: string; value: number }[] };
  /** Why that series is a reasonable stand-in */
  why: string;
}

export const DATA = data as unknown as { retrieved: string; series: Record<ProductId, Product["series"]> };

export const PRODUCTS: Product[] = [
  {
    id: "tablet",
    name: "Wren tablet",
    company: "Northbeam Devices",
    kind: "Consumer tablet",
    tagline: "A mid-range tablet sold through retail in three regions, with a big holiday peak.",
    baseUnits: 200_000,
    regions: [
      { id: "americas", label: "Americas", share: 0.45, price: 499 },
      { id: "emea", label: "Europe, Middle East & Africa", share: 0.3, price: 529 },
      { id: "apac", label: "Asia-Pacific", share: 0.25, price: 469 },
    ],
    defaults: { price: 499, unitCost: 310, holdPerMonth: 0.02, orderCost: 250_000, leadMonths: 2, serviceLevel: 0.95, salvageShare: 0.5 },
    series: DATA.series.tablet,
    why: "US retail sales at electronics stores, not seasonally adjusted: the same holiday spike and slow drift a consumer device sees.",
  },
  {
    id: "server",
    name: "Kestrel 8-GPU server",
    company: "Northbeam Systems",
    kind: "AI server",
    tagline: "An 8-GPU server sold to cloud providers in big, lumpy orders, with long component lead times.",
    baseUnits: 1_500,
    regions: [
      { id: "americas", label: "US hyperscalers", share: 0.6, price: 300_000 },
      { id: "emea", label: "European clouds", share: 0.25, price: 315_000 },
      { id: "apac", label: "Asian clouds", share: 0.15, price: 290_000 },
    ],
    defaults: { price: 300_000, unitCost: 230_000, holdPerMonth: 0.03, orderCost: 500_000, leadMonths: 6, serviceLevel: 0.95, salvageShare: 0.5 },
    series: DATA.series.server,
    why: "New orders at US computer manufacturers, not seasonally adjusted: B2B orders that arrive in lumps rather than a smooth stream.",
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0]!;

/** Monthly units: the series rescaled so its last 12 months average the product's base volume. */
export function history(p: Product) {
  const pts = p.series.points;
  const recent = pts.slice(-12).reduce((n, x) => n + x.value, 0) / Math.min(12, pts.length);
  return pts.map((x) => ({ month: x.month, units: (x.value / recent) * p.baseUnits }));
}

/** Regional prices move with the list price you set. */
export const regionPrice = (p: Product, r: Region, s: Settings) => r.price * (s.price / p.defaults.price);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-07" → "Jul 2026" */
export const formatMonth = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
/** The month after "2026-07", n months on */
export function addMonths(m: string, n: number) {
  const i = Number(m.slice(0, 4)) * 12 + Number(m.slice(5, 7)) - 1 + n;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}

export function formatUnits(n: number) {
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(a >= 1e7 ? 0 : 1)}M`;
  if (a >= 1e4) return `${Math.round(n / 1e3)}K`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

export function formatMoney(n: number) {
  const a = Math.abs(n);
  const sign = n < -0.5 ? "−" : "";
  const fmt = (v: number, d: number) => v.toFixed(d).replace(/\.0+$/, "");
  if (a >= 1e9) return `${sign}$${fmt(a / 1e9, a >= 1e10 ? 1 : 2)}B`;
  if (a >= 1e6) return `${sign}$${fmt(a / 1e6, a >= 1e8 ? 0 : 1)}M`;
  if (a >= 1e3) return `${sign}$${Math.round(a / 1e3)}K`;
  return `${sign}$${Math.round(a)}`;
}

export const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;
