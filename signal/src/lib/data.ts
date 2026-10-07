// Countries from the World Bank API (WDI and Global Findex 2025), built by scripts/build-data.mjs.
import countriesJson from "@/data/countries.json";
import { giniFromQuintiles } from "./stats";

export type Key =
  | "pop" | "under15" | "rural" | "internet" | "gniPc" | "gini" | "q1" | "q2" | "q3" | "q4" | "q5" | "poverty" | "electricity" | "mobileSubs"
  | "account" | "mobileMoney" | "phone" | "phoneWomen" | "phoneMen" | "phonePoor" | "phoneRich" | "phoneRural" | "phoneUrban"
  | "smart" | "smartWomen" | "smartMen" | "smartPoor" | "smartRich" | "smartRural" | "smartUrban"
  | "noSmartCost" | "noSmartData" | "noSmartCoverage" | "noSmartSkills" | "noSmartSafety" | "noSmartNoNeed";

export interface Country {
  iso3: string;
  iso2: string;
  name: string;
  region: string;
  income: string;
  /** Latest value and its year */
  values: Partial<Record<Key, [number, number]>>;
}

export const DATA = countriesJson as unknown as { retrieved: string; countries: Country[] };
export const COUNTRIES = DATA.countries;
export const RETRIEVED = DATA.retrieved;

/** The four worked cases, switchable at the top of every step. */
export const CASES = ["NGA", "KEN", "IND", "PAK"] as const;

export const byIso = (iso3: string) => COUNTRIES.find((c) => c.iso3 === iso3);
export const v = (c: Country, k: Key) => c.values[k]?.[0] ?? null;
export const yearOf = (c: Country, k: Key) => c.values[k]?.[1] ?? null;
/** Percent value as a 0–1 share */
export const share = (c: Country, k: Key) => {
  const x = v(c, k);
  return x === null ? null : x / 100;
};

/** Short display names for the World Bank's long ones. */
export const shortName = (c: Country) =>
  ({ "Egypt, Arab Rep.": "Egypt", "Iran, Islamic Rep.": "Iran", "Congo, Dem. Rep.": "DR Congo", "Congo, Rep.": "Congo", "Yemen, Rep.": "Yemen", "Venezuela, RB": "Venezuela", "Korea, Rep.": "South Korea", "Lao PDR": "Laos", "Gambia, The": "The Gambia", "Bahamas, The": "The Bahamas", "Micronesia, Fed. Sts.": "Micronesia", "Kyrgyz Republic": "Kyrgyzstan", "Slovak Republic": "Slovakia", "Turkiye": "Türkiye", "Viet Nam": "Vietnam", "Russian Federation": "Russia", "Syrian Arab Republic": "Syria" })[c.name] ?? c.name;

/** Gini (0–1): the World Bank's own, else from quintile shares, else a typical value (flagged). */
export function giniOf(c: Country): { gini: number; source: "wdi" | "quintiles" | "assumed" } {
  const g = v(c, "gini");
  if (g !== null) return { gini: g / 100, source: "wdi" };
  const q = (["q1", "q2", "q3", "q4", "q5"] as const).map((k) => v(c, k));
  if (q.every((x) => x !== null)) return { gini: giniFromQuintiles(q as number[]), source: "quintiles" };
  return { gini: 0.38, source: "assumed" };
}

/* ---------- Formatting ---------- */

export function people(n: number) {
  const a = Math.abs(n);
  if (a >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(a >= 1e8 ? 0 : 1)}M`;
  if (a >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(Math.round(n));
}
export function usd(n: number, d = 0) {
  const a = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(a >= 1e8 ? 0 : 1)}M`;
  return `${sign}$${a.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
}
export const pct = (x: number | null, d = 0) => (x === null ? "–" : `${(x * 100).toFixed(d)}%`);
