import { Fold } from "@/components/Fold";
import { Frame, useScenario } from "@/components/Frame";

/** The explanations behind the numbers, kept here so the working pages stay short. Each answer has an id for deep links. */
export const FAQ_GROUPS: { title: string; items: { id: string; q: string; a: string }[] }[] = [
  {
    title: "Data",
    items: [
      {
        id: "sources",
        q: "Where does the data come from?",
        a: "The World Bank's World Development Indicators (internet use, population, rural share, income, electricity, mobile subscriptions, income shares by fifth) and the Global Findex 2025 survey (phone and smartphone ownership by group, reasons for not owning a smartphone, mobile money). Both are CC BY 4.0. Prices and costs are labeled assumptions with sources on the Sources page.",
      },
      {
        id: "no-signal",
        q: "How is the number of people with no signal estimated?",
        a: "From GSMA's State of Mobile Internet Connectivity 2025 coverage gap for the country's region: Sub-Saharan Africa 10%, South Asia 4%, world 4%; high-income countries are set at 1% (an estimate). A country's own figure may differ, and it can be set on the Coverage and funding page.",
      },
    ],
  },
  {
    title: "Affordability",
    items: [
      {
        id: "targets",
        q: "When is being online affordable?",
        a: "A 2GB data plan is affordable under 2% of monthly income (the UN Broadband Commission target). A phone is affordable when the cash needed up front is under 20% of monthly income (GSMA). Income for each fifth of the population comes from GNI per capita and the World Bank's income shares.",
      },
      {
        id: "prices",
        q: "Which prices are used?",
        a: "The data price defaults to ITU's published median for the country's income group (2GB basket, as a share of GNI per capita). The entry smartphone defaults to $54 (GSMA). Taxes default to 15% of the phone price and 10% of the data price. All are editable.",
      },
      {
        id: "levers",
        q: "How are the levers compared?",
        a: "Each lever (pay-as-you-go phone financing with a default guarantee, removing taxes on phones or data, a data subsidy, or a package) is costed to the public purse over the planning horizon and divided by the people it brings online who have a signal and choose to connect. The lowest cost per person comes first. Tax cuts and subsidies are also paid on people who would have bought anyway.",
      },
    ],
  },
  {
    title: "Coverage and funding",
    items: [
      {
        id: "technology",
        q: "How is the cheapest technology chosen?",
        a: "People without a signal are split by area (remote, rural, urban) and into three tranches that are harder and dearer to reach. For each tranche, the technology with the lowest cost per person actually connected wins: capex plus the present value of running costs, divided by the share who go online. Costs are illustrative, scaled to ITU's Connecting Humanity totals.",
      },
      {
        id: "budget",
        q: "How is a budget allocated?",
        a: "The cheapest tranches per person connected are funded first. Because tranches can be partly funded, this is the optimal allocation (the fractional knapsack).",
      },
      {
        id: "who-pays",
        q: "How is the bill split between operators, the universal service fund and government?",
        a: "By the viability gap. Operators fund what the revenue from new users covers (revenue per user × margin, over the horizon, discounted). The universal service fund covers the next part, up to what its levy on telecom revenue raises. Government and donors cover the rest.",
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
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">How Signal works</h1>
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
