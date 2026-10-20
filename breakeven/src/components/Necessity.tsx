import { Plus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { linkClick } from "./Brand";
import { DecisionMap } from "./DecisionMap";
import { Fold } from "./Fold";
import { NumberField, months } from "./ui";
import { CASES, HORIZON_MONTHS, VERDICT_LABELS, type Alternatives, type NecessityResult } from "@/lib/necessity";
import { planNecessity, planQuery, type Plan } from "@/lib/plan";
import { formatMoney } from "@/lib/speedToPower";
import { formatUsd } from "@/lib/tco";

const CASE_LABELS = { conservative: "Conservative", base: "Base", optimistic: "Optimistic" } as const;

/** Inputs of the necessity test; shares are entered as percentages. */
const FIELDS: { key: keyof Alternatives; label: string; unit: string; step: number; percent?: boolean }[] = [
  { key: "redesignPct", label: "Redesign: handling time removed", unit: "% of handling time, no new technology", step: 5, percent: true },
  { key: "redesignCost", label: "Redesign: one-time cost", unit: "$ one-time, process work and training", step: 5_000 },
  { key: "rulesCoverage", label: "Rules automation: coverage", unit: "% of tasks handled with no person", step: 5, percent: true },
  { key: "rulesBuild", label: "Rules automation: build cost", unit: "$ one-time", step: 5_000 },
  { key: "rulesMaintenance", label: "Rules automation: maintenance", unit: "$ per month", step: 100 },
  { key: "cashShare", label: "Cash share of freed hours", unit: "% that becomes savings (hiring avoided, attrition)", step: 5, percent: true },
];

/** "Is AI the right tool?": AI against the cheaper alternatives, three cases, one decision. */
export function Necessity({ plan, setPlan }: { plan: Plan; setPlan: Dispatch<SetStateAction<Plan>> }) {
  const r: NecessityResult = planNecessity(plan);
  const ai = r.options.find((o) => o.id === "ai")!;
  const best = r.instead ?? "ai";
  const fte = ai.cases.base.capacityHours / 160;
  const faq = `/faq${planQuery(plan)}#necessity`;
  const setAlt = (patch: Partial<Alternatives>) => setPlan((p) => ({ ...p, alt: { ...p.alt, ...patch } }));

  return (
    <section aria-label="AI necessity test" className="mt-6 grid gap-4">
      <div className="rounded-[7px] border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="kicker">AI necessity test</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Is AI the right tool?</h2>
          </div>
          <span className="rounded-[5px] bg-brand px-3 py-1.5 text-sm font-semibold text-white">{VERDICT_LABELS[r.verdict]}</span>
        </div>
        <p className="mt-4 rounded-[7px] bg-brand-soft px-4 py-3 text-[15px] leading-7 text-ink-2">
          <span className="font-semibold text-brand-ink">{VERDICT_LABELS[r.verdict]}:</span> {r.reason}{" "}
          {HORIZON_MONTHS / 12}-year value:{" "}
          {r.options
            .filter((o) => o.available && o.id !== "none")
            .map((o) => `${o.label} ${formatMoney(o.cases.base.npv)}`)
            .join(" · ")}
          .
        </p>

        <details className="group mt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-y border-line py-3 [&::-webkit-details-marker]:hidden">
            <span>
              <span className="font-semibold text-ink">See the comparison</span>{" "}
              <span className="text-xs text-muted">all options, three scenarios</span>
            </span>
            <Plus className="size-5 shrink-0 text-ink transition-transform group-open:rotate-45" aria-hidden />
          </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs text-muted">
                <th className="py-2 pr-3 font-medium">Option</th>
                <th className="py-2 pr-3 text-right font-medium">One-time</th>
                <th className="py-2 pr-3 text-right font-medium">Cash benefit / mo</th>
                <th className="py-2 pr-3 text-right font-medium">Payback</th>
                {CASES.map((c) => (
                  <th key={c} className="py-2 pl-3 text-right font-medium">
                    {HORIZON_MONTHS / 12}-yr NPV · {CASE_LABELS[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {r.options.map((o) => {
                const b = o.cases.base;
                const lead = o.id === best;
                return (
                  <tr key={o.id} className={`border-b border-line last:border-0 ${lead ? "bg-brand-soft" : ""}`}>
                    <td className={`py-2.5 pr-3 ${lead ? "font-semibold text-ink" : "text-ink-2"}`}>{o.label}</td>
                    {o.available ? (
                      <>
                        <td className="py-2.5 pr-3 text-right font-mono">{b.oneTime ? formatUsd(b.oneTime) : "–"}</td>
                        <td className="py-2.5 pr-3 text-right font-mono">{o.id === "none" ? "–" : formatUsd(b.cash)}</td>
                        <td className="py-2.5 pr-3 text-right font-mono">{o.id === "none" ? "–" : b.payback === null ? "never" : b.payback === 0 ? "now" : months(b.payback)}</td>
                        {CASES.map((c) => (
                          <td key={c} className={`py-2.5 pl-3 text-right font-mono ${o.cases[c].npv < 0 ? "text-[#a33a3a] dark:text-[#ff8a80]" : ""}`}>
                            {o.id === "none" ? "$0" : formatMoney(o.cases[c].npv)}
                          </td>
                        ))}
                      </>
                    ) : (
                      <td colSpan={4 + CASES.length} className="py-2.5 pr-3 text-right text-muted">
                        Not applicable to this workflow
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </details>

        <DecisionMap plan={plan} />

        <p className="mt-4 text-sm text-muted">
          Cash counts {Math.round(plan.alt.cashShare * 100)}% of freed hours
          {ai.cases.base.capacityHours > 0 && <> · Capacity released: {Math.round(ai.cases.base.capacityHours).toLocaleString("en-US")} hrs/mo ({fte.toFixed(1)} FTE)</>} ·{" "}
          <a href={faq} onClick={linkClick(faq)} className="font-semibold text-brand-ink underline underline-offset-2">
            Method
          </a>
        </p>

        {r.missing.length > 0 && (
          <p className="mt-3 border-t border-line pt-3 text-sm text-ink-2">
            <span className="font-semibold text-ink">To confirm before investing: </span>
            {r.missing.map((m) => `${m.label} (${m.how})`).join(" · ")}
          </p>
        )}
      </div>

      <Fold id="alternatives" title="Alternatives and scenario assumptions" sub="Process redesign, rules-based automation and the cash share of freed hours">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FIELDS.map((f) => (
            <NumberField
              key={f.key}
              label={f.label}
              unit={f.unit}
              step={f.step}
              value={f.percent ? Math.round(plan.alt[f.key] * 1000) / 10 : plan.alt[f.key]}
              max={f.percent ? 100 : undefined}
              onChange={(v) => setAlt({ [f.key]: f.percent ? Math.min(100, v) / 100 : v })}
            />
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">
          <a href={faq} onClick={linkClick(faq)} className="underline underline-offset-2">
            Scenario definitions
          </a>
        </p>
      </Fold>
    </section>
  );
}
