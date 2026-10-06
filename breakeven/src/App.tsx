import { useMemo, useState } from "react";
import { ClosingBars, type OptionMeta } from "@/components/ClosingBars";
import { Odometer } from "@/components/Odometer";
import {
  DEFAULT_ASSUMPTIONS,
  DEFAULT_WORKLOAD,
  PRESETS,
  VOLUME_MAX_M,
  VOLUME_MIN_M,
  cheapest,
  compare,
  crossovers,
  formatTokensM,
  formatUsd,
  type Assumptions,
  type OptionId,
  type Workload,
} from "@/lib/tco";

const OPTIONS: Record<OptionId, OptionMeta & { note: string }> = {
  api: { name: "Pay per token (API)", short: "API", swatch: "bg-api", note: "No hardware. You pay for every token." },
  rent: { name: "Rent cloud GPUs", short: "Rent", swatch: "bg-rent", note: "Pay by the GPU-hour, busy or idle." },
  own: { name: "Own GPUs", short: "Own", swatch: "bg-own", note: "Buy whole 8-GPU servers; pay power and upkeep." },
};

// The volume slider is logarithmic: 0–1000 maps to 10M–100B tokens a month.
const SLIDER_STEPS = 1000;
const toSlider = (m: number) => Math.round((Math.log10(m / VOLUME_MIN_M) / Math.log10(VOLUME_MAX_M / VOLUME_MIN_M)) * SLIDER_STEPS);
const fromSlider = (s: number) => {
  const m = VOLUME_MIN_M * Math.pow(VOLUME_MAX_M / VOLUME_MIN_M, s / SLIDER_STEPS);
  const p = Math.pow(10, Math.floor(Math.log10(m)) - 1); // keep two significant figures
  return Math.round(m / p) * p;
};

const ASSUMPTION_FIELDS: { key: keyof Assumptions; label: string; unit: string; step: number }[] = [
  { key: "apiInputPerM", label: "API price, input", unit: "$ / M tokens", step: 0.1 },
  { key: "apiOutputPerM", label: "API price, output", unit: "$ / M tokens", step: 0.5 },
  { key: "rentPerGpuHour", label: "Cloud GPU rental", unit: "$ / GPU-hour", step: 0.1 },
  { key: "gpuTokensPerSec", label: "GPU throughput", unit: "tokens / sec / GPU", step: 100 },
  { key: "hardwarePerGpu", label: "Hardware cost", unit: "$ per GPU, all-in", step: 1000 },
  { key: "depreciationYears", label: "Depreciation", unit: "years", step: 1 },
  { key: "kwPerGpu", label: "Power draw", unit: "kW per GPU", step: 0.1 },
  { key: "pue", label: "Data center PUE", unit: "facility ÷ IT power", step: 0.05 },
  { key: "electricityPerKwh", label: "Electricity", unit: "$ / kWh", step: 0.01 },
  { key: "opsPerGpuMonth", label: "Space, staff & upkeep", unit: "$ / GPU / month", step: 50 },
];

