// Step 3: what it costs to bring a signal to people who have none, and who should pay.
//
// People without a mobile-broadband signal live mostly in remote areas, then rural ones. Each area is split into three
// tranches that get harder (and dearer) to reach. For each tranche we pick the technology with the lowest cost per person
// actually connected: (capex + present value of running costs) ÷ the share who go online. A budget funds the cheapest
// tranches first, which is optimal when tranches can be partly funded (the fractional knapsack). Then the viability gap
// splits who pays: operators fund what revenue covers, the universal service fund the next part, government and donors the rest.
import { v, type Country } from "./data";

export type Area = "urban" | "rural" | "remote";
export type TechId = "macro" | "small" | "satellite";

export interface Tech {
  id: TechId;
  label: string;
  /** Capex and yearly running cost per person covered, by area */
  capex: Record<Area, number>;
  opex: Record<Area, number>;
}

/** Illustrative costs per person covered (see Sources), scaled to ITU "Connecting Humanity" totals. */
export const TECHS: Tech[] = [
  { id: "macro", label: "4G tower (macro site)", capex: { urban: 12, rural: 40, remote: 150 }, opex: { urban: 1.5, rural: 4, remote: 15 } },
  { id: "small", label: "Small cell", capex: { urban: 15, rural: 50, remote: 85 }, opex: { urban: 2, rural: 6, remote: 10 } },
  { id: "satellite", label: "Satellite hotspot (LEO)", capex: { urban: 60, rural: 45, remote: 35 }, opex: { urban: 14, rural: 13, remote: 12 } },
];

/** Cost multipliers for the three tranches of each area: easier, typical, hardest to reach. */
export const TRANCHES = [0.75, 1, 1.5] as const;

export interface BuildSettings {
  /** People with no mobile-broadband signal, share of population (null = the country default) */
  gap: number | null;
  /** Share of the people without a signal who live in remote (rather than ordinary rural) areas */
  remote: number;
  /** Share of newly covered people who go online */
  adoption: number;
  years: number;
  rate: number;
  /** Budget for building coverage, as a share of the cost of covering everyone */
  fund: number;
  /** Monthly revenue per user, $ (null = the step-2 data plan price) */
  arpu: number | null;
  margin: number;
  /** Universal service fund levy on telecom revenue */
  levy: number;
}

export const DEFAULT_BUILD: BuildSettings = { gap: null, remote: 0.6, adoption: 0.5, years: 10, rate: 0.1, fund: 0.5, arpu: null, margin: 0.35, levy: 0.025 };

/**
 * Default coverage gap (share of people with no mobile-broadband signal), from GSMA's State of Mobile Internet
 * Connectivity 2025: Sub-Saharan Africa 10%, South Asia 4%, world 4%. High-income countries are set at 1% (estimate).
 */
export function defaultGap(c: Country) {
  if (c.region === "Sub-Saharan Africa") return 0.1;
  if (c.region === "South Asia") return 0.04;
  if (c.income === "High income") return 0.01;
  return 0.04;
}

/** Present value of 1 a year for n years at rate r. */
export const annuity = (n: number, r: number) => (r === 0 ? n : (1 - Math.pow(1 + r, -n)) / r);

export interface Tranche {
  id: string;
  area: Area;
  level: number;
  /** People without a signal in this tranche */
  people: number;
  tech: Tech;
  /** Lifetime cost per person covered and per person connected */
  costPerCovered: number;
  costPerUser: number;
  cost: number;
  users: number;
}

/** People without a signal, by area: the remote share first, the rest rural, and any beyond the rural population urban. */
export function uncovered(c: Country, s: BuildSettings) {
  const pop = v(c, "pop") ?? 0;
  const ruralPop = (pop * (v(c, "rural") ?? 0)) / 100;
  const total = pop * (s.gap ?? defaultGap(c));
  const countryside = Math.min(total, ruralPop);
  const out: Record<Area, number> = { remote: countryside * s.remote, rural: countryside * (1 - s.remote), urban: total - countryside };
  return { out, total };
}

/** Lifetime cost per person covered for a technology in an area. */
export const lifetime = (t: Tech, a: Area, s: BuildSettings, mult = 1) => mult * (t.capex[a] + t.opex[a] * annuity(s.years, s.rate));

export function tranches(c: Country, s: BuildSettings): Tranche[] {
  const { out } = uncovered(c, s);
  const list: Tranche[] = [];
  for (const area of ["urban", "rural", "remote"] as Area[]) {
    if (out[area] <= 0) continue;
    TRANCHES.forEach((mult, level) => {
      const tech = [...TECHS].sort((x, y) => lifetime(x, area, s, mult) - lifetime(y, area, s, mult))[0]!;
      const costPerCovered = lifetime(tech, area, s, mult);
      const people = out[area] / TRANCHES.length;
      list.push({
        id: `${area}-${level + 1}`,
        area,
        level: level + 1,
        people,
        tech,
        costPerCovered,
        costPerUser: costPerCovered / s.adoption,
        cost: costPerCovered * people,
        users: people * s.adoption,
      });
    });
  }
  return list;
}

/** Fund the cheapest people first until the budget runs out; the last tranche may be partly funded. */
export const fullCost = (list: Tranche[]) => list.reduce((a, t) => a + t.cost, 0);

export function allocate(list: Tranche[], budget: number) {
  let left = budget;
  const funded = [...list]
    .sort((a, b) => a.costPerUser - b.costPerUser)
    .map((t) => {
      const share = t.cost <= 0 ? 1 : Math.max(0, Math.min(1, left / t.cost));
      left -= share * t.cost;
      return { tranche: t, share, spend: share * t.cost, users: share * t.users };
    });
  return { funded, spend: budget - left, users: funded.reduce((a, f) => a + f.users, 0) };
}

/** Coverage curve: people connected for each budget level, up to the full cost. */
export function curve(list: Tranche[], steps = 24) {
  const full = fullCost(list);
  return Array.from({ length: steps + 1 }, (_, k) => {
    const b = (full * k) / steps;
    return { budget: b, users: allocate(list, b).users };
  });
}

export interface FundingSplit {
  operators: number;
  usf: number;
  public: number;
  total: number;
  /** Present value per connected user of the operator's margin */
  revenuePv: number;
  /** Money the universal service fund raises over the horizon */
  usfPool: number;
}

/** Who pays for the funded plan: operators up to what users' margin repays, then the USF pool, then government and donors. */
export function funding(c: Country, s: BuildSettings, arpu: number, plan: ReturnType<typeof allocate>): FundingSplit {
  const revenuePv = arpu * 12 * s.margin * annuity(s.years, s.rate);
  let operators = 0;
  let gap = 0;
  for (const f of plan.funded) {
    if (f.users <= 0) continue;
    const viable = Math.min(f.spend, revenuePv * f.users);
    operators += viable;
    gap += f.spend - viable;
  }
  const subs = ((v(c, "mobileSubs") ?? 0) / 100) * (v(c, "pop") ?? 0);
  const usfPool = subs * arpu * 12 * s.levy * annuity(s.years, s.rate);
  const usf = Math.min(gap, usfPool);
  return { operators, usf, public: gap - usf, total: plan.spend, revenuePv, usfPool };
}
