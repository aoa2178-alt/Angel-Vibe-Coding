// Sources and methods behind step 2's "Running it well" and step 1's product mode. Values are read from the defaults,
// so this page can't disagree with the model. Same confidence scale as the calculator's methodology.
import { PRODUCT_TEMPLATE as P } from "./freemium";
import type { Confidence, Source } from "./methodology";
import { DEFAULT_OPS as O } from "./operate";
import { PRICES } from "./prices";

export interface OpsEntry {
  label: string;
  confidence: Confidence;
  value: string;
  range: string;
  why: string;
  sources: Source[];
}

const usd = (n: number, d = 0) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: d, minimumFractionDigits: d });
const gpu = PRICES.gpu.find((s) => s.id === PRICES.defaults.gpu)!.points;
const first = gpu[0]!;
const last = gpu[gpu.length - 1]!;

const KINGMAN = { label: "Kingman's formula (queueing)", url: "https://en.wikipedia.org/wiki/Kingman%27s_formula" };
const LITTLE = { label: "Little's Law", url: "https://en.wikipedia.org/wiki/Little%27s_law" };

export const OPS_METHODOLOGY: OpsEntry[] = [
  {
    label: "Tokens per request",
    confidence: "Estimate",
    value: `${O.requestTokens.toLocaleString("en-US")} tokens`,
    range: "A short chat turn is a few hundred tokens; a request carrying documents or code can be tens of thousands.",
    why: "Sets how long a GPU works on one request (tokens ÷ GPU throughput). Use your own average.",
    sources: [],
  },
  {
    label: "Traffic variability",
    confidence: "Estimate",
    value: "Steady 0.5 · Typical 1 · Spiky 3",
    range: "The squared coefficient of variation of arrivals: 1 is purely random (Poisson); bursts and launches run well above it.",
    why: "The V in wait = variability × utilization × time. Doubling it doubles the queue.",
    sources: [KINGMAN],
  },
  {
    label: "Wait target",
    confidence: "Estimate",
    value: `${O.waitTargetSec} second in the queue, on average`,
    range: "Interactive products aim for well under a few seconds before an answer starts; batch jobs can wait minutes.",
    why: "The ceiling for how hot to run the fleet. It's a service-level choice, not a cost.",
    sources: [],
  },
  {
    label: "Peak hours",
    confidence: "Estimate",
    value: `${O.peakHours} hours a day`,
    range: "Business-hours products peak for 8–10 hours; global consumer products flatten out.",
    why: "With the plan's utilization, it sets how much of the fleet is always busy (the base) and how much only at peak.",
    sources: [],
  },
  {
    label: "On-demand premium",
    confidence: "Estimate",
    value: `${O.onDemandPremium}× the reserved price`,
    range: "Clouds discount committed use heavily; by-the-hour capacity typically costs 1.3–2× a reserved rate.",
    why: "Renting only at peak is flexible but dearer per hour. This is what makes the newsvendor trade-off real.",
    sources: [{ label: "AWS: Savings Plans (discounts for committed use vs on-demand)", url: "https://aws.amazon.com/savingsplans/" }],
  },
  {
    label: "Rental price decline",
    confidence: "Market",
    value: `${(O.rentalDecline * 100).toFixed(1)}% a year`,
    range: `Measured from the price tracker: H100 rental at ${usd(first.value, 2)} (${first.date}) and ${usd(last.value, 2)} (${last.date}). Past falls were steep as supply caught up; the future may be gentler.`,
    why: "Drives when renting becomes cheaper than keeping owned GPUs running.",
    sources: [first, last].map((p) => ({ label: `H100 rental, ${p.date}`, url: p.source })),
  },
  {
    label: "Product template",
    confidence: "Estimate",
    value: `${P.users.toLocaleString("en-US")} users · ${P.paidShare * 100}% paid at ${usd(P.price)} · ${(P.freeTokens / 1000).toLocaleString("en-US")}K / ${(P.paidTokens / 1e6).toLocaleString("en-US")}M tokens per free / paid user`,
    range: "Freemium products commonly convert 2–5% of users. Usage per user varies by orders of magnitude between light and heavy users.",
    why: "An illustrative AI writing app. Replace every number with your own.",
    sources: [{ label: "Freemium (business model)", url: "https://en.wikipedia.org/wiki/Freemium" }],
  },
];

export const OPS_FORMULAS: { label: string; formula: string }[] = [
  { label: "Time per request", formula: "tₑ = tokens per request ÷ GPU tokens per second" },
  { label: "Queue wait", formula: "(cₐ² + 1)/2 × u^(√(2(m + 1)) − 1) ÷ (m × (1 − u)) × tₑ, for m GPUs at utilization u (Kingman; Sakasegawa)" },
  { label: "Little's Law", formula: "requests in the system = arrivals per second × (tₑ + wait)" },
  { label: "Off-peak need", formula: "(utilization − peak share of the day) ÷ (1 − peak share), as a share of the fleet" },
  { label: "Critical ratio", formula: "own cost per GPU ÷ (730 h × rent per hour × on-demand premium): own a GPU only if it's busy more than this share of the day" },
  { label: "Retire after", formula: "12 × ln(keep ÷ rent) ÷ ln(1 − yearly decline) months, keep = support + electricity + colocation (hardware is sunk)" },
  { label: "Freemium break-even", formula: "paid share = free user's compute ÷ (price − paid user's compute + free user's compute)" },
];

export const OPS_SOURCES = [KINGMAN, LITTLE, { label: "Newsvendor model", url: "https://en.wikipedia.org/wiki/Newsvendor_model" }, { label: "Sunk cost", url: "https://en.wikipedia.org/wiki/Sunk_cost" }];
