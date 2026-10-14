// Plain-English meanings for the terms Breakeven uses, shown by the ⓘ buttons and read aloud on request.

export const GLOSSARY = {
  tokens: {
    term: "Tokens",
    plain: "Small chunks of text, about three quarters of a word. AI usage and API prices are counted in tokens.",
  },
  perM: {
    term: "Cost per million tokens",
    plain: "The monthly cost divided by how many millions of tokens you use, so the three options can be compared on one scale.",
  },
  gpus: {
    term: "GPUs",
    plain: "The chips that run an AI model. Breakeven assumes NVIDIA H100-class GPUs. Owned GPUs come in whole servers of 8.",
  },
  outputShare: {
    term: "Share the AI writes",
    plain: "Of all the tokens, the share the AI writes rather than reads. Most APIs charge more for written tokens.",
  },
  utilization: {
    term: "How busy each GPU runs",
    plain: "How full each GPU is on average. Fuller means fewer GPUs and a lower cost, but answers slow down if GPUs run too full.",
  },
  crossover: {
    term: "Where the answer flips",
    plain: "The volumes where a different option becomes the cheapest. Below the first one the API wins; above the last one owning wins.",
  },
  payback: {
    term: "Payback",
    plain: "How many months the savings take to cover the one-time setup cost. Under 12 months is usually considered strong.",
  },
  roi: {
    term: "12-month ROI",
    plain: "Return on investment over the first year: what the savings give back after paying the setup cost, as a percentage of that cost.",
  },
  savings: {
    term: "Monthly savings",
    plain: "What the work costs with people alone, minus what it costs with AI: the tasks people still redo, their review time, and the AI compute.",
  },
  npv: {
    term: "Net present value",
    plain: "Three years of savings counted in today's money, minus the setup cost. Positive means the option is worth doing.",
  },
  verdict: {
    term: "AI verdict",
    plain: "Invest: AI wins even in the cautious case. Pilot: it wins in the likely case, so test it first. Defer, Reject or Don't use AI: it doesn't pay off, or a simpler option does better.",
  },
  fitScore: {
    term: "Fit score",
    plain: "How well an option matches your priorities, out of 100: cost, data control, time to launch, model quality, ease of running and flexibility.",
  },
  versusToday: {
    term: "Versus today",
    plain: "How much a year the recommendation saves, or costs, compared with how you run AI now.",
  },
} as const;

export type TermId = keyof typeof GLOSSARY;
