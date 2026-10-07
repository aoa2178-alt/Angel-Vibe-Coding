// Step 2: the supply plan. Safety stock for a service level, EOQ for order size, a 12-month projection,
// total cost, and the launch quantity from the newsvendor model. Pure functions only.
import type { Settings } from "./products";

/* ---------- Normal distribution helpers ---------- */

export function normCdf(z: number) {
  // Abramowitz & Stegun 7.1.26, |error| < 1.5e-7
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t) * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

export const normPdf = (z: number) => Math.exp(-(z * z) / 2) / Math.sqrt(2 * Math.PI);

/** Inverse of the standard normal CDF (Acklam's rational approximation). */
export function normInv(p: number): number {
  const q = Math.min(1 - 1e-12, Math.max(1e-12, p));
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
  const lo = 0.02425;
  if (q < lo) {
    const r = Math.sqrt(-2 * Math.log(q));
    return (((((c[0]! * r + c[1]!) * r + c[2]!) * r + c[3]!) * r + c[4]!) * r + c[5]!) / ((((d[0]! * r + d[1]!) * r + d[2]!) * r + d[3]!) * r + 1);
  }
  if (q > 1 - lo) return -normInv(1 - q);
  const r = q - 0.5;
  const s = r * r;
  return ((((((a[0]! * s + a[1]!) * s + a[2]!) * s + a[3]!) * s + a[4]!) * s + a[5]!) * r) / (((((b[0]! * s + b[1]!) * s + b[2]!) * s + b[3]!) * s + b[4]!) * s + 1);
}

/** Expected units short per unit of σ: G(z) = φ(z) − z(1 − Φ(z)). */
export const normLoss = (z: number) => normPdf(z) - z * (1 - normCdf(z));

/* ---------- The plan ---------- */

export interface PlanMonth {
  index: number;
  demand: number;
  receipts: number;
  orders: number;
  endingInventory: number;
}

export interface SupplyPlan {
  /** Average monthly demand over the forecast */
  monthlyDemand: number;
  /** z for the service level */
  z: number;
  /** Forecast error over the lead time plus one review month: σ × √(L + 1) */
  sigmaLead: number;
  safetyStock: number;
  /** Economic order quantity √(2DS/H), at least one month's demand */
  eoq: number;
  /** √(2DS/H) before the one-month floor */
  rawEoq: number;
  reorderPoint: number;
  /** Per year */
  holdingCost: number;
  orderingCost: number;
  /** Lost margin on expected stock-outs */
  shortageCost: number;
  totalCost: number;
  /** Share of demand met from stock */
  fillRate: number;
  averageInventory: number;
  months: PlanMonth[];
}

export function supplyPlan(forecast: number[], sigma: number, s: Settings): SupplyPlan {
  const monthlyDemand = forecast.reduce((a, b) => a + b, 0) / forecast.length;
  const annual = monthlyDemand * 12;
  const z = normInv(s.serviceLevel);
  const sigmaLead = sigma * Math.sqrt(s.leadMonths + 1);
  const safetyStock = Math.max(0, z * sigmaLead);
  const holdPerUnitYear = s.unitCost * s.holdPerMonth * 12;
  const rawEoq = Math.sqrt((2 * annual * s.orderCost) / Math.max(1e-9, holdPerUnitYear));
  const eoq = Math.max(monthlyDemand, rawEoq);
  const reorderPoint = monthlyDemand * s.leadMonths + safetyStock;
  const cycles = annual / eoq;
  const shortPerCycle = sigmaLead * normLoss(z);
  const margin = s.price - s.unitCost;
  const averageInventory = safetyStock + eoq / 2;

  // Projection, month by month (MRP netting). Orders inside the lead time are already placed (they cover the forecast).
  // From then on, plan a receipt in EOQ lots whenever ending stock would fall below safety stock, released L months earlier.
  const L = Math.max(0, Math.round(s.leadMonths));
  let onHand = safetyStock + eoq / 2;
  const months: PlanMonth[] = forecast.map((demand, i) => ({ index: i, demand, receipts: 0, orders: 0, endingInventory: 0 }));
  for (const m of months) {
    let receipts = m.index < L ? m.demand : 0;
    if (m.index >= L) while (onHand + receipts - m.demand < safetyStock - 1e-9) receipts += eoq;
    m.receipts = receipts;
    onHand += receipts - m.demand;
    m.endingInventory = onHand;
    if (m.index >= L && receipts > 0 && months[m.index - L]) months[m.index - L]!.orders += receipts;
  }

  const holdingCost = averageInventory * holdPerUnitYear;
  const orderingCost = cycles * s.orderCost;
  const shortageCost = cycles * shortPerCycle * margin;
  return {
    monthlyDemand,
    z,
    sigmaLead,
    safetyStock,
    eoq,
    rawEoq,
    reorderPoint,
    holdingCost,
    orderingCost,
    shortageCost,
    totalCost: holdingCost + orderingCost + shortageCost,
    fillRate: Math.max(0, 1 - (cycles * shortPerCycle) / annual),
    averageInventory,
    months,
  };
}

/** Total yearly cost at each service level: the price of the last few points of service. */
export function serviceCurve(forecast: number[], sigma: number, s: Settings, levels = [0.8, 0.85, 0.9, 0.95, 0.975, 0.99, 0.995, 0.999]) {
  return levels.map((serviceLevel) => {
    const p = supplyPlan(forecast, sigma, { ...s, serviceLevel });
    return { serviceLevel, holding: p.holdingCost, total: p.totalCost, safetyStock: p.safetyStock, fillRate: p.fillRate };
  });
}

/* ---------- Launch quantity (newsvendor) ---------- */

export interface Launch {
  /** Expected demand over the first quarter on sale */
  mean: number;
  sd: number;
  /** Margin lost per unit short */
  underage: number;
  /** Loss per unit left over: cost − salvage */
  overage: number;
  criticalRatio: number;
  quantity: number;
}

/** How many to build for the first quarter of a new model: Q* = μ + zσ at the critical ratio Cu ÷ (Cu + Co). */
export function launchQuantity(forecast: number[], sigma: number, s: Settings): Launch {
  const mean = forecast.slice(0, 3).reduce((a, b) => a + b, 0);
  const sd = sigma * Math.sqrt(3);
  const underage = Math.max(0, s.price - s.unitCost);
  const overage = Math.max(0, s.unitCost * (1 - s.salvageShare));
  const criticalRatio = underage + overage > 0 ? underage / (underage + overage) : 0.5;
  return { mean, sd, underage, overage, criticalRatio, quantity: Math.max(0, mean + normInv(criticalRatio) * sd) };
}
