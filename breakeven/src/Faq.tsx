import { useEffect } from "react";
import { Fold } from "@/components/Fold";
import { PlanFrame, usePlan } from "@/components/PlanFrame";

/** The explanations behind the numbers, kept here so the working pages stay short. Each answer has an id for deep links. */
export const FAQ_GROUPS: { title: string; items: { id: string; q: string; a: string }[] }[] = [
  {
    title: "Prices and assumptions",
    items: [
      {
        id: "defaults",
        q: "What do the default assumptions represent?",
        a: "Illustrative October 2026 values, not quotes. API pricing uses Claude Sonnet 5.5 list prices ($2 input and $10 output per million tokens). Rental uses about $2.50 per H100-hour on GPU-focused clouds (market average about $3.60; hyperscalers about $7). Hardware is about $35,000 per GPU, from 8-GPU H100 servers at $250–320K, drawing 1.3 kW per GPU including its share of the server. Throughput is a conservative estimate for a 70B-class open-weight model with batching. Every value is editable; the Sources page gives ranges and references.",
      },
      {
        id: "current-prices",
        q: "Are the prices current?",
        a: "API and GPU rental prices are tracked over time on the Sources page. When the market moves more than 5% from your assumptions, the cost comparison offers to apply current prices. A weekly review proposes updates, and nothing changes without approval.",
      },
      {
        id: "excluded",
        q: "What is excluded from the estimates?",
        a: "Taxes, data egress, setup and change-management costs. All figures are illustrative estimates, not provider quotes.",
      },
    ],
  },
  {
    title: "Cost comparison",
    items: [
      {
        id: "open-weight",
        q: "Why do Rent and Own assume an open-weight model?",
        a: "Frontier models such as Claude and GPT are available only through their providers' APIs. Rent and Own therefore mean running an open-weight model of similar size on your own capacity, so switching is a quality decision as well as a cost decision.",
      },
      {
        id: "gpu-count",
        q: "How is the number of GPUs calculated?",
        a: "Average tokens per second, divided by what one GPU serves at the target utilization, rounded up. Rented GPUs are added one at a time; owned GPUs are bought in whole 8-GPU servers.",
      },
      {
        id: "crossovers",
        q: "Why can renting and owning trade places as volume grows?",
        a: "Owned GPUs come in whole 8-GPU servers, so each new server is partly idle until volume fills it, while rented GPUs are added one at a time. Between the two crossover points the lowest-cost option can alternate.",
      },
      {
        id: "sensitivity",
        q: "What does the sensitivity analysis test?",
        a: "Each cost driver is moved 25% lower and 25% higher, one at a time. Drivers that change the lowest-cost option are listed first; the rest are ranked by how much they move cost.",
      },
      {
        id: "pue",
        q: "What is PUE?",
        a: "Power usage effectiveness: total facility power divided by the power the computing equipment uses. A PUE of 1.3 adds 30% for cooling and other facility load.",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        id: "response-time",
        q: "How is response time modelled?",
        a: "As a queue: wait = variability × utilization × service time, using the Kingman approximation for a single GPU and the Sakasegawa extension for a fleet. Larger fleets pool their traffic, so they can run at higher utilization for the same wait. Real serving batches requests; the model is illustrative, but the shape of the curve holds.",
      },
      {
        id: "base-peak",
        q: "When should capacity be owned rather than rented at peak?",
        a: "Own a GPU only if it is busy for more of the day than its critical ratio: its monthly ownership cost divided by the cost of renting it on demand for a full month. Always-busy base capacity is usually cheaper to own; peak capacity is usually cheaper to rent.",
      },
      {
        id: "sunk-cost",
        q: "Why is owned hardware treated as a sunk cost?",
        a: "Once purchased, the hardware cost is not recovered by keeping it running. Retention therefore compares running cost only (support, power and space) with the cost of renting equivalent capacity, which falls each year. Resale value would bring retirement forward.",
      },
    ],
  },
  {
    title: "Business case and power",
    items: [
      {
        id: "compute-share",
        q: "Why does compute matter less than the resolution rate?",
        a: "In most workflows the remaining human effort, escalations and review, costs far more than the tokens. Raising the AI resolution rate or cutting review time usually moves savings more than changing the deployment model.",
      },
      {
        id: "batteries",
        q: "Can batteries power a site without a grid connection?",
        a: "No. Batteries extend a partial, curtailable connection by covering curtailment events. Bridging costs are measured as incremental spend versus owning the cluster on a working grid from day one; until an option is ready, the cluster is rented.",
      },
      {
        id: "small-power",
        q: "When is power not a constraint?",
        a: "Below about 1 MW, a colocation cage can usually supply the power today. Grid connection delays become material at multi-megawatt scale.",
      },
    ],
  },
];

/** FAQ: short answers to the questions behind the numbers. */
export function Faq() {
  const [plan] = usePlan("faq");
  useEffect(() => {
    if (window.location.hash) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: "start" });
  }, []);
  return (
    <PlanFrame route="faq" plan={plan} strip={false} bare>
      <div className="mx-auto max-w-[900px] px-4 py-14 sm:px-8 sm:py-20">
        <p className="kicker">FAQ</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">Questions behind the numbers</h1>
        {FAQ_GROUPS.map((g) => (
          <section key={g.title} className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-muted">{g.title}</h2>
            <div className="mt-4 grid gap-3">
              {g.items.map((it) => (
                <Fold key={it.id} id={it.id} title={it.q}>
                  <p className="max-w-3xl text-[15px] leading-7 text-ink-2">{it.a}</p>
                </Fold>
              ))}
            </div>
          </section>
        ))}
      </div>
    </PlanFrame>
  );
}
