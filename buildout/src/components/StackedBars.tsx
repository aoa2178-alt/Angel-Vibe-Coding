import { useEffect, useRef, useState } from "react";

/**
 * Stacked bars by quarter: one segment per company, with a 2px surface gap between segments, a hover readout and a
 * table view. Segment order follows the series order (largest at the bottom).
 */
export function StackedBars({
  title,
  labels,
  series,
  format,
  height = 300,
  ariaLabel,
}: {
  title: string;
  labels: string[];
  series: { label: string; color: string; values: (number | null)[] }[];
  format: (v: number) => string;
  height?: number;
  ariaLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(Math.max(280, el.clientWidth));
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = labels.length;
  const totals = labels.map((_, i) => series.reduce((a, s) => a + (s.values[i] ?? 0), 0));
  const maxTotal = Math.max(...totals, 1);
  const mag = Math.pow(10, Math.floor(Math.log10(maxTotal)));
  const step = maxTotal / mag > 5 ? mag * 2 : maxTotal / mag > 2 ? mag : mag / 2;
  const yMax = Math.ceil(maxTotal / step) * step;
  const narrow = width < 560;
  const m = { top: 10, right: 8, bottom: 26, left: narrow ? 44 : 56 };
  const pw = width - m.left - m.right;
  const ph = height - m.top - m.bottom;
  const slot = pw / n;
  const bw = Math.max(2, slot * 0.72);
  const y = (v: number) => m.top + ph - (v / yMax) * ph;
  const ticks: number[] = [];
  for (let v = 0; v <= yMax + 1e-9; v += step) ticks.push(v);
  const every = Math.max(1, Math.ceil(n / (narrow ? 4 : 8)));

  return (
    <figure className="min-w-0">
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">{title}</span>
        <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2">
          {series.map((s) => (
            <span key={s.label} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm" style={{ background: s.color }} aria-hidden />
              {s.label}
            </span>
          ))}
        </span>
      </figcaption>
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
            const i = Math.floor((((e.clientX - r.left) / r.width) * width - m.left) / slot);
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
          {labels.map((l, i) => {
            let base = 0;
            const x = m.left + i * slot + (slot - bw) / 2;
            return (
              <g key={l} opacity={hover === null || hover === i ? 1 : 0.55}>
                {series.map((s) => {
                  const v = s.values[i] ?? 0;
                  if (v <= 0) return null;
                  const top = y(base + v);
                  const h = y(base) - top;
                  base += v;
                  return <rect key={s.label} x={x} y={top} width={bw} height={Math.max(0, h - 2)} fill={s.color} rx={1.5} />;
                })}
                {i % every === 0 && (
                  <text x={x + bw / 2} y={m.top + ph + 16} textAnchor="middle" className="fill-muted font-mono text-[10px]">
                    {l}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg bg-panel px-3 py-2 text-xs text-panel-ink"
            style={{ left: Math.min(Math.max(m.left + hover * slot + slot + 6, 0), width - 200) }}
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-panel-muted">{labels[hover]}</p>
            {[...series].reverse().map((s) => (
              <p key={s.label} className="mt-0.5 flex justify-between gap-3">
                <span className="text-panel-muted">{s.label}</span>
                <span className="font-mono">{s.values[hover] === null ? "–" : format(s.values[hover]!)}</span>
              </p>
            ))}
            <p className="mt-1 flex justify-between gap-3 border-t border-white/15 pt-1 font-semibold">
              <span>Total</span>
              <span className="font-mono">{format(totals[hover]!)}</span>
            </p>
          </div>
        )}
      </div>
      <button type="button" onClick={() => setTable((t) => !t)} aria-expanded={table} className="mt-2 text-xs font-medium text-brand-ink underline underline-offset-2">
        {table ? "Hide table" : "Show as a table"}
      </button>
      {table && (
        <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-line">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-sunken text-muted">
              <tr>
                <th className="px-2 py-1.5 font-medium">Quarter</th>
                {series.map((s) => (
                  <th key={s.label} className="px-2 py-1.5 text-right font-medium">
                    {s.label}
                  </th>
                ))}
                <th className="px-2 py-1.5 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {labels.map((l, i) => (
                <tr key={l} className="border-t border-line">
                  <td className="px-2 py-1">{l}</td>
                  {series.map((s) => (
                    <td key={s.label} className="px-2 py-1 text-right">
                      {s.values[i] === null ? "–" : format(s.values[i]!)}
                    </td>
                  ))}
                  <td className="px-2 py-1 text-right font-semibold">{format(totals[i]!)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
