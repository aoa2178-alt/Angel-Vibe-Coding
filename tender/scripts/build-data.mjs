// Builds src/data/prices.json from public FRED series (BLS producer price indexes, IMF copper, BLS wages). No key needed.
// Run with: node scripts/build-data.mjs   (re-run to refresh; the app shows the retrieval date)
import { writeFileSync } from "node:fs";

const SERIES = {
  transformers: { id: "PCU335311335311", title: "PPI: electric power and specialty transformer manufacturing", unit: "index" },
  switchgear: { id: "PCU335313335313", title: "PPI: switchgear and switchboard apparatus manufacturing", unit: "index" },
  generators: { id: "PCU335312335312", title: "PPI: motor and generator manufacturing", unit: "index" },
  copper: { id: "PCOPPUSDM", title: "Global price of copper (IMF)", unit: "$ per metric ton" },
  steel: { id: "WPU101", title: "PPI: iron and steel", unit: "index" },
  components: { id: "WPU117", title: "PPI: electrical machinery and equipment", unit: "index" },
  wages: { id: "CES3000000008", title: "Average hourly earnings, production workers, manufacturing (BLS)", unit: "$ per hour" },
};
const FROM = "2019-01";

const out = { retrieved: new Date().toISOString().slice(0, 10), from: FROM, series: {} };
for (const [key, meta] of Object.entries(SERIES)) {
  const csv = await (await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${meta.id}`)).text();
  const points = csv
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.split(","))
    .filter(([d, v]) => d.slice(0, 7) >= FROM && v !== "" && v !== "." && Number.isFinite(Number(v)))
    .map(([d, v]) => ({ month: d.slice(0, 7), value: Math.round(Number(v) * 1000) / 1000 }));
  out.series[key] = { ...meta, source: `https://fred.stlouisfed.org/series/${meta.id}`, points };
  console.log(`${meta.id}: ${points[0].month} ${points[0].value} → ${points.at(-1).month} ${points.at(-1).value} (${points.length} months)`);
}
writeFileSync(new URL("../src/data/prices.json", import.meta.url), JSON.stringify(out) + "\n");
