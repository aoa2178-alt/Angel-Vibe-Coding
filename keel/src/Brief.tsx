import { Printer } from "lucide-react";
import { CallBlocks, type CallContent } from "@/components/CallBlocks";
import { COMPANY, Frame, useScenario } from "@/components/Frame";
import { opsCall } from "@/lib/call";
import { formatCount, formatMoney, pct, signed } from "@/lib/model";
import { STATUS_COLOR, STATUS_WORD, run } from "@/lib/run";

/** One printable page: the leadership update for the month under review. */
export function Brief() {
  const [s, setS] = useScenario("brief");
  const r = run(s);
  const p = r.portfolio;
  const drags = [...r.bridge].sort((a, b) => a.effect - b.effect).filter((b) => b.effect < -500).slice(0, 3);
  const lifts = r.bridge.filter((b) => b.effect > 500).sort((a, b) => b.effect - a.effect);
  const lowerFirst = (x: string) => (/^[A-Z][A-Z]/.test(x) ? x : x.charAt(0).toLowerCase() + x.slice(1));
  const kr = (k: (typeof r.krs)[number], v: number) => (k.format === "money" ? formatMoney(v) : k.format === "pct" ? pct(v, 1) : formatCount(v));

  const call = opsCall(s);
  const content: CallContent = {
    demo: `Method demo: ${COMPANY} is fictional and its numbers illustrative (the API price matches public list pricing). The method is the point: explain the gap driver by driver, fund the best portfolio, and say plainly what's left.`,
    decision: `Decision: we're forecast ${formatMoney(call.gap)} short for the year. What do we fund, what do we stop, and what do we tell leadership?`,
    headline: call.gap > 0
      ? `Fund ${p.funded.length} initiatives for ${formatMoney(p.cost)} and ${p.headcount} people: they should recover about ${formatMoney(p.expected)} (${pct(call.closed)} of the gap). Reset the forecast for the other ${formatMoney(call.residual)} now, not in November.`
      : `We're on plan: keep the ${formatMoney(s.budget)} in reserve and fund only what clears its cost.`,
    bullets: [
      ...(call.drag && call.drag.effect < 0 ? [{ label: "What caused it", text: `${lowerFirst(call.drag.label)}: ${signed(call.drag.effect, formatMoney)} of revenue to date, the biggest single driver.` }] : []),
      { label: "Fund", text: p.funded.length ? p.funded.map((x) => `${lowerFirst(x.initiative.name)} (${x.initiative.owner}, ${formatMoney(x.expected)} expected)`).join("; ") : "nothing: no initiative fits what's left." },
      ...(call.noValue.length ? [{ label: "Stop", text: `${call.noValue.map((x) => lowerFirst(x.initiative.name)).join(", ")}: it adds almost nothing this year (the constraint is elsewhere, so more of this input doesn't move revenue).` }] : []),
      ...(call.costOfWaiting > 0.5e6 ? [{ label: "Decide now", text: `waiting three months to decide costs about ${formatMoney(call.costOfWaiting)} of the recovery, because each initiative has less of the year left to work.` }] : []),
      ...(call.residual > 0 ? [{ label: "Tell leadership", text: `even fully funded, ${formatMoney(call.residual)} of the gap remains. Better to reset now with a plan than to miss quietly.` }] : []),
    ],
    checksIntro: "The portfolio rerun with one constraint changed:",
    checks: call.checks,
    landing: [
      { when: "First 30 days", what: ["Name one owner per funded initiative, with a monthly milestone", "Announce what we're not doing, and why", "Leadership agrees the reset forecast"] },
      { when: "60 days", what: ["Business review: each initiative against its leading indicator", "Move money from anything behind to the next-best initiative", "Re-check the driver that caused the gap"] },
      { when: "90 days", what: ["Quarterly review: scale what's working, stop what isn't", "Update next year's plan with what we learned", "Re-run the variance bridge"] },
    ],
    people: `The hard part is saying no: every team wants its initiative funded, and the one that's cut needs a clear reason. Owners: ${[...new Set(p.funded.map((x) => x.initiative.owner))].join(", ")} for their initiatives; business operations runs the review and the reallocation.`,
    measures: [
      ["Revenue forecast for the year", formatMoney(r.fy.forecast), `${formatMoney(r.fy.forecast + p.expected)} (plan ${formatMoney(r.fy.plan)})`],
      ...r.krs.filter((k) => k.status === "red").map((k) => [k.label, kr(k, k.value), kr(k, k.target)] as [string, string, string]),
      ["Funded initiatives on milestone", "–", "all, reviewed monthly"],
    ],
    measuresNote: "Today = the re-forecast at the current run-rate. Aim = re-forecast plus the funded initiatives' expected value.",
    judgment: [
      { label: "Driver by driver", text: "the variance bridge swaps one driver at a time from plan to actual, so the effects add up exactly; the order of swaps shifts how the total is split." },
      { label: "Expected, not hoped-for, value", text: "each initiative's upside is weighted by the chance it works, and the portfolio is the best combination within budget and headcount, not a ranked list cut off at the budget line." },
      { label: "A run-rate forecast", text: "the rest of the year assumes today's run-rate holds; another price move or a slower pipeline would widen the gap." },
      { label: "Left out", text: "second-order effects (a price rise that also slows sign-ups beyond the 2% assumed), team capacity to run four initiatives at once, and next year's budget." },
    ],
  };

  return (
    <Frame route="brief" s={s} setS={setS}>
      <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="kicker">The call · {COMPANY} commercial</p>
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

        <CallBlocks c={content}>
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

        </CallBlocks>

        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          {COMPANY} is fictional and every number is illustrative. The API price matches public list pricing tracked in Breakeven; see Sources for every assumption.
        </p>
      </article>
    </Frame>
  );
}
