import { Printer } from "lucide-react";
import { CallBlocks, type CallContent } from "@/components/CallBlocks";
import { Frame, useScenario } from "@/components/Frame";
import { capexCall } from "@/lib/call";
import { SourceLink } from "@/components/ui";
import { DATA, SPENDERS, filingUrl, formatMillions, formatQuarter, pct, signedPct } from "@/lib/data";
import { headline, payoff, readThrough, ttm } from "@/lib/metrics";

/** One printable page: this quarter in AI capex, auto-drafted from the filings. */
export function NoteStep() {
  const [s, setS] = useScenario("note");
  const h = headline();
  const r = readThrough("2022Q4");
  const before = ttm(SPENDERS, "2022Q4", "capex")! / ttm(SPENDERS, "2022Q4", "revenue")!;
  const negative = SPENDERS.map((c) => ({ c, p: payoff(c, h.quarter) })).filter((x) => x.p.fcf !== null && x.p.fcf < 0);
  const waves = SPENDERS.map((c) => ({ c, p: payoff(c, h.quarter) })).filter((x) => x.p.capexToDa !== null && x.p.capexToDa > 2);
  const top = h.ranked[0]!;

  const call = capexCall();
  const tripped = call.indicators.filter((i) => !i.holds);
  const content: CallContent = {
    demo: "Real data, straight from SEC filings. The thresholds below are my judgment, stated so they can be argued with; what to do depends on which seat you're in.",
    decision: "Decision: should we plan for the AI build-out to keep growing over the next year, and how do we protect ourselves if it doesn't?",
    headline: tripped.length <= 1
      ? `Plan for growth, hedge for a slowdown: capex is still up ${h.yoy === null ? "–" : signedPct(h.yoy)} on a year, but ${tripped.length ? `one of ${call.indicators.length} warning lights is already on (${tripped[0]!.label.toLowerCase()})` : "no warning light is on yet"}, and the weakest balance sheets will cut first.`
      : `Plan for a slowdown: ${tripped.length} of ${call.indicators.length} warning lights are on, even with capex still up ${h.yoy === null ? "–" : signedPct(h.yoy)}.`,
    bullets: [
      { label: "If you sell into the build-out", text: `add capacity, but on contracts with deposits or take-or-pay terms, and watch customer concentration: ${call.negative.length ? call.negative.map((x) => x.c.short).join(" and ") + " already spend more than their operating cash" : "every spender still funds capex from cash"}.` },
      { label: "If you buy AI capacity", text: "don't lock in long: GPU rental prices have been falling about a quarter a year (Breakeven's tracker), so short commitments keep the option to pay less." },
      { label: "If you invest", text: `the money is landing with the suppliers: about $${call.r.perDollar?.toFixed(2)} of their revenue per extra capex dollar since Q4 2022, while the spenders carry a depreciation wave.` },
    ],
    checksIntro: "The leading indicators I'd watch each quarter, with the level that would change my mind:",
    checks: call.indicators.map((i) => ({
      label: `${i.label} (now ${i.now}; trigger ${i.trigger})`,
      holds: i.holds,
      outcome: `already tripped: ${i.meaning}`,
    })),
    landing: [
      { when: "First 30 days", what: ["Size our exposure: revenue, supply or costs tied to the six spenders", "Agree the warning lights and who reads them each quarter", "Brief leadership on the base case and the slowdown case"] },
      { when: "60 days", what: ["Plan three scenarios: boom, base, capex down 30%", "Tie hiring and capacity to the warning lights, not the headlines", "Renegotiate contract terms where exposure is highest"] },
      { when: "90 days", what: ["Review against the next earnings season", "Refresh the data (one script) and redraft this note", "Decide: lean in, hold or hedge"] },
    ],
    people: "The hard part is discipline, not data: in a boom everyone wants to add capacity, and nobody wants to be the one who called the top. Owners: strategy (the thesis and the lights), finance (scenarios and contracts), the business units (capacity and hiring).",
    measures: call.indicators.map((i) => [i.label, i.now, `not ${i.trigger}`] as [string, string, string]),
    measuresNote: "Reread every quarter after earnings; the same indicators are the quarterly note's spine.",
    judgment: [
      { label: "Capex is not all AI", text: "companies don't split AI from other spending in their filings, so this is the whole capex line; most of the growth is AI data centers, but not all." },
      { label: "Read-through, not proof", text: "supplier revenue growing alongside capex is a link, not cause and effect; some of it comes from other customers." },
      { label: "My thresholds", text: "20% growth, 30% intensity, three firms with negative cash flow, $0.50 read-through: round numbers I'd defend, and I'd move them as the cycle teaches us." },
      { label: "Left out", text: "leases and off-balance-sheet deals, private and Chinese spenders, and what management says on earnings calls." },
    ],
  };

  const sections = [
    {
      title: "The headline",
      body: `The six largest spenders put ${formatMillions(h.capex)} into capex in ${formatQuarter(h.quarter)}, ${h.yoy === null ? "" : `${signedPct(h.yoy)} on a year ago`}, an annual pace of ${formatMillions(h.runRate)}. ${top.c.short} spent the most (${formatMillions(top.capex)}); ${h.fastest.c.short} grew fastest (${signedPct(h.fastest.yoy!)}).`,
    },
    {
      title: "Is it paying off?",
      body: `Over the last 12 months the six spent ${pct(h.intensity, 1)} of revenue on capex, against ${pct(before, 1)} in the 12 months to the ChatGPT launch. Capex now absorbs ${pct(h.capexShareOfOcf)} of their operating cash flow.${negative.length ? ` ${negative.map((x) => x.c.short).join(" and ")} ${negative.length > 1 ? "have" : "has"} negative free cash flow.` : ""}`,
    },
    {
      title: "The depreciation wave",
      body: `${waves.map((x) => `${x.c.short} (${x.p.capexToDa!.toFixed(1)}×)`).join(", ")} are spending more than twice their current depreciation. As those servers and buildings come into service, depreciation (a real cost on the income statement) will rise for years, so margins depend on AI revenue catching up.`,
    },
    {
      title: "Who is getting the money",
      body: `Since Q4 2022 the spenders' yearly capex grew ${signedPct(r.capexGrowth)} (+${formatMillions(r.addedCapex)}), and NVIDIA, Broadcom, Vertiv and Eaton's yearly revenue grew ${signedPct(r.revenueGrowth)} (+${formatMillions(r.addedRevenue)}): about $${r.perDollar?.toFixed(2)} of supplier revenue for each extra dollar of capex, led by ${[...r.byReceiver].sort((a, b) => (b.growth ?? 0) - (a.growth ?? 0))[0]!.c.short}.`,
    },
  ];

  return (
    <Frame route="note" s={s} setS={setS}>
      <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="kicker">The call · Buildout quarterly note</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">AI capex, {formatQuarter(h.quarter)}</h1>
            <p className="mt-1 text-sm text-muted">From SEC filings retrieved {DATA.retrieved} · calendar quarters</p>
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-sm font-semibold transition hover:border-brand print:hidden">
            <Printer className="size-4" aria-hidden /> Print or save PDF
          </button>
        </header>
        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {[
            ["Capex this quarter", formatMillions(h.capex)],
            ["Year on year", h.yoy === null ? "–" : signedPct(h.yoy)],
            ["Capex ÷ revenue", pct(h.intensity, 1)],
            ["Free cash flow, 12 mo", formatMillions(h.fcf)],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{k}</dt>
              <dd className="mt-1 font-mono text-lg font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <CallBlocks c={content}>
        {sections.map((sec) => (
          <section key={sec.title} className="mt-7">
            <h2 className="kicker">{sec.title}</h2>
            <p className="mt-2 text-[16px] leading-8 text-ink-2">{sec.body}</p>
          </section>
        ))}
        <section className="mt-7">
          <h2 className="kicker">Filings behind this quarter</h2>
          <p className="mt-2 text-sm leading-7 text-ink-2">
            {h.ranked.map((x, i) => {
              const q = x.c.quarters.find((y) => y.quarter === h.quarter)!;
              return (
                <span key={x.c.ticker}>
                  {i > 0 && " · "}
                  {q.accn ? <SourceLink href={filingUrl(x.c.cik, q.accn)}>{x.c.short}</SourceLink> : x.c.short}
                </span>
              );
            })}
          </p>
        </section>
        </CallBlocks>
        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          Figures are as filed with the SEC (XBRL), summed by calendar quarter. For learning and discussion; not investment advice.
        </p>
      </article>
    </Frame>
  );
}
