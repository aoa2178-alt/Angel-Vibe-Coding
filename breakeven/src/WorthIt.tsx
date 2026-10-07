import { TriangleAlert } from "lucide-react";
import { linkClick } from "@/components/Brand";
import { Odometer } from "@/components/Odometer";
import { OPTIONS } from "@/components/options";
import { PlanFrame, StepHeading, usePlan } from "@/components/PlanFrame";
import { NumberField, PanelStat, months, percent } from "@/components/ui";
import { PRODUCT_TEMPLATE, type FreemiumResult, type ProductInputs } from "@/lib/freemium";
import type { Mode } from "@/lib/opsShare";
import { applyTemplate, planFreemium, planRoi, roiInputsOf, setMode, startPlan, stepHref, updateProduct, updateRoi } from "@/lib/plan";
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
        {plan.mode === "product"
          ? "For an AI product you sell: what free and paying users cost in compute, and how many need to pay. The volume here carries into step 2."
          : "Compare what the work costs your people today with what it costs once AI does most of it. The AI volume here carries into step 2."}
      </StepHeading>
      <ModeSwitch mode={plan.mode} onMode={(m) => setPlan((p) => setMode(p, m))} />
      {plan.mode === "product" ? (
        <FreemiumStep
          inputs={plan.product}
          f={planFreemium(plan)}
          onInput={(patch) => setPlan((p) => updateProduct(p, patch))}
          onReset={() => setPlan((p) => updateProduct(p, PRODUCT_TEMPLATE))}
        />
      ) : (
        <RoiStep
          templateId={plan.templateId!}
          inputs={roiInputsOf(plan)}
          r={planRoi(plan)}
          onTemplate={(id) => setPlan((p) => applyTemplate(p, id))}
          onInput={(patch) => setPlan((p) => updateRoi(p, patch))}
        />
      )}
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
          <OperatingModel inputs={inputs} r={r} />
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

