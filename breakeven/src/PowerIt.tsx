import { Zap } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { linkClick } from "@/components/Brand";
import { Fold } from "@/components/Fold";
import { BridgeChart, type StrategyMeta } from "@/components/BridgeChart";
import { Odometer } from "@/components/Odometer";
import { PlanFrame, StepHeading, formatKw, usePlan } from "@/components/PlanFrame";
import { PowerBudget } from "@/components/PowerBudget";
import { needsPowerPlanning } from "@/lib/call";
import { clusterGpusOf, ownedClusterGpus, stepHref } from "@/lib/plan";
import {
  CLUSTER_PRESETS,
  DEFAULT_BRIDGE,
  MAX_DELAY_MONTHS,
  STRATEGY_IDS,
  bestStrategy,
  facilityKw,
  formatMoney,
  paysOffFrom,
  rentPremium,
  strategies,
  totalOver,
  winnerStretches,
  type BridgeAssumptions,
  type StrategyId,
} from "@/lib/speedToPower";
import { formatUsd, ownCostPerGpuMonth } from "@/lib/tco";

export const STRATEGY_META: Record<StrategyId, StrategyMeta & { note: string }> = {
  wait: { name: "Rent cloud GPUs while you wait", short: "Rent & wait", color: "var(--bridge-wait)", note: "No commitment; pays the cloud premium every month." },
  service: { name: "Bridge power service", short: "Bridge power", color: "var(--bridge-service)", note: "Third-party on-site generation, billed per MWh." },
  engines: { name: "Own on-site gas", short: "Own gas", color: "var(--bridge-engines)", note: "Owned turbines or engines: low running cost, long lead time." },
  flex: { name: "Flexible grid + batteries", short: "Batteries", color: "var(--bridge-flex)", note: "Early curtailable connection, with batteries covering curtailment." },
};

const FIELDS: { group: string; items: { key: keyof BridgeAssumptions; label: string; unit: string; step: number }[] }[] = [
  {
    group: "Bridge power service",
    items: [
      { key: "servicePerMwh", label: "Price", unit: "$ / MWh", step: 5 },
      { key: "serviceLeadMonths", label: "Ready after", unit: "months", step: 1 },
    ],
  },
  {
    group: "Own on-site gas",
    items: [
      { key: "engineCapexPerKw", label: "Capital cost", unit: "$ / kW", step: 50 },
      { key: "engineLeadMonths", label: "Ready after", unit: "months", step: 1 },
      { key: "gasPerMMBtu", label: "Gas price", unit: "$ / MMBtu", step: 0.25 },
      { key: "heatRate", label: "Heat rate", unit: "Btu / kWh", step: 100 },
      { key: "engineFixedOmPerKwYear", label: "Fixed O&M", unit: "$ / kW-year", step: 1 },
      { key: "engineVarOmPerMwh", label: "Variable O&M", unit: "$ / MWh", step: 0.5 },
      { key: "reservePct", label: "Spare capacity", unit: "%", step: 5 },
      { key: "engineValueKeptPct", label: "Value kept", unit: "% when the grid arrives", step: 5 },
    ],
  },
  {
    group: "Flexible grid + batteries",
    items: [
      { key: "flexLeadMonths", label: "Connected after", unit: "months", step: 1 },
      { key: "batteryHours", label: "Longest cutback", unit: "hours", step: 1 },
      { key: "batteryPerKwh", label: "Battery cost", unit: "$ / kWh installed", step: 10 },
      { key: "batteryValueKeptPct", label: "Value kept", unit: "% when the grid arrives", step: 5 },
    ],
  },
];

