import { Printer } from "lucide-react";
import { COMPANY, Frame, useScenario } from "@/components/Frame";
import { formatCount, formatMoney, pct, signed } from "@/lib/model";
import { STATUS_COLOR, STATUS_WORD, run } from "@/lib/run";

/** One printable page: the leadership update for the month under review. */
export function Brief() {
  const [s, setS] = useScenario("brief");
  const r = run(s);
  const p = r.portfolio;
  const gap = Math.max(0, r.fy.gap);
  const drags = [...r.bridge].sort((a, b) => a.effect - b.effect).filter((b) => b.effect < -500).slice(0, 3);
  const lifts = r.bridge.filter((b) => b.effect > 500).sort((a, b) => b.effect - a.effect);
  const offTrack = r.krs.filter((k) => k.status === "red");
  const lowerFirst = (x: string) => (/^[A-Z][A-Z]/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1));
  const kr = (k: (typeof r.krs)[number], v: number) => (k.format === "money" ? formatMoney(v) : k.format === "pct" ? pct(v, 1) : formatCount(v));

  return (
    <Frame route="brief" s={s} setS={setS}>
      <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="kicker">Leadership update · {COMPANY} commercial</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">{r.monthName} business review</h1>
            <p className="mt-1 text-sm text-muted">Month {r.n} of 12 · a fictional company; illustrative numbers</p>
          </div>
          <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-sm font-semibold transition hover:border-brand print:hidden">
            <Printer className="size-4" aria-hidden /> Print or save PDF
          </button>
        </header>

        <p className="mt-6 text-xl font-semibold leading-8 tracking-tight">
          {r.fy.gap > 0
            ? `We're ${formatMoney(Math.abs(r.ytd.actual - r.ytd.plan))} ${r.ytd.actual < r.ytd.plan ? "behind" : "ahead of"} plan year to date and forecast ${formatMoney(r.fy.gap)} short for the year. The funded initiatives below should recover about ${formatMoney(p.expected)} of it.`
            : `We're ${formatMoney(Math.abs(r.ytd.actual - r.ytd.plan))} ${r.ytd.actual < r.ytd.plan ? "behind" : "ahead of"} plan year to date and forecast to finish ${formatMoney(-r.fy.gap)} ahead.`}
        </p>

        <section className="mt-7">
          <h2 className="kicker">OKR scorecard</h2>
          <ul className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {r.krs.map((k) => (
              <li key={k.id} className="flex items-baseline justify-between gap-3 border-b border-line pb-1.5">
                <span>{k.label}</span>
                <span className="shrink-0 font-mono text-xs">
                  {kr(k, k.value)} / {kr(k, k.target)}{" "}
                  <span className="font-sans font-semibold" style={{ color: STATUS_COLOR[k.status] }}>
                    {STATUS_WORD[k.status]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-7">
          <h2 className="kicker">What changed, and why</h2>
          <ul className="mt-2 grid gap-1.5 text-[15px] leading-7 text-ink-2">
            {drags.map((d) => (
              <li key={d.id}>
                <span className="font-semibold text-ink">{d.label}</span>: {signed(d.effect, formatMoney)} of revenue to date.
              </li>
            ))}
            {lifts.length > 0 && (
              <li>
                Offsetting: {lifts.map((l) => `${lowerFirst(l.label)} (${signed(l.effect, formatMoney)})`).join(", ")}.
              </li>
            )}
          </ul>
        </section>

        <section className="mt-7">
          <h2 className="kicker">Decisions we're asking for</h2>
          {p.funded.length > 0 ? (
            <ol className="mt-2 grid gap-1.5 text-[15px] leading-7 text-ink-2">
              {p.funded.map((x, i) => (
                <li key={x.initiative.id}>
                  <span className="font-mono text-muted">{i + 1}.</span> Fund <span className="font-semibold text-ink">{lowerFirst(x.initiative.name)}</span>: {formatMoney(x.initiative.cost)},{" "}
                  {x.initiative.headcount} people, about {formatMoney(x.expected)} expected this year ({x.initiative.owner}).
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-ink-2">No new spend: nothing fits the budget and headcount left.</p>
          )}
          <p className="mt-2 text-sm text-muted">
            Total {formatMoney(p.cost)} and {p.headcount} people, within the {formatMoney(s.budget)} and {s.people} people left.
            {gap > 0 && ` Together they close about ${pct(Math.min(1, p.expected / gap))} of the gap.`}
          </p>
        </section>

        <section className="mt-7">
          <h2 className="kicker">Risks</h2>
          <ul className="mt-2 grid gap-1.5 text-[15px] leading-7 text-ink-2">
            {offTrack.map((k) => (
              <li key={k.id}>
                <span className="font-semibold text-ink">{k.label}</span> is off track: {kr(k, k.value)} forecast against {kr(k, k.target)}.
              </li>
            ))}
            <li>The re-forecast holds today's run-rate; another price cut or a slower pipeline would widen the gap.</li>
            <li>Initiative values are risk-weighted estimates. Review them again at next month's business review.</li>
          </ul>
        </section>

        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          {COMPANY} is fictional and every number is illustrative. The API price matches public list pricing tracked in Breakeven; see Sources for every assumption.
        </p>
      </article>
    </Frame>
  );
}
