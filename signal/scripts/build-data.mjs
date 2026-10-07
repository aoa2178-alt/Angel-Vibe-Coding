// Builds src/data/countries.json from the World Bank's free API (CC BY 4.0): World Development Indicators and the
// Global Findex 2025 survey. Keeps each country's latest value and its year. Run: node scripts/build-data.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "src", "data", "countries.json");
const API = "https://api.worldbank.org/v2";

// [our key, World Bank indicator id, source id (2 = WDI, 28 = Global Findex)]
const INDICATORS = [
  ["pop", "SP.POP.TOTL", 2],
  ["under15", "SP.POP.0014.TO.ZS", 2],
  ["rural", "SP.RUR.TOTL.ZS", 2],
  ["internet", "IT.NET.USER.ZS", 2],
  ["gniPc", "NY.GNP.PCAP.CD", 2],
  ["gini", "SI.POV.GINI", 2],
  ["q1", "SI.DST.FRST.20", 2],
  ["q2", "SI.DST.02ND.20", 2],
  ["q3", "SI.DST.03RD.20", 2],
  ["q4", "SI.DST.04TH.20", 2],
  ["q5", "SI.DST.05TH.20", 2],
  ["poverty", "SI.POV.DDAY", 2],
  ["electricity", "EG.ELC.ACCS.ZS", 2],
  ["mobileSubs", "IT.CEL.SETS.P2", 2],
  ["account", "FX.OWN.TOTL.ZS", 2],
  ["mobileMoney", "mobileaccount.t.d", 28],
  ["phone", "con1", 28],
  ["phoneWomen", "con1.1", 28],
  ["phoneMen", "con1.2", 28],
  ["phonePoor", "con1.7", 28],
  ["phoneRich", "con1.8", 28],
  ["phoneRural", "con1.9", 28],
  ["phoneUrban", "con1.10", 28],
  ["smart", "con9a", 28],
  ["smartWomen", "con9a.1", 28],
  ["smartMen", "con9a.2", 28],
  ["smartPoor", "con9a.7", 28],
  ["smartRich", "con9a.8", 28],
  ["smartRural", "con9a.9", 28],
  ["smartUrban", "con9a.10", 28],
  ["noSmartCost", "con31a", 28],
  ["noSmartData", "con31b", 28],
  ["noSmartCoverage", "con31c", 28],
  ["noSmartSkills", "con31d", 28],
  ["noSmartSafety", "con31f", 28],
  ["noSmartNoNeed", "con31h", 28],
];

async function getJson(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(90_000) });
      if (!res.ok) throw new Error(String(res.status));
      return await res.json();
    } catch (e) {
      if (attempt === 3) throw new Error(`${url}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
}

// Countries (not regional or income aggregates), with region and income group.
const meta = await getJson(`${API}/country?format=json&per_page=400`);
const countries = {};
for (const c of meta[1]) {
  if (c.region.id === "NA" || !c.iso2Code) continue;
  countries[c.id] = { iso3: c.id, iso2: c.iso2Code, name: c.name, region: c.region.value.trim(), income: c.incomeLevel.value.trim(), values: {} };
}

for (const [key, id, source] of INDICATORS) {
  const json = await getJson(`${API}/country/all/indicator/${id}?format=json&mrnev=1&per_page=20000&source=${source}`);
  let n = 0;
  for (const r of json[1] ?? []) {
    const c = countries[r.countryiso3code];
    if (!c || r.value === null) continue;
    c.values[key] = [Math.round(Number(r.value) * 1000) / 1000, Number(r.date)];
    n++;
  }
  console.log(`${key.padEnd(16)} ${id.padEnd(20)} ${n} countries`);
}

const list = Object.values(countries)
  .filter((c) => c.values.pop && c.values.internet && c.values.gniPc)
  .sort((a, b) => a.name.localeCompare(b.name));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ retrieved: new Date().toISOString().slice(0, 10), countries: list }));
console.log(`${list.length} countries with population, internet use and income → ${path.relative(ROOT, OUT)}`);
