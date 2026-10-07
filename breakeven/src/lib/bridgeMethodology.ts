// Sources behind every Speed-to-Power default. Values are read from DEFAULT_BRIDGE, so this page can't disagree with
// the model. Same confidence scale as the calculator's methodology.
import type { Confidence, Source } from "./methodology";
import { DEFAULT_BRIDGE as B, type BridgeAssumptions } from "./speedToPower";

export interface BridgeEntry {
  /** The settings this entry documents */
  keys: (keyof BridgeAssumptions)[];
  label: string;
  confidence: Confidence;
  value: string;
  range: string;
  why: string;
  sources: Source[];
}

const usd = (n: number, d = 0) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: d, minimumFractionDigits: d });

const EIA_COSTS = { label: "EIA: Capital cost and performance characteristics (AEO2025), Case 3 aeroderivative turbines", url: "https://www.eia.gov/analysis/studies/powerplants/capitalcost/pdf/capital_cost_AEO2025.pdf" };
const RABOBANK = { label: "Rabobank: Data centers are building a parallel energy system in the US", url: "https://www.rabobank.com/knowledge/d011524694-the-sprint-data-centers-are-building-a-parallel-energy-system-in-the-us" };
const DUKE = { label: "Duke Nicholas Institute: Rethinking Load Growth (2025)", url: "https://nicholasinstitute.duke.edu/publications/rethinking-load-growth" };

