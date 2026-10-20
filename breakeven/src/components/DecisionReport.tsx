import { CheckCircle2, FileText, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { HORIZONS, defaultScenarioName, reportHref, validateForm, type ReportForm } from "@/lib/decisionReport";
import type { Current, Plan } from "@/lib/plan";

type Status = { kind: "idle" } | { kind: "done" };

const FIELD = "mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm";

/** The report's wording for how the company runs AI today, from the answer in the recommendation box. */
const DEPLOYMENT_LABEL: Record<Current, string> = {
  none: "Not using AI yet",
  api: "Pay-per-token API",
  rent: "Rented cloud GPUs",
  own: "Own GPUs",
  mix: "A mix",
};

/**
 * One button that opens the detailed decision report in a new tab. How the company runs AI today comes from the
 * recommendation box above; the name, growth and horizon have defaults and can be changed under "Customize the report".
 */
export function DecisionReport({ plan }: { plan: Plan }) {
  const [form, setForm] = useState<Omit<ReportForm, "currentDeployment">>(() => ({
    scenarioName: defaultScenarioName(plan),
    growthPct: "30",
    horizonYears: plan.assumptions.depreciationYears,
  }));
  const [errors, setErrors] = useState<ReturnType<typeof validateForm>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const custom = useRef<HTMLDetailsElement>(null);

  const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setStatus({ kind: "idle" });
  };

  function generate() {
    const full: ReportForm = { ...form, currentDeployment: plan.current ? DEPLOYMENT_LABEL[plan.current] : "" };
    const found = validateForm(full);
    setErrors(found);
    if (found.currentDeployment) {
      // Asked once, in the recommendation box: take the person there.
      const pick = document.getElementById("now");
      pick?.scrollIntoView({ block: "center" });
      pick?.focus();
      return;
    }
    if (Object.keys(found).length) {
      if (custom.current) custom.current.open = true;
      return;
    }
    window.open(reportHref(plan, full), "_blank", "noopener");
    setStatus({ kind: "done" });
  }

  return (
    <section className="mt-8 rounded-2xl border border-line bg-bg p-5 print:hidden" aria-labelledby="decision-report">
      <h2 id="decision-report" className="kicker">
        Decision report
      </h2>
      <p className="mt-2 text-sm text-ink-2">A one-page dashboard of this recommendation, ready to print or save as PDF. It opens in a new tab.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={generate}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-ink"
        >
          <FileText className="size-4" aria-hidden />
          Generate Decision Report
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {status.kind === "done" && (
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <CheckCircle2 className="size-4 text-brand" aria-hidden /> Your report is opening in a new tab
            </span>
          )}
          {errors.currentDeployment && <span className="text-red-700 dark:text-red-300">First pick how you run AI today, in the recommendation above.</span>}
        </p>
      </div>

      <details ref={custom} className="group mt-4 rounded-xl border border-line bg-surface">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="text-sm font-semibold text-ink">Customize the report</span>{" "}
            <span className="text-xs text-muted">name, expected growth, decision horizon (optional)</span>
          </span>
          <Plus className="size-5 shrink-0 text-ink transition-transform group-open:rotate-45" aria-hidden />
        </summary>
        <div className="grid gap-4 border-t border-line px-4 py-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="block text-sm font-medium">Scenario name</span>
            <input type="text" value={form.scenarioName} maxLength={120} onChange={(e) => update("scenarioName", e.target.value)} className={FIELD} aria-invalid={!!errors.scenarioName} />
            {errors.scenarioName && <span className="mt-1 block text-xs text-red-700 dark:text-red-300">{errors.scenarioName}</span>}
          </label>
          <label className="block">
            <span className="block text-sm font-medium">Expected yearly growth in volume</span>
            <input type="number" inputMode="decimal" step={5} value={form.growthPct} onChange={(e) => update("growthPct", e.target.value)} className={`${FIELD} font-mono`} aria-invalid={!!errors.growthPct} />
            <span className="mt-0.5 block font-mono text-[11px] text-muted">% a year</span>
            {errors.growthPct && <span className="mt-1 block text-xs text-red-700 dark:text-red-300">{errors.growthPct}</span>}
          </label>
          <label className="block">
            <span className="block text-sm font-medium">Decision horizon</span>
            <select value={form.horizonYears} onChange={(e) => update("horizonYears", Number(e.target.value))} className={FIELD}>
              {HORIZONS.map((y) => (
                <option key={y} value={y}>
                  {y} year{y === 1 ? "" : "s"}
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>
    </section>
  );
}
