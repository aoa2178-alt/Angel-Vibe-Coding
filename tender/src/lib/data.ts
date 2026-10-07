// The sourcing case: a fictional buyer (Meridian Compute) equipping a 96 MW AI data hall, its spend by category and
// supplier, and four fictional transformer bids. Prices are illustrative assumptions anchored to public data where it exists
// (see src/data/prices.json and the Sources page).
import prices from "@/data/prices.json";

export interface Series {
  id: string;
  title: string;
  unit: string;
  source: string;
  points: { month: string; value: number }[];
}

export const PRICES = prices as unknown as { retrieved: string; from: string; series: Record<string, Series> };
export const latest = (key: string) => PRICES.series[key]!.points.at(-1)!;
export const first = (key: string) => PRICES.series[key]!.points[0]!;
/** Latest ÷ January 2019 */
export const growth = (key: string) => latest(key).value / first(key).value;

export const BUYER = { name: "Meridian Compute", project: "Hall B", itMw: 96 };

export interface Category {
  id: string;
  name: string;
  qty: number;
  unit: string;
  /** Average quoted price per unit, $ */
  unitPrice: number;
  /** Spend by supplier, as shares of the category (fictional suppliers) */
  suppliers: { name: string; share: number }[];
  /** Typical savings range from sourcing levers, 0–1 (low, high) */
  savings: [number, number];
  lever: string;
}

export const CATEGORIES: Category[] = [
  { id: "gensets", name: "Backup generators (3 MW)", qty: 40, unit: "units", unitPrice: 1.4e6, suppliers: [{ name: "Kessler Power", share: 0.7 }, { name: "Orion Engines", share: 0.3 }], savings: [0.03, 0.07], lever: "Consolidate volume into one framework and standardize the spec" },
  { id: "racks", name: "Racks and PDUs", qty: 1200, unit: "racks", unitPrice: 25_000, suppliers: [{ name: "Brightline Racks", share: 0.5 }, { name: "Norrland Systems", share: 0.3 }, { name: "Delta Metalworks", share: 0.2 }], savings: [0.05, 0.1], lever: "Competitive re-bid; many qualified suppliers" },
  { id: "transformers", name: "Large power transformers (80 MVA)", qty: 3, unit: "units", unitPrice: 6.5e6, suppliers: [{ name: "Volta Electric", share: 1 }], savings: [0.08, 0.2], lever: "Should-cost negotiation and a second qualified source" },
  { id: "ups", name: "UPS modules (1.5 MW)", qty: 64, unit: "modules", unitPrice: 300_000, suppliers: [{ name: "Cobalt Energy", share: 0.6 }, { name: "Linwood Electric", share: 0.4 }], savings: [0.04, 0.08], lever: "Volume tiers and index-linked pricing" },
  { id: "switchgear", name: "Medium-voltage switchgear", qty: 12, unit: "lineups", unitPrice: 1.2e6, suppliers: [{ name: "Helios Grid", share: 0.8 }, { name: "Northgate Power", share: 0.2 }], savings: [0.04, 0.09], lever: "Bundle with transformers for a package price" },
  { id: "cdus", name: "Liquid-cooling CDUs", qty: 96, unit: "units", unitPrice: 150_000, suppliers: [{ name: "Fjord Thermal", share: 1 }], savings: [0.02, 0.06], lever: "Qualify a second source; the design is new" },
];

export interface Bid {
  supplier: string;
  country: string;
  /** Quoted price per transformer, $ */
  price: number;
  /** Months from order to delivery on site */
  leadMonths: number;
  /** Freight, duty and rigging, share of price */
  freight: number;
  /** Share of price paid at order */
  upfront: number;
  /** Chance a unit fails factory or site acceptance testing, 0–1 */
  defect: number;
  warrantyYears: number;
  /** Supply-risk score 1 (high risk) to 5 (low): geography, finances, single plant */
  risk: number;
  /** Factory capacity score 1 (booked out) to 5 (open slots) */
  capacity: number;
}

/** Four bids for the three transformers (two needed, one spare: N+1). All fictional. */
export const BIDS: Bid[] = [
  { supplier: "Volta Electric", country: "South Korea", price: 5.6e6, leadMonths: 30, freight: 0.08, upfront: 0.3, defect: 0.03, warrantyYears: 2, risk: 3, capacity: 1 },
  { supplier: "Northgate Power", country: "United States", price: 6.4e6, leadMonths: 18, freight: 0.02, upfront: 0.1, defect: 0.02, warrantyYears: 3, risk: 5, capacity: 3 },
  { supplier: "Aster Transformadores", country: "Mexico", price: 5.9e6, leadMonths: 22, freight: 0.04, upfront: 0.2, defect: 0.04, warrantyYears: 2, risk: 4, capacity: 3 },
  { supplier: "Helios Grid", country: "Germany", price: 6.9e6, leadMonths: 14, freight: 0.06, upfront: 0, defect: 0.015, warrantyYears: 5, risk: 4, capacity: 4 },
];

export interface Settings {
  /** Months until the transformers are needed on site */
  needByMonths: number;
  /** Lease rate the hall earns, $ per kW of IT per month */
  leasePerKwMonth: number;
  /** Build cost of the hall, $ millions per MW of IT */
  capexPerMw: number;
  costOfCapital: number;
  /** Chance a given supplier fails to deliver at all (factory, finances, export rules), 0–1 */
  disruption: number;
  /** Months the hall slips if a needed transformer doesn't arrive */
  disruptionMonths: number;
  /** Scorecard weights */
  weights: { cost: number; delivery: number; quality: number; risk: number; capacity: number };
}

export const DEFAULT_SETTINGS: Settings = {
  needByMonths: 20,
  leasePerKwMonth: 150,
  capexPerMw: 11,
  costOfCapital: 0.09,
  disruption: 0.1,
  disruptionMonths: 12,
  weights: { cost: 35, delivery: 30, quality: 15, risk: 15, capacity: 5 },
};

/** What each month the hall stands idle costs: lost lease revenue plus interest on the capital already spent. */
export function monthlyDelayCost(s: Settings) {
  const revenue = BUYER.itMw * 1000 * s.leasePerKwMonth;
  const carrying = (BUYER.itMw * s.capexPerMw * 1e6 * s.costOfCapital) / 12;
  return { revenue, carrying, total: revenue + carrying };
}

/* ---------- Formatting ---------- */

export function formatMoney(n: number) {
  const a = Math.abs(n);
  const sign = n < -0.5 ? "−" : "";
  const fmt = (v: number, d: number) => v.toFixed(d).replace(/\.0+$/, "");
  if (a >= 1e9) return `${sign}$${fmt(a / 1e9, 2)}B`;
  if (a >= 1e6) return `${sign}$${fmt(a / 1e6, a >= 1e8 ? 0 : a >= 1e7 ? 1 : 2)}M`;
  if (a >= 1e3) return `${sign}$${Math.round(a / 1e3)}K`;
  return `${sign}$${Math.round(a)}`;
}
export const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const formatMonth = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]} ${m.slice(0, 4)}`;
