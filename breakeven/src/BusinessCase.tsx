import { ArrowLeft, ArrowRight, Check, Link2, Printer, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { OPTIONS } from "./Calculator";
import { linkClick } from "@/components/Brand";
import { ClosingBars } from "@/components/ClosingBars";
import { Odometer } from "@/components/Odometer";
import { SiteFooter, SiteHeader } from "@/components/Site";
import { STEP_COUNT, caseQuery, readCase } from "@/lib/businessCaseShare";
import { ROI_TEMPLATES, roi, templateById, type RoiInputs, type RoiResult, type TemplateId } from "@/lib/roi";
import {
  CRITERIA,
  DEFAULT_SCORES,
  OPTION_IDS,
  SCORED,
  SCORE_REASONS,
  WEIGHT_PRESETS,
  advantages,
  scorecard,
  type CriterionId,
  type ScorecardResult,
  type Scores,
  type Weights,
} from "@/lib/scorecard";
import { estimateQuery } from "@/lib/share";
import { DEFAULT_ASSUMPTIONS, formatTokensM, formatUsd, sensitivity, type OptionId } from "@/lib/tco";

const NAV = [
  { href: "/calculator", label: "Calculator" },
  { href: "/methodology", label: "Methodology" },
];

const STEPS = [
  { label: "ROI", title: "Is AI worth it for this task?" },
  { label: "Scorecard", title: "Which way to run it fits your priorities?" },
  { label: "Cost", title: "What does the AI itself cost?" },
  { label: "Summary", title: "Your business case" },
];

const FIELDS: { key: keyof RoiInputs; label: string; unit: string; step: number; percent?: boolean }[] = [
  { key: "tasksPerMonth", label: "Tasks per month", unit: "tasks", step: 1000 },
  { key: "humanMinutes", label: "Time per task today", unit: "minutes, by a person", step: 1 },
  { key: "hourlyCost", label: "Loaded cost of an hour", unit: "$ / hour, with benefits", step: 5 },
  { key: "aiSuccess", label: "AI success rate", unit: "% solved without a redo", step: 5, percent: true },
  { key: "reviewMinutes", label: "Review per AI task", unit: "minutes to check it", step: 0.5 },
  { key: "tokensPerTask", label: "Tokens per task", unit: "prompt + answer", step: 1000 },
  { key: "outputShare", label: "Share that is output", unit: "% of tokens", step: 5, percent: true },
  { key: "setupCost", label: "Setup cost", unit: "$ one-time, to build and launch", step: 5000 },
];

const months = (m: number) => `${m < 10 ? m.toFixed(1) : Math.round(m).toLocaleString("en-US")} month${m === 1 ? "" : "s"}`;
const percent = (x: number) => `${Math.round(x * 100).toLocaleString("en-US")}%`;

export function BusinessCase() {
  const [initial] = useState(() => readCase(window.location.search));
  const [templateId, setTemplateId] = useState<TemplateId>(initial.templateId);
  const [inputs, setInputs] = useState<RoiInputs>(initial.inputs);
  const [weights, setWeights] = useState<Weights>(initial.weights);
  const [scores, setScores] = useState<Scores>(initial.scores);
  const [step, setStep] = useState(initial.step);

  const r = useMemo(() => roi(inputs), [inputs]);
  const card = useMemo(() => scorecard(r.costs, weights, scores), [r, weights, scores]);
  const recommended = card.winner ?? r.computeOption;

  // The address bar always holds the whole case, so copying it shares it.
  useEffect(() => {
    window.history.replaceState(null, "", `/business-case${caseQuery({ templateId, inputs, weights, scores, step })}`);
  }, [templateId, inputs, weights, scores, step]);

  const goTo = (n: number) => {
    setStep(n);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-dvh bg-bg">
      <div className="print:hidden">
        <SiteHeader nav={NAV} />
      </div>

      <main className="mx-auto max-w-[1200px] px-4 pb-20 pt-10 sm:px-6 print:p-0">
        <div className="print:hidden">
          <p className="kicker">Build a business case</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-balance sm:text-5xl">{STEPS[step - 1].title}</h1>

          <ol className="mt-7 grid grid-cols-4 gap-2" aria-label="Steps">
            {STEPS.map((s, i) => {
              const n = i + 1;
              const state = n === step ? "current" : n < step ? "done" : "todo";
              return (
                <li key={s.label}>
                  <button
                    type="button"
                    onClick={() => goTo(n)}
                    aria-current={state === "current" ? "step" : undefined}
                    className={`flex w-full flex-col gap-2 border-t-4 pt-2.5 text-left transition sm:flex-row sm:items-center ${
                      state === "todo" ? "border-line text-muted hover:border-brand/50" : "border-brand text-ink"
                    }`}
                  >
                    <span
                      className={`grid size-7 shrink-0 place-items-center rounded-full font-mono text-xs font-semibold ${
                        state === "current" ? "bg-brand text-white" : state === "done" ? "bg-brand-soft text-brand-ink" : "bg-sunken text-muted"
                      }`}
                    >
                      {state === "done" ? <Check className="size-3.5" aria-hidden /> : n}
                    </span>
                    <span className="text-xs font-semibold sm:text-sm">{s.label}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mt-8 print:mt-0">
          {step === 1 && (
            <RoiStep
              templateId={templateId}
              inputs={inputs}
              r={r}
              onTemplate={(id) => {
                setTemplateId(id);
                setInputs(templateById(id).inputs);
              }}
              onInput={(patch) => setInputs((i) => ({ ...i, ...patch }))}
            />
          )}
          {step === 2 && (
            <ScorecardStep
              r={r}
              card={card}
              weights={weights}
              scores={scores}
              onWeights={setWeights}
              onScore={(c, o, v) => setScores((s) => ({ ...s, [c]: { ...s[c], [o]: v } }))}
              onResetScores={() => setScores(DEFAULT_SCORES)}
            />
          )}
          {step === 3 && <CostStep r={r} recommended={recommended} />}
          {step === 4 && <SummaryStep templateId={templateId} inputs={inputs} r={r} card={card} weights={weights} recommended={recommended} />}
        </div>

        <div className="mt-10 flex items-center justify-between gap-3 border-t border-line pt-6 print:hidden">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 font-semibold transition hover:border-brand"
            >
              <ArrowLeft className="size-4" aria-hidden /> {STEPS[step - 2].label}
            </button>
          ) : (
            <span />
          )}
          {step < STEP_COUNT && (
            <button
              type="button"
              onClick={() => goTo(step + 1)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-white transition hover:bg-brand-ink"
            >
              Next: {STEPS[step].label} <ArrowRight className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </main>

      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}

/* ---------- Step 1: ROI ---------- */

function RoiStep({
  templateId,
  inputs,
  r,
  onTemplate,
  onInput,
}: {
  templateId: TemplateId;
  inputs: RoiInputs;
  r: RoiResult;
  onTemplate: (id: TemplateId) => void;
  onInput: (patch: Partial<RoiInputs>) => void;
}) {
  const template = templateById(templateId);
  const edited = FIELDS.some((f) => inputs[f.key] !== template.inputs[f.key]);
  const pays = r.savings > 0;

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold">Start from a template</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="group" aria-label="Templates">
          {ROI_TEMPLATES.map((t) => {
            const active = t.id === templateId;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={active}
                onClick={() => onTemplate(t.id)}
                className={`rounded-2xl border p-4 text-left transition ${active ? "border-brand bg-brand text-white" : "border-line bg-surface hover:border-brand"}`}
              >
                <span className="block font-semibold">{t.label}</span>
                <span className={`mt-1 block text-sm leading-6 ${active ? "text-white/85" : "text-ink-2"}`}>{t.blurb}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <section aria-label="Inputs" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="kicker">Your numbers</p>
            {edited ? (
              <button type="button" onClick={() => onTemplate(templateId)} className="text-xs font-medium text-brand-ink underline underline-offset-2">
                Reset to template
              </button>
            ) : (
              <span className="text-xs text-muted">Illustrative template values. Replace them with yours.</span>
            )}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <NumberField
                key={f.key}
                label={f.label}
                unit={f.unit}
                step={f.step}
                value={f.percent ? Math.round(inputs[f.key] * 1000) / 10 : inputs[f.key]}
                max={f.percent ? 100 : undefined}
                onChange={(v) => onInput({ [f.key]: f.percent ? Math.min(100, v) / 100 : v })}
              />
            ))}
          </div>
        </section>

        <section aria-label="Return on investment" aria-live="polite" className="grid gap-4">
          <div className={`rounded-2xl p-5 sm:p-7 ${pays ? "bg-[#2a1458] text-white" : "border border-line bg-surface"}`}>
            {pays ? (
              <>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/75">Monthly savings with AI</p>
                <p className="mt-2 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
                  <Odometer text={formatUsd(r.savings)} />
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
                  <PanelStat label="Payback">{months(r.paybackMonths!)}</PanelStat>
                  <PanelStat label="12-month ROI">{r.roi12 === null ? "n/a" : percent(r.roi12)}</PanelStat>
                  <PanelStat label="AI tokens / mo">{formatTokensM(r.tokensM)}</PanelStat>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <TriangleAlert className="mt-1 size-5 shrink-0 text-brand-ink" aria-hidden />
                <div>
                  <p className="text-2xl font-extrabold tracking-tight">AI doesn't pay off at these numbers</p>
                  <p className="mt-2 text-ink-2">
                    It would cost {formatUsd(-r.savings)} a month more than doing the work by hand. A higher success rate or a shorter
                    review usually changes that.
                  </p>
                </div>
              </div>
            )}
          </div>

          <CostCompare r={r} />
        </section>
      </div>
    </div>
  );
}

/** People cost today against people + compute with AI, as two bars on one scale. */
function CostCompare({ r }: { r: RoiResult }) {
  const max = Math.max(r.humanCost, r.aiCost) || 1;
  const parts = [
    { label: "People redoing what AI missed", value: r.escalationCost, opacity: 1 },
    { label: "People reviewing AI work", value: r.reviewCost, opacity: 0.6 },
    { label: `AI compute (${OPTIONS[r.computeOption].short})`, value: r.computeCost, opacity: 0.32 },
  ];
  const computeShare = r.aiCost > 0 ? r.computeCost / r.aiCost : 0;
  return (
    <figure className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">Monthly cost of the work</span>
        <span className="kicker">Today vs with AI</span>
      </figcaption>
      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="text-ink-2">Today, all by people</span>
            <span className="font-mono">
              <Odometer text={formatUsd(r.humanCost)} />
            </span>
          </div>
          <div className="h-6 rounded-r-[4px] bg-sunken">
            <div className="glide h-full rounded-r-[4px] bg-ink-2" style={{ width: `${(r.humanCost / max) * 100}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="text-ink-2">With AI</span>
            <span className="font-mono font-semibold">
              <Odometer text={formatUsd(r.aiCost)} />
            </span>
          </div>
          <div
            className="flex h-6 overflow-hidden rounded-r-[4px] bg-sunken"
            role="img"
            aria-label={parts.map((p) => `${p.label} ${formatUsd(p.value)}`).join(", ")}
          >
            {parts.map((p) =>
              p.value > 0 ? (
                <div
                  key={p.label}
                  className="glide border-r-2 border-surface last:border-r-0"
                  style={{ width: `${(p.value / max) * 100}%`, backgroundColor: "var(--brand)", opacity: p.opacity }}
                />
              ) : null,
            )}
          </div>
          <ul className="mt-2 grid gap-1 text-xs text-ink-2 sm:grid-cols-3">
            {parts.map((p) => (
              <li key={p.label} className="flex items-start gap-1.5">
                <span className="mt-0.5 size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: "var(--brand)", opacity: p.opacity }} aria-hidden />
                <span>
                  {p.label} <span className="font-mono">{formatUsd(p.value)}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="mt-4 border-t border-line pt-3 text-sm leading-6 text-ink-2">
        {computeShare < 0.1
          ? `Compute is only ${percent(computeShare)} of the cost with AI: the success rate and review time matter far more than how you run the model.`
          : `Compute is ${percent(computeShare)} of the cost with AI, so how you run the model matters. Step 3 compares the options.`}
      </p>
    </figure>
  );
}

/* ---------- Step 2: Scorecard ---------- */

function ScorecardStep({
  r,
  card,
  weights,
  scores,
  onWeights,
  onScore,
  onResetScores,
}: {
  r: RoiResult;
  card: ScorecardResult;
  weights: Weights;
  scores: Scores;
  onWeights: (w: Weights) => void;
  onScore: (c: Exclude<CriterionId, "cost">, o: OptionId, v: number) => void;
  onResetScores: () => void;
}) {
  const activePreset = WEIGHT_PRESETS.find((p) => CRITERIA.every((c) => p.weights[c.id] === weights[c.id]))?.id;
  const winner = card.winner;
  const cheapestId = r.computeOption;
  const scoresEdited = SCORED.some((c) => OPTION_IDS.some((o) => scores[c][o] !== DEFAULT_SCORES[c][o]));

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
      <section aria-label="Your priorities" className="rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-24">
        <p className="kicker">Your priorities</p>
        <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Priority presets">
          {WEIGHT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={activePreset === p.id}
              onClick={() => onWeights(p.weights)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                activePreset === p.id ? "border-brand bg-brand text-white" : "border-line bg-bg hover:border-brand"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-5">
          {CRITERIA.map((c) => (
            <div key={c.id}>
              <div className="flex items-end justify-between gap-3">
                <label htmlFor={`weight-${c.id}`} className="text-sm font-medium">
                  {c.label}
                </label>
                <span className="font-mono text-sm text-brand-ink">{weights[c.id] === 0 ? "Ignore" : `${weights[c.id]} / 5`}</span>
              </div>
              <input
                id={`weight-${c.id}`}
                type="range"
                min={0}
                max={5}
                value={weights[c.id]}
                onChange={(e) => onWeights({ ...weights, [c.id]: Number(e.target.value) })}
                aria-valuetext={weights[c.id] === 0 ? "Ignored" : `${weights[c.id]} out of 5`}
                className="mt-2 w-full"
              />
              <p className="mt-0.5 text-xs text-muted">{c.question}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-label="Scorecard" aria-live="polite" className={`grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4 ${winner ? `theme-${winner}` : ""}`}>
        {winner ? (
          <div className="win-panel rounded-2xl p-5 text-white sm:p-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/75">Best fit for your priorities</p>
            <p key={winner} className="mt-3 flex animate-rise items-center gap-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
              <span className={`size-4 shrink-0 rounded-full ring-2 ring-white/80 ${OPTIONS[winner].swatch}`} aria-hidden />
              {OPTIONS[winner].name}
            </p>
            <div className="mt-5 grid gap-3 border-t border-white/20 pt-4">
              {OPTION_IDS.map((id) => (
                <div key={id} className="grid grid-cols-[4rem_minmax(0,1fr)_3rem] items-center gap-3 text-sm">
                  <span className="text-white/85">{OPTIONS[id].short}</span>
                  <div className="h-3 rounded-r-[4px] bg-white/15">
                    <div className={`glide h-full rounded-r-[4px] ${OPTIONS[id].swatch} ring-1 ring-white/40`} style={{ width: `${card.totals[id]}%` }} />
                  </div>
                  <span className="text-right font-mono font-semibold">
                    <Odometer text={String(Math.round(card.totals[id]))} />
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-3 font-mono text-[11px] text-white/70">Weighted score out of 100</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="text-xl font-bold">Give at least one priority a weight.</p>
            <p className="mt-1 text-ink-2">With every weight at zero there is nothing to compare.</p>
          </div>
        )}

        {winner && winner !== cheapestId && (
          <Callout>
            {OPTIONS[cheapestId].name} is cheapest at {formatUsd(r.costs[cheapestId].monthly)} a month, but {OPTIONS[winner].name} fits
            your priorities better on {joinLabels(advantages(card, weights, winner, cheapestId).map((a) => a.label.toLowerCase()))}. It costs{" "}
            {formatUsd(r.costs[winner].monthly - r.costs[cheapestId].monthly)} a month more.
          </Callout>
        )}

        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="kicker">Scores, 1 to 5</p>
              <p className="mt-1 text-sm text-ink-2">Disagree with a score? Change it. Cost is worked out from step 3.</p>
            </div>
            {scoresEdited && (
              <button type="button" onClick={onResetScores} className="text-xs font-medium text-brand-ink underline underline-offset-2">
                Reset scores
              </button>
            )}
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
                  <th className="py-2 pr-3 font-medium">Criterion</th>
                  <th className="py-2 pr-3 font-medium">Weight</th>
                  {OPTION_IDS.map((id) => (
                    <th key={id} className="py-2 pr-3 font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className={`size-2 rounded-full ${OPTIONS[id].swatch}`} aria-hidden />
                        {OPTIONS[id].short}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CRITERIA.map((c) => (
                  <tr key={c.id} className={`border-b border-line/70 align-top ${weights[c.id] === 0 ? "opacity-50" : ""}`}>
                    <td className="py-3 pr-3 font-semibold">{c.label}</td>
                    <td className="py-3 pr-3 font-mono text-ink-2">{weights[c.id]}</td>
                    {OPTION_IDS.map((id) => (
                      <td key={id} className="py-3 pr-3">
                        {c.id === "cost" ? (
                          <>
                            <span className="font-mono font-semibold">{card.scores.cost[id].toFixed(1)}</span>
                            <span className="mt-1 block text-xs leading-5 text-muted">{formatUsd(r.costs[id].monthly)} / month</span>
                          </>
                        ) : (
                          <>
                            <select
                              aria-label={`${c.label} score for ${OPTIONS[id].name}`}
                              value={scores[c.id][id]}
                              onChange={(e) => onScore(c.id as Exclude<CriterionId, "cost">, id, Number(e.target.value))}
                              className="rounded-lg border border-line bg-bg px-2 py-1 font-mono text-sm"
                            >
                              {[1, 2, 3, 4, 5].map((v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ))}
                            </select>
                            <span className="mt-1 block text-xs leading-5 text-muted">{SCORE_REASONS[c.id][id]}</span>
                          </>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- Step 3: Cost ---------- */

function CostStep({ r, recommended }: { r: RoiResult; recommended: OptionId }) {
  const winner = r.computeOption;
  const c = r.costs[winner];
  const calcLink = `/calculator${estimateQuery(r.workload, DEFAULT_ASSUMPTIONS)}`;
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
      <section aria-label="Compute cost" className={`theme-${winner} grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4`}>
        <div className="win-panel rounded-2xl p-5 text-white sm:p-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/75">
            Cheapest at {formatTokensM(r.tokensM)} tokens / month
          </p>
          <p className="mt-3 flex items-center gap-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            <span className={`size-4 shrink-0 rounded-full ring-2 ring-white/80 ${OPTIONS[winner].swatch}`} aria-hidden />
            {OPTIONS[winner].name}
          </p>
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
            <PanelStat label="Per month">{formatUsd(c.monthly)}</PanelStat>
            <PanelStat label="Per M tokens">{formatUsd(c.perM, 2)}</PanelStat>
            <PanelStat label="GPUs">{c.gpus === null ? "None" : c.gpus}</PanelStat>
          </div>
        </div>
        <ClosingBars costs={r.costs} winner={winner} meta={OPTIONS} />
      </section>

      <aside className="grid gap-4">
        {recommended !== winner && (
          <Callout>
            Your scorecard picked {OPTIONS[recommended].name}, at {formatUsd(r.costs[recommended].monthly)} a month. The summary
            weighs that against the {formatUsd(r.costs[recommended].monthly - c.monthly)} a month it costs over the cheapest option.
          </Callout>
        )}
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <p className="kicker">Where these numbers come from</p>
          <p className="mt-2 text-sm leading-6 text-ink-2">
            Step 1's {formatTokensM(r.tokensM)} tokens a month ({percent(r.workload.outputShare)} output), priced with Breakeven's default
            assumptions: API list prices, typical GPU rental rates, and the full cost of owning servers.
          </p>
          <a
            href={calcLink}
            onClick={linkClick(calcLink)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-line bg-bg px-4 py-2.5 text-sm font-semibold transition hover:border-brand"
          >
            Open in the full calculator <ArrowRight className="size-4" aria-hidden />
          </a>
          <p className="mt-2 text-xs text-muted">Change prices, power and hardware there; this case keeps the defaults.</p>
        </div>
      </aside>
    </div>
  );
}

/* ---------- Step 4: Summary ---------- */

function SummaryStep({
  templateId,
  inputs,
  r,
  card,
  weights,
  recommended,
}: {
  templateId: TemplateId;
  inputs: RoiInputs;
  r: RoiResult;
  card: ScorecardResult;
  weights: Weights;
  recommended: OptionId;
}) {
  const [copied, setCopied] = useState(false);
  const template = templateById(templateId);
  const cheapestId = r.computeOption;
  const pays = r.savings > 0;
  const risks = useMemo(() => caseRisks(inputs, r), [inputs, r]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy this link to your business case:", window.location.href);
    }
  }

  const fieldText = (f: (typeof FIELDS)[number]) =>
    f.percent
      ? percent(inputs[f.key])
      : f.key === "hourlyCost" || f.key === "setupCost"
        ? formatUsd(inputs[f.key])
        : `${inputs[f.key].toLocaleString("en-US")}${f.key === "humanMinutes" || f.key === "reviewMinutes" ? " min" : ""}`;

  return (
    <article className="mx-auto max-w-4xl rounded-3xl border border-line bg-surface p-6 sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="kicker">Business case · Breakeven</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">AI for {template.label.toLowerCase()}</h2>
          <p className="mt-1 text-sm text-muted">
            Prepared {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · Illustrative estimate, USD
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-ink"
          >
            {copied ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
            {copied ? "Link copied" : "Copy link"}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-sm font-semibold transition hover:border-brand"
          >
            <Printer className="size-4" aria-hidden /> Print or save PDF
          </button>
          <span className="sr-only" aria-live="polite">
            {copied ? "Link to this business case copied" : ""}
          </span>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4 mt-6">
        <SummaryStat label="Savings / month" value={pays ? formatUsd(r.savings) : `−${formatUsd(-r.savings)}`} />
        <SummaryStat label="Payback" value={r.paybackMonths === null ? "None" : months(r.paybackMonths)} />
        <SummaryStat label="12-month ROI" value={r.roi12 === null ? "n/a" : percent(r.roi12)} />
        <SummaryStat label="Setup" value={formatUsd(inputs.setupCost)} />
      </dl>

      <section className="mt-8">
        <h3 className="kicker">The case</h3>
        <p className="mt-2 text-lg leading-8">
          Today {inputs.tasksPerMonth.toLocaleString("en-US")} tasks a month cost {formatUsd(r.humanCost)} in people's time. With AI solving{" "}
          {percent(inputs.aiSuccess)} of them and people reviewing its work and handling the rest, the same work costs {formatUsd(r.aiCost)}
          , including {formatUsd(r.computeCost)} of compute.{" "}
          {pays
            ? `That saves ${formatUsd(r.savings)} a month and pays back the ${formatUsd(inputs.setupCost)} setup in ${months(r.paybackMonths!)}.`
            : `That costs ${formatUsd(-r.savings)} a month more than today, so the case doesn't hold at these numbers.`}
        </p>
      </section>

      <section className={`theme-${recommended} mt-8`}>
        <h3 className="kicker">Recommendation</h3>
        <div className="win-border mt-3 rounded-2xl border-2 p-5">
          <p className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight">
            <span className={`size-3.5 shrink-0 rounded-full ${OPTIONS[recommended].swatch}`} aria-hidden />
            {OPTIONS[recommended].name}
          </p>
          <p className="mt-2 leading-7 text-ink-2">
            {card.winner
              ? `Scores ${Math.round(card.totals[recommended])} out of 100 on your priorities`
              : "The cheapest option (no priorities were weighted)"}{" "}
            and costs {formatUsd(r.costs[recommended].monthly)} a month in compute at {formatTokensM(r.tokensM)} tokens.
            {recommended !== cheapestId &&
              ` ${OPTIONS[cheapestId].name} would be ${formatUsd(r.costs[recommended].monthly - r.costs[cheapestId].monthly)} a month cheaper, but scores lower on ${joinLabels(
                advantages(card, weights, recommended, cheapestId).map((a) => a.label.toLowerCase()),
              )}.`}
          </p>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-muted">
            {OPTION_IDS.map((id) => (
              <li key={id}>
                {OPTIONS[id].short} {Math.round(card.totals[id])}/100 · {formatUsd(r.costs[id].monthly)}/mo
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <section>
          <h3 className="kicker">Risks to check</h3>
          <ul className="mt-3 space-y-3">
            {risks.map((risk) => (
              <li key={risk} className="flex gap-3 text-[15px] leading-7 text-ink-2">
                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {risk}
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="kicker">Inputs</h3>
          <dl className="mt-3 divide-y divide-line border-y border-line text-sm">
            {FIELDS.map((f) => (
              <div key={f.key} className="flex justify-between gap-4 py-2">
                <dt className="text-ink-2">{f.label}</dt>
                <dd className="font-mono">{fieldText(f)}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <p className="mt-8 border-t border-line pt-4 text-xs leading-5 text-muted">
        Compute is priced with Breakeven's default assumptions (October 2026). Template figures are illustrative starting points, not
        benchmarks. Excludes taxes, egress and change-management costs.
      </p>
    </article>
  );
}

/** What could make this case wrong, most important first. */
function caseRisks(inputs: RoiInputs, r: RoiResult) {
  const out: string[] = [];
  if (r.savings <= 0) out.push("At these numbers AI costs more than it saves. Raise the success rate or shorten reviews before investing.");
  else if (r.paybackMonths! > 12) out.push(`Payback takes ${months(r.paybackMonths!)}, longer than a typical one-year budget cycle.`);
  if (inputs.aiSuccess < 0.5) {
    out.push(`The AI solves only ${percent(inputs.aiSuccess)} of tasks, and the savings move with that rate. Measure it in a pilot first.`);
  }
  if (r.savings > 0) {
    // How far the success rate can fall before the savings are gone.
    const perTaskGain = (inputs.humanMinutes - inputs.reviewMinutes) * (inputs.hourlyCost / 60) * inputs.tasksPerMonth;
    const breakEven = perTaskGain > 0 ? inputs.aiSuccess - r.savings / perTaskGain : null;
    if (breakEven !== null && breakEven >= 0.05) out.push(`The savings disappear if the success rate falls below about ${percent(breakEven)}.`);
    else if (breakEven !== null) out.push(`Each task the AI solves saves ${inputs.humanMinutes - inputs.reviewMinutes} of ${inputs.humanMinutes} minutes, so the case holds even at a low success rate.`);
  }
  const flips = sensitivity(r.workload, DEFAULT_ASSUMPTIONS).filter((s) => s.flips);
  for (const f of flips.slice(0, 2)) {
    const lower = f.low.winner !== r.computeOption;
    const to = lower ? f.low.winner : f.high.winner;
    out.push(`If ${f.label.toLowerCase()} is 25% ${lower ? "lower" : "higher"} than assumed, ${OPTIONS[to].name} becomes the cheapest way to run it.`);
  }
  if (flips.length === 0) out.push("No single price or hardware assumption moving 25% changes the cheapest way to run it at this volume.");
  out.push("Template figures are illustrative. Replace them with your own volumes, handling times and pay rates.");
  return out;
}

/* ---------- Shared bits ---------- */

function NumberField({
  label,
  unit,
  step,
  value,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  step: number;
  value: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(v) && v >= 0) onChange(v);
        }}
        className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 font-mono text-sm"
      />
      <span className="mt-0.5 block font-mono text-[11px] text-muted">{unit}</span>
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

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-semibold sm:text-xl">{value}</dd>
    </div>
  );
}

function Callout({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-line bg-brand-soft p-4 text-sm leading-6 text-ink sm:p-5">{children}</p>;
}

function joinLabels(labels: string[]) {
  if (labels.length === 0) return "your other priorities";
  return labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}
