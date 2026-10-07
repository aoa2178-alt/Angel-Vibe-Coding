// Builds src/data/delivery.json from a BigQuery export of the DataCo Smart Supply Chain dataset (CC BY 4.0):
// one row per market × order region × category × shipping mode, with orders, late-delivery rate, days late, sales and profit.
// Run with: node scripts/build-delivery.mjs path/to/export.csv
import { readFileSync, writeFileSync } from "node:fs";

const file = process.argv[2];
if (!file) throw new Error("Pass the CSV path");
const lines = readFileSync(file, "utf8").trim().split(/\r?\n/);
const header = lines.shift().split(",");
const parse = (line) => {
  const cells = [];
  let cur = "";
  let quoted = false;
  for (const ch of line) {
    if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) {
      cells.push(cur);
      cur = "";
    } else cur += ch;
  }
  cells.push(cur);
  return Object.fromEntries(header.map((h, i) => [h, cells[i]]));
};
const rows = lines.map(parse).map((r) => ({
  market: r["Market"],
  region: r["Order Region"].replace(/\s+/g, " ").trim(),
  category: r["Category Name"],
  mode: r["Shipping Mode"],
  orders: Number(r.total_orders),
  late: (Number(r.total_orders) * Number(r.late_delivery_rate_pct)) / 100,
  daysLate: Number(r.total_orders) * Number(r.avg_days_variance),
  cancelled: (Number(r.total_orders) * Number(r.cancellation_rate_pct)) / 100,
  sales: Number(r.total_sales),
  profit: Number(r.total_profit),
}));

// Sum a group of rows into cells keyed by the given fields; rates are recomputed from counts later.
function group(keys) {
  const map = new Map();
  for (const r of rows) {
    const k = keys.map((key) => r[key]).join("|");
    const g = map.get(k) ?? { ...Object.fromEntries(keys.map((key) => [key, r[key]])), orders: 0, late: 0, daysLate: 0, cancelled: 0, sales: 0, profit: 0 };
    for (const f of ["orders", "late", "daysLate", "cancelled", "sales", "profit"]) g[f] += r[f];
    map.set(k, g);
  }
  return [...map.values()].map((g) => ({
    ...g,
    late: Math.round(g.late),
    daysLate: Math.round(g.daysLate * 100) / 100,
    cancelled: Math.round(g.cancelled),
    sales: Math.round(g.sales),
    profit: Math.round(g.profit),
  }));
}

const out = {
  source: {
    title: "DataCo Smart Supply Chain for Big Data Analysis",
    authors: "Constante, F., Silva, F., & Pereira, A.",
    year: 2019,
    version: 5,
    doi: "https://doi.org/10.17632/8gx2fvg2k6.5",
    url: "https://data.mendeley.com/datasets/8gx2fvg2k6/5",
    license: "CC BY 4.0",
    note: "Aggregated in BigQuery by Angel Ade-Oduntan (June 2026): one row per market, order region, category and shipping mode.",
  },
  totalOrders: rows.reduce((a, r) => a + r.orders, 0),
  marketMode: group(["market", "mode"]),
  regionMode: group(["market", "region", "mode"]),
  category: group(["category"]),
  mode: group(["mode"]),
};
writeFileSync(new URL("../src/data/delivery.json", import.meta.url), JSON.stringify(out) + "\n");
console.log(`${rows.length} rows, ${out.totalOrders} orders, ${out.regionMode.length} region × mode cells, ${out.category.length} categories`);
