import { CheckCircle2, FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { DEPLOYMENTS, HORIZONS, buildPayload, defaultScenarioName, sendReport, validateForm, type ReportForm } from "@/lib/decisionReport";
import { CURRENTS, type Plan } from "@/lib/plan";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "done" } | { kind: "error"; message: string };

const FIELD = "mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 text-sm";

/** Four quick answers and a button that sends the plan to the n8n decision-report workflow. */
export function DecisionReport({ plan }: { plan: Plan }) {
  const [form, setForm] = useState<ReportForm>(() => ({
    scenarioName: defaultScenarioName(plan),
    currentDeployment: CURRENTS.find((c) => c.id === plan.current)?.label ?? "",
    growthPct: "",
    horizonYears: plan.assumptions.depreciationYears,
  }));
  const [errors, setErrors] = useState<ReturnType<typeof validateForm>>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const sending = status.kind === "sending";

  const update = <K extends keyof ReportForm>(key: K, value: ReportForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    if (status.kind !== "sending") setStatus({ kind: "idle" });
  };

  async function generate() {
    const found = validateForm(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setStatus({ kind: "sending" });
    try {
      await sendReport(buildPayload(plan, form));
      setStatus({ kind: "done" });
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : "Something went wrong. Try again in a moment." });
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-line bg-bg p-5 print:hidden" aria-labelledby="decision-report">
      <h2 id="decision-report" className="kicker">
        Decision report
      </h2>
      <p className="mt-2 text-sm text-ink-2">A few details for the report. Everything else comes from your plan above.</p>
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
          disabled={sending}
          aria-busy={sending}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-ink disabled:cursor-wait disabled:opacity-60"
        >
          {sending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <FileText className="size-4" aria-hidden />}
          {sending ? "Generating…" : "Generate Decision Report"}
        </button>
        <p role="status" aria-live="polite" className="text-sm">
          {status.kind === "done" && (
            <span className="inline-flex items-center gap-1.5 font-medium text-ink">
              <CheckCircle2 className="size-4 text-brand" aria-hidden /> Decision report generated successfully
            </span>
          )}
          {status.kind === "error" && <span className="text-red-700 dark:text-red-300">{status.message}</span>}
        </p>
      </div>
    </section>
  );
}
