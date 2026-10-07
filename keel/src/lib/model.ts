// Keel's driver model for "Halcyon AI", a fictional AI lab's commercial org. Revenue is built from drivers, month by
// month, so the same function gives the plan (planned drivers), the actuals (fixed, fictional drivers) and every
// what-if in between. Pure functions only.

export const MONTHS = 12;
export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface Settings {
  /** Active API developers in month 1 */
  developers: number;
  /** Monthly growth in active developers, 0–1 */
  devGrowth: number;
  /** Millions of tokens one developer uses a month */
  tokensPerDevM: number;
  /** Blended API price, $ per million tokens */
  pricePerM: number;
  /** Compute cost to serve, $ per million tokens */
  computePerM: number;
  /** Enterprise ARR at the start of the year, $ */
  startingArr: number;
  /** New enterprise pipeline created each month, $ of annual contract value */
  pipeline: number;
  /** Share of pipeline won, 0–1 */
  winRate: number;
  /** Share of ARR lost each month, 0–1 */
  churn: number;
  /** ARR added from existing customers each month, as a share of ARR, 0–1 */
  expansion: number;
  /** Account executives at the start of the year */
  reps: number;
  /** New account executives hired each month */
  hiresPerMonth: number;
  /** Annual new-ARR quota per fully ramped rep, $ */
  quota: number;
  /** Share of quota a ramped rep actually closes, 0–1 */
  attainment: number;
  /** Months for a new rep to reach full productivity */
  rampMonths: number;
  /** Fully loaded cost per account executive per year, $ */
  repCost: number;
  /** Other commercial roles (sales engineers, customer success) per account executive */
  supportPerRep: number;
  /** Fully loaded cost per other commercial role per year, $ */
  supportCost: number;
  /** Marketing and programs per month, $ */
  programs: number;
  /** Enterprise gross margin, 0–1 */
  enterpriseMargin: number;
}

/** Illustrative defaults for a fictional mid-size AI lab. The API price matches Breakeven's tracked list price ($2 / $10 per M, 25% output). */
export const DEFAULT_SETTINGS: Settings = {
  developers: 50_000,
  devGrowth: 0.04,
  tokensPerDevM: 100,
  pricePerM: 4,
  computePerM: 1.6,
  startingArr: 300e6,
  pipeline: 30e6,
  winRate: 0.25,
  churn: 0.01,
  expansion: 0.015,
  reps: 60,
  hiresPerMonth: 2,
  quota: 2.4e6,
  attainment: 0.8,
  rampMonths: 4,
  repCost: 300_000,
  supportPerRep: 1.5,
  supportCost: 220_000,
  programs: 3e6,
  enterpriseMargin: 0.75,
};

/** The month-by-month value of every driver. Plans, actuals and what-ifs differ only in these paths. */
export interface Paths {
  developers: number[];
  tokensPerDevM: number[];
  pricePerM: number[];
  pipeline: number[];
  winRate: number[];
  churn: number[];
  expansion: number[];
  /** Account executives on the payroll each month */
  reps: number[];
}

export type DriverId = keyof Paths;

export const DRIVERS: { id: DriverId; label: string; segment: "API" | "Enterprise"; format: "count" | "tokens" | "price" | "money" | "pct" }[] = [
  { id: "developers", label: "Active developers", segment: "API", format: "count" },
  { id: "tokensPerDevM", label: "Tokens per developer", segment: "API", format: "tokens" },
  { id: "pricePerM", label: "Price per M tokens", segment: "API", format: "price" },
  { id: "pipeline", label: "New pipeline", segment: "Enterprise", format: "money" },
  { id: "winRate", label: "Win rate", segment: "Enterprise", format: "pct" },
  { id: "churn", label: "Monthly churn", segment: "Enterprise", format: "pct" },
  { id: "expansion", label: "Monthly expansion", segment: "Enterprise", format: "pct" },
  { id: "reps", label: "Account executives", segment: "Enterprise", format: "count" },
];

export function planPaths(s: Settings): Paths {
  const m = Array.from({ length: MONTHS }, (_, t) => t);
  return {
    developers: m.map((t) => s.developers * Math.pow(1 + s.devGrowth, t)),
    tokensPerDevM: m.map(() => s.tokensPerDevM),
    pricePerM: m.map(() => s.pricePerM),
    pipeline: m.map(() => s.pipeline),
    winRate: m.map(() => s.winRate),
    churn: m.map(() => s.churn),
    expansion: m.map(() => s.expansion),
    reps: m.map((t) => s.reps + s.hiresPerMonth * (t + 1)),
  };
}

export interface MonthResult {
  apiRevenue: number;
  apiCompute: number;
  newArr: number;
  /** New ARR the reps could close, if pipeline allowed */
  capacity: number;
  arr: number;
  enterpriseRevenue: number;
  revenue: number;
  grossProfit: number;
  opex: number;
  contribution: number;
  rampedReps: number;
  headcount: number;
}

/**
 * Runs the year. New ARR each month is the lesser of what the pipeline converts (pipeline × win rate) and what the
 * reps can close (ramped reps × quota ÷ 12 × attainment). Reps hired in a month ramp linearly over `rampMonths`.
 */
