import { Check, Link2, Zap } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { linkClick } from "@/components/Brand";
import { BridgeChart, type StrategyMeta } from "@/components/BridgeChart";
import { Odometer } from "@/components/Odometer";
import { PillBar, SiteFooter } from "@/components/Site";
import { estimateQuery } from "@/lib/share";
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
import { readScenario, scenarioQuery } from "@/lib/speedToPowerShare";
import { DEFAULT_WORKLOAD, formatUsd, ownCostPerGpuMonth } from "@/lib/tco";

export const STRATEGY_META: Record<StrategyId, StrategyMeta & { note: string }> = {
  wait: { name: "Rent cloud GPUs while you wait", short: "Rent & wait", color: "var(--bridge-wait)", note: "No commitment, but you pay the cloud premium every month." },
  service: { name: "Bridge power service", short: "Bridge power", color: "var(--bridge-service)", note: "A provider brings and runs on-site generators; you pay per MWh." },
  engines: { name: "Own on-site gas", short: "Own gas", color: "var(--bridge-engines)", note: "Your own turbines or engines: cheap power, long lead time." },
  flex: { name: "Flexible grid + batteries", short: "Batteries", color: "var(--bridge-flex)", note: "Connect early on curtailable terms; batteries carry the cutbacks." },
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

const NAV = [
  { href: "/calculator", label: "Calculator" },
  { href: "/business-case", label: "Business case" },
  { href: "/methodology#speed-to-power", label: "Methodology" },
];

const mw = (kw: number) => (kw >= 10_000 ? `${Math.round(kw / 1000)} MW` : `${(kw / 1000).toFixed(1)} MW`);

export function SpeedToPower() {
  const [initial] = useState(() => readScenario(window.location.search));
  const [gpus, setGpus] = useState(initial.gpus);
  const [bridge, setBridge] = useState<BridgeAssumptions>(initial.bridge);
  const assumptions = initial.assumptions;
  const [copied, setCopied] = useState(false);

  const all = useMemo(() => strategies(gpus, assumptions, bridge), [gpus, assumptions, bridge]);
  const stretches = useMemo(() => winnerStretches(all), [all]);
  const delay = bridge.delayMonths;
  const winner = bestStrategy(all, delay);
  const premium = rentPremium(gpus, assumptions);
  const setB = (patch: Partial<BridgeAssumptions>) => setBridge((b) => ({ ...b, ...patch }));

  useEffect(() => {
    window.history.replaceState(null, "", `/speed-to-power${scenarioQuery({ gpus, bridge, assumptions })}`);
  }, [gpus, bridge, assumptions]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link to your scenario:", window.location.href);
    }
  }

  const calcLink = `/calculator${estimateQuery(DEFAULT_WORKLOAD, assumptions)}`;
  const winnerTotal = totalOver(all[winner], delay);
  const savedVsRent = totalOver(all.wait, delay) - winnerTotal;
  const edited = (Object.keys(DEFAULT_BRIDGE) as (keyof BridgeAssumptions)[]).some(
    (k) => k !== "delayMonths" && k !== "serviceOffered" && k !== "flexOffered" && bridge[k] !== DEFAULT_BRIDGE[k],
  );

  return (
    <div className="min-h-dvh">
      <PillBar
        nav={NAV}
        actions={
          <>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-ink"
              aria-label="Save scenario: copy a link to it"
            >
              {copied ? <Check className="size-3.5" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />}
              <span className="hidden sm:inline">{copied ? "Link copied" : "Save scenario"}</span>
            </button>
            <span className="sr-only" aria-live="polite">
              {copied ? "Link to this scenario copied" : ""}
            </span>
          </>
        }
      />

      <main className="mx-auto max-w-[1360px] px-4 pb-16 pt-7 sm:px-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="kicker">Speed-to-Power</p>
            <h1 className="mt-2 text-4xl font-extrabold leading-none tracking-[-0.035em] sm:text-5xl">
              The grid is late. <span className="text-brand">Now what?</span>
            </h1>
          </div>
          <p className="max-w-md text-base text-ink-2 lg:text-right">
            Your servers can be ready long before the utility can power them. Compare the ways to bridge the wait, and when each one pays off.
          </p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          <section aria-label="Your cluster" className="rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
            <p className="kicker">01 · Your cluster</p>
            <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="Cluster size">
              {CLUSTER_PRESETS.map((p) => {
                const active = gpus === p.gpus;
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
                GPUs <span className="font-mono text-brand-ink">≈ {mw(facilityKw(gpus, assumptions))}</span>
              </label>
              <input
                id="gpus"
                type="number"
                min={1}
                step={8}
                value={gpus}
                onChange={(e) => {
                  const v = Math.round(Number(e.target.value));
                  if (Number.isFinite(v) && v >= 1) setGpus(Math.min(10_000_000, v));
                }}
                className="w-32 rounded-lg border border-line bg-bg px-2 py-1 text-right font-mono text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-muted">Facility power = GPUs × {assumptions.kwPerGpu} kW × PUE {assumptions.pue}.</p>

            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <label htmlFor="delay" className="text-sm font-medium">
                  How late is the grid?
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
              <legend className="text-sm font-medium">What's on offer where you are</legend>
              <Toggle checked={bridge.serviceOffered > 0} onChange={(on) => setB({ serviceOffered: on ? 1 : 0 })}>
                A bridge-power provider can serve this size
              </Toggle>
              <Toggle checked={bridge.flexOffered > 0} onChange={(on) => setB({ flexOffered: on ? 1 : 0 })}>
                The utility offers a flexible (curtailable) connection
              </Toggle>
            </fieldset>

            <details className="group mt-6 rounded-xl border border-line bg-bg">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
                <span className="kicker">02 · Assumptions</span>
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
                  Change them there
                </a>
                {" · "}
                <a href="/methodology#speed-to-power" onClick={linkClick("/methodology#speed-to-power")} className="font-semibold text-brand-ink underline underline-offset-2">
                  Sources for every number →
                </a>
              </p>
            </details>
          </section>

          <section aria-label="Results" aria-live="polite" className={`bridge-${winner} grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4`}>
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
                <PanelStat label="Extra cost">
                  <Odometer text={formatMoney(winnerTotal)} />
                </PanelStat>
                <PanelStat label="Saves vs renting">
                  <Odometer text={formatMoney(savedVsRent)} />
                </PanelStat>
                <PanelStat label="Running from">{delay === 0 ? "Day one" : all[winner].readyAfter === 0 ? "Now" : `Month ${all[winner].readyAfter}`}</PanelStat>
              </div>
            </div>

            <StrategyBars all={all} delay={delay} winner={winner} />

            <BridgeChart all={all} delay={delay} stretches={stretches} meta={STRATEGY_META} />

            <div className="grid items-start gap-4 xl:grid-cols-2">
              <div className="flex gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-white" aria-hidden>
                  <Zap className="size-4" />
                </span>
                <div>
                  <p className="kicker">Speed beats price</p>
                  <p className="mt-1 text-sm leading-6 text-ink">
                    Renting this cluster costs {formatMoney(premium)} a month more than owning it on a working grid, so the fastest bridge usually
                    wins, even with pricier power. {describeStretches(stretches)} {describePayoff(all, stretches)}
                  </p>
                </div>
              </div>
              <StrategyTable all={all} delay={delay} />
            </div>

            <p className="text-xs leading-5 text-muted">
              Batteries alone can't power a site with no grid connection: they only carry a partial, curtailable connection through cutbacks.
              Costs are extra spending versus owning the cluster on a working grid from day one. Illustrative, not quotes.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
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

function StrategyBars({ all, delay, winner }: { all: ReturnType<typeof strategies>; delay: number; winner: StrategyId }) {
  const totals = STRATEGY_IDS.map((id) => ({ id, total: totalOver(all[id], delay), available: all[id].available }));
  const max = Math.max(1, ...totals.filter((t) => t.available).map((t) => Math.abs(t.total)));
  return (
    <figure className="win-tint rounded-2xl border p-5 sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">Extra cost over {delay} months</span>
        <span className="kicker">Each option</span>
      </figcaption>
      <div className="mt-5 space-y-4">
        {totals.map(({ id, total, available }) => (
          <div key={id}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-ink-2">
                <span className="size-2.5 rounded-full" style={{ background: STRATEGY_META[id].color }} aria-hidden />
                {STRATEGY_META[id].name}
                {id === winner && delay > 0 && (
                  <span className="win-pill rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">Cheapest</span>
                )}
              </span>
              <span className={`font-mono ${id === winner ? "font-semibold text-ink" : "text-ink-2"}`}>{available ? formatMoney(total) : "Not on offer"}</span>
            </div>
            <div className="h-5 rounded-r-[4px] bg-surface/80">
              {available && (
                <div className="glide h-full rounded-r-[4px]" style={{ width: `${Math.max(0.8, (Math.max(0, total) / max) * 100)}%`, background: STRATEGY_META[id].color }} />
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted">{STRATEGY_META[id].note}</p>
          </div>
        ))}
      </div>
    </figure>
  );
}

function StrategyTable({ all, delay }: { all: ReturnType<typeof strategies>; delay: number }) {
  return (
    <details className="group rounded-2xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <span className="kicker">Show the numbers</span>
        <span className="text-xs text-muted group-open:hidden">Lead times and costs ▾</span>
        <span className="hidden text-xs text-muted group-open:inline">Hide ▴</span>
      </summary>
      <div className="overflow-x-auto border-t border-line px-5 py-4">
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
    </details>
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
