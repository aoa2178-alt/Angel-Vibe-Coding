// Step 3: when supply falls short, who gets it? Three common rules, and what each costs. Pure functions only.
import { regionPrice, type Product, type RegionId, type Settings } from "./products";

export type Rule = "proportional" | "priority" | "margin";

export const RULES: { id: Rule; label: string; blurb: string }[] = [
  { id: "proportional", label: "Fair share", blurb: "Every region gets the same share of what it asked for." },
  { id: "priority", label: "Priority", blurb: "Fill regions in a set order: strategic customers first." },
  { id: "margin", label: "Most margin", blurb: "Fill the most profitable region first." },
];

export interface RegionAllocation {
  id: RegionId;
  label: string;
  demand: number;
  allocated: number;
  fillRate: number;
  unitMargin: number;
  revenue: number;
  margin: number;
}

export interface Allocation {
  supply: number;
  demand: number;
  regions: RegionAllocation[];
  revenue: number;
  margin: number;
  /** Margin a full supply would have earned, minus what this allocation earns */
  marginLost: number;
}

/** Split `supply` units across regions whose total demand is `demand`, by a rule. `order` sets the priority sequence. */
export function allocate(p: Product, s: Settings, demand: number, supply: number, rule: Rule, order: RegionId[] = p.regions.map((r) => r.id)): Allocation {
  const rows = p.regions.map((r) => {
    const price = regionPrice(p, r, s);
    return { id: r.id, label: r.label, demand: demand * r.share, unitMargin: price - s.unitCost, price };
  });
  const avail = Math.max(0, Math.min(supply, demand));
  const given = new Map<RegionId, number>();
  if (rule === "proportional") {
    for (const r of rows) given.set(r.id, demand > 0 ? (r.demand / demand) * avail : 0);
  } else {
    const sequence = rule === "priority" ? order.map((id) => rows.find((r) => r.id === id)!).filter(Boolean) : [...rows].sort((a, b) => b.unitMargin - a.unitMargin);
    let left = avail;
    for (const r of sequence) {
      const take = Math.min(r.demand, left);
      given.set(r.id, take);
      left -= take;
    }
  }
  const regions = rows.map((r) => {
    const allocated = given.get(r.id) ?? 0;
    return {
      id: r.id,
      label: r.label,
      demand: r.demand,
      allocated,
      fillRate: r.demand > 0 ? allocated / r.demand : 1,
      unitMargin: r.unitMargin,
      revenue: allocated * r.price,
      margin: allocated * r.unitMargin,
    };
  });
  const margin = regions.reduce((a, r) => a + r.margin, 0);
  const fullMargin = rows.reduce((a, r) => a + r.demand * r.unitMargin, 0);
  return { supply, demand, regions, revenue: regions.reduce((a, r) => a + r.revenue, 0), margin, marginLost: fullMargin - margin };
}
