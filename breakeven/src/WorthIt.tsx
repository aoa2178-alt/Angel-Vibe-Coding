import { TriangleAlert } from "lucide-react";
import { linkClick } from "@/components/Brand";
import { Fold } from "@/components/Fold";
import { Necessity } from "@/components/Necessity";
import { Odometer } from "@/components/Odometer";
import { OPTIONS } from "@/components/options";
import { Explain } from "@/components/Explain";
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
  const narration = (() => {
    if (plan.mode === "product") {
      const f = planFreemium(plan);
      return `Your AI product brings in ${formatUsd(f.revenue)} a month and spends ${formatUsd(f.compute)} on AI compute${f.marginPct === null ? "." : `, a ${Math.round(f.marginPct * 100)}% margin after compute.`}`;
    }
    const r = planRoi(plan);
    const label = plan.templateId ? templateById(plan.templateId).label.toLowerCase() : "this work";
    return r.savings > 0
      ? `For ${label}, people alone cost ${formatUsd(r.humanCost)} a month. With AI, including the tasks people still redo, their review time and the compute, it costs ${formatUsd(r.aiCost)}. That saves ${formatUsd(r.savings)} a month${r.paybackMonths === null ? "." : `, and the setup cost pays back in ${months(r.paybackMonths)}.`}`
      : `For ${label}, AI does not pay off at these numbers: with AI the work costs ${formatUsd(r.aiCost)} a month against ${formatUsd(r.humanCost)} with people alone.`;
  })();
  return (
    <PlanFrame
      route="worth-it"
      plan={plan}
      footerNote={
        <a href={skip} onClick={linkClick(skip)} className="text-sm font-medium text-brand-ink underline underline-offset-2">
          Business case already approved? Go to the cost comparison
        </a>
      }
    >
      <StepHeading route="worth-it" narration={narration}>
        {plan.mode === "product"
          ? "Unit economics of an AI product: compute cost per free and paid user, gross margin and break-even conversion. The token volume carries into the cost comparison."
          : "Current labour cost against the AI-enabled cost of the same work: net savings, payback and 12-month ROI. The token volume carries into the cost comparison."}
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
        <>
        <RoiStep
          templateId={plan.templateId!}
          inputs={roiInputsOf(plan)}
          r={planRoi(plan)}
          onTemplate={(id) => setPlan((p) => applyTemplate(p, id))}
          onInput={(patch) => setPlan((p) => updateRoi(p, patch))}
        />
        <Necessity plan={plan} setPlan={setPlan} />
        </>
      )}
    </PlanFrame>
  );
}

