import { CapacityChart } from "@/components/CapacityChart";
import { Expansion } from "@/components/Expansion";
import { Fold } from "@/components/Fold";
import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Gantt } from "@/components/Gantt";
import { Card, PHASE_COLOR } from "@/components/ui";
import { MILESTONES, campusById, formatMonth, formatMw, lowerFirst, monthIndex, months, plan } from "@/lib/model";

/** Step 2: when does each phase go live, and which milestone is it waiting on? */
export function TimelineStep() {
  const [s, setS] = useScenario("timeline");
  const campus = campusById(s.campusId);
  const plans = plan(campus, s.settings, s.slips);

  return (
    <Frame route="timeline" s={s} setS={setS}>
      <StepHeading route="timeline" campus={campus}>
        Go-live by phase, and the milestone each phase is waiting on.
      </StepHeading>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((p, i) => {
          const critical = MILESTONES.find((m) => m.id === p.now.critical)!;
          const runnerUp = [...p.now.deps].filter((d) => d.id !== p.now.critical).sort((a, b) => a.slack - b.slack)[0]!;
          const actual = p.phase.actual ? monthIndex(p.phase.actual.date) : null;
          const target = p.phase.target ? monthIndex(p.phase.target.date) : null;
          return (
            <Card key={p.phase.id}>
              <p className="flex items-center gap-2 text-lg font-bold tracking-tight">
                <span className="size-3 rounded-full" style={{ background: PHASE_COLOR[i] }} aria-hidden />
                {p.phase.name} · {formatMw(p.facilityMw)}
              </p>
              <p className="mt-3 font-mono text-3xl font-semibold tracking-tight">{formatMonth(p.now.live)}</p>
              <p className="text-sm text-muted">{p.delay > 0 ? `${p.delay.toFixed(1)} months later than planned (${formatMonth(p.base.live)})` : "go-live in this plan"}</p>
              <p className="mt-4 text-[15px] leading-7 text-ink-2">
                Critical path: <span className="font-semibold text-ink">{lowerFirst(critical.label)}</span>, then {months(p.phase.commissioningMonths)} of
                commissioning. Next: {lowerFirst(MILESTONES.find((m) => m.id === runnerUp.id)!.label)}, {runnerUp.slack.toFixed(1)} months of slack.
              </p>
              {(target !== null || actual !== null || p.phase.status) && (
                <p className="mt-3 rounded-xl bg-sunken px-3 py-2 text-sm leading-6">
                  {p.phase.target && <span className="block">{p.phase.target.label}.</span>}
                  {p.phase.actual && (
                    <span className="block font-semibold">
                      {p.phase.actual.label}
                      {target !== null && actual !== null && actual > target && ` — about ${Math.round(actual - target)} months after the target.`}
                    </span>
                  )}
                  {p.phase.status && <span className="block text-muted">{p.phase.status}</span>}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6">
        <Gantt plans={plans} />
        <Fold id="capacity" title="Capacity online over time" sub="Facility megawatts live each month, planned and with current slips">
          <CapacityChart plans={plans} />
        </Fold>
        <Fold id="expansion" title="Capacity strategy: build now or phase it?" sub="Expected value of building the later phases early, under demand uncertainty">
          <Expansion s={s} setS={setS} campus={campus} />
        </Fold>
      </div>
    </Frame>
  );
}
