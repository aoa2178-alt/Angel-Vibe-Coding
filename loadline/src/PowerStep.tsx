import { Card, FactList, NumberField, PHASE_COLOR, SourceLink, Stat } from "@/components/ui";
import { Frame, StepHeading, useScenario } from "@/components/Frame";
import { DATA, campusById, formatMoney, formatMw, plan, type Settings } from "@/lib/model";

/** Step 1: how much power does the campus need, and what will it spend on electricity? */
export function PowerStep() {
  const [s, setS] = useScenario("power");
  const campus = campusById(s.campusId);
  const plans = plan(campus, s.settings, s.slips);
  const totals = {
    gpus: plans.reduce((n, p) => n + p.gpus, 0),
    it: plans.reduce((n, p) => n + p.itMw, 0),
    facility: plans.reduce((n, p) => n + p.facilityMw, 0),
    energy: plans.reduce((n, p) => n + p.annualEnergy, 0),
  };
  const set = (patch: Partial<Settings>) => setS({ ...s, settings: { ...s.settings, ...patch } });
  const profile = DATA.gpuProfiles[campus.phases[0]!.gpuProfile]!;

  return (
    <Frame route="power" s={s} setS={setS}>
      <StepHeading route="power" campus={campus}>
        From the GPU plan to megawatts at the meter, and the electricity bill once it's fully running.
      </StepHeading>

      <div className="rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">{campus.tagline}</p>
        <div className="mt-4 grid grid-cols-2 gap-5 lg:grid-cols-4">
          <Stat dark label="GPUs at full build" value={totals.gpus.toLocaleString("en-US")} sub={profile.label} />
          <Stat dark label="IT power" value={formatMw(totals.it)} sub="what the computers draw" />
          <Stat dark label="Facility power" value={formatMw(totals.facility)} sub={`IT × PUE ${s.settings.pue}`} />
          <Stat dark label="Electricity per year" value={formatMoney(totals.energy)} sub={`at $${s.settings.pricePerMwh}/MWh`} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="grid gap-4">
          {plans.map((p, i) => (
            <Card key={p.phase.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="flex items-center gap-2 text-lg font-bold tracking-tight">
                  <span className="size-3 rounded-full" style={{ background: PHASE_COLOR[i] }} aria-hidden />
                  {p.phase.name}
                </p>
                <span className="text-sm text-muted">
                  {p.phase.buildings} building{p.phase.buildings === 1 ? "" : "s"}
                </span>
              </div>
              {/* The chain: GPUs → IT MW → facility MW → yearly electricity */}
              <ol className="mt-4 grid gap-2 sm:grid-cols-4">
                {[
                  { label: "GPUs", value: p.gpus.toLocaleString("en-US"), note: p.phase.gpus ? "disclosed" : "from disclosed MW" },
                  { label: "IT power", value: formatMw(p.itMw), note: `${DATA.gpuProfiles[p.phase.gpuProfile]!.kwPerGpu} kW per GPU` },
                  { label: "Facility power", value: formatMw(p.facilityMw), note: `× PUE ${s.settings.pue}` },
                  { label: "Electricity / yr", value: formatMoney(p.annualEnergy), note: `${Math.round(s.settings.loadFactor * 100)}% load` },
                ].map((step, k) => (
                  <li key={step.label} className="relative rounded-xl bg-sunken px-3 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{step.label}</p>
                    <p className="mt-0.5 font-mono text-lg font-semibold">{step.value}</p>
                    <p className="text-[11px] text-muted">{step.note}</p>
                    {k < 3 && (
                      <span className="absolute -right-2 top-1/2 hidden -translate-y-1/2 text-muted sm:block" aria-hidden>
                        →
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </Card>
          ))}

          <Card>
            <p className="kicker">What's public</p>
            <div className="mt-2">
              <FactList facts={campus.facts} />
            </div>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-40">
          <p className="kicker">Power assumptions</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <NumberField label="Electricity price" unit="$ per MWh" value={s.settings.pricePerMwh} step={1} onChange={(v) => set({ pricePerMwh: v })} />
            <NumberField label="PUE" unit="facility ÷ IT power" value={s.settings.pue} step={0.01} min={1} max={3} onChange={(v) => set({ pue: v })} />
            <NumberField label="Average load" unit="share of full power" value={s.settings.loadFactor} step={0.05} min={0.05} max={1} onChange={(v) => set({ loadFactor: v })} />
          </div>
          <p className="mt-4 text-xs leading-5 text-muted">
            {campus.region.priceNote} <SourceLink href={campus.region.priceSource}>EIA</SourceLink>. Grid: {campus.region.grid}.
          </p>
          <p className="mt-2 text-xs leading-5 text-muted">
            {profile.why} <SourceLink href={profile.source}>NVIDIA</SourceLink>
          </p>
        </Card>
      </div>
    </Frame>
  );
}
