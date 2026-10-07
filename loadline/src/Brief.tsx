import { Printer } from "lucide-react";
import { Frame, useScenario } from "@/components/Frame";
import { PHASE_COLOR, SourceLink } from "@/components/ui";
import { expansion } from "@/lib/expansion";
import { spares } from "@/lib/hedge";
import { MILESTONES, campusById, lowerFirst, formatMoney, formatMonth, formatMw, plan, resolveFirst } from "@/lib/model";

/** One printable page: the campus, its power, when each phase goes live, what delay costs, and what to resolve first. */
export function Brief() {
  const [s, setS] = useScenario("brief");
  const campus = campusById(s.campusId);
  const plans = plan(campus, s.settings, s.slips);
  const risks = resolveFirst(campus, s.settings, s.slips).filter((r) => r.cost > 0).slice(0, 3);
  const totals = {
    it: plans.reduce((n, p) => n + p.itMw, 0),
    facility: plans.reduce((n, p) => n + p.facilityMw, 0),
    energy: plans.reduce((n, p) => n + p.annualEnergy, 0),
    delay: plans.reduce((n, p) => n + p.delayCost, 0),
  };
  const label = (id: string) => lowerFirst(MILESTONES.find((m) => m.id === id)!.label);
  const hedge = spares(campus, s.settings, s.hedge);
  const build = expansion(campus, s.settings, s.expansion);

  return (
    <Frame route="brief" s={s} setS={setS}>
      <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="kicker">Loadline brief</p>
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

        <section className="mt-8">
          <h2 className="kicker">Resolve first</h2>
          {risks.length > 0 ? (
            <ol className="mt-3 space-y-2 text-[15px] leading-7 text-ink-2">
              {risks.map((r, k) => (
                <li key={`${r.phaseId}.${r.milestone}`}>
                  <span className="font-mono text-muted">{k + 1}.</span> <span className="font-semibold text-ink">{r.phaseName}: {label(r.milestone)}</span>. Three
                  more months would cost {formatMoney(r.cost)}.
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-ink-2">Every milestone has more than three months of slack.</p>
          )}
        </section>

        <section className="mt-8">
          <h2 className="kicker">Hedges and strategy</h2>
          <ul className="mt-3 space-y-2 text-[15px] leading-7 text-ink-2">
            <li>
              <span className="font-semibold text-ink">
                Hold {hedge.best} spare transformer{hedge.best === 1 ? "" : "s"}
              </span>{" "}
              across {hedge.units} on the campus. With factories {Math.round(s.hedge.supplierLoad * 100)}% busy a replacement takes about {Math.round(hedge.leadMonths)} months, so
              being one short costs about {formatMoney(hedge.underage)} against {formatMoney(hedge.overage)} for an unused spare (newsvendor critical ratio{" "}
              {(hedge.criticalRatio * 100).toFixed(1)}%).
            </li>
            {build.applies && (
              <li>
                <span className="font-semibold text-ink">{build.advantage > 0 ? "Build the later phases now" : "Phase the later buildings"}</span>: worth{" "}
                {formatMoney(Math.abs(build.advantage))} more in expectation at a {Math.round(s.expansion.pStrong * 100)}% chance of strong demand
                {build.breakEvenP !== null && ` (building now wins above ${Math.round(build.breakEvenP * 100)}%)`}.
              </li>
            )}
          </ul>
        </section>

        <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
          Built from public disclosures (see Sources) plus labeled assumptions: milestone dates inside each phase, power price (
          <SourceLink href={campus.region.priceSource}>EIA regional average</SourceLink>), PUE, lease or GPU pricing, build cost and cost of
          capital. An illustrative model for discussion, not company guidance.
        </p>
      </article>
    </Frame>
  );
}
