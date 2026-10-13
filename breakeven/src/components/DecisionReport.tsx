import { CheckCircle2, FileText } from "lucide-react";
import { useState } from "react";
import { DEPLOYMENTS, HORIZONS, defaultScenarioName, reportHref, validateForm, type ReportForm } from "@/lib/decisionReport";
import { CURRENTS, type Plan } from "@/lib/plan";

type Status = { kind: "idle" } | { kind: "done" };

const FIELD = "mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm";

/** Four quick answers and a button that opens the detailed decision report in a new tab. */
export function DecisionReport({ plan }: { plan: Plan }) {
  const [form, setForm] = useState<ReportForm>(() => ({
    scenarioName: defaultScenarioName(plan),
    currentDeployment: CURRENTS.find((c) => c.id === plan.current)?.label ?? "",
    growthPct: "",
    horizonYears: plan.assumptions.depreciationYears,
  }));
  const [errors, setErrors] = useState<ReturnType<typeof validateForm>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const update = <K extends keyof ReportForm>(key: K, value: ReportForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setStatus({ kind: "idle" });
  };

  function generate() {
    const found = validateForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    window.open(reportHref(plan, form), "_blank", "noopener");
    setStatus({ kind: "done" });
  }

  return (
    <section className="mt-8 rounded-2xl border border-line bg-bg p-5 print:hidden" aria-labelledby="decision-report">
      <h2 id="decision-report" className="kicker">
        Decision report
      </h2>
      <p className="mt-2 text-sm text-ink-2">A few details for the report. Everything else comes from your plan above. The report opens in a new tab, ready to print or save as PDF.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="block text-sm font-medium">Scenario name</span>
          <input type="text" value={form.scenarioName} maxLength={120} onChange={(e) => update("scenarioName", e.target.value)} className={FIELD} aria-invalid={!!errors.scenarioName} />
          {errors.scenarioName && <span className="mt-1 block text-xs text-red-700 dark:text-red-300">{errors.scenarioName}</span>}
        </label>
        <label className="block">
          <span className="block text-sm font-medium">How you run AI today</span>
          <select value={form.currentDeployment} onChange={(e) => update("currentDeployment", e.target.value)} className={FIELD} aria-invalid={!!errors.currentDeployment}>
            <option value="" disabled>
              Choose one
            </option>
            {DEPLOYMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {errors.currentDeployment && <span className="mt-1 block text-xs text-red-700 dark:text-red-300">{errors.currentDeployment}</span>}
        </label>
        <label className="block">
          <span className="block text-sm font-medium">Expected yearly growth in volume</span>
          <input type="number" inputMode="decimal" step={5} value={form.growthPct} placeholder="30" onChange={(e) => update("growthPct", e.target.value)} className={`${FIELD} font-mono`} aria-invalid={!!errors.growthPct} />
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
      <div className="mt-5 flex flex-wrap items-center gap-3">
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
        </p>
      </div>
    </section>
  );
}
