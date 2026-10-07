// Tender's analysis: spend (Pareto, concentration, savings), should-cost (build-up and the index check), bids (total cost
// of ownership, scorecard, award split) and negotiation (walk-away, target, bargaining zone, deal structures). Pure functions.
import { BIDS, CATEGORIES, growth, latest, monthlyDelayCost, pct, type Bid, type Category, type Settings } from "./data";

/* ---------- 1. Spend ---------- */

export function spend(categories: Category[] = CATEGORIES) {
  const rows = categories.map((c) => {
    const total = c.qty * c.unitPrice;
    const top = Math.max(...c.suppliers.map((x) => x.share));
    return { ...c, total, topShare: top, singleSource: c.suppliers.length === 1, savingsLow: total * c.savings[0], savingsHigh: total * c.savings[1] };
  });
  const grand = rows.reduce((a, r) => a + r.total, 0);
  const sorted = [...rows].sort((a, b) => b.total - a.total);
  let cum = 0;
  const pareto = sorted.map((r) => {
    cum += r.total;
    return { ...r, share: r.total / grand, cumulative: cum / grand };
  });
  return {
    grand,
    pareto,
    singleSource: pareto.filter((r) => r.singleSource),
    savingsLow: rows.reduce((a, r) => a + r.savingsLow, 0),
    savingsHigh: rows.reduce((a, r) => a + r.savingsHigh, 0),
  };
}

/* ---------- 2. Should-cost of one 80 MVA transformer ---------- */

export interface CostLine {
  id: string;
  label: string;
  /** Today's cost, $ */
  cost: number;
  /** What the same line cost in January 2019, $ */
  cost2019: number;
  basis: string;
}

/** A cost build-up for one large power transformer. Quantities and rates are assumptions; prices move with public series. */
export function shouldCost(): { lines: CostLine[]; total: number; total2019: number; costGrowth: number; ppiGrowth: number; margin: number } {
  const copperT = latest("copper").value;
  const copperGrowth = growth("copper");
  const steelGrowth = growth("steel");
  const partsGrowth = growth("components");
  const wage = latest("wages").value;
  const wageGrowth = growth("wages");
  const direct: CostLine[] = [
    { id: "copper", label: "Copper windings (30 t)", cost: 30 * copperT, cost2019: (30 * copperT) / copperGrowth, basis: `30 t × $${Math.round(copperT).toLocaleString("en-US")}/t (IMF copper price)` },
    { id: "core", label: "Electrical steel core (60 t)", cost: 60 * 5000, cost2019: (60 * 5000) / steelGrowth, basis: "60 t × $5,000/t grain-oriented steel, moved with the iron and steel price index" },
    { id: "tank", label: "Tank and structural steel (40 t)", cost: 40 * 1200, cost2019: (40 * 1200) / steelGrowth, basis: "40 t × $1,200/t, moved with the iron and steel price index" },
    { id: "parts", label: "Bushings, tap changer, insulation, oil, cooling", cost: 900_000, cost2019: 900_000 / partsGrowth, basis: "Bought-in components, moved with the electrical equipment price index" },
    { id: "labor", label: "Factory labor (9,000 hours)", cost: 9000 * wage * 2, cost2019: (9000 * wage * 2) / wageGrowth, basis: `9,000 h × $${wage.toFixed(2)}/h manufacturing wage × 2 for benefits and payroll costs` },
  ];
  const sub = direct.reduce((a, l) => a + l.cost, 0);
  const sub2019 = direct.reduce((a, l) => a + l.cost2019, 0);
  const lines: CostLine[] = [
    ...direct,
    { id: "overhead", label: "Factory overhead (30%)", cost: 0.3 * sub, cost2019: 0.3 * sub2019, basis: "30% of materials and labor" },
    { id: "testing", label: "Engineering and testing", cost: 250_000, cost2019: 250_000 / wageGrowth, basis: "Design, factory acceptance tests" },
    { id: "freight", label: "Freight and rigging", cost: 200_000, cost2019: 200_000, basis: "Heavy haul and placement on site" },
  ];
  const beforeMargin = lines.reduce((a, l) => a + l.cost, 0);
  const before2019 = lines.reduce((a, l) => a + l.cost2019, 0);
  const margin = 0.15;
  lines.push({ id: "margin", label: "Supplier margin (15%)", cost: beforeMargin * margin, cost2019: before2019 * margin, basis: "A fair margin for a capital-equipment maker" });
  const total = beforeMargin * (1 + margin);
  const total2019 = before2019 * (1 + margin);
  return { lines, total, total2019, costGrowth: total / total2019, ppiGrowth: growth("transformers"), margin };
}

