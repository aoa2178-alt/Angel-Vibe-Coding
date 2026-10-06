import { Check, Download, Link2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ClosingBars, type OptionMeta } from "@/components/ClosingBars";
import { CostChart } from "@/components/CostChart";
import { Odometer } from "@/components/Odometer";
import { estimateCsv, estimateQuery, readEstimate } from "@/lib/share";
import {
  DEFAULT_ASSUMPTIONS,
  PRESETS,
  VOLUME_MAX_M,
  VOLUME_MIN_M,
  breakdown,
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

// Read once on load: a shared link opens the estimate it was made from.
const initial = typeof window === "undefined" ? readEstimate("") : readEstimate(window.location.search);

export default function App() {
  const [workload, setWorkload] = useState<Workload>(initial.workload);
  const [assumptions, setAssumptions] = useState<Assumptions>(initial.assumptions);
  const [copied, setCopied] = useState(false);

  const costs = useMemo(() => compare(workload, assumptions), [workload, assumptions]);
  const winner = cheapest(costs);
  const cross = useMemo(() => crossovers(workload, assumptions), [workload, assumptions]);
  const setW = (patch: Partial<Workload>) => setWorkload((w) => ({ ...w, ...patch }));

  // Keep the address bar in sync, so the current estimate is always a shareable link.
  useEffect(() => {
    const url = `${window.location.pathname}${estimateQuery(workload, assumptions)}`;
    window.history.replaceState(null, "", url);
  }, [workload, assumptions]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link to your estimate:", window.location.href);
    }
  }

  function exportCsv() {
    const blob = new Blob([estimateCsv(workload, assumptions, costs, winner, cross)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `breakeven-estimate-${formatTokensM(workload.tokensM)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1360px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand" aria-hidden>
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
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden rounded-full border border-line bg-brand-soft px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-ink md:inline">
              Illustrative estimate · USD
            </span>
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-2 text-xs font-semibold text-ink-2 transition hover:border-brand hover:text-ink"
              aria-label="Export CSV"
            >
              <Download className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-2.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-ink"
              aria-label="Save estimate: copy a link to it"
            >
              {copied ? <Check className="size-3.5" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />}
              <span className="hidden sm:inline">{copied ? "Link copied" : "Save estimate"}</span>
            </button>
            <span className="sr-only" aria-live="polite">
              {copied ? "Link to this estimate copied" : ""}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1360px] px-4 pb-16 pt-7 sm:px-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
          <div>
            <p className="font-mono text-sm text-ink-2">
              <span className="text-brand-ink">&gt;</span> what does AI really cost at my volume?
            </p>
            <h1 className="mt-2 text-4xl font-extrabold leading-none tracking-[-0.035em] sm:text-5xl">
              Own, rent, <span className="text-brand">or API?</span>
            </h1>
          </div>
          <p className="max-w-md text-base text-ink-2 lg:text-right">
            Compare the three ways to run AI, see which is cheapest for you, and where that answer flips.
          </p>
        </div>

        <div className="mt-7 grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start">
          {/* Inputs: stay in view on wide screens while the results scroll beside them */}
          <section aria-label="Your workload" className="rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-6">
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
                      active ? "border-brand bg-brand text-white" : "border-line bg-bg hover:border-brand"
                    }`}
                  >
                    <span className="block text-sm font-semibold leading-tight">{p.label}</span>
                    <span className={`mt-0.5 block font-mono text-xs ${active ? "text-white/80" : "text-muted"}`}>{formatTokensM(p.tokensM)}/mo</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <div className="flex items-end justify-between gap-3">
                <label htmlFor="volume" className="text-sm font-medium">
                  Tokens per month <span className="font-mono text-brand-ink">= {formatTokensM(workload.tokensM)}</span>
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
                    className="text-xs font-medium text-brand-ink underline underline-offset-2"
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
          <section aria-label="Results" aria-live="polite" className={`theme-${winner} grid min-w-0 gap-4`}>
            <div className="win-panel relative overflow-hidden rounded-2xl p-5 text-white sm:p-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/75">
                  Cheapest at {formatTokensM(workload.tokensM)} tokens / month
                </p>
                <span key={`pill-${winner}`} className="animate-pop rounded-full border border-white/40 bg-white/15 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">
                  {OPTIONS[winner].short} wins
                </span>
              </div>
              <p key={winner} className="mt-3 flex animate-rise items-center gap-3 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
                <span className={`size-4 shrink-0 rounded-full ring-2 ring-white/80 ${OPTIONS[winner].swatch}`} aria-hidden />
                {OPTIONS[winner].name}
              </p>
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/20 pt-4 font-mono">
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

            <CostChart workload={workload} assumptions={assumptions} cross={cross} meta={OPTIONS} />

            <div className="grid items-start gap-4 xl:grid-cols-2">
              <div className="flex gap-3 rounded-2xl border border-line bg-surface p-4 sm:p-5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand text-white" aria-hidden>
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <p className="kicker">Where the answer flips</p>
                  <p className="mt-1 text-sm leading-6 text-ink">{describeCrossovers(cross)}</p>
                </div>
              </div>
              <Calculations workload={workload} assumptions={assumptions} costs={costs} />
            </div>

            <p className="text-xs leading-5 text-muted">
              “Rent” and “Own” mean running an open-weight model of similar size yourself. Frontier models like Claude and
              GPT are only available through their APIs, so switching is also a quality decision, not only a cost one.
              Every number here is an editable assumption, not a quote.
            </p>
          </section>
        </div>
      </main>

      <footer className="mx-auto flex max-w-[1360px] flex-wrap justify-between gap-2 border-t border-line px-4 py-6 font-mono text-[11px] uppercase tracking-[0.12em] text-muted sm:px-6">
        <span>
          Illustrative estimate <span className="text-brand-ink">·</span> excludes taxes, egress and setup costs
        </span>
        <span>Breakeven · v1 · Angel Ade-Oduntan</span>
      </footer>
    </div>
  );
}

/** The math behind the three numbers, written out with the current inputs. */
function Calculations({ workload, assumptions, costs }: { workload: Workload; assumptions: Assumptions; costs: ReturnType<typeof compare> }) {
  const b = breakdown(workload, assumptions);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const n = (x: number, d = 0) => x.toLocaleString("en-US", { maximumFractionDigits: d });
  const gpus = (g: number | null) => `${g} GPU${g === 1 ? "" : "s"}`;
  const lines: { label: string; text: string }[] = [
    {
      label: "Blended API price",
      text: `${pct(1 - workload.outputShare)} input × ${formatUsd(assumptions.apiInputPerM, 2)} + ${pct(workload.outputShare)} output × ${formatUsd(assumptions.apiOutputPerM, 2)} = ${formatUsd(b.blendedPerM, 2)} per M tokens`,
    },
    { label: "API", text: `${n(workload.tokensM)}M tokens × ${formatUsd(b.blendedPerM, 2)} = ${formatUsd(costs.api.monthly)} / month` },
    {
      label: "GPUs needed",
      text: `${n(b.avgTokensPerSec)} tokens/sec on average ÷ (${n(assumptions.gpuTokensPerSec)} tokens/sec × ${pct(workload.utilization)} utilization) = ${n(b.gpusExact, 2)} → ${gpus(costs.rent.gpus)}`,
    },
    { label: "Rent", text: `${gpus(costs.rent.gpus)} × 730 hours × ${formatUsd(assumptions.rentPerGpuHour, 2)} = ${formatUsd(costs.rent.monthly)} / month` },
    {
      label: "Own",
      text: `${gpus(costs.own.gpus)} (whole ${n(assumptions.gpusPerServer)}-GPU servers) × (${formatUsd(b.ownDepreciation)} hardware + ${formatUsd(b.ownPower)} power + ${formatUsd(b.ownOps)} upkeep) = ${formatUsd(costs.own.monthly)} / month`,
    },
    { label: "Per M tokens", text: "monthly cost ÷ monthly volume in millions of tokens" },
  ];
  return (
    <details className="group rounded-2xl border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4">
        <span className="kicker">Show calculations</span>
        <span className="text-xs text-muted group-open:hidden">See the math with your numbers ▾</span>
        <span className="hidden text-xs text-muted group-open:inline">Hide ▴</span>
      </summary>
      <dl className="grid gap-2.5 border-t border-line px-5 py-4 text-sm">
        {lines.map((l) => (
          <div key={l.label} className="grid gap-0.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
            <dt className="font-semibold text-ink">{l.label}</dt>
            <dd className="font-mono text-[13px] leading-6 text-ink-2">{l.text}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.12em] text-white/75">{label}</p>
      <p className="mt-1.5 text-lg font-semibold sm:text-2xl">{children}</p>
    </div>
  );
}

function describeCrossovers(c: ReturnType<typeof crossovers>) {
  if (c.apiUntilM !== null && c.ownFromM !== null && Math.abs(Math.log10(c.ownFromM / c.apiUntilM)) < 0.02) {
    return `The API is cheapest below about ${formatTokensM(c.apiUntilM)} tokens a month. Above that, owning your GPUs is cheapest; with these assumptions renting never wins.`;
  }
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
        <span className="font-mono text-sm text-brand-ink">{Math.round(value * 100)}%</span>
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
