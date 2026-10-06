import { useState } from "react";
import { formatUsd, type OptionCost, type OptionId } from "@/lib/tco";
import { Odometer } from "./Odometer";

const ORDER: OptionId[] = ["api", "rent", "own"];

export interface OptionMeta {
  name: string;
  short: string;
  swatch: string;
}

/**
 * Monthly cost per option as horizontal bars. A dashed "cheapest" line marks the winning cost; on every other bar
 * the stretch past that line (the extra you'd pay) is striped and labeled, so the gap visibly closes or opens as
 * the inputs change. Bars, line and labels glide; digits roll.
 */
export function ClosingBars({
  costs,
  winner,
  meta,
}: {
  costs: Record<OptionId, OptionCost>;
  winner: OptionId;
  meta: Record<OptionId, OptionMeta>;
}) {
  const [hover, setHover] = useState<OptionId | null>(null);
  const max = Math.max(...ORDER.map((id) => costs[id].monthly)) || 1;
  const pct = (v: number) => Math.max(1.2, (v / max) * 100);
  const winPct = pct(costs[winner].monthly);

  return (
    <figure className="win-tint rounded-2xl border p-5 sm:p-6">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold">Monthly cost</span>
        <span className="kicker">Closing the gap</span>
      </figcaption>

      <div className="mt-5 space-y-4">
        {ORDER.map((id) => {
          const c = costs[id];
          const isWinner = id === winner;
          const barPct = pct(c.monthly);
          const extra = c.monthly - costs[winner].monthly;
          return (
            <div
              key={id}
              tabIndex={0}
              onMouseEnter={() => setHover(id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(id)}
              onBlur={() => setHover(null)}
              aria-label={`${meta[id].name}: ${formatUsd(c.monthly)} a month${isWinner ? ", cheapest" : `, ${formatUsd(extra)} more than the cheapest`}`}
              className="relative rounded-md outline-offset-4"
            >
              <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-ink-2">
                  <span className={`size-2.5 rounded-full ${meta[id].swatch}`} aria-hidden />
                  {meta[id].short}
                  {isWinner && (
                    <span key={winner} className="win-pill animate-pop rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">
                      Cheapest
                    </span>
                  )}
                </span>
                <span className={`font-mono ${isWinner ? "font-semibold text-ink" : "text-ink-2"}`}>
                  <Odometer text={formatUsd(c.monthly)} />
                </span>
              </div>

              {/* Track */}
              <div className="relative h-6 rounded-r-[4px] bg-surface/80">
                <div
                  className={`glide absolute inset-y-0 left-0 rounded-r-[4px] ${meta[id].swatch} ${hover && hover !== id ? "opacity-40" : ""}`}
                  style={{ width: `${barPct}%` }}
                />
                {/* The extra cost past the cheapest line, striped */}
                <div
                  className="glide absolute inset-y-0 rounded-r-[4px]"
                  style={{
                    left: `${winPct}%`,
                    width: `${isWinner ? 0 : Math.max(0, barPct - winPct)}%`,
                    backgroundImage:
                      "repeating-linear-gradient(135deg, rgb(255 255 255 / 0.42) 0 3px, transparent 3px 8px)",
                  }}
                  aria-hidden
                />
                {/* Cheapest line */}
                <div
                  className="glide absolute -inset-y-1.5 w-0 border-l-2 border-dashed border-ink"
                  style={{ left: `${winPct}%` }}
                  aria-hidden
                />
              </div>

              <p className="mt-1 h-4 font-mono text-[11px] text-muted">
                {isWinner ? (
                  "The line to beat"
                ) : (
                  <>
                    <Odometer text={`+${formatUsd(extra)}`} /> a month more
                  </>
                )}
              </p>

              {hover === id && (
                <div role="tooltip" className="absolute -top-2 right-0 z-10 -translate-y-full rounded-lg bg-panel px-3 py-2 text-xs text-panel-ink shadow-lg">
                  <span className="font-semibold">{meta[id].name}</span> · {formatUsd(c.perM, 2)} per M tokens
                  {c.gpus !== null && ` · ${c.gpus} GPU${c.gpus === 1 ? "" : "s"}`}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </figure>
  );
}
