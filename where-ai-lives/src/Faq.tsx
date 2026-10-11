import { Fold } from "@/components/Fold";
import { Frame, useScenario } from "@/components/Frame";

/** The explanations behind the numbers, kept here so the working pages stay short. Each answer has an id for deep links. */
export const FAQ_GROUPS: { title: string; items: { id: string; q: string; a: string }[] }[] = [
  {
    title: "Data",
    items: [
      {
        id: "sites",
        q: "Which data centers are included?",
        a: "Every US site in Epoch AI's Frontier Data Centers dataset (CC BY 4.0), with the facility power each draws over time. Future quarters follow each site's announced timeline; projects can slip or be cancelled. Locations come from the US Census geocoder.",
      },
      {
        id: "owners",
        q: "How are owners assigned?",
        a: "As Epoch AI records them. Sites without a named owner are listed under their developer, such as QTS or STACK.",
      },
      {
        id: "prices",
        q: "Which power prices are used?",
        a: "EIA Electric Power Monthly, Table 5.6.B: the average price by state, industrial or commercial. These are state averages; a large site negotiates its own contract.",
      },
      {
        id: "wait",
        q: "What does the grid wait measure?",
        a: "Lawrence Berkeley National Laboratory's interconnection queue data: the median time for new power plants to go from connection request to operation, by grid region. It is a public proxy for how fast a region adds supply; data centers' own connection waits aren't published consistently. Each state uses its main grid region, where most of its connection requests go; a few states are split between regions.",
      },
    ],
  },
  {
    title: "Site selection",
    items: [
      {
        id: "dea",
        q: "How does the DEA score work?",
        a: "Data envelopment analysis treats each state as a unit that uses two inputs, power price and grid wait, to host a data center; less of each is better. The score is the smallest share of a state's inputs that some mix of other states can still match. No weights are chosen by hand: each state is judged on the trade-off that flatters it most, so a low score is hard to argue with.",
      },
      {
        id: "frontier",
        q: "What is the frontier?",
        a: "The states that no mix of others beats on both price and wait at once. With two inputs, it is the lower-left edge of the scatter; every other state is measured along a straight line toward it. States on the frontier score 1.0.",
      },
      {
        id: "limits",
        q: "What does the score leave out?",
        a: "Land, water, fiber, tax incentives and on-site generation also decide real sites; this scores the grid only. Grid waits are by region, so states in one region share a wait and the score mostly separates regions.",
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
        <h1 className="mt-2 text-4xl tracking-[-0.03em] sm:text-5xl">How Where AI Lives works</h1>
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