/* ---------- 3. Bids: total cost of ownership ---------- */

export const QTY = 3;
/** Transformers needed to energize the hall (the third is the spare: N+1) */
export const NEEDED = 2;

export interface Tco {
  bid: Bid;
  price: number;
  freight: number;
  /** Interest on the money paid up front while waiting for delivery */
  financing: number;
  /** Expected cost of units failing acceptance tests (a quarter of the unit price each to repair) */
  quality: number;
  monthsLate: number;
  /** Months late × cost of a month late */
  lateness: number;
  total: number;
}

export function tco(b: Bid, s: Settings, qty = QTY, leadMonths = b.leadMonths, priceFactor = 1): Tco {
  const price = qty * b.price * priceFactor;
  const freight = price * b.freight;
  const financing = price * b.upfront * s.costOfCapital * (leadMonths / 12);
  const quality = qty * b.defect * 0.25 * b.price * priceFactor;
  const monthsLate = Math.max(0, leadMonths - s.needByMonths);
  const lateness = monthsLate * monthlyDelayCost(s).total;
  return { bid: b, price, freight, financing, quality, monthsLate, lateness, total: price + freight + financing + quality + lateness };
}

export const ranked = (s: Settings, bids: Bid[] = BIDS) => bids.map((b) => tco(b, s)).sort((a, b) => a.total - b.total);

export const CRITERIA = [
  { id: "cost", label: "Total cost" },
  { id: "delivery", label: "Delivery" },
  { id: "quality", label: "Quality" },
  { id: "risk", label: "Supply risk" },
  { id: "capacity", label: "Capacity" },
] as const;

/** Scores 1–5 per criterion and a weighted total out of 100. */
export function scorecard(s: Settings, bids: Bid[] = BIDS) {
  const t = bids.map((b) => tco(b, s));
  const minTotal = Math.min(...t.map((x) => x.total));
  const minDefect = Math.min(...bids.map((b) => b.defect));
  const w = s.weights;
  const wsum = w.cost + w.delivery + w.quality + w.risk + w.capacity || 1;
  return t
    .map((x) => {
      const scores = {
        cost: 5 * (minTotal / x.total),
        delivery: Math.max(1, 5 - x.monthsLate / 2),
        quality: 5 * (minDefect / x.bid.defect),
        risk: x.bid.risk,
        capacity: x.bid.capacity,
      };
      const total = ((w.cost * scores.cost + w.delivery * scores.delivery + w.quality * scores.quality + w.risk * scores.risk + w.capacity * scores.capacity) / wsum) * 20;
      return { supplier: x.bid.supplier, scores, total };
    })
    .sort((a, b) => b.total - a.total);
}

/* ---------- Award split ---------- */

/** Volume discount for ordering several units from one supplier */
export const tierDiscount = (units: number) => (units >= 3 ? 0.04 : units === 2 ? 0.02 : 0);

export interface Award {
  label: string;
  units: { supplier: string; units: number }[];
  /** Price + freight + financing + quality, with volume tiers */
  cost: number;
  /** Months late, waiting for the second unit to arrive (N = 2) */
  monthsLate: number;
  lateness: number;
  /** Chance fewer than two units arrive because a supplier fails, given each fails independently */
  pShort: number;
  expectedDisruption: number;
  total: number;
}

export function award(label: string, units: { supplier: string; units: number }[], s: Settings, bids: Bid[] = BIDS): Award {
  const parts = units.map((u) => {
    const b = bids.find((x) => x.supplier === u.supplier)!;
    const t = tco(b, { ...s, needByMonths: Infinity }, u.units, b.leadMonths, 1 - tierDiscount(u.units));
    return { b, u, cost: t.price + t.freight + t.financing + t.quality };
  });
  const leads = parts.flatMap((p) => Array<number>(p.u.units).fill(p.b.leadMonths)).sort((a, b) => a - b);
  const live = leads[NEEDED - 1] ?? Infinity;
  const monthsLate = Math.max(0, live - s.needByMonths);
  const monthly = monthlyDelayCost(s).total;
  // Enumerate which suppliers fail; the hall slips if the survivors deliver fewer than NEEDED units.
  let pShort = 0;
  for (let mask = 0; mask < 1 << parts.length; mask++) {
    let p = 1;
    let delivered = 0;
    parts.forEach((x, i) => {
      const fails = (mask >> i) & 1;
      p *= fails ? s.disruption : 1 - s.disruption;
      if (!fails) delivered += x.u.units;
    });
    if (delivered < NEEDED) pShort += p;
  }
  const cost = parts.reduce((a, p) => a + p.cost, 0);
  const lateness = monthsLate * monthly;
  const expectedDisruption = pShort * s.disruptionMonths * monthly;
  return { label, units, cost, monthsLate, lateness, pShort, expectedDisruption, total: cost + lateness + expectedDisruption };
}

