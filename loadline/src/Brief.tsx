import { Printer } from "lucide-react";
import { CallBlocks, type CallContent } from "@/components/CallBlocks";
import { Frame, useScenario } from "@/components/Frame";
import { programCall } from "@/lib/call";
import { PHASE_COLOR, SourceLink } from "@/components/ui";
import { expansion } from "@/lib/expansion";
import { spares } from "@/lib/hedge";
import { MILESTONES, campusById, lowerFirst, formatMoney, formatMonth, formatMw, plan } from "@/lib/model";

/** One printable page: the campus, its power, when each phase goes live, what delay costs, and what to resolve first. */
export function Brief() {
  const [s, setS] = useScenario("brief");
  const campus = campusById(s.campusId);
  const plans = plan(campus, s.settings, s.slips);
  const totals = {
    it: plans.reduce((n, p) => n + p.itMw, 0),
    facility: plans.reduce((n, p) => n + p.facilityMw, 0),
    energy: plans.reduce((n, p) => n + p.annualEnergy, 0),
    delay: plans.reduce((n, p) => n + p.delayCost, 0),
  };
  const label = (id: string) => lowerFirst(MILESTONES.find((m) => m.id === id)!.label);
  const hedge = spares(campus, s.settings, s.hedge);
  const build = expansion(campus, s.settings, s.expansion);

  const call = programCall(s);
  const top = call.top;
  const monthly = call.topPlan?.monthly.total ?? 0;
  const content: CallContent = {
    demo: `Method demo on a real campus: the phases, sizes and dates come from public disclosures; milestone dates inside each phase, prices and costs are labeled assumptions. The method is the point: find the critical path, put a price on a month, and spend to protect it.`,
    decision: `Decision: what do we fix first to protect go-live at ${campus.site}, and how much is it worth paying to pull it in?`,
    headline: top
      ? `Chase ${top.phaseName}: ${label(top.milestone)} first. Every month it slips costs about ${formatMoney(monthly)}, so any fix that pulls it in by a month is worth paying up to that.`
      : "Every milestone has more than three months of slack: hold the plan and watch the grid date.",
    bullets: [
      ...call.risks.slice(1, 3).map((r, k) => ({ label: k === 0 ? "Second" : "Third", text: `${r.phaseName}: ${label(r.milestone)} (three more months would cost ${formatMoney(r.cost)}).` })),
      { label: "Hedge", text: `hold ${hedge.best} spare transformer${hedge.best === 1 ? "" : "s"} across the campus's ${hedge.units}: one short costs about ${formatMoney(hedge.underage)}, an unused spare ${formatMoney(hedge.overage)}.` },
      ...(build.applies
        ? [{ label: build.advantage > 0 ? "Build the later phases now" : "Phase the later buildings", text: `worth ${formatMoney(Math.abs(build.advantage))} more in expectation at a ${Math.round(s.expansion.pStrong * 100)}% chance of strong demand${build.breakEvenP !== null ? ` (building now wins above ${Math.round(build.breakEvenP * 100)}%)` : ""}.` }]
        : []),
      ...(totals.delay > 0 ? [{ label: "Already lost", text: `today's slips have cost about ${formatMoney(totals.delay)}; that money is gone, so decide on what's ahead, not on what's sunk.` }] : []),
    ],
    checksIntro: "The priorities rerun with one assumption changed:",
    checks: call.checks,
    landing: [
      { when: "First 30 days", what: ["Name an owner for each critical-path milestone, with a weekly date check", "Price the expedite options (air freight, overtime, a second crew) against the cost of a month", "Order the spare transformers now: they take years to arrive"] },
      { when: "60 days", what: ["Weekly program review on the critical path, not the whole schedule", "Escalate any milestone that loses a week of slack", "Lock the utility's energization date in writing"] },
      { when: "90 days", what: ["Re-run the plan with actual dates", "Decide the later phases: build now or phase", "Move spend to whatever has become critical"] },
    ],
    people: "The hard part is focus: every contractor reports their own milestone as on track, and the one that matters is often outside your walls (the utility, a transformer factory). Owners: the program lead (critical path), procurement (long-lead gear), the utility liaison (grid), finance (expedite spend).",
    measures: [
      ["Phase go-live dates", call.plans.map((p) => formatMonth(p.now.live)).join(", "), "no later than planned"],
      ["The top critical-path milestone against its date", top ? "tracked weekly" : "–", "on or ahead"],
      ["Cost of slips to date", formatMoney(totals.delay), "no growth"],
      ["Spare transformers on order", "–", String(hedge.best)],
    ],
    judgment: [
      { label: "A month has a price", text: "each month a phase waits is valued at lost lease or GPU revenue plus interest on the capital already spent, so expediting is a business case, not a favor." },
      { label: "Only the critical path matters", text: "a milestone with slack can slip for free; the ranking slips each one three more months and counts only what moves go-live." },
      { label: "Spares by the newsvendor", text: "hold spares while the chance a shortage costs more than the spare's idle cost stays above the critical ratio; busy factories mean long replacements, so more spares." },
      { label: "Left out", text: "the operator's real contracts and penalties, labor availability, and permitting risk, none of which are public." },
    ],
  };

  return (
    <Frame route="brief" s={s} setS={setS}>
      <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="kicker">The call · Loadline</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              {campus.company}, {campus.site}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {campus.customer} · prepared {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-sm font-semibold transition hover:border-ink print:hidden"
          >
            <Printer className="size-4" aria-hidden /> Print or save PDF
          </button>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4">
          {[
            ["IT power", formatMw(totals.it)],
            ["Facility power", formatMw(totals.facility)],
            ["Electricity per year", formatMoney(totals.energy)],
            ["Cost of current slips", formatMoney(totals.delay)],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface p-4">
              <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{k}</dt>
              <dd className="mt-1 font-mono text-lg font-semibold sm:text-xl">{v}</dd>
            </div>
          ))}
        </dl>

        <CallBlocks c={content}>
        <section className="mt-8">
          <h2 className="kicker">When it goes live</h2>
          <ul className="mt-3 space-y-3">
            {plans.map((p, i) => (
              <li key={p.phase.id} className="flex gap-3 text-[15px] leading-7 text-ink-2">
                <span className="mt-2 size-3 shrink-0 rounded-full" style={{ background: PHASE_COLOR[i] }} aria-hidden />
                <span>
                  <span className="font-semibold text-ink">
                    {p.phase.name} ({formatMw(p.facilityMw)}): {formatMonth(p.now.live)}.
                  </span>{" "}
                  Waiting on {label(p.now.critical)}.
                  {p.delay > 0 && ` That's ${p.delay.toFixed(1)} months later than planned, costing about ${formatMoney(p.monthly.total)} a month (${formatMoney(p.delayCost)} so far).`}
                  {p.phase.actual && ` Public record: ${lowerFirst(p.phase.actual.label)}.`}
                  {p.phase.status && ` ${p.phase.status}`}
                </span>
              </li>
            ))}
          </ul>
        </section>

        </CallBlocks>

        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          Built from public disclosures (see Sources) plus labeled assumptions: milestone dates inside each phase, power price (
          <SourceLink href={campus.region.priceSource}>EIA regional average</SourceLink>), PUE, lease or GPU pricing, build cost and cost of
          capital. An illustrative model for discussion, not company guidance.
        </p>
      </article>
    </Frame>
  );
}