export default function App() {
  const [workload, setWorkload] = useState<Workload>(DEFAULT_WORKLOAD);
  const [assumptions, setAssumptions] = useState<Assumptions>(DEFAULT_ASSUMPTIONS);

  const costs = useMemo(() => compare(workload, assumptions), [workload, assumptions]);
  const winner = cheapest(costs);
  const cross = useMemo(() => crossovers(workload, assumptions), [workload, assumptions]);
  const setW = (patch: Partial<Workload>) => setWorkload((w) => ({ ...w, ...patch }));

  return (
    <div className="min-h-dvh">
      <header className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-coral/70 bg-surface px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-coral" aria-hidden>
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round">
                <path d="M3 18 L21 6" />
                <path d="M3 9 C9 9 13 13 21 14" />
                <circle cx="12.1" cy="11.9" r="2" fill="white" stroke="none" />
              </svg>
            </span>
            <div className="leading-tight">
              <p className="text-lg font-extrabold tracking-tight">Breakeven</p>
              <p className="kicker !text-[10px]">AI compute cost of ownership</p>
            </div>
          </div>
          <p className="hidden font-mono text-xs text-muted sm:block">
            <span className="text-coral-ink">✱</span> own · rent · api
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
        <div className="max-w-3xl">
          <p className="font-mono text-sm text-ink-2">
            <span className="text-coral-ink">&gt;</span> what does AI really cost at my volume?
            <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 animate-pulse bg-coral" aria-hidden />
          </p>
          <h1 className="mt-4 text-5xl font-extrabold leading-[0.98] tracking-[-0.035em] sm:text-7xl">
            Own, rent, <span className="text-coral">or API?</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-ink-2">
            Compare the three ways to run AI, see which is cheapest for you, and where that answer flips.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
          {/* Inputs */}
          <section aria-label="Your workload" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <p className="kicker">01 · Your workload</p>

            <div className="mt-4 grid grid-cols-3 gap-2" role="group" aria-label="Presets">
              {PRESETS.map((p) => {
                const active = workload.tokensM === p.tokensM;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setW({ tokensM: p.tokensM })}
                    className={`rounded-xl border px-3 py-2.5 text-left transition ${
                      active ? "border-panel bg-panel text-panel-ink" : "border-line bg-bg hover:border-coral"
                    }`}
                  >
                    <span className="block text-sm font-semibold leading-tight">{p.label}</span>
                    <span className={`mt-0.5 block font-mono text-xs ${active ? "text-panel-muted" : "text-muted"}`}>{formatTokensM(p.tokensM)}/mo</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <label htmlFor="volume" className="text-sm font-medium">
                  Tokens per month <span className="font-mono text-coral-ink">= {formatTokensM(workload.tokensM)}</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    aria-label="Tokens per month, in millions"
                    type="number"
                    min={VOLUME_MIN_M}
                    max={VOLUME_MAX_M}
                    value={workload.tokensM}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      if (Number.isFinite(v) && v > 0) setW({ tokensM: Math.min(VOLUME_MAX_M * 10, v) });
                    }}
                    className="w-28 rounded-lg border border-line bg-bg px-2 py-1 text-right font-mono text-sm"
                  />
                  <span className="font-mono text-sm text-muted">M</span>
                </div>
              </div>
              <input
                id="volume"
                type="range"
                min={0}
                max={SLIDER_STEPS}
                value={toSlider(Math.min(Math.max(workload.tokensM, VOLUME_MIN_M), VOLUME_MAX_M))}
                onChange={(e) => setW({ tokensM: fromSlider(Number(e.target.value)) })}
                aria-valuetext={`${formatTokensM(workload.tokensM)} tokens per month`}
                className="mt-3 w-full"
              />
              <div className="mt-1 flex justify-between font-mono text-[11px] text-muted">
                <span>10M</span>
                <span>1B</span>
                <span>100B</span>
              </div>
            </div>

            <PercentSlider
              id="output-share"
              label="Share that is output"
              hint="Answers cost more than prompts on most APIs."
              value={workload.outputShare}
              onChange={(v) => setW({ outputShare: v })}
              min={0.05}
              max={0.8}
            />
            <PercentSlider
              id="utilization"
              label="GPU utilization you can sustain"
              hint="Traffic peaks leave GPUs partly idle. Lower means more GPUs."
              value={workload.utilization}
              onChange={(v) => setW({ utilization: v })}
              min={0.2}
              max={0.9}
            />

            <details className="group mt-6 rounded-xl border border-line bg-bg">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
                <span className="kicker">02 · Assumptions</span>
                <span className="text-xs text-muted group-open:hidden">Edit prices, power, throughput ▾</span>
                <span className="hidden text-xs text-muted group-open:inline">Hide ▴</span>
              </summary>
              <div className="grid gap-3 border-t border-line px-4 py-4 sm:grid-cols-2">
                {ASSUMPTION_FIELDS.map((f) => (
                  <label key={f.key} className="block">
                    <span className="block text-xs font-medium text-ink-2">{f.label}</span>
                    <input
                      type="number"
                      step={f.step}
                      min={0}
                      value={assumptions[f.key]}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v >= 0) setAssumptions((a) => ({ ...a, [f.key]: v }));
                      }}
                      className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-sm"
                    />
                    <span className="mt-0.5 block font-mono text-[10px] text-muted">{f.unit}</span>
                  </label>
                ))}
                <div className="flex items-end sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setAssumptions(DEFAULT_ASSUMPTIONS)}
                    className="text-xs font-medium text-coral-ink underline underline-offset-2"
                  >
                    Reset to defaults
                  </button>
                </div>
              </div>
              <p className="border-t border-line px-4 py-3 text-[11px] leading-5 text-muted">
                Defaults (October 2026, illustrative): API at Claude Sonnet 5.5 list price ($2 / $10 per M tokens). Rent at
                about $2.50 per H100-hour on GPU-focused clouds (market average ≈ $3.60, hyperscalers ≈ $7). Hardware ≈ $35K
                per GPU, from 8-GPU H100 servers at $250–320K. 1.3 kW per GPU with its share of the server. Throughput is a
                conservative estimate for a 70B-class open-weight model with batching.
              </p>
            </details>
          </section>

          {/* Results */}
          <section aria-label="Results" aria-live="polite" className="grid gap-4">
            <div className="relative overflow-hidden rounded-2xl bg-panel p-5 text-panel-ink sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-panel-muted">
                  Cheapest at {formatTokensM(workload.tokensM)} tokens / month
                </p>
                <span key={`pill-${winner}`} className="animate-pop rounded-full bg-coral px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">
                  {OPTIONS[winner].short} wins
                </span>
              </div>
              <p key={winner} className="mt-3 flex animate-rise items-center gap-3 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
                <span className={`size-4 shrink-0 rounded-full ring-2 ring-panel-ink/30 ${OPTIONS[winner].swatch}`} aria-hidden />
                {OPTIONS[winner].name}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-panel-line pt-4 font-mono">
                <Stat label="Per month">
                  <Odometer text={formatUsd(costs[winner].monthly)} />
                </Stat>
                <Stat label="Per M tokens">
                  <Odometer text={formatUsd(costs[winner].perM, 2)} />
                </Stat>
                <Stat label="GPUs">{costs[winner].gpus === null ? "None" : <Odometer text={String(costs[winner].gpus)} />}</Stat>
              </div>
            </div>

            <ClosingBars costs={costs} winner={winner} meta={OPTIONS} />

            <div className="grid gap-3 sm:grid-cols-3">
              {(["api", "rent", "own"] as const).map((id) => {
                const c = costs[id];
                return (
                  <article key={id} className={`rounded-2xl border bg-surface p-4 ${id === winner ? "border-coral" : "border-line"}`}>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <span className={`size-2.5 rounded-full ${OPTIONS[id].swatch}`} aria-hidden />
                      {OPTIONS[id].name}
                    </p>
                    <dl className="mt-3 space-y-1 font-mono text-sm">
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted">Per M tokens</dt>
                        <dd>
                          <Odometer text={formatUsd(c.perM, 2)} />
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted">GPUs</dt>
                        <dd>{c.gpus === null ? "—" : <Odometer text={String(c.gpus)} />}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-xs leading-5 text-muted">{OPTIONS[id].note}</p>
                  </article>
                );
              })}
            </div>

            <div className="rounded-2xl border border-line bg-surface p-5">
              <p className="kicker">Where the answer flips</p>
              <p className="mt-2 text-sm leading-6 text-ink-2">{describeCrossovers(cross)}</p>
            </div>

            <p className="text-xs leading-5 text-muted">
              “Rent” and “Own” mean running an open-weight model of similar size yourself. Frontier models like Claude and
              GPT are only available through their APIs, so switching is also a quality decision, not only a cost one.
              Every number here is an editable assumption, not a quote.
            </p>
          </section>
        </div>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-2 border-t border-line px-4 py-6 font-mono text-[11px] uppercase tracking-[0.12em] text-muted sm:px-6">
        <span>
          Every number is an assumption <span className="text-coral-ink">·</span> edit any of them
        </span>
        <span>Breakeven · v1 · Angel Ade-Oduntan</span>
      </footer>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-panel-muted">{label}</p>
      <p className="mt-1.5 text-lg font-semibold sm:text-2xl">{children}</p>
    </div>
  );
}

function describeCrossovers(c: ReturnType<typeof crossovers>) {
  const parts: string[] = [];
  if (c.apiUntilM !== null) parts.push(`The API is cheapest below about ${formatTokensM(c.apiUntilM)} tokens a month.`);
  else parts.push("With these assumptions the API is never the cheapest option in the 10M–100B range.");
  if (c.ownFromM !== null) {
    parts.push(`From about ${formatTokensM(c.ownFromM)} a month up, owning your GPUs stays cheapest.`);
    if (c.flipFlops) parts.push("In between, renting and owning trade places as volume fills each 8-GPU server.");
    else if (c.apiUntilM !== null) parts.push("In between, renting wins.");
  } else {
    parts.push("Owning never becomes the cheapest option for good below 100B tokens a month.");
  }
  return parts.join(" ");
}

function PercentSlider({
  id,
  label,
  hint,
  value,
  onChange,
  min,
  max,
}: {
  id: string;
  label: string;
  hint: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <span className="font-mono text-sm text-coral-ink">{Math.round(value * 100)}%</span>
      </div>
      <input
        id={id}
        type="range"
        min={Math.round(min * 100)}
        max={Math.round(max * 100)}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="mt-3 w-full"
      />
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
