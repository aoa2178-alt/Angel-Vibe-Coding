// Step 5: will it get there on time? Real delivery performance from the DataCo Smart Supply Chain dataset (CC BY 4.0),
// used as the benchmark for the products' distribution network. Rates are always recomputed from order counts, so every
// slice is order-weighted. Pure functions only.
import data from "@/data/delivery.json";
import type { RegionId } from "./products";

export interface Cell {
  orders: number;
  /** Orders that arrived after the promised date */
  late: number;
  /** Σ orders × (actual − scheduled shipping days) */
  daysLate: number;
  cancelled: number;
  sales: number;
  profit: number;
  market?: string;
  region?: string;
  mode?: string;
  category?: string;
}

export const DELIVERY = data as unknown as {
  source: { title: string; authors: string; year: number; version: number; doi: string; url: string; license: string; note: string };
  totalOrders: number;
  marketMode: Cell[];
  regionMode: Cell[];
  category: Cell[];
  mode: Cell[];
};

export const MODES = ["Standard Class", "Second Class", "First Class", "Same Day"] as const;
export type Mode = (typeof MODES)[number];
export const MARKETS = ["USCA", "LATAM", "Europe", "Africa", "Pacific Asia"] as const;

export const MARKET_LABEL: Record<string, string> = { USCA: "US & Canada", LATAM: "Latin America", Europe: "Europe", Africa: "Africa", "Pacific Asia": "Pacific Asia" };

/** Which DataCo markets stand in for each of Throughline's regions. */
export const REGION_MARKETS: Record<RegionId, string[]> = { americas: ["USCA", "LATAM"], emea: ["Europe", "Africa"], apac: ["Pacific Asia"] };

/** Add cells up; rates come from the totals. */
export function combine(cells: Cell[]) {
  const t = cells.reduce(
    (a, c) => ({ orders: a.orders + c.orders, late: a.late + c.late, daysLate: a.daysLate + c.daysLate, sales: a.sales + c.sales, profit: a.profit + c.profit }),
    { orders: 0, late: 0, daysLate: 0, sales: 0, profit: 0 },
  );
  return {
    ...t,
    lateRate: t.orders > 0 ? t.late / t.orders : 0,
    avgDaysLate: t.orders > 0 ? t.daysLate / t.orders : 0,
    margin: t.sales > 0 ? t.profit / t.sales : 0,
  };
}

export const byMode = (mode: string) => combine(DELIVERY.marketMode.filter((c) => c.mode === mode));
export const byMarket = (market: string) => combine(DELIVERY.marketMode.filter((c) => c.market === market));
export const cell = (market: string, mode: string) => combine(DELIVERY.marketMode.filter((c) => c.market === market && c.mode === mode));

/** Expected on-time rate for one of the products' regions, shipping with `mode`. */
export function onTime(region: RegionId, mode: string) {
  const c = combine(DELIVERY.marketMode.filter((x) => REGION_MARKETS[region].includes(x.market!) && x.mode === mode));
  return { ...c, onTimeRate: 1 - c.lateRate };
}

/** The spread of late rates across modes and across markets: which one actually drives lateness. */
export function spread() {
  const modes = MODES.map((m) => ({ mode: m, ...byMode(m) }));
  const markets = MARKETS.map((m) => ({ market: m, ...byMarket(m) }));
  const range = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
  return { modes, markets, modeRange: range(modes.map((m) => m.lateRate)), marketRange: range(markets.map((m) => m.lateRate)) };
}

/** Region × mode lanes with the most late orders. */
export function topLateLanes(n = 8) {
  return [...DELIVERY.regionMode].sort((a, b) => b.late - a.late).slice(0, n).map((c) => ({ ...c, lateRate: c.late / c.orders }));
}

/** Product categories with the highest late rate, among those with at least `minOrders` orders. */
export function worstCategories(n = 6, minOrders = 1000) {
  return DELIVERY.category
    .filter((c) => c.orders >= minOrders)
    .map((c) => ({ ...c, lateRate: c.late / c.orders }))
    .sort((a, b) => b.lateRate - a.lateRate)
    .slice(0, n);
}
