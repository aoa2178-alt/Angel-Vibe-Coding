import { ArrowUpRight, RotateCcw } from "lucide-react";
import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { Hedge } from "@/components/Hedge";
import { Card, NumberField, PHASE_COLOR, Stat } from "@/components/ui";
import { MILESTONES, campusById, lowerFirst, formatMoney, formatMonth, plan, resolveFirst, type Settings } from "@/lib/model";
import { MAX_SLIP } from "@/lib/scenario";

/** Step 3: slip milestones and see what each month late costs, and which milestone to resolve first. */
export function DelaysStep() {
  const [s, setS] = useScenario("delays");
  const campus = campusById(s.campusId);
  const plans = plan(campus, s.settings, s.slips);
  const risks = resolveFirst(campus, s.settings, s.slips).slice(0, 5);
  const totalCost = plans.reduce((n, p) => n + p.delayCost, 0);
  const slipped = Object.values(s.slips).some((v) => v > 0);
  const set = (patch: Partial<Settings>) => setS({ ...s, settings: { ...s.settings, ...patch } });
  const top = risks[0];

  return (
    <Frame route="delays" s={s} setS={setS}>
      <StepHeading route="delays" campus={campus}>
        Slip any milestone and watch go-live and the bill move. A slip only costs money once it eats through that milestone's slack.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-4">
          <div className="rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">Cost of today's slips</p>
            <p className="mt-2 font-mono text-4xl font-semibold tracking-tight sm:text-5xl">{formatMoney(totalCost)}</p>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/15 pt-4">
              {plans.map((p) => (
                <Stat key={p.phase.id} dark label={`${p.phase.name} · per month late`} value={formatMoney(p.monthly.total)} sub={p.delay > 0 ? `${p.delay.toFixed(1)} months late → ${formatMonth(p.now.live)}` : `live ${formatMonth(p.now.live)}`} />
              ))}
            </div>
          </div>

          {top && (
            <Card className="border-ink">
              <p className="kicker">Resolve first</p>
              <p className="mt-2 text-2xl font-extrabold tracking-tight">
                {top.phaseName}: {lowerFirst(MILESTONES.find((m) => m.id === top.milestone)!.label)}
              </p>
              <p className="mt-1 text-ink-2">
                Three more months here would move go-live {top.delay.toFixed(1)} months and cost {formatMoney(top.cost)}.
              </p>
              <ol className="mt-4 divide-y divide-line border-t border-line text-sm">
                {risks.map((r, k) => (
                  <li key={`${r.phaseId}.${r.milestone}`} className="flex items-center justify-between gap-3 py-2.5">
                    <span>
                      <span className="font-mono text-muted">{k + 1}.</span> {r.phaseName} · {MILESTONES.find((m) => m.id === r.milestone)!.label}
                    </span>
                    <span className="text-right font-mono">{r.cost > 0 ? formatMoney(r.cost) : `${r.slack.toFixed(1)} mo slack`}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs leading-5 text-muted">Each line: the cost if that milestone slipped 3 more months, on top of today's slips.</p>
            </Card>
          )}

          <Card>
            <p className="kicker">What a month late costs</p>
            <div className="mt-3 flex gap-2" role="group" aria-label="Revenue basis">
              {(["lease", "gpu"] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  aria-pressed={s.settings.revenueBasis === b}
                  onClick={() => set({ revenueBasis: b })}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${s.settings.revenueBasis === b ? "border-ink bg-panel text-panel-ink" : "border-line hover:border-ink"}`}
                >
                  {b === "lease" ? "Leased capacity ($/kW-month)" : "GPU cloud ($/GPU-hour)"}
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {s.settings.revenueBasis === "lease" ? (
                <NumberField label="Lease rate" unit="$ per kW of IT per month" value={s.settings.leasePerKwMonth} step={5} onChange={(v) => set({ leasePerKwMonth: v })} />
              ) : (
                <>
                  <NumberField label="GPU price" unit="$ per GPU-hour" value={s.settings.gpuHourPrice} step={0.25} onChange={(v) => set({ gpuHourPrice: v })} />
                  <NumberField label="Utilization" unit="share of hours sold" value={s.settings.utilization} step={0.05} min={0.05} max={1} onChange={(v) => set({ utilization: v })} />
                </>
              )}
              <NumberField label="Build cost" unit="$ millions per MW of IT" value={s.settings.capexPerMw} step={0.5} onChange={(v) => set({ capexPerMw: v })} />
              <NumberField label="Cost of capital" unit="per year (0.09 = 9%)" value={s.settings.costOfCapital} step={0.01} max={0.5} onChange={(v) => set({ costOfCapital: v })} />
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">
              Lost revenue plus the interest on capital that's built but idle. All assumptions; see Sources for the reasoning.
            </p>
          </Card>
        </div>

        <Card>
          <div className="flex items-baseline justify-between gap-3">
            <p className="kicker">Slip a milestone</p>
            {slipped && (
              <button type="button" onClick={() => setS({ ...s, slips: {} })} className="inline-flex items-center gap-1 text-xs font-medium text-ink underline decoration-brand decoration-2 underline-offset-2">
                <RotateCcw className="size-3" aria-hidden /> Reset slips
              </button>
            )}
          </div>
          <div className="mt-4 grid gap-6">
            {plans.map((p, i) => (
              <fieldset key={p.phase.id}>
                <legend className="flex items-center gap-2 font-bold">
                  <span className="size-3 rounded-full" style={{ background: PHASE_COLOR[i] }} aria-hidden />
                  {p.phase.name}
                </legend>
                <div className="mt-2 grid gap-3">
                  {p.now.deps.map((d) => {
                    const m = MILESTONES.find((mm) => mm.id === d.id)!;
                    const key = `${p.phase.id}.${d.id}`;
                    const id = `slip-${key.replace(".", "-")}`;
                    return (
                      <div key={d.id}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <label htmlFor={id} className={d.id === p.now.critical ? "font-semibold" : ""}>
                            {m.label}
                            {d.id === p.now.critical && <span className="ml-2 rounded-full bg-brand px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-on-brand">critical</span>}
                          </label>
                          <span className="font-mono text-xs text-muted">
                            {d.slip ? `+${d.slip} mo → ` : ""}
                            {formatMonth(d.at)}
                            {d.id !== p.now.critical ? ` · ${d.slack.toFixed(1)} mo slack` : ""}
                          </span>
                        </div>
                        <input
                          id={id}
                          type="range"
                          min={0}
                          max={MAX_SLIP}
                          step={1}
                          value={s.slips[key] ?? 0}
                          onChange={(e) => setS({ ...s, slips: { ...s.slips, [key]: Number(e.target.value) } })}
                          aria-valuetext={`${s.slips[key] ?? 0} months late`}
                          className="mt-1 w-full"
                        />
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          <a
            href={breakevenLink(plans)}
            className="mt-6 inline-flex items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-sm font-semibold transition hover:border-ink"
          >
            Grid running late? Compare ways to bridge it in Breakeven <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </Card>
      </div>

      <Hedge s={s} setS={setS} campus={campus} />
    </Frame>
  );
}

/**
 * Breakeven sizes clusters in H100s at 1.69 kW of facility power each (1.3 kW × PUE 1.3), so hand it the GPU count
 * that matches this campus's largest phase in megawatts, plus the current delay.
 */
function breakevenLink(plans: ReturnType<typeof plan>) {
  const biggest = plans.reduce((a, b) => (b.facilityMw > a.facilityMw ? b : a));
  const gpus = Math.round((biggest.facilityMw * 1000) / 1.69);
  const delay = Math.max(1, Math.round(Math.max(...plans.map((p) => p.delay))));
  return `https://breakeven-silk.vercel.app/power-it?g=${gpus}&d=${delay}`;
}
