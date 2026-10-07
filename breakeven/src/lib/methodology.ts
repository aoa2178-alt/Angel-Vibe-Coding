// Sources behind every default in DEFAULT_ASSUMPTIONS. The values themselves are read from tco.ts,
// so this page can never disagree with the calculator. Update CHECKED when the sources are re-checked.
import { DEFAULT_ASSUMPTIONS as A, type Assumptions } from "./tco";

export const CHECKED = "October 2026";

export interface Source {
  label: string;
  url: string;
}

export interface MethodologyEntry {
  key: keyof Assumptions;
  label: string;
  value: string;
  range: string;
  why: string;
  sources: Source[];
}

const usd = (n: number, d = 0) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: d, minimumFractionDigits: d });

export const METHODOLOGY: MethodologyEntry[] = [
  {
    key: "apiInputPerM",
    label: "API price",
    value: `${usd(A.apiInputPerM)} input · ${usd(A.apiOutputPerM)} output per M tokens`,
    range: "Varies by provider and model size; smaller models cost a fraction of this, frontier models several times more.",
    why: "Claude Sonnet 5.5's list price: a capable mid-to-large model, the kind a company would otherwise replace with a 70B-class open-weight model on its own GPUs. Batch and prompt-caching discounts are not applied.",
    sources: [{ label: "Anthropic: Claude API pricing", url: "https://platform.claude.com/docs/en/about-claude/pricing" }],
  },
  {
    key: "rentPerGpuHour",
    label: "Cloud GPU rental",
    value: `${usd(A.rentPerGpuHour, 2)} per GPU-hour`,
    range: "$1.49–$2.99 on GPU-focused clouds; a median of about $3.61 across 40+ providers; $3.50–$7 on the big clouds.",
    why: "An on-demand H100 on a GPU-focused cloud. Reserved capacity is cheaper and hyperscalers cost more, so this sits in the middle of what a cost-conscious team would actually pay.",
    sources: [
      { label: "IntuitionLabs: H100 rental prices across 15+ providers (2026)", url: "https://intuitionlabs.ai/articles/h100-rental-prices-cloud-comparison" },
      { label: "Jarvis Labs: H100 price guide 2026", url: "https://jarvislabs.ai/blog/h100-price" },
    ],
  },
  {
    key: "hardwarePerGpu",
    label: "Hardware cost",
    value: `${usd(A.hardwarePerGpu)} per GPU, all-in`,
    range: "8-GPU H100 servers run about $250,000–$320,000, so roughly $31,000–$40,000 per GPU including CPUs, memory and networking.",
    why: "The middle of the range for a complete 8-GPU server, divided by eight. Owned GPUs are always bought in whole servers.",
    sources: [
      { label: "IntuitionLabs: NVIDIA AI GPU pricing guide", url: "https://intuitionlabs.ai/articles/nvidia-ai-gpu-pricing-guide" },
      { label: "GPU Per Hour: NVIDIA H100 price", url: "https://gpuperhour.com/blog/nvidia-h100-price" },
    ],
  },
  {
    key: "depreciationYears",
    label: "Depreciation",
    value: `${A.depreciationYears} years`,
    range: "Hyperscalers depreciate servers over 5–6 years; Amazon shortened some to 5 in 2025, citing the pace of AI hardware.",
    why: "Deliberately conservative. GPUs lose value faster than general servers, and a smaller company can't stretch hardware the way a hyperscaler can.",
    sources: [
      { label: "Interface: Hyperscalers lengthen server lifespans", url: "https://interface.media/blog/2024/03/06/hyperscalers-lengthen-server-lifespans-to-save-billions/" },
      { label: "Data Gravity: How long does a GPU last?", url: "https://www.datagravity.dev/p/how-long-does-a-gpu-last" },
    ],
  },
  {
    key: "kwPerGpu",
    label: "Power draw",
    value: `${A.kwPerGpu} kW per GPU`,
    range: "An H100 SXM is rated at 700 W; a full 8-GPU DGX H100 system draws up to 10.2 kW, about 1.28 kW per GPU.",
    why: "Each GPU's share of the whole server (CPUs, memory, networking and fans), not just the chip.",
    sources: [
      { label: "NVIDIA: DGX H100 user guide", url: "https://docs.nvidia.com/dgx/dgxh100-user-guide/introduction-to-dgxh100.html" },
      { label: "NVIDIA: DGX SuperPOD H100 electrical specifications", url: "https://docs.nvidia.com/dgx-superpod/design-guides/dgx-superpod-data-center-design-h100/latest/electrical.html" },
    ],
  },
  {
    key: "pue",
    label: "Data center PUE",
    value: `${A.pue}`,
    range: "The industry average is about 1.56 (1.47 weighted by capacity); modern and hyperscale facilities run 1.1–1.3.",
    why: "A modern colocation facility of the kind an AI deployment would choose. Older sites would push owning costs up.",
    sources: [{ label: "Uptime Institute: Large data centers are mostly more efficient", url: "https://journal.uptimeinstitute.com/large-data-centers-are-mostly-more-efficient-analysis-confirms/" }],
  },
  {
    key: "electricityPerKwh",
    label: "Electricity",
    value: `${usd(A.electricityPerKwh, 2)} per kWh`,
    range: "The US industrial average was 8.71¢ per kWh in May 2026; commercial rates are higher.",
    why: "Slightly above the industrial average, since a colocation provider passes power through with a margin.",
    sources: [{ label: "U.S. EIA: Average price of electricity by sector", url: "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a" }],
  },
  {
    key: "opsPerGpuMonth",
    label: "Space, staff & upkeep",
    value: `${usd(A.opsPerGpuMonth)} per GPU per month`,
    range: "North American colocation averaged about $195 per kW per month in 2025, up 6.5% on the year; all-in costs with power and services run higher.",
    why: `About ${usd(195 * A.kwPerGpu)} of colocation space for each GPU's ${A.kwPerGpu} kW, plus a share of staff time and maintenance contracts.`,
    sources: [{ label: "CBRE: North American data center market set records in 2025", url: "https://www.cbre.com/press-releases/fast-growing-north-american-data-center-market-set-records-in-2025" }],
  },
  {
    key: "gpuTokensPerSec",
    label: "GPU throughput",
    value: `${A.gpuTokensPerSec.toLocaleString("en-US")} tokens per second per GPU`,
    range: "MLPerf benchmark runs reach about 3,400 tokens/sec per H100 on Llama 2 70B in offline batch mode; real interactive serving is lower.",
    why: "Below the benchmark ceiling to allow for latency targets, uneven traffic and less-tuned software. This is the most sensitive number in the model: doubling it roughly halves the GPUs you need.",
    sources: [
      { label: "IEEE Spectrum: MLPerf adds Llama 2 70B", url: "https://spectrum.ieee.org/ai-benchmark-mlperf-llama-stablediffusion" },
      { label: "NVIDIA: MLPerf Inference v4.1 results", url: "https://developer.nvidia.com/blog/nvidia-blackwell-platform-sets-new-llm-inference-records-in-mlperf-inference-v4-1" },
    ],
  },
];

