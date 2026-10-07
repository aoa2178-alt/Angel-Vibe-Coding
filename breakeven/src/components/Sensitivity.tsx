import { cheapest, compare, formatUsd, sensitivity, type Assumptions, type OptionId, type Workload } from "@/lib/tco";
import type { OptionMeta } from "./ClosingBars";

/**
 * "What moves the answer": each driver pushed 25% down and up, with the cheapest option at each end.
 * Drivers that change the answer sort first, then the ones that move the cost most.
 */
export function Sensitivity({ workload, assumptions, meta }: { workload: Workload; assumptions: Assumptions; meta: Record<OptionId, OptionMeta> }) {
  const rows = sensitivity(workload, assumptions, 0.25);
  const base = cheapest(compare(workload, assumptions));
  const flips = rows.filter((r) => r.flips).length;

  const Cell = ({ winner, monthly }: { winner: OptionId; monthly: number }) => (
    <span className={`inline-flex items-center justify-end gap-1.5 ${winner !== base ? "font-semibold text-ink" : "text-ink-2"}`}>
      <span className={`size-2 rounded-full ${meta[winner].swatch}`} aria-hidden />
      <span className="hidden sm:inline">{meta[winner].short}</span>
      <span className="font-mono">{formatUsd(monthly)}</span>
    </span>
  );

  return (
    <figure className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <p className="kicker">Sensitivity</p>
      <figcaption className="mt-1 text-lg font-bold tracking-tight">What moves the answer</figcaption>
      <p className="mt-1 text-sm text-ink-2">
        Each assumption pushed 25% lower and higher.{" "}
        {flips === 0
          ? `None of them changes the cheapest option (${meta[base].name}) at this volume.`
          : `${flips} of them ${flips === 1 ? "changes" : "change"} the cheapest option at this volume.`}
      </p>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[380px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="py-2 font-medium">Assumption</th>
              <th className="py-2 text-right font-medium">25% lower</th>
              <th className="py-2 text-right font-medium">25% higher</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-line/70">
                <td className="py-2.5">
                  {r.label}
                  {r.flips && (
                    <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-brand-ink">
                      Flips
                    </span>
                  )}
                </td>
                <td className="py-2.5 text-right">
                  <Cell {...r.low} />
                </td>
                <td className="py-2.5 text-right">
                  <Cell {...r.high} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted">Each cell shows the cheapest option and its monthly cost. Bold means the answer changed.</p>
    </figure>
  );
}