/** Single source from the best bid, a 2 + 1 split with the runner-up, and 1 + 1 + 1 across the top three. */
export function awardOptions(s: Settings) {
  const r = ranked(s);
  const [a, b, c] = [r[0]!.bid.supplier, r[1]!.bid.supplier, r[2]!.bid.supplier];
  return [
    award(`All three from ${a}`, [{ supplier: a, units: 3 }], s),
    award(`Two from ${a}, one from ${b}`, [{ supplier: a, units: 2 }, { supplier: b, units: 1 }], s),
    award(`One each from ${a}, ${b} and ${c}`, [{ supplier: a, units: 1 }, { supplier: b, units: 1 }, { supplier: c, units: 1 }], s),
  ];
}

/* ---------- 4. Negotiate ---------- */

export function negotiation(s: Settings) {
  const r = ranked(s);
  const best = r[0]!;
  const next = r[1]!;
  const sc = shouldCost();
  // Walk-away: the unit price at which the chosen bid's total cost matches the runner-up's.
  const perUnitShare = best.price / QTY;
  const nonPrice = best.total - best.price - best.freight - best.financing - best.quality;
  const priceCoef = QTY * (1 + best.bid.freight + best.bid.upfront * s.costOfCapital * (best.bid.leadMonths / 12) + best.bid.defect * 0.25);
  const walkAway = (next.total - nonPrice) / priceCoef;
  // Target: the quote as if it had risen only as fast as the transformer's costs since 2019, not as fast as the price index.
  const target = perUnitShare * (sc.costGrowth / sc.ppiGrowth);
  // The supplier's floor: should-cost with a thin 5% margin.
  const floor = (sc.total / (1 + sc.margin)) * 1.05;
  return {
    best,
    next,
    quoted: perUnitShare,
    shouldCost: sc.total,
    walkAway,
    target,
    floor,
    /** The price range both sides could accept: from the supplier's floor to our walk-away */
    zone: { low: floor, high: walkAway },
    savingsAtTarget: (perUnitShare - target) * QTY,
  };
}

export interface Structure {
  id: string;
  label: string;
  detail: string;
  /** Total cost for the three units, including lateness */
  total: number;
  /** Price exposure to the transformer price index over the term */
  indexRisk: string;
}

/** Three ways to buy from the chosen supplier: spot, a framework agreement, or a capacity reservation. */
export function structures(s: Settings, bid: Bid = ranked(s)[0]!.bid): Structure[] {
  const spot = tco(bid, s);
  const framework = tco(bid, s, QTY, bid.leadMonths, 0.94);
  const reserveLead = Math.max(0, bid.leadMonths - 6);
  const reserve = tco(bid, s, QTY, reserveLead);
  const deposit = 0.15 * QTY * bid.price;
  const depositCost = deposit * s.costOfCapital * (bid.leadMonths / 12);
  const ppi = growth("transformers");
  return [
    { id: "spot", label: "Spot purchase", detail: "Today's quote, today's lead time.", total: spot.total, indexRisk: "None: the price is fixed." },
    {
      id: "framework",
      label: "Framework agreement",
      detail: "Commit to nine more units for the next halls over three years for 6% off, with the price linked to the transformer price index.",
      total: framework.total,
      indexRisk: `Follows the index, which rose ${pct(ppi - 1)} since January 2019.`,
    },
    {
      id: "reserve",
      label: "Capacity reservation",
      detail: `A 15% deposit (${"$"}${(deposit / 1e6).toFixed(1)}M) now buys a factory slot six months earlier.`,
      total: reserve.total + depositCost,
      indexRisk: "None, plus the cost of tying up the deposit.",
    },
  ];
}

export { growth };
