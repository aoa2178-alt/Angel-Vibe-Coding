import { useEffect, useState } from "react";
import { deltaQuality, metricStatus, type MetricStatus } from "@/engine/engine";
import type { MetricDef, MetricValues } from "@/engine/types";
import { cx } from "./ui";

const statusText: Record<MetricStatus, string> = { good: "On track", watch: "Watch", critical: "Critical" };
const statusColor: Record<MetricStatus, string> = { good: "text-good", watch: "text-watch", critical: "text-bad" };
const barColor: Record<MetricStatus, string> = { good: "bg-good", watch: "bg-watch", critical: "bg-bad" };

/** Starts at `from` and moves to `to` after mount, so CSS transitions show the change. */
function useAnimatedValue(from: number, to: number) {
  const [value, setValue] = useState(from);
  useEffect(() => {
    setValue(from);
    const t = window.setTimeout(() => setValue(to), 80);
    return () => window.clearTimeout(t);
  }, [from, to]);
  return value;
}

export function DeltaChip({ metric, delta, className }: { metric: MetricDef; delta: number; className?: string }) {
  const quality = deltaQuality(metric, delta);
  const text = delta === 0 ? "±0" : `${delta > 0 ? "+" : "−"}${Math.abs(delta)}`;
  const label = delta === 0 ? "no change" : `${quality === "better" ? "improved" : "worsened"} by ${Math.abs(delta)}`;
  return (
    <span
      aria-label={label}
      className={cx(
        "inline-flex animate-pop items-center rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold leading-none",
        quality === "better" && "bg-good/15 text-good",
        quality === "worse" && "bg-bad/15 text-bad",
        quality === "same" && "bg-line/60 text-muted",
        className,
      )}
      style={{ animationDelay: "250ms" }}
    >
      {text}
    </span>
  );
}

interface TileProps {
  metric: MetricDef;
  value: number;
  /** When set, the tile animates from this value and shows the change. */
  from?: number;
}

export function MetricTile({ metric, value, from }: TileProps) {
  const status = metricStatus(metric, value);
  const shown = useAnimatedValue(from ?? value, value);
  const delta = from === undefined ? null : value - from;
  return (
    <div className="rounded-xl border border-line bg-panel-2/60 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-ink-2">{metric.label}</p>
        {delta !== null && <DeltaChip metric={metric} delta={delta} />}
      </div>
      <p className="mt-1 text-[15px] font-semibold leading-snug text-ink">{metric.describe(value)}</p>
      <div className="mt-2.5 flex items-center gap-2.5">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-line/70"
          role="meter"
          aria-label={metric.label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          aria-valuetext={`${value} of 100, ${statusText[status]}`}
        >
          <div
            className={cx("h-full rounded-full transition-[width] duration-700 ease-out", barColor[status])}
            style={{ width: `${shown}%` }}
          />
        </div>
        <span className="w-6 text-right font-mono text-xs text-muted">{value}</span>
      </div>
      <p className="mt-1.5 flex justify-between text-[11px]">
        <span className={cx("font-semibold uppercase tracking-wider", statusColor[status])}>{statusText[status]}</span>
        <span className="text-muted">{metric.higherIsBetter ? "Higher is better" : "Lower is better"}</span>
      </p>
    </div>
  );
}

function CompactTile({ metric, value, from }: TileProps) {
  const status = metricStatus(metric, value);
  const shown = useAnimatedValue(from ?? value, value);
  const delta = from === undefined ? null : value - from;
  return (
    <div className="min-w-0 rounded-lg border border-line bg-panel-2/70 px-2 py-1.5">
      <div className="flex items-center justify-between gap-1">
        <span className="truncate text-[11px] font-medium text-ink-2">{metric.shortLabel}</span>
        <span className={cx("size-1.5 shrink-0 rounded-full", barColor[status])} aria-hidden />
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-line/70">
        <div className={cx("h-full rounded-full transition-[width] duration-700 ease-out", barColor[status])} style={{ width: `${shown}%` }} />
      </div>
      <div className="mt-1 flex h-4 items-center justify-between gap-1">
        <span className="font-mono text-[11px] text-muted">{value}</span>
        {delta !== null && delta !== 0 && <DeltaChip metric={metric} delta={delta} className="px-1 text-[10px]" />}
      </div>
      <span className="sr-only">
        {metric.label}: {metric.describe(value)}, {statusText[status]}
      </span>
    </div>
  );
}

interface PanelProps {
  metrics: MetricDef[];
  values: MetricValues;
  from?: MetricValues;
  /** Changes whenever a new set of deltas should animate. */
  animationKey: string;
}

/** Desktop: vertical stack in the sidebar. */
export function MetricsPanel({ metrics, values, from, animationKey }: PanelProps) {
  return (
    <section aria-label="Company metrics" className="grid gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Dashboard</h2>
        {from && <span className="text-[11px] text-muted">Change from your last call</span>}
      </div>
      {metrics.map((m) => (
        <MetricTile key={`${m.id}-${animationKey}`} metric={m} value={values[m.id]} from={from?.[m.id]} />
      ))}
    </section>
  );
}

/** Mobile: one row of four compact tiles. */
export function MetricsStrip({ metrics, values, from, animationKey }: PanelProps) {
  return (
    <section aria-label="Company metrics" className="grid grid-cols-4 gap-1.5">
      {metrics.map((m) => (
        <CompactTile key={`${m.id}-${animationKey}`} metric={m} value={values[m.id]} from={from?.[m.id]} />
      ))}
    </section>
  );
}
