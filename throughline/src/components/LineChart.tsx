import { useEffect, useRef, useState } from "react";
import { Replay, anim, useInView } from "./Motion";

export interface LineSeries {
  label: string;
  color: string;
  /** One value per x position; null leaves a gap */
  values: (number | null)[];
  dashed?: boolean;
  width?: number;
}

export interface Band {
  color: string;
  lower: (number | null)[];
  upper: (number | null)[];
  label: string;
}

/**
 * A line chart over a shared x axis (months), with an optional shaded band, horizontal reference lines,
 * a crosshair tooltip, and a table view. Text stays in ink colors; series color only marks the lines.
 */
export function LineChart({
  title,
  xLabels,
  series,
  band,
  refs = [],
  format,
  height = 280,
  tableEvery = 1,
  ariaLabel,
  animate = false,
}: {
  title: string;
  xLabels: string[];
  series: LineSeries[];
  band?: Band;
  refs?: { value: number; label: string; color: string }[];
  format: (v: number) => string;
  height?: number;
  tableEvery?: number;
  ariaLabel: string;
  /** Projection Fan: sweep the plot in from the left, history first, the forecast band last */
  animate?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const view = useInView<HTMLDivElement>();
  const [run, setRun] = useState(0);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(Math.max(280, el.clientWidth));
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = xLabels.length;
  const all = [...series.flatMap((s) => s.values), ...(band ? [...band.lower, ...band.upper] : []), ...refs.map((r) => r.value)].filter((v): v is number => v !== null && Number.isFinite(v));
  const lo = Math.min(0, ...all);
  const hi = Math.max(...all, 1);
  const mag = Math.pow(10, Math.floor(Math.log10(hi - lo)));
  const step = (hi - lo) / mag > 5 ? mag * 2 : (hi - lo) / mag > 2 ? mag : mag / 2;
  const yMin = Math.floor(lo / step) * step;
  const yMax = Math.ceil(hi / step) * step;
  const narrow = width < 560;
  const m = { top: 12, right: 14, bottom: 30, left: narrow ? 48 : 60 };
  const pw = width - m.left - m.right;
  const ph = height - m.top - m.bottom;
  const x = (i: number) => m.left + (n <= 1 ? 0 : (i / (n - 1)) * pw);
  const y = (v: number) => m.top + ph - ((v - yMin) / (yMax - yMin || 1)) * ph;
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-9; v += step) ticks.push(v);
  const path = (vals: (number | null)[]) => {
    let d = "";
    let pen = false;
    vals.forEach((v, i) => {
      if (v === null || !Number.isFinite(v)) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };
  const bandPath = band
    ? (() => {
        const idx = band.lower.map((v, i) => (v !== null && band.upper[i] !== null ? i : -1)).filter((i) => i >= 0);
        if (idx.length === 0) return "";
        const top = idx.map((i, k) => `${k ? "L" : "M"}${x(i).toFixed(1)},${y(band.upper[i]!).toFixed(1)}`).join("");
        const bottom = [...idx].reverse().map((i) => `L${x(i).toFixed(1)},${y(band.lower[i]!).toFixed(1)}`).join("");
        return `${top}${bottom}Z`;
      })()
    : "";
  const labelEvery = Math.max(1, Math.ceil(n / (narrow ? 5 : 9)));

  return (
    <figure className="min-w-0">
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className="w-4" style={{ borderTop: `2px ${s.dashed ? "dashed" : "solid"} ${s.color}` }} aria-hidden />
              {s.label}
            </span>
          ))}
          {band && (
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-4 rounded-sm" style={{ background: band.color, opacity: 0.25 }} aria-hidden />
              {band.label}
            </span>
          )}
        </span>
      </figcaption>
      <div ref={view.ref} className={animate ? view.paused : undefined}>
      <div ref={wrapRef} className="relative mt-3 w-full min-w-0">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block"
          role="img"
          aria-label={ariaLabel}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const px = ((e.clientX - r.left) / r.width) * width;
            const i = Math.round(((px - m.left) / pw) * (n - 1));
            setHover(i >= 0 && i < n ? i : null);
          }}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + pw} y1={y(t)} y2={y(t)} stroke="var(--line)" />
              <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[10px]">
                {format(t)}
              </text>
            </g>
          ))}
          {xLabels.map((l, i) =>
            i % labelEvery === 0 ? (
              <text key={i} x={x(i)} y={m.top + ph + 18} textAnchor="middle" className="fill-muted font-mono text-[10px]">
                {l}
              </text>
            ) : null,
          )}
          <g key={run} style={animate ? anim("wipe", 1600, 150, "std") : undefined}>
          {bandPath && <path d={bandPath} fill={band!.color} opacity={0.18} />}
          {refs.map((r) => (
            <g key={r.label}>
              <line x1={m.left} x2={m.left + pw} y1={y(r.value)} y2={y(r.value)} stroke={r.color} strokeDasharray="4 4" />
              <text x={m.left + pw - 4} y={y(r.value) - 5} textAnchor="end" className="fill-ink-2 text-[10px] font-medium" style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3 }}>
                {r.label}
              </text>
            </g>
          ))}
          {series.map((s) => (
            <path key={s.label} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={s.width ?? 2} strokeDasharray={s.dashed ? "5 4" : undefined} strokeLinejoin="round" />
          ))}
          </g>
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={m.top} y2={m.top + ph} stroke="var(--ink-2)" opacity={0.35} />
              {series.map((s) =>
                s.values[hover] !== null && s.values[hover] !== undefined ? <circle key={s.label} cx={x(hover)} cy={y(s.values[hover]!)} r={3.5} fill={s.color} stroke="var(--surface)" strokeWidth={1.5} /> : null,
              )}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-lg bg-panel px-3 py-2 text-xs text-panel-ink"
            style={{ left: Math.min(Math.max(x(hover) + 12, 0), width - 190) }}
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-panel-muted">{xLabels[hover]}</p>
            {series.map((s) =>
              s.values[hover] !== null && s.values[hover] !== undefined ? (
                <p key={s.label} className="mt-0.5 flex justify-between gap-3">
                  <span className="text-panel-muted">{s.label}</span>
                  <span className="font-mono">{format(s.values[hover]!)}</span>
                </p>
              ) : null,
            )}
          </div>
        )}
      </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3">
      <button type="button" onClick={() => setTable((t) => !t)} aria-expanded={table} className="text-xs font-medium text-brand-ink underline underline-offset-2">
        {table ? "Hide table" : "Show as a table"}
      </button>
        {animate && <Replay onClick={() => setRun((v) => v + 1)} />}
      </div>
      {table && (
        <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-line">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-sunken text-muted">
              <tr>
                <th className="px-2 py-1.5 font-medium">Month</th>
                {series.map((s) => (
                  <th key={s.label} className="px-2 py-1.5 text-right font-medium">
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {xLabels.map((l, i) =>
                i % tableEvery === 0 || i === n - 1 ? (
                  <tr key={i} className="border-t border-line">
                    <td className="px-2 py-1">{l}</td>
                    {series.map((s) => (
                      <td key={s.label} className="px-2 py-1 text-right">
                        {s.values[i] === null || s.values[i] === undefined ? "–" : format(s.values[i]!)}
                      </td>
                    ))}
                  </tr>
                ) : null,
              )}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