export const BRIDGE_METHODOLOGY: BridgeEntry[] = [
  {
    keys: ["delayMonths"],
    label: "Grid delay",
    confidence: "Analyst",
    value: `${B.delayMonths} months`,
    range: "The national average wait for a large data center connection is reported at about four years, and about seven years for 100 MW in Northern Virginia (JLL's 2026 outlook).",
    why: "Two years is a common wait outside the most congested markets. Slide it to match your utility's answer.",
    sources: [
      { label: "Construction Owners: How long it actually takes to power a data center in 2026", url: "https://www.constructionowners.com/insights/how-long-it-actually-takes-to-power-a-data-center-in-2026-a-u-s-market-by-market-reality-check" },
      { label: "Data Center Frontier: Dominion resumes new connections, but Loudoun faces lengthy power constraints", url: "https://www.datacenterfrontier.com/energy/article/11436951/dominion-resumes-new-connections-but-loudoun-faces-lengthy-power-constraints" },
    ],
  },
  {
    keys: ["gasPerMMBtu"],
    label: "Natural gas price",
    confidence: "Primary",
    value: `${usd(B.gasPerMMBtu, 2)} per MMBtu`,
    range: "Gas delivered to US power plants averaged $4.02 per thousand cubic feet in 2025, about $3.90 per MMBtu. In 2026 it swung from $10.50 in January to under $3 in the spring.",
    why: "Close to the 2025 average. Winter spikes matter if your bridge runs through one.",
    sources: [{ label: "EIA: U.S. natural gas electric power price (monthly)", url: "https://www.eia.gov/dnav/ng/hist/n3045us3m.htm" }],
  },
  {
    keys: ["heatRate"],
    label: "Heat rate",
    confidence: "Primary",
    value: `${B.heatRate.toLocaleString("en-US")} Btu per kWh`,
    range: "EIA's 2024 tested averages: gas engines 8,924 and gas turbines 10,999 Btu per kWh. Lower means less fuel per kWh.",
    why: "EIA's AEO2025 figure for aeroderivative turbines, the fast-to-deploy machines used for on-site power.",
    sources: [EIA_COSTS, { label: "EIA Electric Power Annual, Table 8.2: average tested heat rates", url: "https://www.eia.gov/electricity/annual/html/epa_08_02.html" }],
  },
  {
    keys: ["engineCapexPerKw"],
    label: "On-site gas generation, capital cost",
    confidence: "Primary",
    value: `${usd(B.engineCapexPerKw)} per kW`,
    range: "EIA's AEO2025 estimate for aeroderivative turbines is $1,606 per kW. Industry reporting puts gas engines at $1,700–2,000 per kW all-in, and tight supply is pushing quotes up.",
    why: "EIA's figure, so every gas number comes from one consistent study. Raise it if you're quoted more.",
    sources: [EIA_COSTS, RABOBANK],
  },
  {
    keys: ["engineFixedOmPerKwYear", "engineVarOmPerMwh"],
    label: "On-site gas generation, O&M",
    confidence: "Primary",
    value: `${usd(B.engineFixedOmPerKwYear, 2)} per kW-year + ${usd(B.engineVarOmPerMwh, 2)} per MWh`,
    range: "EIA AEO2025 aeroderivative turbines: $9.56 per kW-year fixed and $5.70 per MWh variable.",
    why: "Running around the clock, the variable part dominates.",
    sources: [EIA_COSTS],
  },
  {
    keys: ["engineLeadMonths"],
    label: "Lead time to own gas generation",
    confidence: "Analyst",
    value: `${B.engineLeadMonths} months`,
    range: "Gas engines take roughly 12–24 months to procure and install; turbine order books are booked out further.",
    why: "The middle of the range. This lead time is why owning loses to faster options for short and medium delays.",
    sources: [RABOBANK, { label: "SemiAnalysis: How AI labs are solving the power crisis (on-site gas)", url: "https://newsletter.semianalysis.com/p/how-ai-labs-are-solving-the-power" }],
  },
  {
    keys: ["servicePerMwh", "serviceLeadMonths", "serviceOffered"],
    label: "Bridge power service",
    confidence: "Analyst",
    value: `${usd(B.servicePerMwh)} per MWh, from month ${B.serviceLeadMonths}`,
    range: "Behind-the-meter power costs about $100–165 per MWh, against $90–95 from the grid.",
    why: "A provider brings and runs the generators, so you pay per MWh and nothing up front. Turn it off if no provider can serve a cluster your size in time.",
    sources: [RABOBANK],
  },
  {
    keys: ["reservePct"],
    label: "Spare capacity",
    confidence: "Estimate",
    value: `${B.reservePct}% extra`,
    range: "Data centers usually carry at least one spare unit (N+1) so a single failure doesn't take the site down.",
    why: "About one spare for every five units. More spares raise the up-front cost.",
    sources: [{ label: "Uptime Institute: Tier Standard (redundancy levels)", url: "https://uptimeinstitute.com/tiers" }],
  },
  {
    keys: ["batteryPerKwh"],
    label: "Battery cost",
    confidence: "Market",
    value: `${usd(B.batteryPerKwh)} per kWh installed`,
    range: "BNEF's 2025 survey: turnkey 4-hour systems averaged $219 per kWh in the US and $117 globally, down 31% in a year.",
    why: "The US turnkey price plus installation and connection.",
    sources: [{ label: "Energy-Storage.news: BNEF finds a 40% year-on-year drop in battery storage costs", url: "https://www.energy-storage.news/behind-the-numbers-bnef-finds-40-year-on-year-drop-in-bess-costs/" }],
  },
  {
    keys: ["batteryHours", "flexLeadMonths", "flexOffered"],
    label: "Flexible grid connection",
    confidence: "Primary",
    value: `${B.batteryHours}-hour events, connected from month ${B.flexLeadMonths}`,
    range: "Duke found the largest US grids could take 76–126 GW of new load if it accepts curtailment in 0.25–1% of hours, mostly in short events.",
    why: "Batteries carry the full load through a 4-hour event. The 12-month lead time is our estimate, and not every utility offers this: turn it off if yours doesn't.",
    sources: [DUKE],
  },
  {
    keys: ["engineValueKeptPct", "batteryValueKeptPct"],
    label: "Value kept when the grid arrives",
    confidence: "Estimate",
    value: `Gas ${B.engineValueKeptPct}% · batteries ${B.batteryValueKeptPct}%`,
    range: "Bridge generators are often kept as backup power or resold; batteries keep earning by covering peaks and outages.",
    why: "Counting only the value used up by the bridge. Set both to 0% if you'd scrap the equipment.",
    sources: [{ label: "Rabobank: Can behind-the-meter data center power endure the decade?", url: "https://www.rabobank.com/knowledge/d011532274-the-marathon-can-behind-the-meter-data-center-power-solutions-endure-the-decade-in-the-us" }],
  },
];

export const BRIDGE_FORMULAS: { label: string; formula: string }[] = [
  { label: "Facility power", formula: "GPUs × kW per GPU × PUE" },
  { label: "Waiting", formula: "until an option is ready: GPUs × (730 × $ per GPU-hour − own cost per GPU) per month" },
  { label: "Bridge service", formula: "facility MWh × (service $/MWh − grid $/MWh) per month" },
  { label: "Own gas", formula: "facility kW × (1 + spare) × capex × (1 − value kept), once + facility kWh × (heat rate × gas price + variable O&M − grid $/kWh) + fixed O&M, per month" },
  { label: "Flexible grid", formula: "facility kW × event hours × battery $/kWh × (1 − value kept), once; then normal grid power" },
];
