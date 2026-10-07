import { TriangleAlert } from "lucide-react";
import { linkClick } from "@/components/Brand";
import { Odometer } from "@/components/Odometer";
import { OPTIONS } from "@/components/options";
import { PlanFrame, StepHeading, usePlan } from "@/components/PlanFrame";
import { NumberField, PanelStat, months, percent } from "@/components/ui";
import { applyTemplate, planRoi, roiInputsOf, startPlan, stepHref, updateRoi } from "@/lib/plan";
import { ROI_TEMPLATES, templateById, type RoiInputs, type RoiResult, type TemplateId } from "@/lib/roi";
import { formatTokensM, formatUsd } from "@/lib/tco";

/** Step 1: is AI worth it for this work? People cost today vs people + AI compute, from an editable template. */
export function WorthIt() {
  const [plan, setPlan] = usePlan("worth-it", startPlan);
  const skip = stepHref("run-it", plan);
  return (
    <PlanFrame
      route="worth-it"
      plan={plan}
      footerNote={
        <a href={skip} onClick={linkClick(skip)} className="text-sm font-medium text-brand-ink underline underline-offset-2">
          Already sure AI is worth it? Skip to step 2
        </a>
      }
    >
      <StepHeading route="worth-it">
        Compare what the work costs your people today with what it costs once AI does most of it. The AI volume here carries into
        step 2.
      </StepHeading>
      <RoiStep
        templateId={plan.templateId!}
        inputs={roiInputsOf(plan)}
        r={planRoi(plan)}
        onTemplate={(id) => setPlan((p) => applyTemplate(p, id))}
        onInput={(patch) => setPlan((p) => updateRoi(p, patch))}
      />
    </PlanFrame>
  );
}

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
          : `Compute is ${percent(computeShare)} of the cost with AI, so how you run the model matters. Step 2 compares the options.`}
      </p>
    </figure>
  );
}
