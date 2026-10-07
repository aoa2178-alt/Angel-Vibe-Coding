import { Printer } from "lucide-react";
import { CallBlocks, type CallContent } from "@/components/CallBlocks";
import { COMPANY, Frame, useScenario } from "@/components/Frame";
import { sourcingCall } from "@/lib/call";
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

  const call = sourcingCall(s);
  const swing = call.checks.filter((k) => !k.holds);
  const content: CallContent = {
    demo: `Method demo: ${COMPANY} and every supplier are fictional; copper, steel, wages and price indexes are real public data. The method is the point: price the lead time, build the should-cost, then negotiate from it.`,
    decision: `Decision: who supplies the three 80 MVA transformers for ${BUYER.project}, at what price, on what terms?`,
    headline: `Lead with ${call.leader.bid.supplier} and negotiate to ${formatMoney(n.target)} a unit, saving ${formatMoney(n.savingsAtTarget)} across the three against the quotes; it is also ${formatMoney(call.avoided)} cheaper all-in than the cheapest bid in this scenario, almost all of it the modeled cost of the hall waiting.`,
    bullets: [
      { label: "The award", text: `${bestAward.label.charAt(0).toLowerCase()}${bestAward.label.slice(1)}, through a ${bestStructure.label.toLowerCase()}. Spreading it means two suppliers must fail before the hall slips.` },
      { label: "Why not the cheapest quote", text: `${cheapestQuote.bid.supplier} is ${formatMoney(cheapestQuote.bid.price)} a unit but needs ${cheapestQuote.bid.leadMonths} months against our ${s.needByMonths}; at ${formatMoney(monthlyDelayCost(s).total)} for every month the hall waits, it's the most expensive deal.` },
      { label: "Walk away", text: `above ${formatMoney(n.walkAway)} a unit, where the next-best bid becomes cheaper all-in.` },
      ...(swing.some((k) => k.label.includes("need them") || k.label.includes("need the transformers"))
        ? [{ label: "Lock this first", text: "the date we need the transformers. It, more than price or supplier risk, decides who should win: six months either way changes the lead supplier." }]
        : []),
    ],
    checksIntro: "The award rerun with one assumption changed:",
    checks: call.checks,
    landing: [
      { when: "First 30 days", what: ["Engineering freezes the spec and the need-by date", "Share the should-cost with the lead supplier, line by line", "Ask every bidder to firm up lead times, with penalties"] },
      { when: "60 days", what: [`Negotiate: open at ${formatMoney(n.target)}, trade price for earlier slots, never above ${formatMoney(n.walkAway)}`, "Pay a deposit to reserve factory slots if it shortens lead time", "Award letters to all three suppliers"] },
      { when: "90 days", what: ["Contracts with index-linked prices and late-delivery damages", "Monthly factory reviews and witness tests", "Apply the same playbook to switchgear and generators"] },
    ],
    people: "The hard part is alignment, not math: engineering wants the earliest date, finance the lowest price, and suppliers need to see a lasting relationship to hold a factory slot. Owners: sourcing (negotiation), engineering (spec and date), finance (budget and deposits), project controls (delivery tracking).",
    measures: [
      ["Price per unit", formatMoney(n.quoted), `≤ ${formatMoney(n.target)}`],
      ["Months to delivery", String(call.leader.bid.leadMonths), `≤ ${s.needByMonths}`],
      ["Chance the hall slips for lack of a transformer", pct(call.awards[0]!.pShort, 1), `≤ ${pct(bestAward.pShort, 1)}`],
      ["Single-sourced categories in the build", String(sp.singleSource.length), "0"],
    ],
    measuresNote: "Today = the lead supplier's quote and lead time, and a single-supplier award.",
    judgment: [
      { label: "Lead time is a cost", text: `each month the hall waits is valued at lost lease revenue plus interest (${formatMoney(monthlyDelayCost(s).total)} a month), so a cheap, slow bid can lose.` },
      { label: "A fair target, not the floor", text: "the target moves the quote by how much the supplier's own costs rose against its prices, instead of demanding the bare should-cost. It's defensible, and a supplier can say yes to it." },
      { label: "Spread the risk", text: "a split award costs a little more on paper, but the hall slips only if two suppliers fail together." },
      { label: "Left out", text: "currency and tariff swings, the suppliers' own capacity limits, and quality differences beyond the scorecard." },
    ],
  };

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
            <p className="kicker">The call · {COMPANY}</p>
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

        <CallBlocks c={content}>
        {sections.filter((sec) => sec.title !== "Recommendation" && sec.title !== "Why not the cheapest quote").map((sec) => (
          <section key={sec.title} className="mt-7">
            <h2 className="kicker">{sec.title}</h2>
            <p className="mt-2 text-[16px] leading-8 text-ink-2">{sec.body}</p>
          </section>
        ))}
        </CallBlocks>

        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          {COMPANY} and every supplier are fictional. Copper, steel, wages and price indexes are public FRED series; transformer price and lead-time anchors come from GAO and Wood
          Mackenzie. See Sources.
        </p>
      </article>
    </Frame>
  );
}
