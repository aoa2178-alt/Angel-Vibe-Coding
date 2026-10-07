import { useEffect, useRef, useState } from "react";
import { capacityOverTime, formatMonth, formatMw, type PhasePlan } from "@/lib/model";

/** Facility megawatts online, month by month: as planned (dashed) and with today's slips (solid). */
export function CapacityChart({ plans }: { plans: PhasePlan[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(Math.max(300, el.clientWidth));
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(300, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const series = capacityOverTime(plans);
  const max = Math.max(...series.map((p) => Math.max(p.planned, p.now)), 1);
  const step = Math.pow(10, Math.floor(Math.log10(max))) * (max / Math.pow(10, Math.floor(Math.log10(max))) > 5 ? 2 : 1);
  const yMax = Math.ceil(max / step) * step;
  const height = width < 560 ? 220 : 260;
  const m = { top: 14, right: 16, bottom: 28, left: 56 };
  const pw = width - m.left - m.right;
  const ph = height - m.top - m.bottom;
  const first = series[0]!.month;
  const last = series[series.length - 1]!.month;
  const x = (mo: number) => m.left + ((mo - first) / Math.max(1, last - first)) * pw;
  const y = (v: number) => m.top + ph - (v / yMax) * ph;
  const path = (key: "planned" | "now") => series.map((p, i) => `${i ? `H${x(p.month).toFixed(1)}V` : `M${x(p.month).toFixed(1)},`}${y(p[key]).toFixed(1)}`).join("");
  const ticks: number[] = [];
  for (let v = 0; v <= yMax + 1e-9; v += step) ticks.push(v);
  const years = series.filter((p) => p.month % 12 === 0).map((p) => p.month);
  const hovered = hover === null ? null : series.find((p) => p.month === hover);

  return (
    <figure className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <p className="kicker">Capacity</p>
      <figcaption className="mt-1 text-lg font-bold tracking-tight">Facility power online over time</figcaption>
      <div ref={wrapRef} className="relative mt-4 w-full min-w-0">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label={`Step chart of facility power online. Full build: ${formatMw(max)}.`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + pw} y1={y(t)} y2={y(t)} stroke="var(--line)" />
              <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[10px]">
                {formatMw(t)}
              </text>
            </g>
          ))}
          {years.map((mo) => (
            <text key={mo} x={x(mo)} y={height - 8} textAnchor="middle" className="fill-muted font-mono text-[10px]">
              {2000 + mo / 12}
            </text>
          ))}
          <path d={`${path("now")}V${y(0)}H${x(first)}Z`} fill="var(--brand)" opacity={0.28} />
          <path d={path("now")} fill="none" stroke="var(--ink)" strokeWidth={2} />
          <path d={path("planned")} fill="none" stroke="var(--muted)" strokeWidth={2} strokeDasharray="5 4" />
          {hovered && <line x1={x(hovered.month)} x2={x(hovered.month)} y1={m.top} y2={m.top + ph} stroke="var(--ink)" />}
          <rect
            x={m.left}
            y={m.top}
            width={Math.max(0, pw)}
            height={Math.max(0, ph)}
            fill="transparent"
            onPointerMove={(e) => {
              const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
              setHover(Math.round(first + ((e.clientX - box.left - m.left) / pw) * (last - first)));
            }}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {hovered && (
          <div role="tooltip" className="pointer-events-none absolute top-2 z-10 w-48 rounded-xl bg-panel px-3 py-2.5 text-xs text-panel-ink" style={{ left: Math.min(Math.max(x(hovered.month) + 12, 0), width - 200) }}>
            <p className="font-mono text-[10px] uppercase tracking-wider text-panel-muted">{formatMonth(hovered.month)}</p>
            <p className="mt-1 flex justify-between">
              <span>With slips</span>
              <span className="font-mono">{formatMw(hovered.now)}</span>
            </p>
            <p className="flex justify-between text-panel-muted">
              <span>As planned</span>
              <span className="font-mono">{formatMw(hovered.planned)}</span>
            </p>
          </div>
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 bg-ink" aria-hidden /> With today's slips
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-0 w-5 border-t-2 border-dashed border-muted" aria-hidden /> As planned
        </li>
      </ul>
    </figure>
  );
}
