import { useEffect, useRef, useState } from "react";
import { Replay, anim, useInView } from "./Motion";
import { formatMoney, signed } from "@/lib/model";

export interface WaterfallStep {
  id: string;
  label: string;
  effect: number;
}

/**
 * Budget Waterfall (Macro Brief Motion Library): plan on the left, each driver's effect floating from the running total,
 * actual on the right. Bars grow one after another (back-out easing), connectors fade in behind them, then labels rise.
 * The axis starts near the smallest total, not at zero, so million-dollar steps stay visible against a revenue base.
 * The animation waits until the chart scrolls into view; Replay runs it again.
 */
export function Waterfall({ start, end, steps, startLabel = "Plan", endLabel = "Actual" }: { start: number; end: number; steps: WaterfallStep[]; startLabel?: string; endLabel?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [run, setRun] = useState(0);
  const view = useInView<HTMLElement>();
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    setWidth(Math.max(300, el.clientWidth));
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(300, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Running totals before and after each step.
  let level = start;
  const bars = steps.map((s) => {
    const from = level;
    level += s.effect;
    return { ...s, from, to: level };
  });
  const totals = [start, end, ...bars.flatMap((b) => [b.from, b.to])];
  const span = Math.max(...totals) - Math.min(...totals) || 1;
  const lo = Math.min(...totals) - span * 0.6;
  const hi = Math.max(...totals) + span * 0.25;

  const narrow = width < 560;
  const H = narrow ? 320 : 300;
  const m = { top: 28, right: 8, bottom: narrow ? 108 : 44, left: 8 };
  const n = bars.length + 2;
  const slot = (width - m.left - m.right) / n;
  const bw = Math.min(56, slot * 0.62);
  const x = (i: number) => m.left + slot * i + (slot - bw) / 2;
  const y = (v: number) => m.top + (H - m.top - m.bottom) * (1 - (v - lo) / (hi - lo));
  const base = y(lo);
  const step = 140; // ms between bars

  const money = (v: number) => (Math.abs(v) < 500 ? "$0" : signed(v, formatMoney));
  // On narrow screens only the bigger steps carry a value label; the list view has every figure.
  const big = Math.max(...steps.map((s) => Math.abs(s.effect)), 1);
  const showValue = (v: number) => !narrow || Math.abs(v) >= big * 0.2;

  const col = (i: number, top: number, bottom: number, fill: string, origin: "top" | "bottom", value: string | null, name: string, emphasize = false) => (
    <g key={`${run}-${i}`}>
      <rect
        x={x(i)}
        y={top}
        width={bw}
        height={Math.max(1.5, bottom - top)}
        rx={2}
        fill={fill}
        style={{ transformBox: "fill-box", transformOrigin: origin, ...anim("growY", 700, 200 + i * step, "back") }}
      />
      {value !== null && (
        <text
          x={x(i) + bw / 2}
          y={top - 8}
          textAnchor="middle"
          className={`fill-ink font-mono ${emphasize ? "text-[12px] font-semibold" : "text-[10.5px]"}`}
          style={anim("rise", 400, 650 + i * step, "back")}
        >
          {value}
        </text>
      )}
      <text
        x={x(i) + bw / 2}
        y={base + 16}
        textAnchor={narrow ? "end" : "middle"}
        className="fill-muted text-[10.5px]"
        transform={narrow ? `rotate(-60 ${x(i) + bw / 2} ${base + 16})` : undefined}
        style={anim("fade", 300, 100 + i * step)}
      >
        {name}
      </text>
    </g>
  );

  return (
    <figure ref={view.ref} className={`min-w-0 ${view.paused}`}>
      <div ref={wrap} className="w-full min-w-0">
        <svg width="100%" height={H} viewBox={`0 0 ${width} ${H}`} className="block" role="img" aria-label={`Waterfall from ${startLabel} ${formatMoney(start)} to ${endLabel} ${formatMoney(end)}`}>
          <line x1={m.left} x2={width - m.right} y1={base} y2={base} stroke="var(--line)" />
          {col(0, y(start), base, "var(--brand)", "bottom", formatMoney(start), startLabel, true)}
          {bars.map((b, k) => {
            const i = k + 1;
            const up = b.effect >= 0;
            return col(i, y(Math.max(b.from, b.to)), y(Math.min(b.from, b.to)), up ? "var(--green)" : "var(--red)", up ? "bottom" : "top", showValue(b.effect) ? money(b.effect) : null, b.label);
          })}
          {/* Dashed connectors: each bar's end level carries to the next bar. */}
          {[start, ...bars.map((b) => b.to)].map((v, k) => (
            <line
              key={`c${run}-${k}`}
              x1={x(k) + bw}
              x2={x(k + 1)}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--muted)"
              strokeDasharray="3 3"
              style={anim("fade", 300, 650 + k * step)}
            />
          ))}
          {col(n - 1, y(end), base, "var(--ink)", "bottom", formatMoney(end), endLabel, true)}
        </svg>
      </div>
      <figcaption className="mt-1 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: "var(--green)" }} aria-hidden /> Adds revenue
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ background: "var(--red)" }} aria-hidden /> Costs revenue
          </span>
          <span>Axis starts above zero so the steps show</span>
        </span>
        <Replay onClick={() => setRun((v) => v + 1)} />
      </figcaption>
    </figure>
  );
}