const FIELDS: { key: keyof RoiInputs; label: string; unit: string; step: number; percent?: boolean }[] = [
  { key: "tasksPerMonth", label: "Monthly task volume", unit: "tasks", step: 1000 },
  { key: "humanMinutes", label: "Handling time per task", unit: "minutes per task, manual", step: 1 },
  { key: "hourlyCost", label: "Fully loaded hourly cost", unit: "$ per hour, incl. benefits and overhead", step: 5 },
  { key: "aiSuccess", label: "AI resolution rate", unit: "% of tasks resolved without rework", step: 5, percent: true },
  { key: "reviewMinutes", label: "Review time per resolved task", unit: "minutes of human QA per task", step: 0.5 },
  { key: "tokensPerTask", label: "Tokens per task", unit: "input + output tokens", step: 1000 },
  { key: "outputShare", label: "Output token share", unit: "% of tokens", step: 5, percent: true },
  { key: "setupCost", label: "One-time implementation cost", unit: "$ one-time, build and launch", step: 5000 },
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
      <div className="max-w-md">
        <label htmlFor="roi-template" className="text-sm font-semibold">
          Start from a template
        </label>
        <select
          id="roi-template"
          value={templateId}
          onChange={(e) => onTemplate(e.target.value as TemplateId)}
          className="mt-2 w-full rounded-[5px] border border-line bg-surface px-3 py-2.5 text-[15px] text-ink focus:border-brand"
        >
          {ROI_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-sm text-muted">{template.blurb}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <section aria-label="Inputs" className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="kicker">Inputs</p>
            {edited ? (
              <button type="button" onClick={() => onTemplate(templateId)} className="text-xs font-medium text-brand-ink underline underline-offset-2">
                Reset to template
              </button>
            ) : (
              <span className="text-xs text-muted">Illustrative template values; replace with company data.</span>
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
          <div className={`rounded-2xl p-5 sm:p-7 ${pays ? "bg-[#182536] text-white" : "border border-line bg-surface"}`}>
            {pays ? (
              <>
                <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-white/75">
                  Net monthly savings
                  <Explain id="savings" onDark />
                </p>
                <p className="mt-2 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
                  <Odometer text={formatUsd(r.savings)} />
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/20 pt-4">
                  <PanelStat label="Payback" term="payback">{months(r.paybackMonths!)}</PanelStat>
                  <PanelStat label="12-month ROI" term="roi">{r.roi12 === null ? "n/a" : percent(r.roi12)}</PanelStat>
                  <PanelStat label="Token volume / mo">{formatTokensM(r.tokensM)}</PanelStat>
                </div>
              </>
            ) : (
              <div className="flex gap-3">
                <TriangleAlert className="mt-1 size-5 shrink-0 text-brand-ink" aria-hidden />
                <div>
                  <p className="text-2xl font-extrabold tracking-tight">No positive business case at these inputs</p>
                  <p className="mt-2 text-ink-2">
                    It would cost {formatUsd(-r.savings)} a month more than doing the work by hand. A higher success rate or a shorter
                    review usually changes that.
                  </p>
                </div>
              </div>
            )}
          </div>

          <CostCompare r={r} />
          <Fold id="operating-model" title="Operating model" sub="Capacity released, FTE equivalent, and spend on tokens versus labour">
            <OperatingModel inputs={inputs} r={r} />
          </Fold>
        </section>
      </div>
    </div>
  );
}

/** People cost today against people + compute with AI, as two bars on one scale. */
function CostCompare({ r }: { r: RoiResult }) {
  const max = Math.max(r.humanCost, r.aiCost) || 1;
  const parts = [
    { label: "Escalations handled by staff", value: r.escalationCost, opacity: 1 },
    { label: "Human review of AI output", value: r.reviewCost, opacity: 0.6 },
    { label: `AI compute (${OPTIONS[r.computeOption].short})`, value: r.computeCost, opacity: 0.32 },
  ];
  const computeShare = r.aiCost > 0 ? r.computeCost / r.aiCost : 0;
  return (
    <figure className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">Monthly operating cost</span>
        <span className="kicker">Current state vs AI-enabled</span>
      </figcaption>
      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="text-ink-2">Current state (fully manual)</span>
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
            <span className="text-ink-2">AI-enabled</span>
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
          ? `Compute is ${percent(computeShare)} of the AI-enabled cost: resolution rate and review time drive the economics far more than the deployment model.`
          : `Compute is ${percent(computeShare)} of the AI-enabled cost, so the deployment model is material. The cost comparison evaluates the options.`}
      </p>
    </figure>
  );
}

/** Work the company does today, or an AI product it sells. */
function ModeSwitch({ mode, onMode }: { mode: Mode; onMode: (m: Mode) => void }) {
  const options: { id: Mode; label: string }[] = [
    { id: "work", label: "Internal workflow" },
    { id: "product", label: "Customer-facing product" },
  ];
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <p className="text-sm font-semibold">Use case</p>
      <div className="inline-flex rounded-full border border-line bg-surface p-1" role="group" aria-label="Use case">
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
      <p className="kicker">Operating model · labour and token spend</p>
      <p className="mt-2 text-sm leading-6 text-ink-2">
        AI completes {percent(inputs.aiSuccess)} of tasks. People's time on this work falls from {n(hoursToday)} to {n(hoursWithAi)} hours a month
        {freed > 0 ? (
          <>
            : about <span className="font-semibold text-ink">{(freed / 160).toFixed(1)} FTEs</span> freed for other work (at 160 hours a month).
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
  { key: "users", label: "Monthly active users", unit: "users per month", step: 1000 },
  { key: "paidShare", label: "Paid conversion rate", unit: "% of users (freemium benchmarks: 2–5%)", step: 0.5, percent: true },
  { key: "price", label: "Price per paid user", unit: "$ per paid user per month", step: 1 },
  { key: "freeTokens", label: "Tokens per free user", unit: "per month, capped by the free tier", step: 10_000 },
  { key: "paidTokens", label: "Tokens per paying user", unit: "per month", step: 100_000 },
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
          <p className="kicker">Product inputs · freemium</p>
          {edited ? (
            <button type="button" onClick={onReset} className="text-xs font-medium text-brand-ink underline underline-offset-2">
              Reset to template
            </button>
          ) : (
            <span className="text-xs text-muted">Illustrative: an AI writing app. Replace with company data.</span>
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
        <div className={`rounded-2xl p-5 sm:p-7 ${pays ? "bg-[#182536] text-white" : "border border-line bg-surface"}`}>
          <p className={`font-mono text-[11px] uppercase tracking-[0.12em] ${pays ? "text-white/75" : "text-muted"}`}>Gross margin after compute / month</p>
          <p className="mt-2 text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            <Odometer text={pays ? formatUsd(f.margin) : `−${formatUsd(-f.margin)}`} />
          </p>
          <div className={`mt-5 grid grid-cols-3 gap-3 border-t pt-4 ${pays ? "border-white/20" : "border-line"}`}>
            <PanelStat label="Gross margin">{f.marginPct === null ? "n/a" : percent(f.marginPct)}</PanelStat>
            <PanelStat label="Break-even conversion">{f.breakEvenShare === null ? "never" : share(f.breakEvenShare)}</PanelStat>
            <PanelStat label="Token volume / mo">{formatTokensM(f.tokensM)}</PanelStat>
          </div>
        </div>

        <figure className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <figcaption className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">Revenue vs compute cost / month</span>
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
              ? "At this price a paid user does not cover their own compute cost, so no conversion rate breaks even."
              : `Revenue covers everyone's compute once ${share(f.breakEvenShare)} of users pay, at today's cost per token.`}
          </p>
        </figure>
      </section>
    </div>
  );
}
