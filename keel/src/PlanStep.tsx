import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { LineChart } from "@/components/LineChart";
import { Card, Kicker, NumberField, Slider, Stat } from "@/components/ui";
import { MONTH_NAMES, formatCount, formatMoney, pct, total, type Settings } from "@/lib/model";
import { run } from "@/lib/run";

const formatKr = (format: "money" | "count" | "pct", v: number) => (format === "money" ? formatMoney(v) : format === "pct" ? pct(v, 1) : formatCount(v));

/** Step 1: the driver-based annual plan, the headcount and opex it implies, and the OKRs it sets. */
export function PlanStep() {
  const [s, setS] = useScenario("plan");
  const r = run(s);
  const set = (patch: Partial<Settings>) => setS({ ...s, settings: { ...s.settings, ...patch } });
  const st = s.settings;
  const p = r.plan;
  const last = p[p.length - 1]!;
  const capacityBinds = p.filter((m) => m.newArr >= m.capacity - 1).length;
  const objectives = [...new Set(r.krs.map((k) => k.objective))];

  return (
    <Frame route="plan" s={s} setS={setS}>
      <StepHeading route="plan">
        The year's plan, built from the drivers each team controls. Change a driver and the revenue, headcount, opex and OKR targets all move with it.
      </StepHeading>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
        <div className="grid gap-4">
          <div className="rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">The plan for the year</p>
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat dark label="Revenue" value={formatMoney(total(p, "revenue"))} sub={`API ${formatMoney(total(p, "apiRevenue"))} · Enterprise ${formatMoney(total(p, "enterpriseRevenue"))}`} />
              <Stat dark label="Enterprise ARR, Dec" value={formatMoney(last.arr)} sub={`from ${formatMoney(st.startingArr)}`} />
              <Stat dark label="Commercial opex" value={formatMoney(total(p, "opex"))} sub={`${Math.round(last.headcount)} people by December`} />
              <Stat dark label="Contribution" value={formatMoney(total(p, "contribution"))} sub="gross profit − commercial opex" />
            </div>
          </div>

          <Card>
            <LineChart
              title="Monthly revenue in the plan"
              xLabels={MONTH_NAMES}
              series={[
                { label: "API", color: "var(--series-1)", values: p.map((m) => m.apiRevenue) },
                { label: "Enterprise", color: "var(--series-2)", values: p.map((m) => m.enterpriseRevenue) },
                { label: "Total", color: "var(--ink)", values: p.map((m) => m.revenue), width: 2.5 },
              ]}
              format={formatMoney}
              height={240}
              ariaLabel={`Planned monthly revenue rising from ${formatMoney(p[0]!.revenue)} in January to ${formatMoney(last.revenue)} in December.`}
            />
            <p className="mt-3 text-sm leading-6 text-ink-2">
              {capacityBinds > 0
                ? `In ${capacityBinds} month${capacityBinds === 1 ? "" : "s"} the reps, not the pipeline, are the limit on new ARR: more pipeline won't help there, more ramped reps will.`
                : `Pipeline is the limit on new ARR all year (pipeline × win rate stays below what ${Math.round(last.rampedReps)} ramped reps can close), so hiring more reps alone won't grow Enterprise.`}
            </p>
          </Card>

          <Card>
            <Kicker>OKRs this plan sets</Kicker>
            <div className="mt-3 grid gap-4 md:grid-cols-3">
              {objectives.map((o) => (
                <div key={o} className="rounded-xl border border-line p-4">
                  <p className="font-semibold">{o}</p>
                  <ul className="mt-2 grid gap-2 text-sm">
                    {r.krs
                      .filter((k) => k.objective === o)
                      .map((k) => (
                        <li key={k.id}>
                          <span className="block text-ink-2">{k.label}</span>
                          <span className="font-mono font-semibold">
                            {k.higherBetter ? "≥ " : "≤ "}
                            {formatKr(k.format, k.target)}
                          </span>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-muted">Targets come straight from the plan's drivers, so every key result traces to a number someone owns.</p>
          </Card>
        </div>

        <div className="grid gap-4">
          <Card>
            <Kicker>API drivers</Kicker>
            <div className="mt-3 grid gap-4">
              <Slider label="Developer growth" value={Math.round(st.devGrowth * 1000)} display={`${pct(st.devGrowth, 1)} a month`} min={0} max={100} onChange={(v) => set({ devGrowth: v / 1000 })} />
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="Active developers" unit="in January" value={st.developers} step={1000} onChange={(v) => set({ developers: v })} />
                <NumberField label="Tokens per developer" unit="millions a month" value={st.tokensPerDevM} step={5} onChange={(v) => set({ tokensPerDevM: v })} />
                <NumberField label="Price" unit="$ per M tokens, blended" value={st.pricePerM} step={0.1} onChange={(v) => set({ pricePerM: v })} />
                <NumberField label="Compute cost" unit="$ per M tokens" value={st.computePerM} step={0.1} onChange={(v) => set({ computePerM: v })} />
              </div>
            </div>
          </Card>
          <Card>
            <Kicker>Enterprise drivers</Kicker>
            <div className="mt-3 grid gap-4">
              <Slider label="Win rate" value={Math.round(st.winRate * 100)} display={pct(st.winRate)} min={5} max={60} onChange={(v) => set({ winRate: v / 100 })} />
              <Slider label="Reps hired a month" value={st.hiresPerMonth} display={`${st.hiresPerMonth}`} min={0} max={10} onChange={(v) => set({ hiresPerMonth: v })} />
              <div className="grid grid-cols-2 gap-3">
                <NumberField label="New pipeline" unit="$ a month (ACV)" value={st.pipeline} step={1e6} onChange={(v) => set({ pipeline: v })} />
                <NumberField label="Monthly churn" unit="share of ARR (0.01 = 1%)" value={st.churn} step={0.001} max={1} onChange={(v) => set({ churn: v })} />
                <NumberField label="Monthly expansion" unit="share of ARR" value={st.expansion} step={0.001} max={1} onChange={(v) => set({ expansion: v })} />
                <NumberField label="Quota per rep" unit="$ new ARR a year" value={st.quota} step={1e5} onChange={(v) => set({ quota: v })} />
              </div>
            </div>
          </Card>
          <Card>
            <Kicker>People and programs</Kicker>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <NumberField label="Rep cost" unit="$ a year, loaded" value={st.repCost} step={10_000} onChange={(v) => set({ repCost: v })} />
              <NumberField label="Support per rep" unit="SEs + CSMs per rep" value={st.supportPerRep} step={0.1} onChange={(v) => set({ supportPerRep: v })} />
              <NumberField label="Programs" unit="$ a month" value={st.programs} step={1e5} onChange={(v) => set({ programs: v })} />
              <NumberField label="Ramp" unit="months to full quota" value={st.rampMonths} step={1} min={1} onChange={(v) => set({ rampMonths: v })} />
            </div>
          </Card>
        </div>
      </div>
    </Frame>
  );
}