export const FORMULAS: { label: string; formula: string }[] = [
  { label: "Average load", formula: "tokens per month ÷ (730 hours × 3,600 seconds)" },
  { label: "GPUs needed", formula: "average tokens/sec ÷ (throughput × utilization), rounded up" },
  { label: "API", formula: "tokens × (input price × input share + output price × output share)" },
  { label: "Rent", formula: "GPUs needed × 730 hours × $ per GPU-hour" },
  { label: "Own", formula: "GPUs in whole 8-GPU servers × (hardware ÷ depreciation months + kW × PUE × 730 × $/kWh + upkeep)" },
  { label: "Power cap", formula: "owned GPUs ≤ power budget ÷ (kW × PUE), in whole servers; the rest are rented" },
  { label: "Per million tokens", formula: "monthly cost ÷ millions of tokens" },
];

export const NOT_INCLUDED = [
  "Taxes, network egress, and one-time setup or migration work.",
  "Model quality: own and rent assume an open-weight model of similar size, which may not match a frontier API model.",
  "Discounts: reserved cloud capacity, enterprise API agreements, batch pricing and prompt caching can all lower costs.",
  "Cost of capital: buying servers ties up cash up front; the model spreads hardware evenly over its life.",
  "Peak traffic: GPUs are sized from average load and your utilization target, not minute-by-minute peaks.",
];
