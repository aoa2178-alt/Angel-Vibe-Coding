import { useMemo, useState } from "react";
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

const OPTIONS: Record<OptionId, { name: string; short: string; swatch: string; note: string }> = {
  api: { name: "Pay per token (API)", short: "API", swatch: "bg-api", note: "No hardware. You pay for every token." },
  rent: { name: "Rent cloud GPUs", short: "Rent", swatch: "bg-rent", note: "Pay by the GPU-hour, whether busy or idle." },
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

const ASSUMPTION_FIELDS: { key: keyof Assumptions; label: string; unit: string; step: number; group: string }[] = [
  { key: "apiInputPerM", label: "API price, input", unit: "$ / M tokens", step: 0.1, group: "API" },
  { key: "apiOutputPerM", label: "API price, output", unit: "$ / M tokens", step: 0.5, group: "API" },
  { key: "rentPerGpuHour", label: "Cloud GPU rental", unit: "$ / GPU-hour", step: 0.1, group: "Rent" },
  { key: "gpuTokensPerSec", label: "GPU throughput", unit: "tokens / sec / GPU", step: 100, group: "Rent & own" },
  { key: "hardwarePerGpu", label: "Hardware cost", unit: "$ per GPU, all-in", step: 1000, group: "Own" },
  { key: "depreciationYears", label: "Depreciation", unit: "years", step: 1, group: "Own" },
  { key: "kwPerGpu", label: "Power draw", unit: "kW per GPU", step: 0.1, group: "Own" },
  { key: "pue", label: "Data center PUE", unit: "facility ÷ IT power", step: 0.05, group: "Own" },
  { key: "electricityPerKwh", label: "Electricity", unit: "$ / kWh", step: 0.01, group: "Own" },
  { key: "opsPerGpuMonth", label: "Space, staff & upkeep", unit: "$ / GPU / month", step: 50, group: "Own" },
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
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6">
          <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden>
            <rect width="32" height="32" rx="7" className="fill-ink" />
            <path d="M6 22 L13 15 L18 19 L26 9" fill="none" className="stroke-own" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="leading-tight">
            <p className="font-semibold tracking-tight">Breakeven</p>
            <p className="text-xs text-muted">AI compute cost of ownership</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="max-w-3xl">
          <h1 className="font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl">Own, rent, or API?</h1>
          <p className="mt-3 text-lg text-ink-2">
            What it really costs to run AI at your volume, and where the cheapest option changes.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
          {/* Inputs */}
          <section aria-label="Your workload" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted">Your workload</h2>

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
                      active ? "border-ink bg-ink text-accent-ink" : "border-line bg-bg hover:border-ink-2"
                    }`}
                  >
                    <span className="block text-sm font-semibold leading-tight">{p.label}</span>
                    <span className={`mt-0.5 block font-mono text-xs ${active ? "opacity-80" : "text-muted"}`}>{formatTokensM(p.tokensM)}/mo</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <label htmlFor="volume" className="text-sm font-medium">
                  Tokens per month <span className="font-mono text-muted">= {formatTokensM(workload.tokensM)}</span>
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
                  <span className="text-sm text-muted">M</span>
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
              hint="Traffic peaks mean GPUs sit partly idle. Lower means more GPUs."
              value={workload.utilization}
              onChange={(v) => setW({ utilization: v })}
              min={0.2}
              max={0.9}
            />

            <details className="group mt-6 rounded-xl border border-line bg-bg">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-medium">
                Assumptions
                <span className="text-xs text-muted group-open:hidden">Edit prices, power and throughput ▾</span>
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
                    <span className="mt-0.5 block text-[11px] text-muted">{f.unit}</span>
                  </label>
                ))}
                <div className="flex items-end sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setAssumptions(DEFAULT_ASSUMPTIONS)}
                    className="text-xs font-medium text-ink-2 underline underline-offset-2 hover:text-ink"
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
            <div className="rounded-2xl border border-ink bg-ink p-5 text-accent-ink sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
                Cheapest for you at {formatTokensM(workload.tokensM)} tokens/month
              </p>
              <p className="mt-2 flex items-center gap-3 font-serif text-4xl leading-tight sm:text-5xl">
                <span className={`size-4 shrink-0 rounded-full ${OPTIONS[winner].swatch}`} aria-hidden />
                {OPTIONS[winner].name}
              </p>
              <p className="mt-2 text-sm opacity-80">
                {formatUsd(costs[winner].monthly)} a month · {formatUsd(costs[winner].perM, 2)} per million tokens
                {costs[winner].gpus !== null && ` · ${costs[winner].gpus} GPU${costs[winner].gpus === 1 ? "" : "s"}`}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {(["api", "rent", "own"] as const).map((id) => {
                const c = costs[id];
                const ratio = c.monthly / costs[winner].monthly;
                return (
                  <article
                    key={id}
                    className={`rounded-2xl border bg-surface p-4 ${id === winner ? "border-ink ring-1 ring-ink" : "border-line"}`}
                  >
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <span className={`size-2.5 rounded-full ${OPTIONS[id].swatch}`} aria-hidden />
                      {OPTIONS[id].name}
                    </p>
                    <p className="mt-3 font-mono text-2xl font-semibold tracking-tight">{formatUsd(c.monthly)}</p>
                    <p className="text-xs text-muted">per month</p>
                    <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted">Per M tokens</dt>
                        <dd className="font-mono">{formatUsd(c.perM, 2)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted">GPUs</dt>
                        <dd className="font-mono">{c.gpus ?? "—"}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-xs text-muted">
                      {id === winner ? "Cheapest" : `${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}× the cheapest`} · {OPTIONS[id].note}
                    </p>
                  </article>
                );
              })}
            </div>

            <CostBars costs={costs} winner={winner} />

            <div className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="text-sm font-semibold">Where the answer changes</h3>
              <p className="mt-1.5 text-sm leading-6 text-ink-2">{describeCrossovers(cross)}</p>
            </div>

            <p className="text-xs leading-5 text-muted">
              “Rent” and “Own” mean running an open-weight model of similar size yourself. Frontier models like Claude and
              GPT are only available through their APIs, so switching is also a quality decision, not only a cost one.
              Every number here is an editable assumption, not a quote.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted sm:px-6">
          Breakeven · first version · built by Angel Ade-Oduntan
        </div>
      </footer>
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
        <span className="font-mono text-sm">{Math.round(value * 100)}%</span>
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

/** Monthly cost per option as horizontal bars, directly labeled, with a hover/focus tooltip. */
function CostBars({ costs, winner }: { costs: ReturnType<typeof compare>; winner: OptionId }) {
  const [hover, setHover] = useState<OptionId | null>(null);
  const max = Math.max(...(["api", "rent", "own"] as const).map((id) => costs[id].monthly));
  return (
    <figure className="rounded-2xl border border-line bg-surface p-5">
      <figcaption className="text-sm font-semibold">Monthly cost</figcaption>
      <div className="mt-4 space-y-3">
        {(["api", "rent", "own"] as const).map((id) => {
          const c = costs[id];
          const pct = max > 0 ? Math.max(1.5, (c.monthly / max) * 100) : 0;
          return (
            <div
              key={id}
              tabIndex={0}
              onMouseEnter={() => setHover(id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(id)}
              onBlur={() => setHover(null)}
              className="relative grid grid-cols-[4.5rem_1fr] items-center gap-3 rounded-md py-1 outline-offset-4"
              aria-label={`${OPTIONS[id].name}: ${formatUsd(c.monthly)} a month, ${formatUsd(c.perM, 2)} per million tokens`}
            >
              <span className="text-sm text-ink-2">{OPTIONS[id].short}</span>
              <div className="flex items-center gap-2">
                <div className="h-5 flex-1">
                  <div
                    className={`h-full rounded-r-[4px] transition-[width] duration-300 ${OPTIONS[id].swatch} ${hover && hover !== id ? "opacity-40" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className={`w-24 text-right font-mono text-sm ${id === winner ? "font-semibold text-ink" : "text-ink-2"}`}>
                  {formatUsd(c.monthly)}
                </span>
              </div>
              {hover === id && (
                <div role="tooltip" className="absolute -top-9 left-20 z-10 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs shadow-lg">
                  <span className="font-semibold">{OPTIONS[id].name}</span> · {formatUsd(c.perM, 2)} per M tokens
                  {c.gpus !== null && ` · ${c.gpus} GPU${c.gpus === 1 ? "" : "s"}`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </figure>
  );
}
