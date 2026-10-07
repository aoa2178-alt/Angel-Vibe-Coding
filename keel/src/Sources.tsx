import { Frame, useScenario } from "@/components/Frame";
import { Card, SourceLink } from "@/components/ui";
import { INITIATIVES } from "@/lib/initiatives";
import { DEFAULT_SETTINGS as S, formatMoney, pct } from "@/lib/model";

const ASSUMPTIONS: [string, string, string][] = [
  ["Blended API price", `$${S.pricePerM.toFixed(2)} per M tokens`, "A $2 input / $10 output list price with 25% output tokens, matching the public price Breakeven tracks."],
  ["Compute to serve", `$${S.computePerM.toFixed(2)} per M tokens`, "Sets a 60% API gross margin. Illustrative; Breakeven shows how serving cost depends on how you run the model."],
  ["Developers and usage", `${S.developers.toLocaleString("en-US")} developers growing ${pct(S.devGrowth)} a month, ${S.tokensPerDevM}M tokens each`, "Sized so API revenue is about $20M a month."],
  ["Enterprise ARR", `${formatMoney(S.startingArr)} at the start of the year`, "A mid-size AI lab's enterprise book. Fictional."],
  ["Pipeline and win rate", `${formatMoney(S.pipeline)} a month at ${pct(S.winRate)}`, "Enterprise software win rates are commonly quoted around 20–30%."],
  ["Churn and expansion", `${pct(S.churn, 1)} and ${pct(S.expansion, 1)} of ARR a month`, "Roughly 106% net revenue retention over a year."],
  ["Sales capacity", `${S.reps} reps, +${S.hiresPerMonth} a month, ${formatMoney(S.quota)} quota, ${pct(S.attainment)} attainment, ${S.rampMonths}-month ramp`, "New reps reach full productivity linearly over the ramp. Enterprise sales ramps of 3–6 months are typical."],
  ["Costs", `${formatMoney(S.repCost)} per rep, ${S.supportPerRep} support roles per rep at ${formatMoney(S.supportCost)}, ${formatMoney(S.programs)} a month in programs`, "Fully loaded costs, including benefits and overhead. Illustrative."],
];

const METHODS: [string, string][] = [
  ["API revenue", "active developers × tokens per developer × price per M tokens"],
  ["New enterprise ARR", "min(pipeline × win rate, ramped reps × quota ÷ 12 × attainment)"],
  ["Enterprise ARR", "last month × (1 − churn + expansion) + new ARR; revenue = ARR ÷ 12"],
  ["Status", "on track within 5% of plan (or better), watch within 10%, off track beyond"],
  ["Re-forecast", "actuals to date, then the latest month's rates held for the rest of the year"],
  ["Variance bridge", "sequential substitution: swap drivers from plan to actual one at a time; the steps add up to the gap"],
  ["Initiative value", "(re-forecast revenue with the initiative − without) × chance it works"],
  ["Funding", "the combination with the most expected value within the budget and headcount (all 2⁸ combinations checked)"],
];

/** What's assumed, what's public, and the methods. */
export function Sources() {
  const [s, setS] = useScenario("sources");
  return (
    <Frame route="sources" s={s} setS={setS}>
      <div className="mb-8 max-w-3xl">
        <p className="kicker">Sources</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] sm:text-5xl">A fictional company, real methods</h1>
        <p className="mt-4 text-lg leading-8 text-ink-2">
          Halcyon AI, its plan, its actuals and its initiatives are all made up, so no company's confidential numbers are used. The methods are the standard ones an
          operations team runs every month.
        </p>
      </div>
      <div className="grid gap-6">
        <Card>
          <p className="kicker">Plan assumptions</p>
          <ul className="mt-2 divide-y divide-line">
            {ASSUMPTIONS.map(([k, v, why]) => (
              <li key={k} className="grid gap-1 py-3 text-sm leading-6 sm:grid-cols-[13rem_1fr] sm:gap-6">
                <span>
                  <span className="block font-semibold">{k}</span>
                  <span className="font-mono text-xs text-muted">{v}</span>
                </span>
                <span className="text-ink-2">
                  {why}{" "}
                  {k === "Blended API price" && <SourceLink href="https://breakeven-silk.vercel.app/sources#price-history">Breakeven price history</SourceLink>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="kicker">The actuals</p>
          <p className="mt-2 text-[15px] leading-7 text-ink-2">
            The "actual" results are fictional and fixed, built once from the default plan with a story: developers grow faster than planned, a competitive 10% API price cut
            lands in April, win rate slips to about 21% from March as a rival enters enterprise deals, churn rises a quarter from May, and hiring runs a month behind.
            Small, seeded month-to-month noise makes them look like real data. Editing the plan never changes them.
          </p>
        </Card>
        <Card>
          <p className="kicker">Initiatives</p>
          <ul className="mt-2 grid gap-1.5 text-sm leading-6 text-ink-2">
            {INITIATIVES.map((i) => (
              <li key={i.id}>
                <span className="font-semibold text-ink">{i.name}</span>: {formatMoney(i.cost)}, {i.headcount} people,{" "}
                {i.effects
                  .map((e) => `${e.driver} ${e.kind === "mult" ? `${e.value >= 1 ? "+" : "−"}${Math.round(Math.abs(e.value - 1) * 100)}%` : `${e.value >= 0 ? "+" : "−"}${Math.abs(e.value) < 1 ? pct(Math.abs(e.value), 1) : Math.abs(e.value)}`}`)
                  .join(", ")}
                , {pct(i.confidence)} confidence, starts {i.delay} month{i.delay === 1 ? "" : "s"} later.
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <p className="kicker">Methods</p>
          <dl className="mt-2 divide-y divide-line text-sm">
            {METHODS.map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 sm:grid-cols-[11rem_1fr] sm:gap-6">
                <dt className="font-semibold">{k}</dt>
                <dd className="font-mono text-[13px] leading-6 text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>
    </Frame>
  );
}
