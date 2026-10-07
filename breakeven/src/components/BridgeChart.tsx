import { useEffect, useId, useRef, useState } from "react";
import { MAX_DELAY_MONTHS, STRATEGY_IDS, bestStrategy, formatMoney, totalOver, type StrategyCost, type StrategyId } from "@/lib/speedToPower";

export interface StrategyMeta {
  name: string;
  short: string;
  color: string;
}

const TABLE_MONTHS = [6, 12, 24, 36, 48, 72];
const X_TICKS = [0, 12, 24, 36, 48, 60, 72];

function niceStep(max: number) {
  const raw = max / 4;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  return [1, 2, 2.5, 5, 10].map((k) => k * p).find((s) => s >= raw) ?? 10 * p;
}

/**
 * Total extra cost of each strategy (versus owning on a working grid) for every grid delay from 0 to 72 months.
 * Renting climbs off the top of the chart, so the bridges stay readable; dots mark where the cheapest option changes.
 */
export function BridgeChart({
  all,
  delay,
  stretches,
  meta,
}: {
  all: Record<StrategyId, StrategyCost>;
  delay: number;
  stretches: { fromMonth: number; id: StrategyId }[];
  meta: Record<StrategyId, StrategyMeta>;
}) {
  const clipId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(Math.max(280, el.clientWidth));
    const ro = new ResizeObserver(([entry]) => entry && setWidth(Math.max(280, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const ids = STRATEGY_IDS.filter((id) => all[id].available);
  const months = Array.from({ length: MAX_DELAY_MONTHS + 1 }, (_, m) => m);

  // Scale to the bridges, not to renting, which would flatten them; renting runs off the top instead.
  const bridges = ids.filter((id) => id !== "wait");
  const pool = bridges.length > 0 ? bridges : (["wait"] as StrategyId[]);
  const peak = Math.max(1, ...pool.flatMap((id) => months.map((mo) => totalOver(all[id], mo))));
  const step = niceStep(peak * 1.1);
  const yMax = Math.ceil((peak * 1.1) / step) * step;

  const narrow = width < 560;
  const height = narrow ? 260 : 320;
  const m = { top: 22, right: narrow ? 84 : 96, bottom: 34, left: narrow ? 52 : 62 };
  const pw = width - m.left - m.right;
  const ph = height - m.top - m.bottom;
  const x = (mo: number) => m.left + (mo / MAX_DELAY_MONTHS) * pw;
  const y = (v: number) => m.top + ph - (Math.max(0, v) / yMax) * ph;
  const monthFromX = (px: number) => Math.round(Math.min(1, Math.max(0, (px - m.left) / pw)) * MAX_DELAY_MONTHS);

  const path = (id: StrategyId) => months.map((mo) => `${mo ? "L" : "M"}${x(mo).toFixed(1)},${y(totalOver(all[id], mo)).toFixed(1)}`).join("");

  // End labels at the right edge (renting's sits where it leaves the top of the chart), nudged apart.
  const labels = ids
    .map((id) => {
      const end = totalOver(all[id], MAX_DELAY_MONTHS);
      if (end <= yMax) return { id, x: m.left + pw + 8, y: y(end) };
      const perMonth = all[id].monthlyWaiting || 1;
      const exitMonth = Math.min(MAX_DELAY_MONTHS, yMax / perMonth);
      return { id, x: x(exitMonth) + 6, y: m.top + 2 };
    })
    .sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) if (Math.abs(labels[i]!.x - labels[i - 1]!.x) < 40) labels[i]!.y = Math.max(labels[i]!.y, labels[i - 1]!.y + 14);

  const ticks: number[] = [];
  for (let t = 0; t <= yMax + 1e-6; t += step) ticks.push(t);
  const switches = stretches.filter((s) => s.fromMonth > 0);

  return (
    <figure className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker">Cost of the wait</p>
          <figcaption className="mt-1 text-lg font-bold tracking-tight">Extra cost over the whole delay, by option</figcaption>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2" aria-label="Legend">
          {ids.map((id) => (
            <li key={id} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ background: meta[id].color }} aria-hidden />
              {meta[id].short}
            </li>
          ))}
        </ul>
      </div>

      <div ref={wrapRef} className="relative mt-4 w-full min-w-0">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block"
          role="img"
          aria-label={`Line chart of the extra cost of each option for grid delays from 0 to 72 months. ${switches.map((s) => `${meta[s.id].name} is cheapest from ${s.fromMonth} months`).join(". ")}.`}
        >
          <defs>
            <clipPath id={clipId}>
              <rect x={m.left} y={m.top - 2} width={pw + 2} height={ph + 4} />
            </clipPath>
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + pw} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeWidth={1} />
              <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[10px]">
                {formatMoney(t)}
              </text>
            </g>
          ))}
          {(narrow ? X_TICKS.filter((t) => t % 24 === 0) : X_TICKS).map((t) => (
            <text key={t} x={x(t)} y={m.top + ph + 18} textAnchor="middle" className="fill-muted font-mono text-[10px]">
              {t === 0 ? "0" : t % 12 === 0 ? `${t / 12} yr` : `${t} mo`}
            </text>
          ))}
          <text x={m.left + pw / 2} y={height - 2} textAnchor="middle" className="fill-muted text-[10px]">
            How late the grid is
          </text>

          <g clipPath={`url(#${clipId})`}>
            {ids.map((id) => (
              <path key={id} d={path(id)} fill="none" stroke={meta[id].color} strokeWidth={2} strokeLinejoin="round" />
            ))}
          </g>

          {labels.map((l) => (
            <g key={l.id}>
              <circle cx={l.x} cy={l.y} r={3.5} fill={meta[l.id].color} />
              <text x={l.x + 7} y={l.y} dy="0.32em" className="fill-ink-2 text-[11px] font-medium">
                {meta[l.id].short}
              </text>
            </g>
          ))}

          {/* Where the cheapest option changes */}
          {switches.map((s) => (
            <circle key={s.fromMonth} cx={x(s.fromMonth)} cy={y(totalOver(all[s.id], s.fromMonth))} r={5.5} fill="var(--surface)" stroke="var(--brand)" strokeWidth={2.5} />
          ))}

          {/* You are here */}
          <g style={{ transition: "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)", transform: `translateX(${x(delay)}px)` }}>
            <line y1={m.top} y2={m.top + ph} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="4 4" />
            <text y={m.top - 8} textAnchor="middle" className="fill-ink font-mono text-[10px] font-semibold">
              {delay} mo
            </text>
          </g>

          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={m.top} y2={m.top + ph} stroke="var(--brand)" strokeWidth={1} />}
          <rect
            x={m.left}
            y={m.top}
            width={Math.max(0, pw)}
            height={Math.max(0, ph)}
            fill="transparent"
            onPointerMove={(e) => {
              const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
              setHover(monthFromX(e.clientX - box.left));
            }}
            onPointerLeave={() => setHover(null)}
          />
        </svg>

        {hover !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute top-2 z-10 w-56 rounded-xl bg-panel px-3 py-2.5 text-xs text-panel-ink"
            style={{ left: Math.min(Math.max(x(hover) + 12, 0), width - 230) }}
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-panel-muted">Grid {hover} months late</p>
            <ul className="mt-1.5 space-y-1">
              {ids.map((id) => (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: meta[id].color }} aria-hidden />
                    {meta[id].short}
                    {bestStrategy(all, hover) === id && hover > 0 && <span className="text-panel-muted">· cheapest</span>}
                  </span>
                  <span className="font-mono">{formatMoney(totalOver(all[id], hover))}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {switches.length > 0 && (
        <ol className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-2">
          {switches.map((s) => (
            <li key={s.fromMonth} className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full border-2 border-brand" aria-hidden />
              From <span className="font-mono text-ink">{s.fromMonth} mo</span>: {meta[s.id].short}
            </li>
          ))}
        </ol>
      )}

      <button
        type="button"
        onClick={() => setShowTable((v) => !v)}
        aria-expanded={showTable}
        className="mt-3 text-xs font-medium text-brand-ink underline underline-offset-2"
      >
        {showTable ? "Hide table" : "View as table"}
      </button>
      {showTable && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[460px] text-left text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
                <th className="py-2 font-medium">Grid delay</th>
                {ids.map((id) => (
                  <th key={id} className="py-2 text-right font-medium">
                    {meta[id].short}
                  </th>
                ))}
                <th className="py-2 text-right font-medium">Cheapest</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {TABLE_MONTHS.map((mo) => (
                <tr key={mo} className="border-b border-line/70">
                  <td className="py-2">{mo} months</td>
                  {ids.map((id) => (
                    <td key={id} className="py-2 text-right">
                      {formatMoney(totalOver(all[id], mo))}
                    </td>
                  ))}
                  <td className="py-2 text-right font-sans">{meta[bestStrategy(all, mo)].short}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
