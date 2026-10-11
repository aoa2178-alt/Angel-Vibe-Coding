import { Fold } from "@/components/Fold";
import { Frame, useScenario } from "@/components/Frame";

/** The explanations behind the numbers, kept here so the working pages stay short. Each answer has an id for deep links. */
export const FAQ_GROUPS: { title: string; items: { id: string; q: string; a: string }[] }[] = [
  {
    title: "Case studies and data",
    items: [
      {
        id: "cases",
        q: "What do the case studies include?",
        a: "Three real AI campuses: Crusoe in Abilene, CoreWeave in Lancaster and QTS in Cedar Rapids. Phase sizes, construction starts, targets and go-live dates come from public disclosures and link to their sources. Milestone dates inside each phase, prices and costs are labeled assumptions, and every one is editable.",
      },
      {
        id: "milestones",
        q: "How are the milestone dates set?",
        a: "Each phase waits on five milestones: building shell, electrical gear, grid energization, cooling and GPU delivery. Their dates are assumptions fitted to the public start, target and go-live dates. Change them under Cost of delay by slipping any milestone.",
      },
      {
        id: "excluded",
        q: "What is left out?",
        a: "The operators' actual contracts and penalties, labor availability and permitting risk, none of which are public. Loadline is an illustrative model for discussion, not company guidance.",
      },
    ],
  },
  {
    title: "Power demand",
    items: [
      {
        id: "power",
        q: "How is power demand calculated?",
        a: "GPUs × kW per GPU gives IT power; × PUE gives facility power. kW per GPU is all-in by GPU generation, from NVIDIA reference designs. Annual electricity cost = facility MW × 8,760 hours × average load × price per MWh.",
      },
      {
        id: "pue",
        q: "What is PUE?",
        a: "Power usage effectiveness: total facility power divided by the power the computing equipment draws. A PUE of 1.2 adds 20% for cooling and other facility load.",
      },
      {
        id: "price",
        q: "Which electricity price is used?",
        a: "The EIA average industrial price for the campus's state. It is a regional average, not the campus's contracted rate.",
      },
    ],
  },
  {
    title: "Schedule and cost of delay",
    items: [
      {
        id: "critical-path",
        q: "What is the critical path?",
        a: "Go-live is the latest milestone plus commissioning. That latest milestone is the critical path. Every other milestone has slack: the months it can slip before it moves go-live.",
      },
      {
        id: "delay-cost",
        q: "How is a month of delay valued?",
        a: "Revenue not earned (leased capacity at $ per kW-month, or GPU cloud at $ per GPU-hour × utilization) plus the carrying cost of capital that is built but idle (build cost × cost of capital ÷ 12). This is the exposure per month, not a budget: an expedite is worth its cost only weighted by the chance it actually saves the month.",
      },
      {
        id: "resolve-first",
        q: "How is “resolve first” ranked?",
        a: "Each milestone is slipped three more months, one at a time, on top of the current slips. Milestones are ranked by the cost of the go-live delay that causes; those with enough slack cost nothing.",
      },
      {
        id: "sunk",
        q: "How are delays that have already happened treated?",
        a: "Their cost is shown, but it is sunk. Priorities are set on what can still move, not on what has already been lost.",
      },
    ],
  },
  {
    title: "Methods",
    items: [
      {
        id: "lead-time",
        q: "Why do transformers take years to arrive?",
        a: "Factory physics (Kingman's formula): quoted lead time ≈ build time × (variability × u ÷ (1 − u) + 1), where u is factory utilization. Near full load, waiting time grows sharply: at 90% load, a 3-month build quotes about 30 months.",
      },
      {
        id: "spares",
        q: "How is the number of spare transformers set?",
        a: "The newsvendor model. Being short one transformer costs that unit's share of its phase's monthly delay cost × the replacement lead time; an unused spare costs its price less the value kept. Hold the smallest number of spares where the chance of enough units meets the critical ratio, shortage cost ÷ (shortage cost + spare cost). Shortages across the campus are Poisson, and one spare pool covers every phase.",
      },
      {
        id: "expansion",
        q: "How is “build now or phase it” decided?",
        a: "A decision tree on 10-year NPV at the cost of capital. Building the later phases now brings capacity online earlier and saves on scale; if demand turns out weak, only part of it is used. The break-even probability is the chance of strong demand at which both choices are worth the same.",
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
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] sm:text-4xl">How Loadline works</h1>
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
