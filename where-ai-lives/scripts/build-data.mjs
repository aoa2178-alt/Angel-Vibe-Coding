// Builds Where AI Lives' data from public sources. Run: node scripts/build-data.mjs
//
//   Epoch AI, "Frontier Data Centers" (CC BY 4.0): sites, owners, power, H100s, cost, and each site's build timeline.
//   US Census Geocoder (public): street address -> map point. New-build addresses it can't match fall back to the
//   ZIP code's center (Census ZCTA Gazetteer), and sites with no usable address to a hand-checked town.
//   EIA Electric Power Monthly, Table 5.6.B (public domain): average price by state and sector, year to date.
//   LBNL "Queued Up" interconnection data (public): how long new power plants waited to connect, and the active queue.
//   us-atlas (ISC): state shapes, already projected to a 975 x 610 Albers USA frame.
//
// Downloads land in raw/ (git-ignored); only the small JSON files in src/data/ are committed.
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { geoAlbersUsa, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import zlib from "node:zlib";
import XLSX from "xlsx";

const require = createRequire(import.meta.url);
const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const RAW = path.join(ROOT, "raw");
const OUT = path.join(ROOT, "src", "data");
fs.mkdirSync(RAW, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

const UA = "Mozilla/5.0 (Where AI Lives class portfolio build script)";
const SOURCES = {
  epoch: "https://epoch.ai/data/data_centers/data_centers.csv",
  epochTimelines: "https://epoch.ai/data/data_centers/data_center_timelines.csv",
  eia: "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_b",
  lbnl: "https://eta-publications.lbl.gov/sites/default/files/2026-05/lbnl_ix_queue_data_file_thru2025.xlsx",
  census: "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress",
  zcta: "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2024_Gazetteer/2024_Gaz_zcta_national.zip",
};

async function download(url, file) {
  const dest = path.join(RAW, file);
  if (!fs.existsSync(dest)) {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`${url}: ${res.status}`);
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  }
  return dest;
}

/** RFC 4180 CSV: quoted fields may hold commas, quotes and newlines. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const records = (text) => {
  const [head, ...rows] = parseCsv(text);
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
};

const STATES = {
  AL: "Alabama", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  DC: "District of Columbia", FL: "Florida", GA: "Georgia", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin",
  WY: "Wyoming", AK: "Alaska", HI: "Hawaii",
};
const BY_NAME = Object.fromEntries(Object.entries(STATES).map(([k, v]) => [v, k]));

// Sites whose Epoch address is blank or not a street address: the town named in Epoch's sources, placed at the town.
// [state, longitude, latitude, place]
const TOWNS = {
  "Google Mesa": ["AZ", -111.65, 33.36, "Mesa, AZ"],
  "Google Kansas City East": ["MO", -94.44, 39.17, "Kansas City, MO"],
  "AWS New Albany": ["OH", -82.77, 40.11, "New Albany, OH"],
  "Amazon Madison Mega Site": ["MS", -90.06, 32.59, "Canton, MS (Madison County)"],
  "Google Storey County": ["NV", -119.44, 39.54, "Storey County, NV"],
  "Stream Phoenix": ["AZ", -112.36, 33.42, "Goodyear, AZ"],
  "Anthropic Barber Lake": ["TX", -100.87, 32.39, "Colorado City, TX"],
  "Meta Hyperion": ["LA", -91.65, 32.42, "Holly Ridge, LA (Richland Parish)"],
  "OpenAI Stargate Michigan": ["MI", -83.78, 42.17, "Saline Township, MI"],
  "OpenAI Stargate Milam": ["TX", -97.0, 30.79, "Milam County, TX"],
  "OpenAI Stargate New Mexico": ["NM", -106.8, 32.1, "Doña Ana County, NM"],
  "OpenAI Stargate Wisconsin": ["WI", -87.87, 43.39, "Port Washington, WI"],
  "OpenAI Stargate Shackelford": ["TX", -99.35, 32.73, "Shackelford County, TX"],
  "Meta Cheyenne": ["WY", -104.82, 41.14, "Cheyenne, WY"],
  "Meta Montgomery": ["AL", -86.3, 32.37, "Montgomery, AL"],
  "Goodnight": ["TX", -101.39, 35.04, "Claude, TX"],
  "Google The Dalles": ["OR", -121.18, 45.6, "The Dalles, OR"],
  "Meta Huntsville": ["AL", -86.71, 34.9, "Toney, AL"],
};

/** The first file in a .zip (the Gazetteer zips hold one text file). */
function unzipFirst(buf) {
  const nameLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const method = buf.readUInt16LE(8);
  let size = buf.readUInt32LE(18);
  const start = 30 + nameLen + extraLen;
  if (size === 0) {
    // Sizes live in the central directory when the local header defers them.
    const cd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
    size = buf.readUInt32LE(cd + 20);
  }
  const body = buf.subarray(start, start + size);
  return (method === 8 ? zlib.inflateRawSync(body) : body).toString("utf8");
}

async function zipCenters() {
  const text = unzipFirst(fs.readFileSync(await download(SOURCES.zcta, "zcta.zip")));
  const [head, ...rows] = text.trim().split(/\r?\n/).map((l) => l.split("\t").map((c) => c.trim()));
  const at = (k) => head.indexOf(k);
  return Object.fromEntries(rows.map((r) => [r[at("GEOID")], [Number(r[at("INTPTLONG")]), Number(r[at("INTPTLAT")])]]));
}

const tag = (s) => s.replace(/\s*#\w+/g, "").trim();
const round = (n, d = 0) => Math.round(n * 10 ** d) / 10 ** d;

async function geocode(address) {
  const url = `${SOURCES.census}?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (!res.ok) throw new Error(String(res.status));
      const m = (await res.json()).result?.addressMatches?.[0];
      return m ? { lon: m.coordinates.x, lat: m.coordinates.y, state: m.addressComponents.state } : null;
    } catch {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  return null;
}

/** The state an address names: "…, TX 79601", "…, Kuna ID 83634", or a spelled-out state name. */
function stateInAddress(address) {
  const m = address.match(/\b([A-Z]{2})\s*,?\s*\d{5}/) ?? address.match(/,\s*([A-Z]{2})\b/);
  if (m && STATES[m[1]]) return m[1];
  const named = Object.values(STATES).find((n) => address.includes(n));
  return named ? BY_NAME[named] : null;
}

// ---------- Sites ----------
async function buildSites() {
  const main = records(fs.readFileSync(await download(SOURCES.epoch, "dc.csv"), "utf8"));
  const lines = records(fs.readFileSync(await download(SOURCES.epochTimelines, "timelines.csv"), "utf8"));
  const cachePath = path.join(RAW, "geocode-cache.json");
  const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, "utf8")) : {};
  const projection = geoAlbersUsa().scale(1300).translate([487.5, 305]);
  const misses = [];
  const zips = await zipCenters();

  const sites = [];
  for (const r of main.filter((x) => x.Country.includes("United States"))) {
    const name = r.Name.trim();
    const address = r.Address.split("\n")[0].trim();
    let located;
    if (TOWNS[name]) {
      const [state, lon, lat, place] = TOWNS[name];
      located = { state, lon, lat, how: "town", place };
    } else {
      if (!(address in cache)) cache[address] = await geocode(address);
      const g = cache[address];
      const named = stateInAddress(address);
      const zip = address.match(/\b(\d{5})\b(?!.*\b\d{5}\b)/)?.[1];
      if (!g && zip && zips[zip] && named) {
        const [lon, lat] = zips[zip];
        located = { state: named, lon, lat, how: "zip", place: address };
      } else if (!g || (named && g.state !== named)) {
        misses.push(`${name} | ${address} | ${g ? `geocoded to ${g.state}` : "no match"}`);
        continue;
      } else located = { state: g.state, lon: g.lon, lat: g.lat, how: "address", place: address };
    }
    const [x, y] = projection([located.lon, located.lat]);
    const timeline = lines
      .filter((l) => l["Data center"].trim() === name)
      .map((l) => ({ date: l.Date, mw: Number(l["Power (MW)"]) || 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));
    // Keep only the points where facility power changes, so the series stays small.
    const series = [];
    for (const p of timeline) if (!series.length || series.at(-1)[1] !== round(p.mw)) series.push([p.date, round(p.mw)]);
    sites.push({
      name,
      owner: tag(r.Owner) || name.split(" ")[0],
      project: tag(r.Project) || null,
      users: tag(r.Users) || null,
      state: located.state,
      place: located.place,
      located: located.how,
      lon: round(located.lon, 4),
      lat: round(located.lat, 4),
      x: round(x, 1),
      y: round(y, 1),
      itMw: round(Number(r["Current power (MW)"]) || 0, 1),
      h100: Math.round(Number(r["Current H100 equivalents"]) || 0),
      capexB: round(Number(r["Current total capital cost (2025 USD billions)"]) || 0, 2),
      series,
    });
  }
  fs.writeFileSync(cachePath, JSON.stringify(cache, null, 1));
  if (misses.length) throw new Error(`Add these to TOWNS:\n${misses.join("\n")}`);
  sites.sort((a, b) => b.itMw - a.itMw || a.name.localeCompare(b.name));
  return sites;
}

// ---------- Power prices ----------
async function buildPrices() {
  const html = fs.readFileSync(await download(SOURCES.eia, "eia-5-6-b.html"), "utf8");
  const rows = [...html.matchAll(/<tr[\s\S]*?<\/tr>/g)].map((m) =>
    [...m[0].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((c) => c[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim()),
  );
  const header = rows.find((r) => r.some((c) => /YTD/.test(c)));
  const num = (s) => (s && /^\d+(\.\d+)?$/.test(s) ? Number(s) : null);
  const states = {};
  for (const r of rows) {
    const code = BY_NAME[r[0]] ?? (r[0] === "U.S. Total" ? "US" : null);
    if (!code) continue;
    // Columns: residential (now, prior), commercial (now, prior), industrial (now, prior), transportation, all sectors
    states[code] = { commercial: num(r[3]), industrial: num(r[5]), commercialPrior: num(r[4]), industrialPrior: num(r[6]) };
  }
  return { period: header[1], prior: header[2], unit: "cents per kWh", states };
}

// ---------- Grid connection ----------
async function buildGrid() {
  const wb = XLSX.readFile(await download(SOURCES.lbnl, "lbnl-queue.xlsx"), { sheets: ["02. Data Sample by Region", "03. Complete Queue Data"] });
  const sample = XLSX.utils.sheet_to_json(wb.Sheets["02. Data Sample by Region"], { header: 1 });
  const activeGw = {};
  for (const r of sample) if (typeof r[0] === "string" && typeof r[2] === "number") activeGw[r[0].replace(" (non-ISO)", "")] = r[2];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets["03. Complete Queue Data"], { range: 1 });
  const fromExcel = (d) => new Date(Math.round((d - 25569) * 864e5));
  const quantile = (a, q) => {
    const s = [...a].sort((x, y) => x - y);
    const i = (s.length - 1) * q;
    const lo = Math.floor(i);
    return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo);
  };
  const waits = {};
  const count = {};
  for (const r of rows) {
    if (STATES[r.state] && r.region) {
      count[r.state] ??= {};
      count[r.state][r.region] = (count[r.state][r.region] ?? 0) + 1;
    }
    if (r.q_status !== "operational" || typeof r.on_date !== "number" || typeof r.q_date !== "number") continue;
    const year = fromExcel(r.on_date).getUTCFullYear();
    if (year < 2021 || year > 2025) continue;
    const years = (r.on_date - r.q_date) / 365.25;
    if (years >= 0) (waits[r.region] ??= []).push(years);
  }
  const regions = {};
  for (const [region, gw] of Object.entries(activeGw)) {
    const w = waits[region] ?? [];
    const enough = w.length >= 10;
    regions[region] = {
      activeGw: gw,
      waitYears: enough ? round(quantile(w, 0.5), 2) : null,
      p25: enough ? round(quantile(w, 0.25), 2) : null,
      p75: enough ? round(quantile(w, 0.75), 2) : null,
      n: w.length,
    };
  }
  // Each state's main grid region = the region with the most interconnection requests there.
  const stateRegion = {};
  for (const [st, c] of Object.entries(count)) {
    const sorted = Object.entries(c).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, n]) => s + n, 0);
    stateRegion[st] = { region: sorted[0][0], share: round(sorted[0][1] / total, 2) };
  }
  return { years: "2021–2025", regions, stateRegion };
}

// ---------- Map ----------
function buildMap() {
  const topo = require("us-atlas/states-albers-10m.json");
  const p = geoPath().digits(1);
  const states = feature(topo, topo.objects.states).features.map((f) => {
    const name = f.properties.name;
    const [cx, cy] = p.centroid(f);
    return { code: BY_NAME[name], name, d: p(f), cx: round(cx, 1), cy: round(cy, 1) };
  });
  const borders = p(mesh(topo, topo.objects.states, (a, b) => a !== b));
  return { width: 975, height: 610, states, borders };
}

const sites = await buildSites();
const prices = await buildPrices();
const grid = await buildGrid();
const map = buildMap();
const retrieved = new Date().toISOString().slice(0, 10);

fs.writeFileSync(path.join(OUT, "sites.json"), JSON.stringify({ retrieved, sites }));
fs.writeFileSync(path.join(OUT, "grid.json"), JSON.stringify({ retrieved, prices, grid }));
fs.writeFileSync(path.join(OUT, "map.json"), JSON.stringify(map));

const how = (k) => sites.filter((s) => s.located === k).length;
console.log(`${sites.length} US sites (${how("address")} at their address, ${how("zip")} at their ZIP code, ${how("town")} at their town), ${Object.keys(prices.states).length} price rows (${prices.period}), ${Object.keys(grid.regions).length} grid regions`);
for (const [r, g] of Object.entries(grid.regions)) console.log(`  ${r}: wait ${g.waitYears} yr (n=${g.n}), queue ${g.activeGw} GW`);
