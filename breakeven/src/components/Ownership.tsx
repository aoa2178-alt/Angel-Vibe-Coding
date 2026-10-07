import { ownershipView, formatUsd, type Assumptions, type OptionId, type Workload } from "@/lib/tco";
import type { OptionMeta } from "./ClosingBars";

const ORDER: OptionId[] = ["api", "rent", "own"];

// Parts of the cost of owning, drawn as steps of the "own" color so they read as one option.
const PARTS = [
  { key: "hardware", label: "Hardware", opacity: 1 },
  { key: "support", label: "Support", opacity: 0.72 },
  { key: "electricity", label: "Electricity", opacity: 0.5 },
  { key: "colocation", label: "Colocation", opacity: 0.32 },
  { key: "rentedOverflow", label: "Rented overflow", opacity: 0.18 },
] as const;

const short = (n: number) =>
  n >= 1e6 ? `$${(n / 1e6).toFixed(n >= 1e7 ? 1 : 2)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : formatUsd(n);

/**
 * The cash view: what each option costs in year 1 and over the whole ownership period (the depreciation years).
 * Monthly figures hide that owning pays for hardware up front; this makes the up-front cash visible.
 */
export function Ownership({ workload, assumptions, meta }: { workload: Workload; assumptions: Assumptions; meta: Record<OptionId, OptionMeta> }) {
  const view = ownershipView(workload, assumptions);
  const years = assumptions.depreciationYears;
  const own = view.own;
  const parts = own.parts!;
  const monthlyRent = view.rent.total / (years * 12);
  const upFrontMonthsOfRent = monthlyRent > 0 ? parts.hardware / monthlyRent : 0;

  return (
    <figure className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="kicker">Ownership view</p>
          <figcaption className="mt-1 text-lg font-bold tracking-tight">
            Cash over {years} year{years === 1 ? "" : "s"}
          </figcaption>
        </div>
        <span className="text-xs text-muted">The ownership period follows the depreciation setting</span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
              <th className="py-2 font-medium">Option</th>
              <th className="py-2 text-right font-medium">Year 1 cash</th>
              <th className="py-2 text-right font-medium">Total over {years} yrs</th>
            </tr>
          </thead>
          <tbody>
            {ORDER.map((id) => (
              <tr key={id} className="border-b border-line/70">
                <td className="py-2.5">
                  <span className="flex items-center gap-2">
                    <span className={`size-2.5 rounded-full ${meta[id].swatch}`} aria-hidden />
                    {meta[id].name}
                  </span>
                </td>
                <td className="py-2.5 text-right font-mono">{formatUsd(view[id].yearOne)}</td>
                <td className="py-2.5 text-right font-mono">{formatUsd(view[id].total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {own.total > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold">Where owning's {short(own.total)} goes</p>
          <div className="mt-2 flex h-5 overflow-hidden rounded-[4px] bg-sunken" role="img" aria-label={PARTS.filter((p) => parts[p.key] > 0).map((p) => `${p.label} ${short(parts[p.key])}`).join(", ")}>
            {PARTS.map((p) =>
              parts[p.key] > 0 ? (
                <div
                  key={p.key}
                  className="glide border-r-2 border-surface last:border-r-0"
                  style={{ width: `${(parts[p.key] / own.total) * 100}%`, backgroundColor: "var(--series-own)", opacity: p.opacity }}
                />
              ) : null,
            )}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2">
            {PARTS.filter((p) => parts[p.key] > 0).map((p) => (
              <li key={p.key} className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: "var(--series-own)", opacity: p.opacity }} aria-hidden />
                {p.label} <span className="font-mono">{short(parts[p.key])}</span>
              </li>
            ))}
          </ul>
          {parts.hardware > 0 && monthlyRent > 0 && (
            <p className="mt-3 text-sm leading-6 text-ink-2">
              Owning needs <span className="font-semibold text-ink">{formatUsd(parts.hardware)}</span> of hardware up front, about{" "}
              {upFrontMonthsOfRent >= 10 ? Math.round(upFrontMonthsOfRent) : upFrontMonthsOfRent.toFixed(1)} months of renting.
            </p>
          )}
        </div>
      )}
    </figure>
  );
}
