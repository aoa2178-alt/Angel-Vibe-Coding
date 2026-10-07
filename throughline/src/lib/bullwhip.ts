// Step 4: the bullwhip effect. A four-tier chain (retailer → distributor → factory → supplier), each ordering with an
// order-up-to policy and a moving-average forecast. Small swings in customer demand grow at every tier. Pure functions only.

export const TIERS = ["Retailer", "Distributor", "Factory", "Supplier"] as const;

export interface BullwhipSettings {
  /** Months between ordering and receiving, at every tier */
  leadMonths: number;
  /** Months in each tier's moving-average forecast */
  window: number;
  /** Every tier forecasts from end-customer demand instead of the orders it receives */
  share: boolean;
}

export const DEFAULT_BULLWHIP: BullwhipSettings = { leadMonths: 2, window: 4, share: false };

export interface BullwhipResult {
  /** Customer demand, then each tier's orders, month by month */
  series: { label: string; values: number[] }[];
  /** Variance of each tier's orders ÷ variance of customer demand */
  ratios: number[];
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const variance = (xs: number[]) => {
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / xs.length;
};

/**
 * Each tier sees incoming orders d_t, forecasts F_t = average of its last `window` signals (its own orders, or customer
 * demand when sharing), targets S_t = (L + 1) × F_t, and orders q_t = max(0, d_t + S_t − S_{t−1}).
 */
export function bullwhip(demand: number[], b: BullwhipSettings): BullwhipResult {
  const w = Math.max(1, Math.round(b.window));
  const L = Math.max(0, b.leadMonths);
  const forecastAt = (xs: number[], t: number) => mean(xs.slice(Math.max(0, t - w + 1), t + 1));
  const series = [{ label: "Customer demand", values: demand }];
  let incoming = demand;
  for (const tier of TIERS) {
    const signal = b.share ? demand : incoming;
    const orders = incoming.map((d, t) => {
      if (t === 0) return d;
      const target = (L + 1) * forecastAt(signal, t);
      const prev = (L + 1) * forecastAt(signal, t - 1);
      return Math.max(0, d + target - prev);
    });
    series.push({ label: tier, values: orders });
    incoming = orders;
  }
  const base = variance(demand.slice(w));
  return { series, ratios: series.slice(1).map((x) => (base > 0 ? variance(x.values.slice(w)) / base : 1)) };
}
