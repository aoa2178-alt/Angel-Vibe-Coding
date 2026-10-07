// "The call" for Buildout: a thesis on the AI capex cycle and the leading indicators that would prove it wrong.
// The thresholds are judgment calls, stated so they can be argued with; today's readings come from the filings.
import { SPENDERS, formatMillions, pct, signedPct } from "./data";
import { headline, payoff, readThrough } from "./metrics";

export interface Indicator {
  label: string;
  /** Today's reading, formatted */
  now: string;
  /** The level that would change the thesis */
  trigger: string;
  /** True while the thesis holds on this indicator */
  holds: boolean;
  /** What it means if it trips */
  meaning: string;
}

export function capexCall(base = "2022Q4") {
  const h = headline();
  const r = readThrough(base);
  const firms = SPENDERS.map((c) => ({ c, p: payoff(c, h.quarter) }));
  const negative = firms.filter((x) => x.p.fcf !== null && x.p.fcf < 0);
  const waves = firms.filter((x) => x.p.capexToDa !== null && x.p.capexToDa > 2);

  const indicators: Indicator[] = [
    {
      label: "Capex growth, year on year",
      now: h.yoy === null ? "–" : signedPct(h.yoy),
      trigger: "below +20%",
      holds: h.yoy === null || h.yoy >= 0.2,
      meaning: "the build-out is cooling: suppliers' order books thin out about two quarters later.",
    },
    {
      label: "Capex as a share of revenue (12 months)",
      now: pct(h.intensity, 1),
      trigger: "above 30%",
      holds: h.intensity <= 0.3,
      meaning: "spending is outrunning the business that pays for it; boards start to push back.",
    },
    {
      label: "Spenders with negative free cash flow",
      now: `${negative.length} of ${SPENDERS.length}`,
      trigger: "3 or more",
      holds: negative.length < 3,
      meaning: "the build is being financed with debt, not cash; the weakest balance sheets cut first.",
    },
    {
      label: "Supplier revenue per extra capex dollar",
      now: r.perDollar === null ? "–" : `$${r.perDollar.toFixed(2)}`,
      trigger: "below $0.50",
      holds: r.perDollar === null || r.perDollar >= 0.5,
      meaning: "more of the spend is going to buildings and power, less to chips and gear.",
    },
    {
      label: "Spenders investing over 2× their depreciation",
      now: `${waves.length} of ${SPENDERS.length}`,
      trigger: "half or more",
      holds: waves.length < SPENDERS.length / 2,
      meaning: "a depreciation wave is coming: margins fall for years unless AI revenue catches up.",
    },
  ];
  return { h, r, negative, waves, indicators, money: formatMillions };
}
