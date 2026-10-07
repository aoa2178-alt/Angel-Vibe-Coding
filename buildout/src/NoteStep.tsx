import { Printer } from "lucide-react";
import { Frame, useScenario } from "@/components/Frame";
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
            <p className="kicker">Buildout quarterly note</p>
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
        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          Figures are as filed with the SEC (XBRL), summed by calendar quarter. For learning and discussion; not investment advice.
        </p>
      </article>
    </Frame>
  );
}
