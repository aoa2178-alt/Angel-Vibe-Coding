// Builds src/data/filings.json from SEC EDGAR's free XBRL API (data.sec.gov/api/xbrl/companyfacts).
// Cash-flow items are filed year-to-date, so quarters are derived (Q2 = six months − Q1, and so on) and mapped to
// calendar quarters by period end (fiscal years differ). The SEC asks every caller to identify itself in the User-Agent.
// Run with: node scripts/build-data.mjs   (re-run after each earnings season)
import { writeFileSync } from "node:fs";
import { deriveQuarters } from "../src/lib/quarters.js";

const UA = "Angel Ade-Oduntan class portfolio aoa2178@columbia.edu";
const COMPANIES = [
  { ticker: "MSFT", cik: "0000789019", role: "spender", short: "Microsoft" },
  { ticker: "GOOGL", cik: "0001652044", role: "spender", short: "Alphabet" },
  { ticker: "AMZN", cik: "0001018724", role: "spender", short: "Amazon" },
  { ticker: "META", cik: "0001326801", role: "spender", short: "Meta" },
  { ticker: "AAPL", cik: "0000320193", role: "spender", short: "Apple" },
  { ticker: "ORCL", cik: "0001341439", role: "spender", short: "Oracle" },
  { ticker: "NVDA", cik: "0001045810", role: "receiver", short: "NVIDIA" },
  { ticker: "AVGO", cik: "0001730168", role: "receiver", short: "Broadcom" },
  { ticker: "VRT", cik: "0001674101", role: "receiver", short: "Vertiv" },
  { ticker: "ETN", cik: "0001551182", role: "receiver", short: "Eaton" },
];
// For each metric, candidate concepts in order; the one with the most recent data wins.
const METRICS = {
  capex: ["PaymentsToAcquirePropertyPlantAndEquipment", "PaymentsToAcquireProductiveAssets"],
  revenue: ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet"],
  ocf: ["NetCashProvidedByUsedInOperatingActivities"],
  da: ["DepreciationDepletionAndAmortization", "DepreciationAmortizationAndAccretionNet", "DepreciationAndAmortization", "Depreciation", "DepreciationOfPropertyPlantAndEquipment"],
};
const FROM = "2019Q1";

const out = { retrieved: new Date().toISOString().slice(0, 10), source: "https://www.sec.gov/edgar/sec-api-documentation", companies: [] };
for (const co of COMPANIES) {
  const res = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${co.cik}.json`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`${co.ticker}: HTTP ${res.status}`);
  const json = await res.json();
  const gaap = json.facts["us-gaap"] ?? {};
  const concepts = {};
  const series = {};
  for (const [metric, candidates] of Object.entries(METRICS)) {
    const found = candidates
      .map((name) => ({ name, q: deriveQuarters(gaap[name]?.units?.USD ?? []).filter((x) => x.quarter >= FROM) }))
      .filter((c) => c.q.length > 0);
    if (found.length === 0) continue;
    if (metric === "capex" || metric === "revenue") {
      // Same quantity under different tags over the years: fill each quarter from the first tag that has it.
      const map = new Map();
      for (const c of found) for (const x of c.q) if (!map.has(x.quarter)) map.set(x.quarter, x);
      concepts[metric] = found.map((c) => c.name).join(" + ");
      series[metric] = map;
    } else {
      // Different tags can measure different things (depreciation vs depreciation and amortization): use one tag, the best covered.
      const best = found.reduce((x, y) => (y.q.length > x.q.length || (y.q.length === x.q.length && y.q.at(-1).quarter > x.q.at(-1).quarter) ? y : x));
      concepts[metric] = best.name;
      series[metric] = new Map(best.q.map((x) => [x.quarter, x]));
    }
  }
  const quarters = [...new Set(Object.values(series).flatMap((m) => [...m.keys()]))]
    .filter((q) => q >= FROM)
    .sort()
    .map((q) => {
      const row = { quarter: q };
      for (const metric of Object.keys(METRICS)) {
        const x = series[metric]?.get(q);
        row[metric] = x ? Math.round(x.value / 1e6) : null; // $ millions
        if (x && metric === "capex") {
          row.end = x.end;
          row.accn = x.accn;
        }
      }
      return row;
    });
  out.companies.push({ ...co, name: json.entityName, concepts, quarters });
  const last = quarters.filter((x) => x.capex !== null).at(-1);
  console.log(`${co.ticker}: ${Object.entries(concepts).map(([k, v]) => `${k}=${v}`).join(", ")} · ${quarters.length} quarters · latest capex ${last?.quarter} $${last?.capex}M`);
  await new Promise((r) => setTimeout(r, 150)); // stay well under the SEC's 10 requests a second
}
writeFileSync(new URL("../src/data/filings.json", import.meta.url), JSON.stringify(out) + "\n");
