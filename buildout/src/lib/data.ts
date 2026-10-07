// The filings: quarterly capex, revenue, operating cash flow and depreciation for ten companies, from SEC EDGAR
// (see scripts/build-data.mjs). Values are $ millions; null means the company didn't report it under the tags used.
import filings from "@/data/filings.json";

export interface Quarter {
  quarter: string;
  end?: string;
  accn?: string;
  capex: number | null;
  revenue: number | null;
  ocf: number | null;
  da: number | null;
}

export interface Company {
  ticker: string;
  cik: string;
  role: "spender" | "receiver";
  short: string;
  name: string;
  concepts: Record<string, string>;
  quarters: Quarter[];
}

export const DATA = filings as unknown as { retrieved: string; source: string; companies: Company[] };
export const COMPANIES = DATA.companies;
export const SPENDERS = COMPANIES.filter((c) => c.role === "spender");
export const RECEIVERS = COMPANIES.filter((c) => c.role === "receiver");
export const byTicker = (t: string) => COMPANIES.find((c) => c.ticker === t);

/** Categorical colors, assigned in a fixed order (validated set; text never uses them). */
const PALETTE = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#4a3aa7"];
export const colorOf = (ticker: string) => {
  const list = SPENDERS.some((c) => c.ticker === ticker) ? SPENDERS : RECEIVERS;
  return PALETTE[list.findIndex((c) => c.ticker === ticker)] ?? "#6b7280";
};

/** EDGAR filing index for an accession number. */
export const filingUrl = (cik: string, accn: string) => `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accn.replace(/-/g, "")}/${accn}-index.htm`;

/** "2026Q2" → "Q2 2026" */
export const formatQuarter = (q: string) => `${q.slice(4)} ${q.slice(0, 4)}`;

/** $ millions → "$35.8B" / "$532M" */
export function formatMillions(m: number) {
  const a = Math.abs(m);
  const sign = m < -0.5 ? "−" : "";
  if (a >= 1000) return `${sign}$${(a / 1000).toFixed(a >= 100_000 ? 0 : 1)}B`;
  return `${sign}$${Math.round(a)}M`;
}
export const pct = (x: number, d = 0) => `${(x * 100).toFixed(d)}%`;
export const signedPct = (x: number, d = 0) => `${x >= 0 ? "+" : "−"}${(Math.abs(x) * 100).toFixed(d)}%`;