export function simulate(p: Paths, s: Settings): MonthResult[] {
  let arr = s.startingArr;
  const out: MonthResult[] = [];
  for (let t = 0; t < MONTHS; t++) {
    const startReps = s.reps;
    // Ramped-equivalent reps: the starting team is fully ramped; each later hire counts as (months since hire ÷ ramp), up to 1.
    let ramped = Math.min(p.reps[t]!, startReps);
    for (let h = 0; h <= t; h++) {
      const hired = Math.max(0, p.reps[h]! - (h === 0 ? startReps : p.reps[h - 1]!));
      ramped += hired * Math.min(1, (t - h) / Math.max(1, s.rampMonths));
    }
    const capacity = (ramped * s.quota * s.attainment) / 12;
    const newArr = Math.min(p.pipeline[t]! * p.winRate[t]!, capacity);
    arr = arr * (1 - p.churn[t]! + p.expansion[t]!) + newArr;
    const apiTokensM = p.developers[t]! * p.tokensPerDevM[t]!;
    const apiRevenue = apiTokensM * p.pricePerM[t]!;
    const apiCompute = apiTokensM * s.computePerM;
    const enterpriseRevenue = arr / 12;
    const revenue = apiRevenue + enterpriseRevenue;
    const grossProfit = apiRevenue - apiCompute + enterpriseRevenue * s.enterpriseMargin;
    const support = p.reps[t]! * s.supportPerRep;
    const opex = (p.reps[t]! * s.repCost + support * s.supportCost) / 12 + s.programs;
    out.push({
      apiRevenue,
      apiCompute,
      newArr,
      capacity,
      arr,
      enterpriseRevenue,
      revenue,
      grossProfit,
      opex,
      contribution: grossProfit - opex,
      rampedReps: ramped,
      headcount: p.reps[t]! + support,
    });
  }
  return out;
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const total = (r: MonthResult[], key: keyof MonthResult, months = MONTHS) => sum(r.slice(0, months).map((m) => m[key]));

/* ---------- OKRs ---------- */

export interface KeyResult {
  id: string;
  objective: string;
  label: string;
  target: number;
  format: "money" | "count" | "pct";
  /** Higher is better (false for costs) */
  higherBetter: boolean;
  /** Read the value from a year of results and the driver paths */
  measure: (r: MonthResult[], p: Paths) => number;
}

/** Three objectives, two key results each. Targets come from the plan, so editing a driver moves its targets. */
export function okrs(plan: MonthResult[], p: Paths): KeyResult[] {
  const last = (r: MonthResult[]) => r[r.length - 1]!;
  const krs: Omit<KeyResult, "target">[] = [
    { id: "arr", objective: "Grow Enterprise", label: "Enterprise ARR at year end", format: "money", higherBetter: true, measure: (r) => last(r).arr },
    { id: "win", objective: "Grow Enterprise", label: "Average win rate", format: "pct", higherBetter: true, measure: (_r, q) => sum(q.winRate) / q.winRate.length },
    { id: "devs", objective: "Scale the API", label: "Active developers at year end", format: "count", higherBetter: true, measure: (_r, q) => q.developers[q.developers.length - 1]! },
    {
      id: "apimargin",
      objective: "Scale the API",
      label: "API gross margin",
      format: "pct",
      higherBetter: true,
      measure: (r) => 1 - total(r, "apiCompute") / Math.max(1, total(r, "apiRevenue")),
    },
    { id: "opex", objective: "Run efficiently", label: "Commercial opex for the year", format: "money", higherBetter: false, measure: (r) => total(r, "opex") },
    {
      id: "productivity",
      objective: "Run efficiently",
      label: "New ARR per ramped rep (yearly)",
      format: "money",
      higherBetter: true,
      measure: (r) => (total(r, "newArr") / Math.max(1, sum(r.map((m) => m.rampedReps)))) * 12,
    },
  ];
  return krs.map((k) => ({ ...k, target: k.measure(plan, p) }));
}

/* ---------- Formatting ---------- */

export function formatMoney(n: number) {
  const a = Math.abs(n);
  const sign = n < -0.5 ? "−" : "";
  const fmt = (v: number, d: number) => v.toFixed(d).replace(/\.0+$/, "");
  if (a >= 1e9) return `${sign}$${fmt(a / 1e9, 2)}B`;
  if (a >= 1e6) return `${sign}$${fmt(a / 1e6, a >= 1e8 ? 0 : 1)}M`;
  if (a >= 1e3) return `${sign}$${Math.round(a / 1e3)}K`;
  return `${sign}$${Math.round(a)}`;
}

export function formatCount(n: number) {
  const a = Math.abs(n);
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (a >= 1e4) return `${Math.round(n / 1e3)}K`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${Math.round(n)}`;
}

export const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;
export const signed = (x: number, f: (v: number) => string) => `${x >= 0 ? "+" : "−"}${f(Math.abs(x))}`;

export function formatDriver(id: DriverId, v: number) {
  const f = DRIVERS.find((d) => d.id === id)!.format;
  if (f === "money") return formatMoney(v);
  if (f === "pct") return pct(v, id === "winRate" ? 0 : 1);
  if (f === "price") return `$${v.toFixed(2)}`;
  if (f === "tokens") return `${Math.round(v)}M`;
  return formatCount(v);
}
