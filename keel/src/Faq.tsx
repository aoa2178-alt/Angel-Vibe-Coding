import { Fold } from "@/components/Fold";
import { Frame, useScenario } from "@/components/Frame";

/** The explanations behind the numbers, kept here so the working pages stay short. Each answer has an id for deep links. */
export const FAQ_GROUPS: { title: string; items: { id: string; q: string; a: string }[] }[] = [
  {
    title: "The company and the data",
    items: [
      {
        id: "company",
        q: "Is Halcyon AI a real company?",
        a: "No. Halcyon AI is a fictional AI lab and every figure is illustrative. The API price matches public list pricing tracked in Breakeven. The methods are the point: a driver-based plan, a variance bridge, and expected-value funding.",
      },
      {
        id: "actuals",
        q: "Where do the actuals come from?",
        a: "They are fictional but fixed: built once from the default plan with a story in them. Developers beat plan, a 10% competitive price cut lands in April, win rate slips to about 21% from March, churn rises from May, and hiring runs a month behind. Editing the plan moves the gap, not the actuals, as in a real company.",
      },
    ],
  },
  {
    title: "Annual plan",
    items: [
      {
        id: "drivers",
        q: "How is revenue planned?",
        a: "Two segments. API revenue = active developers × tokens per developer × price per million tokens, with developers growing at a monthly rate. Enterprise new ARR each month is the lesser of what the pipeline converts (pipeline × win rate) and what the sales team can close (ramped reps × quota × attainment ÷ 12). ARR then churns and expands monthly, and enterprise revenue is ARR ÷ 12.",
      },
      {
        id: "ramp",
        q: "How are new sales reps counted?",
        a: "The starting team is fully productive. Each new hire ramps linearly over the ramp period, so a rep hired two months into a four-month ramp counts as half a rep.",
      },
      {
        id: "okrs",
        q: "Where do the OKR targets come from?",
        a: "Straight from the plan's drivers, so every key result traces to a number someone owns. In the review they are scored against the re-forecast.",
      },
    ],
  },
  {
    title: "Business review",
    items: [
      {
        id: "reforecast",
        q: "How is the re-forecast built?",
        a: "Actuals to date, then the rest of the year at today's run-rate: rates hold at the latest actual, developers keep growing at the plan's rate from where they actually are, and hiring follows the plan.",
      },
      {
        id: "bridge",
        q: "How does the variance bridge split the gap?",
        a: "Sequential substitution. Starting from the plan, each driver is swapped to its actual path one at a time, in a fixed order, and the change in year-to-date revenue is recorded. The driver effects add up exactly to actual minus plan.",
      },
      {
        id: "status",
        q: "What do on track, watch and off track mean?",
        a: "On track: within 5% of plan, or better. Watch: within 10%. Off track: more than 10% worse. For churn, lower is better.",
      },
    ],
  },
  {
    title: "Funding",
    items: [
      {
        id: "expected-value",
        q: "How is each initiative valued?",
        a: "Each initiative moves a driver from some month on, after a start delay. Its value is the extra revenue it adds to the re-forecast for the rest of the year, multiplied by the chance it works.",
      },
      {
        id: "portfolio",
        q: "How is the funded set chosen?",
        a: "Every combination of initiatives is checked, and the set with the most expected value that fits the remaining budget and headcount is funded. This is a small knapsack problem, so checking every combination gives the exact best set.",
      },
      {
        id: "zero",
        q: "Why do some initiatives add nothing?",
        a: "Either they start working too late to affect this year, or they relieve a constraint that isn't binding. Extra sales reps add nothing while pipeline, not selling capacity, limits new ARR.",
      },
    ],
  },
];

export function Faq() {
  const [s, setS] = useScenario("faq");
  return (
    <Frame route="faq" s={s} setS={setS}>
      <div className="mb-8 max-w-2xl">
        <p className="kicker">FAQ</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">How Keel works</h1>
      </div>
      <div className="grid gap-10">
        {FAQ_GROUPS.map((g) => (
          <section key={g.title} aria-label={g.title}>
            <h2 className="mb-3 text-lg font-semibold">{g.title}</h2>
            <div className="grid gap-2">
              {g.items.map((it) => (
                <Fold key={it.id} id={it.id} title={it.q}>
                  <p className="max-w-3xl text-[15px] leading-7 text-ink-2">{it.a}</p>
                </Fold>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Frame>
  );
}
