// Builds src/data/demand.json from two public US Census series published on FRED (no key needed).
// Run with: node scripts/build-data.mjs   (re-run to refresh; the app shows the retrieval date)
import { writeFileSync } from "node:fs";

const SERIES = {
  tablet: {
    id: "MRTSSM443USN",
    title: "Retail sales: electronics and appliance stores, not seasonally adjusted",
    unit: "millions of dollars",
    publisher: "U.S. Census Bureau, Monthly Retail Trade Survey, via FRED",
  },
  server: {
    id: "U34ANO",
    title: "Manufacturers' new orders: electronic computer manufacturing, not seasonally adjusted",
    unit: "millions of dollars",
    publisher: "U.S. Census Bureau, Manufacturers' Shipments, Inventories, and Orders (M3), via FRED",
  },
};
const MONTHS = 120;

const out = { retrieved: new Date().toISOString().slice(0, 10), series: {} };
for (const [key, meta] of Object.entries(SERIES)) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${meta.id}`;
  const csv = await (await fetch(url)).text();
  const rows = csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => line.split(","))
    .filter(([, v]) => v !== "" && v !== "." && Number.isFinite(Number(v)))
    .map(([date, v]) => ({ month: date.slice(0, 7), value: Number(v) }));
  const points = rows.slice(-MONTHS);
  if (points.length < MONTHS) throw new Error(`${meta.id}: only ${points.length} months`);
  out.series[key] = { ...meta, source: `https://fred.stlouisfed.org/series/${meta.id}`, points };
  console.log(`${meta.id}: ${points[0].month} to ${points.at(-1).month}, ${points.length} months`);
}
writeFileSync(new URL("../src/data/demand.json", import.meta.url), JSON.stringify(out, null, 1) + "\n");