/** Work the company does today, or an AI product it sells. */
function ModeSwitch({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  const options: { id: Mode; label: string }[] = [
    { id: "work", label: "Work we do today" },
    { id: "product", label: "A product we sell" },
  ];
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <p className="text-sm font-semibold">What is the AI for?</p>
      <div className="inline-flex rounded-full border border-line bg-surface p-1" role="group" aria-label="What is the AI for?">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={mode === o.id}
            onClick={() => mode !== o.id && onMode(o.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${mode === o.id ? "bg-brand text-white" : "text-ink-2 hover:text-ink"}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** People and "token capital": who does the work once AI is in, and where the money goes. */
function OperatingModel({ inputs, r }: { inputs: RoiInputs; r: RoiResult }) {
  const hoursToday = (inputs.tasksPerMonth * inputs.humanMinutes) / 60;
  const hoursWithAi = (r.escalatedTasks * inputs.humanMinutes + inputs.tasksPerMonth * inputs.aiSuccess * inputs.reviewMinutes) / 60;
  const freed = hoursToday - hoursWithAi;
  const people = r.escalationCost + r.reviewCost;
  const n = (x: number) => Math.round(x).toLocaleString("en-US");
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <p className="kicker">Operating model · people and token capital</p>
      <p className="mt-2 text-sm leading-6 text-ink-2">
        AI completes {percent(inputs.aiSuccess)} of tasks. People's time on this work falls from {n(hoursToday)} to {n(hoursWithAi)} hours a month
        {freed > 0 ? (
          <>
            : about <span className="font-semibold text-ink">{(freed / 160).toFixed(1)} full-time people</span> freed for other work (at 160 hours a month).
          </>
        ) : (
          "."
        )}{" "}
        The budget shifts from {formatUsd(r.humanCost)} all on people to {formatUsd(people)} on people and{" "}
        <span className="font-semibold text-ink">{formatUsd(r.computeCost)} on tokens</span>.
      </p>
    </div>
  );
}

const PRODUCT_FIELDS: { key: keyof ProductInputs; label: string; unit: string; step: number; percent?: boolean }[] = [
  { key: "users", label: "Monthly users", unit: "people using it in a month", step: 1000 },
  { key: "paidShare", label: "Share who pay", unit: "% of users (freemium is often 2–5%)", step: 0.5, percent: true },
  { key: "price", label: "Price", unit: "$ per paying user per month", step: 1 },
  { key: "freeTokens", label: "Tokens per free user", unit: "a month, capped by the free tier", step: 10_000 },
  { key: "paidTokens", label: "Tokens per paying user", unit: "a month", step: 100_000 },
];

const share = (x: number) => `${(x * 100).toFixed(x < 0.01 ? 2 : 1)}%`;

/** Step 1 for a product: compute per free and paying user, the margin, and the break-even paid share. */
function FreemiumStep({
  inputs,
  f,
  onInput,
  onReset,
}: {
  inputs: ProductInputs;
  f: FreemiumResult;
  onInput: (p: Partial<ProductInputs>) => void;
  onReset: () => void;
}) {
  const edited = PRODUCT_FIELDS.some((x) => inputs[x.key] !== PRODUCT_TEMPLATE[x.key]);
  const pays = f.margin > 0;
  const cents = (x: number) => (x < 1 ? `${(x * 100).toFixed(x < 0.1 ? 2 : 1)}¢` : formatUsd(x, 2));
  const max = Math.max(f.revenue, f.compute) || 1;
  const bars = [
    { label: `Revenue from ${Math.round(f.paidUsers).toLocaleString("en-US")} paying users`, value: f.revenue, color: "var(--brand)" },
    { label: `Compute for all ${inputs.users.toLocaleString("en-US")} users`, value: f.compute, color: "var(--ink-2)" },
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
      <section aria-label="Product inputs" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="kicker">Your product · freemium</p>
          {edited ? (
            <button type="button" onClick={onReset} className="text-xs font-medium text-brand-ink underline underline-offset-2">
              Reset to template
            </button>
          ) : (
            <span className="text-xs text-muted">Illustrative: an AI writing app. Replace with yours.</span>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PRODUCT_FIELDS.map((x) => (
            <NumberField
              key={x.key}
              label={x.label}
              unit={x.unit}
              step={x.step}
              value={x.percent ? Math.round(inputs[x.key] * 1000) / 10 : inputs[x.key]}
              max={x.percent ? 100 : undefined}
              onChange={(v) => {
                const val = x.percent ? Math.min(100, v) / 100 : v;
                if ((x.key !== "users" && x.key !== "paidShare") || val > 0) onInput({ [x.key]: val });
              }}
            />
          ))}
        </div>
      </section>

      <section aria-label="Product economics" aria-live="polite" className="grid gap-4">
        <div className={`rounded-2xl p-5 sm:p-7 ${pays ? "bg-[#2a1458] text-white" : "border border-line bg-surface"}`}>
          <p className={`font-mono text-[11px] uppercase tracking-[0.12em] ${pays ? "text-white/75" : "text-muted"}`}>Margin after compute, per month</p>
          <p className="mt-2 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            <Odometer text={pays ? formatUsd(f.margin) : `−${formatUsd(-f.margin)}`} />
          </p>
          <div className={`mt-5 grid grid-cols-3 gap-3 border-t pt-4 ${pays ? "border-white/20" : "border-line"}`}>
            <PanelStat label="Gross margin">{f.marginPct === null ? "n/a" : percent(f.marginPct)}</PanelStat>
            <PanelStat label="Break-even paid">{f.breakEvenShare === null ? "never" : share(f.breakEvenShare)}</PanelStat>
            <PanelStat label="AI tokens / mo">{formatTokensM(f.tokensM)}</PanelStat>
          </div>
        </div>

        <figure className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <figcaption className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">Revenue vs compute, per month</span>
            <span className="kicker">{OPTIONS[f.computeOption].short} is cheapest</span>
          </figcaption>
          <div className="mt-4 space-y-4">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="mb-1.5 flex justify-between gap-3 text-sm">
                  <span className="text-ink-2">{b.label}</span>
                  <span className="font-mono">
                    <Odometer text={formatUsd(b.value)} />
                  </span>
                </div>
                <div className="h-6 rounded-r-[4px] bg-sunken">
                  <div className="glide h-full rounded-r-[4px]" style={{ width: `${(b.value / max) * 100}%`, background: b.color }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-line pt-3 text-sm leading-6 text-ink-2">
            A free user costs {cents(f.costPerFree)} a month in compute and a paying user {cents(f.costPerPaid)}.{" "}
            {f.freePerPaid !== null && `Each paying user carries ${f.freePerPaid < 10 ? f.freePerPaid.toFixed(1) : Math.round(f.freePerPaid)} free users. `}
            {f.breakEvenShare === null
              ? "A paying user doesn't cover their own compute at this price, so no paid share breaks even."
              : `Revenue covers everyone's compute once ${share(f.breakEvenShare)} of users pay, at today's cost per token.`}
          </p>
        </figure>
      </section>
    </div>
  );
}
