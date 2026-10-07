import { Printer } from "lucide-react";
import { COMPANY, Frame, useScenario } from "@/components/Frame";
import { awardOptions, negotiation, ranked, shouldCost, spend, structures } from "@/lib/analysis";
import { BUYER, formatMoney, monthlyDelayCost, pct } from "@/lib/data";

/** One printable page: the sourcing recommendation for the transformers, with the wider spend picture. */
export function Brief() {
  const [s, setS] = useScenario("brief");
  const sp = spend();
  const sc = shouldCost();
  const t = ranked(s);
  const n = negotiation(s);
  const awards = awardOptions(s);
  const bestAward = awards.reduce((a, b) => (b.total < a.total ? b : a));
  const st = structures(s);
  const bestStructure = st.reduce((a, b) => (b.total < a.total ? b : a));
  const cheapestQuote = [...t].sort((a, b) => a.price - b.price)[0]!;

  const sections = [
    {
      title: "Recommendation",
      body: `Award the three 80 MVA transformers as follows: ${bestAward.label.charAt(0).toLowerCase()}${bestAward.label.slice(1)}. ${n.best.bid.supplier} has the lowest total cost, so it leads: negotiate it toward ${formatMoney(n.target)} a unit (quote ${formatMoney(n.quoted)}; walk away above ${formatMoney(n.walkAway)}) and buy through a ${bestStructure.label.toLowerCase()}. Hold the other suppliers to the same should-cost logic.`,
    },
    {
      title: "Why not the cheapest quote",
      body: `${cheapestQuote.bid.supplier} quoted the lowest price (${formatMoney(cheapestQuote.bid.price)} a unit) but needs ${cheapestQuote.bid.leadMonths} months against our ${s.needByMonths}. Each month the hall waits costs ${formatMoney(monthlyDelayCost(s).total)}, so its all-in cost is ${formatMoney(cheapestQuote.total)} against ${formatMoney(t[0]!.total)} for ${t[0]!.bid.supplier}.`,
    },
    {
      title: "Price basis",
      body: `A cost build-up puts a fair price at ${formatMoney(sc.total)} a unit. Since January 2019 the inputs rose ${pct(sc.costGrowth - 1)} (copper more than doubled) while transformer prices rose ${pct(sc.ppiGrowth - 1)}: the difference is a scarcity premium we can push back on. At target, three units would save ${formatMoney(n.savingsAtTarget)}.`,
    },
    {
      title: "Risk",
      body: `With one supplier there's a ${pct(s.disruption)} chance the hall slips ${s.disruptionMonths} months if it fails to deliver. Spreading the award so two suppliers must fail together cuts that to ${pct(awards[2]!.pShort, 1)}. ${sp.singleSource.length} categories are single-sourced today (${sp.singleSource.map((r) => r.name.split(" (")[0]!.toLowerCase()).join(", ")}).`,
    },
    {
      title: "Across the whole build",
      body: `Equipment spend for ${BUYER.project} is ${formatMoney(sp.grand)}. Sourcing levers across all six categories could save ${formatMoney(sp.savingsLow)}–${formatMoney(sp.savingsHigh)}, led by ${[...sp.pareto].sort((a, b) => b.savingsHigh - a.savingsHigh)[0]!.name.split(" (")[0]!.toLowerCase()}.`,
    },
  ];

  return (
    <Frame route="brief" s={s} setS={setS}>
      <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="kicker">Sourcing recommendation · {COMPANY}</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">Transformers for {BUYER.project}</h1>
            <p className="mt-1 text-sm text-muted">A fictional buyer and suppliers; prices anchored to public data</p>
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-sm font-semibold transition hover:border-brand print:hidden">
            <Printer className="size-4" aria-hidden /> Print or save PDF
          </button>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {[
            ["Award to", n.best.bid.supplier],
            ["Target price", `${formatMoney(n.target)}/unit`],
            ["Should-cost", `${formatMoney(sc.total)}/unit`],
            ["Saving at target", formatMoney(n.savingsAtTarget)],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{k}</dt>
              <dd className="mt-1 font-mono text-lg font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        {sections.map((sec) => (
          <section key={sec.title} className="mt-7">
            <h2 className="kicker">{sec.title}</h2>
            <p className="mt-2 text-[16px] leading-8 text-ink-2">{sec.body}</p>
          </section>
        ))}

        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          {COMPANY} and every supplier are fictional. Copper, steel, wages and price indexes are public FRED series; transformer price and lead-time anchors come from GAO and Wood
          Mackenzie. See Sources.
        </p>
      </article>
    </Frame>
  );
}
