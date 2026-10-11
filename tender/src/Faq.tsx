import { Fold } from "@/components/Fold";
import { Frame, useScenario } from "@/components/Frame";

/** The explanations behind the numbers, kept here so the working pages stay short. Each answer has an id for deep links. */
export const FAQ_GROUPS: { title: string; items: { id: string; q: string; a: string }[] }[] = [
  {
    title: "The case and the data",
    items: [
      {
        id: "case",
        q: "Who is the buyer?",
        a: "Meridian Compute, a fictional company sourcing the power and cooling equipment for Hall B, a 96 MW AI data hall. Suppliers, quantities, quotes and savings ranges are illustrative assumptions; the transformer price sits inside the public range (GAO: up to $10 million a unit).",
      },
      {
        id: "public-data",
        q: "Which numbers come from public data?",
        a: "Commodity and price series from FRED: the IMF copper price, the iron and steel price index, the electrical equipment and transformer producer price indexes, and the manufacturing wage. Quantities, steel price per tonne and labor hours are assumptions. The Sources page lists every series.",
      },
    ],
  },
  {
    title: "Spend and should-cost",
    items: [
      {
        id: "pareto",
        q: "What does the spend analysis show?",
        a: "Spend by category, largest first, with the cumulative share (a Pareto view); how concentrated each category is on its largest supplier; and a savings range for each category from a named lever, such as a competitive re-bid or a second qualified source.",
      },
      {
        id: "should-cost",
        q: "How is the should-cost built?",
        a: "Line by line: copper windings, the electrical steel core, tank steel, bought-in components, factory labor, overhead at 30% of materials and labor, engineering and testing, freight, and a 15% supplier margin. Each line moves with its public price series.",
      },
      {
        id: "index-check",
        q: "What is the index check?",
        a: "Each input is weighted by its share of the transformer and indexed to January 2019, then compared with the transformer producer price index. When prices rise faster than costs, the difference is the premium suppliers charge while factories are full, and the room to negotiate.",
      },
    ],
  },
  {
    title: "Bids and negotiation",
    items: [
      {
        id: "tco",
        q: "What goes into total cost of ownership?",
        a: "Price, freight and duty, the financing cost of cash paid up front (deposit × cost of capital × lead time), expected quality cost (failure rate × 25% of the unit price), and lateness: months delivered after the need-by date × the cost of a month late.",
      },
      {
        id: "month-late",
        q: "How is a month late valued?",
        a: "Lease revenue the hall would have earned (IT kW × lease rate per kW-month) plus the carrying cost of capital already spent (build cost × cost of capital ÷ 12).",
      },
      {
        id: "scorecard",
        q: "How does the scorecard work?",
        a: "Each bid scores 1 to 5 on total cost, delivery, quality, supply risk and capacity, relative to the best bid. Your weights combine them into a score out of 100.",
      },
      {
        id: "award-split",
        q: "When does splitting the award pay?",
        a: "The hall needs two of three units to energize. With one supplier, that supplier's failure delays the hall. With one unit from each of three suppliers, two must fail together, which lowers the chance of a delay at the cost of the volume discount.",
      },
      {
        id: "bounds",
        q: "How are the walk-away and target prices set?",
        a: "Walk-away: the unit price at which the chosen bid's total cost equals the runner-up's. Target: the quote as if it had risen only as fast as the transformer's costs since 2019, not as fast as the price index. The supplier's floor is the should-cost with a 5% margin.",
      },
      {
        id: "structures",
        q: "How do the deal structures compare?",
        a: "Spot: today's quote and lead time. Framework: commit to nine more units over three years for 6% off, with the price linked to the transformer index. Capacity reservation: a 15% deposit buys a factory slot six months earlier, which pays only when the supplier would otherwise be late.",
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
        <h1 className="mt-2 text-4xl tracking-[-0.025em] sm:text-5xl">How Tender works</h1>
      </div>
      <div className="grid gap-10">
        {FAQ_GROUPS.map((g) => (
          <section key={g.title} aria-label={g.title}>
            <h2 className="mb-3 text-2xl">{g.title}</h2>
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
