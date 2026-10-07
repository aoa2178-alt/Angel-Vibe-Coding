import { useEffect, useRef, useState } from "react";
import type { DeaResult, Unit } from "@/lib/dea";

export interface ScatterPoint {
  unit: Unit;
  result: DeaResult;
  name: string;
  /** AI power in the state on the map date, MW (sets the point size) */
  mw: number;
}

const AMBER = "var(--amber)";
const PERI = "var(--peri)";

/**
 * Price (x) against grid wait (y), both "less is better", with the DEA efficient frontier drawn through the states no
 * mix of others beats on both. The focused state shows its radial projection onto the frontier (its benchmark).
 */
export function Scatter({
  points,
  frontier,
  selected,
  onSelect,
  xLabel,
}: {
  points: ScatterPoint[];
  frontier: Unit[];
  selected: string;
  onSelect: (code: string) => void;
  xLabel: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<ScatterPoint | null>(null);
  const [table, setTable] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(Math.max(280, el.clientWidth));
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = width < 560;
  const height = narrow ? 340 : 420;
  const m = { top: 14, right: 16, bottom: 40, left: narrow ? 40 : 48 };
  const pw = width - m.left - m.right;
  const ph = height - m.top - m.bottom;
  // A few very expensive states (California, DC) would squash everyone else; prices beyond twice the median sit at the
  // right edge as arrows, with their value in the label.
  const prices = points.map((p) => p.unit.x1).sort((a, b) => a - b);
  const median = prices[Math.floor(prices.length / 2)] ?? 10;
  const xMax = Math.ceil(Math.max(...prices.filter((v) => v <= 2 * median)) / 2) * 2;
  const yMax = Math.ceil(Math.max(...points.map((p) => p.unit.x2)));
  // Both axes start at zero: DEA's radial benchmark runs toward the origin.
  const clipped = (v: number) => v > xMax;
  const x = (v: number) => m.left + (Math.min(v, xMax) / xMax) * pw;
  const y = (v: number) => m.top + ph - (v / yMax) * ph;
  const r = (mw: number) => (mw > 0 ? 4 + Math.sqrt(mw) * (narrow ? 0.12 : 0.16) : 3.5);

  const f = frontier;
  const frontierPath = f.length
    ? `M${x(f[0]!.x1)},${y(yMax)} ` + f.map((u) => `L${x(u.x1)},${y(u.x2)}`).join(" ") + ` L${x(xMax)},${y(f.at(-1)!.x2)}`
    : "";
  const sel = points.find((p) => p.unit.id === selected);
  const xTicks = Array.from({ length: xMax / 2 + 1 }, (_, k) => k * 2);
  const yTicks = Array.from({ length: yMax + 1 }, (_, k) => k);
  const labelled = new Set(points.filter((p) => p.result.efficient || p.mw >= 500 || p.unit.id === selected || clipped(p.unit.x1)).map((p) => p.unit.id));

  return (
    <figure className="min-w-0">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-2">
        <span className="text-sm font-semibold text-ink">Power price against grid wait, by state</span>
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full" style={{ background: AMBER }} aria-hidden /> On the frontier
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded-full" style={{ background: PERI }} aria-hidden /> Beaten by a mix of others
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 border-t-2" style={{ borderColor: AMBER }} aria-hidden /> Efficient frontier
          </span>
          <span className="text-muted">Size = AI power there</span>
        </span>
      </figcaption>
      <div ref={wrapRef} className="relative mt-3 w-full min-w-0">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label="Scatter of states by power price and grid-connection wait, with the DEA efficient frontier">
          {yTicks.map((t) => (
            <g key={`y${t}`}>
              <line x1={m.left} x2={m.left + pw} y1={y(t)} y2={y(t)} stroke="var(--line)" />
              <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[10px]">
                {t}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <text key={`x${t}`} x={x(t)} y={m.top + ph + 16} textAnchor="middle" className="fill-muted font-mono text-[10px]">
              {t}¢
            </text>
          ))}
          <text x={m.left + pw} y={height - 4} textAnchor="end" className="fill-muted text-[11px]">
            {xLabel} →
          </text>
          <text transform={`translate(11,${m.top + ph / 2}) rotate(-90)`} textAnchor="middle" className="fill-muted text-[11px]">
            Grid wait, years →
          </text>
          {frontierPath && <path d={frontierPath} fill="none" stroke={AMBER} strokeWidth={2} strokeLinejoin="round" />}
          {sel && !sel.result.efficient && !clipped(sel.unit.x1) && (
            <g pointerEvents="none">
              <line x1={x(0)} y1={y(0)} x2={x(sel.unit.x1)} y2={y(sel.unit.x2)} stroke="var(--ink-2)" strokeDasharray="3 4" opacity={0.6} />
              <circle cx={x(sel.result.target.x1)} cy={y(sel.result.target.x2)} r={4} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.5} />
            </g>
          )}
          {[...points]
            .sort((a, b) => b.mw - a.mw)
            .map((p) => {
              const isSel = p.unit.id === selected;
              return (
                <g key={p.unit.id} className="cursor-pointer" onClick={() => onSelect(isSel ? "" : p.unit.id)} onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)}>
                  <circle cx={x(p.unit.x1)} cy={y(p.unit.x2)} r={Math.max(r(p.mw) + 4, 10)} fill="transparent" />
                  {clipped(p.unit.x1) ? (
                    <path
                      d={`M${x(xMax) - 9},${y(p.unit.x2) - 6} L${x(xMax)},${y(p.unit.x2)} L${x(xMax) - 9},${y(p.unit.x2) + 6} Z`}
                      fill={PERI}
                      fillOpacity={p.mw > 0 ? 0.9 : 0.45}
                      stroke={isSel ? "var(--ink)" : "var(--surface)"}
                      strokeWidth={isSel ? 2.5 : 1.5}
                    />
                  ) : (
                    <circle
                      cx={x(p.unit.x1)}
                      cy={y(p.unit.x2)}
                      r={r(p.mw)}
                      fill={p.result.efficient ? AMBER : PERI}
                      fillOpacity={p.mw > 0 ? 0.9 : 0.45}
                      stroke={isSel ? "var(--ink)" : "var(--surface)"}
                      strokeWidth={isSel ? 2.5 : 1.5}
                    />
                  )}
                  {labelled.has(p.unit.id) && (
                    <text
                      x={clipped(p.unit.x1) ? x(xMax) - 12 : x(p.unit.x1) + r(p.mw) + 3}
                      y={clipped(p.unit.x1) ? y(p.unit.x2) : y(p.unit.x2) - r(p.mw) - 1}
                      dy={clipped(p.unit.x1) ? "-0.6em" : undefined}
                      textAnchor={clipped(p.unit.x1) ? "end" : "start"}
                      className="fill-ink text-[10px] font-semibold"
                      style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 3 }}
                    >
                      {clipped(p.unit.x1) ? `${p.unit.id} ${p.unit.x1.toFixed(1)}¢ →` : p.unit.id}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>
        {hover && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 w-56 rounded-lg border border-line bg-sunken px-3 py-2 text-xs text-ink"
            style={{ left: Math.min(Math.max(x(hover.unit.x1) + 14, 0), width - 230), top: Math.max(y(hover.unit.x2) - 30, 0) }}
          >
            <p className="font-semibold">{hover.name}</p>
            <p className="mt-1 flex justify-between gap-3">
              <span className="text-muted">Power price</span>
              <span className="font-mono">{hover.unit.x1.toFixed(2)}¢/kWh</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-muted">Grid wait</span>
              <span className="font-mono">{hover.unit.x2.toFixed(1)} yrs</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-muted">DEA score</span>
              <span className="font-mono">{hover.result.theta.toFixed(2)}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-muted">AI power now</span>
              <span className="font-mono">{hover.mw > 0 ? `${Math.round(hover.mw)} MW` : "none"}</span>
            </p>
          </div>
        )}
      </div>
      <button type="button" onClick={() => setTable((t) => !t)} aria-expanded={table} className="mt-2 text-xs font-medium text-brand-ink underline underline-offset-2 print:hidden">
        {table ? "Hide table" : "Show as a table"}
      </button>
      {table && (
        <div className="mt-2 max-h-80 overflow-auto rounded-lg border border-line">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 bg-sunken text-muted">
              <tr>
                <th className="px-2 py-1.5 font-sans font-medium">State</th>
                <th className="px-2 py-1.5 text-right font-medium">¢/kWh</th>
                <th className="px-2 py-1.5 text-right font-medium">Wait, yrs</th>
                <th className="px-2 py-1.5 text-right font-medium">Score</th>
                <th className="px-2 py-1.5 text-right font-medium">AI MW</th>
              </tr>
            </thead>
            <tbody>
              {[...points]
                .sort((a, b) => b.result.theta - a.result.theta || a.unit.x1 - b.unit.x1)
                .map((p) => (
                  <tr key={p.unit.id} className="border-t border-line">
                    <td className="px-2 py-1 font-sans">
                      {p.name}
                      {p.result.efficient ? " ★" : ""}
                    </td>
                    <td className="px-2 py-1 text-right">{p.unit.x1.toFixed(2)}</td>
                    <td className="px-2 py-1 text-right">{p.unit.x2.toFixed(1)}</td>
                    <td className="px-2 py-1 text-right">{p.result.theta.toFixed(2)}</td>
                    <td className="px-2 py-1 text-right">{p.mw > 0 ? Math.round(p.mw).toLocaleString("en-US") : "–"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p className="border-t border-line px-2 py-1.5 font-sans text-[11px] text-muted">★ on the efficient frontier</p>
        </div>
      )}
    </figure>
  );
}