export function PowerIt() {
  const [plan, setPlan] = usePlan("power-it");
  const { assumptions, bridge } = plan;
  const gpus = clusterGpusOf(plan);
  const yours = ownedClusterGpus(plan);
  const setGpus = (g: number | null) => setPlan((p) => ({ ...p, clusterGpus: g }));
  const setBridge = (f: (b: BridgeAssumptions) => BridgeAssumptions) => setPlan((p) => ({ ...p, bridge: f(p.bridge) }));
  const kw = facilityKw(gpus, assumptions);

  const all = useMemo(() => strategies(gpus, assumptions, bridge), [gpus, assumptions, bridge]);
  const stretches = useMemo(() => winnerStretches(all), [all]);
  const delay = bridge.delayMonths;
  const winner = bestStrategy(all, delay);
  const premium = rentPremium(gpus, assumptions);
  const setB = (patch: Partial<BridgeAssumptions>) => setBridge((b) => ({ ...b, ...patch }));

  const calcLink = stepHref("run-it", plan);
  const winnerTotal = totalOver(all[winner], delay);
  const savedVsRent = totalOver(all.wait, delay) - winnerTotal;
  const edited = (Object.keys(DEFAULT_BRIDGE) as (keyof BridgeAssumptions)[]).some(
    (k) => k !== "delayMonths" && k !== "serviceOffered" && k !== "flexOffered" && bridge[k] !== DEFAULT_BRIDGE[k],
  );

  return (
    <PlanFrame route="power-it" plan={plan}>
        <StepHeading route="power-it">
          Ownership only pays if the capacity can be powered. Set the power available, then compare options for bridging a delayed grid connection.
        </StepHeading>

        {!needsPowerPlanning(plan) && (
          <p className="mt-4 rounded-xl border border-line bg-sunken px-4 py-3 text-sm text-ink-2">
            <strong className="text-ink">Not needed for your plan.</strong> You're paying per token or renting GPUs, so the provider supplies the power. This step only matters if you own GPUs; explore it to see what owning would take, or{" "}
            <a href={stepHref("result", plan)} onClick={linkClick(stepHref("result", plan))} className="font-semibold text-brand-ink underline underline-offset-2">
              go to the recommendation
            </a>
            .
          </p>
        )}

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
          <section aria-label="Your power" className="rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
            <p className="kicker">01 · Available power</p>
            <div className="mt-4">
              <PowerBudget
                kw={assumptions.powerLimitKw}
                assumptions={assumptions}
                onChange={(v) => setPlan((p) => ({ ...p, assumptions: { ...p.assumptions, powerLimitKw: v } }))}
              />
            </div>

            <p className="kicker mt-7">02 · Grid connection delay</p>
            <p className="mt-2 text-sm font-medium">Cluster size</p>
            <button
              type="button"
              aria-pressed={plan.clusterGpus === null}
              onClick={() => setGpus(null)}
              className={`mt-2 w-full rounded-xl border px-3 py-2.5 text-left transition ${plan.clusterGpus === null ? "border-brand bg-brand text-white" : "border-line bg-bg hover:border-brand"}`}
            >
              <span className="block text-sm font-semibold leading-tight">Your workload</span>
              <span className={`mt-0.5 block font-mono text-xs ${plan.clusterGpus === null ? "text-white/80" : "text-muted"}`}>
                {yours.toLocaleString("en-US")} owned GPUs · {formatKw(facilityKw(yours, assumptions))}
              </span>
            </button>
            <p className="mt-3 text-xs font-medium text-ink-2">Scale scenarios</p>
            <div className="mt-1.5 grid grid-cols-3 gap-2" role="group" aria-label="What-if cluster sizes">
              {CLUSTER_PRESETS.map((p) => {
                const active = plan.clusterGpus === p.gpus;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setGpus(p.gpus)}
                    className={`rounded-xl border px-3 py-2.5 text-left transition ${active ? "border-brand bg-brand text-white" : "border-line bg-bg hover:border-brand"}`}
                  >
                    <span className="block text-sm font-semibold leading-tight">{p.label}</span>
                    <span className={`mt-0.5 block font-mono text-xs ${active ? "text-white/80" : "text-muted"}`}>{p.gpus.toLocaleString("en-US")} GPUs</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex items-end justify-between gap-3">
              <label htmlFor="gpus" className="text-sm font-medium">
                GPUs <span className="font-mono text-brand-ink">≈ {formatKw(kw)}</span>
              </label>
              <input
                id="gpus"
                type="number"
                min={1}
                step={8}
                value={gpus}
                onChange={(e) => {
                  const v = Math.round(Number(e.target.value));
                  if (Number.isFinite(v) && v >= 1) setGpus(v === yours ? null : Math.min(10_000_000, v));
                }}
                className="w-32 rounded-lg border border-line bg-bg px-2 py-1 text-right font-mono text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-muted">Facility power = GPUs × {assumptions.kwPerGpu} kW × PUE {assumptions.pue}.</p>

            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <label htmlFor="delay" className="text-sm font-medium">
                  Expected grid delay
                </label>
                <span className="font-mono text-sm text-brand-ink">{delay === 0 ? "On time" : `${delay} months`}</span>
              </div>
              <input
                id="delay"
                type="range"
                min={0}
                max={MAX_DELAY_MONTHS}
                value={delay}
                onChange={(e) => setB({ delayMonths: Number(e.target.value) })}
                aria-valuetext={`${delay} months`}
                className="mt-3 w-full"
              />
              <div className="mt-1 flex justify-between font-mono text-[11px] text-muted">
                <span>0</span>
                <span>2 yrs</span>
                <span>4 yrs</span>
                <span>6 yrs</span>
              </div>
              <p className="mt-1 text-xs text-muted">The US average is about 4 years; Northern Virginia about 7 for 100 MW.</p>
            </div>

            <fieldset className="mt-6 space-y-2.5">
              <legend className="text-sm font-medium">Options available at this site</legend>
              <Toggle checked={bridge.serviceOffered > 0} onChange={(on) => setB({ serviceOffered: on ? 1 : 0 })}>
                Bridge-power provider available at this scale
              </Toggle>
              <Toggle checked={bridge.flexOffered > 0} onChange={(on) => setB({ flexOffered: on ? 1 : 0 })}>
                The utility offers a flexible (curtailable) connection
              </Toggle>
            </fieldset>

            <details className="group mt-6 rounded-xl border border-line bg-bg">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
                <span className="kicker">03 · Assumptions</span>
                <span className="text-xs text-muted group-open:hidden">Prices, lead times ▾</span>
                <span className="hidden text-xs text-muted group-open:inline">Hide ▴</span>
              </summary>
              <div className="space-y-5 border-t border-line px-4 py-4">
                {FIELDS.map((g) => (
                  <div key={g.group}>
                    <p className="text-xs font-semibold text-ink">{g.group}</p>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      {g.items.map((f) => (
                        <label key={f.key} className="block">
                          <span className="block text-xs font-medium text-ink-2">{f.label}</span>
                          <input
                            type="number"
                            min={0}
                            step={f.step}
                            value={bridge[f.key]}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (e.target.value !== "" && Number.isFinite(v) && v >= 0) setB({ [f.key]: v });
                            }}
                            className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-sm"
                          />
                          <span className="mt-0.5 block font-mono text-[10px] text-muted">{f.unit}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {edited && (
                  <button
                    type="button"
                    onClick={() => setBridge((b) => ({ ...DEFAULT_BRIDGE, delayMonths: b.delayMonths, serviceOffered: b.serviceOffered, flexOffered: b.flexOffered }))}
                    className="text-xs font-medium text-brand-ink underline underline-offset-2"
                  >
                    Reset to defaults
                  </button>
                )}
              </div>
              <p className="border-t border-line px-4 py-3 text-[11px] leading-5 text-muted">
                GPU, rent and grid prices come from the calculator: {formatUsd(assumptions.rentPerGpuHour, 2)} per GPU-hour to rent,{" "}
                {formatUsd(ownCostPerGpuMonth(assumptions))} per GPU-month to own, {formatUsd(assumptions.electricityPerKwh, 2)} per kWh.{" "}
                <a href={calcLink} onClick={linkClick(calcLink)} className="font-semibold text-brand-ink underline underline-offset-2">
                  Change them in step 2
                </a>
                {" · "}
                <a href="/methodology#speed-to-power" onClick={linkClick("/methodology#speed-to-power")} className="font-semibold text-brand-ink underline underline-offset-2">
                  Sources for every number →
                </a>
              </p>
            </details>
          </section>

          <section aria-label="Results" aria-live="polite" className={`bridge-${winner} grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4`}>
            {kw < 1000 && (
              <p className="rounded-2xl border border-line bg-brand-soft p-4 text-sm leading-6">
                <span className="font-semibold">At {formatKw(kw)}, power is unlikely to be a constraint.</span> Grid delays matter at multi-megawatt
                scale; try a <span className="font-semibold">scale scenario</span>.
              </p>
            )}
            {premium <= 0 && (
              <p className="rounded-2xl border border-line bg-brand-soft p-4 text-sm leading-6">
                At these prices renting costs no more than owning, so a late grid costs you nothing: just rent.{" "}
                <a href={calcLink} onClick={linkClick(calcLink)} className="font-semibold text-brand-ink underline underline-offset-2">
                  Check the calculator
                </a>
                .
              </p>
            )}

            <div className="win-panel rounded-2xl p-5 text-white sm:p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/75">
                {delay === 0 ? "Grid on time" : `Cheapest way to bridge a ${delay}-month wait`}
              </p>
              <p key={winner} className="mt-3 flex animate-rise items-center gap-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
                <span className="size-4 shrink-0 rounded-full ring-2 ring-white/80" style={{ background: STRATEGY_META[winner].color }} aria-hidden />
                {delay === 0 ? "Nothing to bridge" : STRATEGY_META[winner].name}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
                <PanelStat label="Incremental cost">
                  <Odometer text={formatMoney(winnerTotal)} />
                </PanelStat>
                <PanelStat label="Savings vs renting">
                  <Odometer text={formatMoney(savedVsRent)} />
                </PanelStat>
                <PanelStat label="Operational from">{delay === 0 ? "Day one" : all[winner].readyAfter === 0 ? "Now" : `Month ${all[winner].readyAfter}`}</PanelStat>
              </div>
            </div>

            <StrategyBars all={all} delay={delay} winner={winner} />

            <div className="grid items-start gap-4">
              <div className="flex gap-3 rounded-[7px] border border-line bg-surface p-4 sm:p-5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-white" aria-hidden>
                  <Zap className="size-4" />
                </span>
                <div>
                  <p className="kicker">Time to power drives the decision</p>
                  <p className="mt-1 text-sm leading-6 text-ink">
                    Renting this cluster costs {formatMoney(premium)} a month more than owning it on a working grid, so the fastest bridge usually
                    wins, even with pricier power. {describeStretches(stretches)} {describePayoff(all, stretches)}
                  </p>
                </div>
              </div>
            </div>

            <Fold id="wait-chart" title="Cost of delay by option" sub="Each option's incremental cost as the grid delay grows, with the switch points">
              <BridgeChart all={all} delay={delay} stretches={stretches} meta={STRATEGY_META} />
            </Fold>
            <Fold id="bridge-numbers" title="Behind the numbers" sub="Lead times, one-time and monthly costs for each option">
              <StrategyTable all={all} delay={delay} />
            </Fold>

            <p className="text-xs leading-5 text-muted">
              Costs are incremental to owning on a working grid. Illustrative, not quotes.{" "}
              <a href="/faq#batteries" onClick={linkClick("/faq#batteries")} className="font-semibold text-brand-ink underline underline-offset-2">
                Can batteries run a site alone?
              </a>
            </p>
          </section>
        </div>
    </PlanFrame>
  );
}

function describeStretches(stretches: { fromMonth: number; id: StrategyId }[]) {
  const [first, ...rest] = stretches;
  if (!first) return "";
  if (rest.length === 0) return `${STRATEGY_META[first.id].name} is cheapest at every delay.`;
  const opening = first.id === "wait" ? `Up to ${rest[0]!.fromMonth - 1} months, just rent.` : `${STRATEGY_META[first.id].name} is cheapest up to ${rest[0]!.fromMonth - 1} months.`;
  return [opening, ...rest.map((s) => `From ${s.fromMonth} months: ${STRATEGY_META[s.id].name}.`)].join(" ");
}

function describePayoff(all: ReturnType<typeof strategies>, stretches: { fromMonth: number; id: StrategyId }[]) {
  const m = paysOffFrom(all, "engines");
  if (!all.engines.available || m === null) return "";
  const fasterWins = stretches.some((s) => s.id === "service" || s.id === "flex");
  return fasterWins
    ? `Owning gas beats renting from ${m} months, but its ${all.engines.readyAfter}-month lead time is why faster options win first.`
    : `Owning gas beats renting from ${m} months; until it arrives (${all.engines.readyAfter} months), you rent.`;
}

const HATCH = "repeating-linear-gradient(135deg, #c9d2d8 0 5px, #e4e9ec 5px 10px)";

/**
 * The wait as a timeline: one lane per option across the months until the grid arrives. Hatched is the months you rent
 * while the option is being built; colour is the months it's running. The total extra cost sits at the end of each lane.
 */
function StrategyBars({ all, delay, winner }: { all: ReturnType<typeof strategies>; delay: number; winner: StrategyId }) {
  const premium = all.wait.monthlyWaiting;
  const ticks = delay > 0 ? [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(f * delay)) : [];
  return (
    <figure className="win-tint rounded-2xl border p-5 sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">{delay === 0 ? "The grid is on time" : `The ${delay}-month wait, option by option`}</span>
        <span className="kicker">Extra cost</span>
      </figcaption>
      {delay === 0 ? (
        <p className="mt-3 text-sm text-ink-2">Nothing to bridge: every option costs nothing extra. Move the delay to compare them.</p>
      ) : (
        <>
          <div className="mt-4">
            {STRATEGY_IDS.map((id) => {
              const s = all[id];
              const total = totalOver(s, delay);
              const ready = Math.min(delay, s.readyAfter);
              const pct = (ready / delay) * 100;
              const best = id === winner;
              return (
                <div key={id} className={`grid grid-cols-1 items-center gap-x-3 gap-y-1.5 border-t border-line/70 py-2.5 first:border-t-0 sm:grid-cols-[200px_minmax(0,1fr)_72px] ${best ? "-mx-2 rounded-lg bg-surface/80 px-2" : ""}`}>
                  <span className="flex items-start gap-2 text-sm text-ink-2">
                    <span className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: STRATEGY_META[id].color }} aria-hidden />
                    <span>
                      {STRATEGY_META[id].name}
                      {best && <span className="win-pill ml-1.5 rounded-[999px] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">Cheapest</span>}
                    </span>
                  </span>
                  <div className="relative h-[26px] overflow-hidden rounded-[5px] bg-surface/80" role="img" aria-label={!s.available ? "Not on offer" : id === "wait" ? `Renting all ${delay} months` : s.readyAfter >= delay ? `Not ready before the grid arrives: renting all ${delay} months` : `Renting for ${ready} months, then running from month ${ready}`}>
                    {s.available &&
                      (id === "wait" ? (
                        <div className="absolute inset-0 opacity-90" style={{ background: STRATEGY_META[id].color }}>
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-white">renting all {delay} months</span>
                        </div>
                      ) : (
                        <>
                          <div className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, background: HATCH }} />
                          {ready < delay ? (
                            <div className="absolute inset-y-0 right-0" style={{ left: `${pct}%`, background: STRATEGY_META[id].color }}>
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] font-semibold text-white">{pct < 75 ? `running from month ${ready}` : `month ${ready}`}</span>
                            </div>
                          ) : (
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-ink-2">not ready before the grid arrives</span>
                          )}
                        </>
                      ))}
                    {!s.available && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-muted">not on offer</span>}
                  </div>
                  <span className={`font-mono text-sm sm:text-right ${best ? "font-semibold text-ink" : "text-ink-2"}`}>{s.available ? formatMoney(total) : "–"}</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-[200px_minmax(0,1fr)_72px]">
            <span className="hidden sm:block" />
            <div className="relative mt-1 h-4 font-mono text-[10.5px] text-muted">
              {ticks.map((t, k) => (
                <span key={k} className={`absolute ${k === 0 ? "left-0" : k === ticks.length - 1 ? "right-0" : "-translate-x-1/2"}`} style={k > 0 && k < ticks.length - 1 ? { left: `${(t / delay) * 100}%` } : undefined}>
                  {k === 0 ? "Month 0" : k === ticks.length - 1 ? `${t} · grid arrives` : t}
                </span>
              ))}
            </div>
          </div>
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-ink-2">
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-2.5 w-5 rounded-sm" style={{ background: HATCH }} />
              Renting cloud GPUs while it's built ({formatMoney(premium)} a month)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block h-2.5 w-5 rounded-sm bg-ink-2" />
              Running on the option
            </span>
          </p>
        </>
      )}
    </figure>
  );
}

function StrategyTable({ all, delay }: { all: ReturnType<typeof strategies>; delay: number }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[460px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="py-2 font-medium">Option</th>
              <th className="py-2 text-right font-medium">Ready</th>
              <th className="py-2 text-right font-medium">One-time</th>
              <th className="py-2 text-right font-medium">Per month after</th>
              <th className="py-2 text-right font-medium">Over {delay} mo</th>
            </tr>
          </thead>
          <tbody>
            {STRATEGY_IDS.map((id) => {
              const s = all[id];
              return (
                <tr key={id} className={`border-b border-line/70 ${s.available ? "" : "opacity-50"}`}>
                  <td className="py-2">{STRATEGY_META[id].short}</td>
                  <td className="py-2 text-right font-mono">{s.readyAfter === 0 ? "Now" : `${s.readyAfter} mo`}</td>
                  <td className="py-2 text-right font-mono">{s.oneTime ? formatMoney(s.oneTime) : "–"}</td>
                  <td className="py-2 text-right font-mono">{formatMoney(s.monthlyRunning)}</td>
                  <td className="py-2 text-right font-mono">{s.available ? formatMoney(totalOver(s, delay)) : "n/a"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 text-xs leading-5 text-muted">
          Until an option is ready, you rent ({formatMoney(all.wait.monthlyRunning)} a month extra). Negative means cheaper than grid power.
        </p>
      </div>
    </div>
  );
}

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (on: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 accent-[var(--brand)]" />
      <span>{children}</span>
    </label>
  );
}

function PanelStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/75">{label}</p>
      <p className="mt-1.5 font-mono text-base font-semibold sm:text-xl">{children}</p>
    </div>
  );
}
