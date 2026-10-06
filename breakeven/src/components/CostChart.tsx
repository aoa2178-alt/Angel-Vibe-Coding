import { useEffect, useMemo, useRef, useState } from "react";
import {
  VOLUME_MAX_M,
  VOLUME_MIN_M,
  cheapest,
  compare,
  formatTokensM,
  formatUsd,
  type Assumptions,
  type Crossovers,
  type OptionId,
  type Workload,
} from "@/lib/tco";
import type { OptionMeta } from "./ClosingBars";

const ORDER: OptionId[] = ["api", "rent", "own"];
const STROKE: Record<OptionId, string> = { api: "var(--series-api)", rent: "var(--series-rent)", own: "var(--series-own)" };
const SAMPLES = 240;
const X_TICKS = [10, 100, 1_000, 10_000, 100_000];
const TABLE_VOLUMES = [100, 1_000, 10_000, 100_000];

function compactUsd(n: number) {
  if (n >= 1e6) return `$${n / 1e6}M`;
  if (n >= 1e3) return `$${n / 1e3}K`;
  return `$${n}`;
}

/**
 * Monthly cost of each option across 10M–100B tokens a month, on log scales (both axes span four or more
 * orders of magnitude). Marks the two crossovers, glides a "you are here" line to the current volume, and shows
 * a crosshair tooltip on hover. A table view gives the same numbers without the chart.
 */
export function CostChart({
  workload,
  assumptions,
  cross,
  meta,
}: {
  workload: Workload;
  assumptions: Assumptions;
  cross: Crossovers;
  meta: Record<OptionId, OptionMeta>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hoverV, setHoverV] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(Math.max(280, el.clientWidth)); // measure right away; the observer only reports once the page paints
    const ro = new ResizeObserver(([entry]) => entry && setWidth(Math.max(280, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = width < 560;
  const height = narrow ? 270 : 330;
  const m = { top: 20, right: narrow ? 52 : 70, bottom: 34, left: narrow ? 46 : 58 };
  const pw = width - m.left - m.right;
  const ph = height - m.top - m.bottom;

  const { outputShare, utilization } = workload;
  const data = useMemo(() => {
    const vols = Array.from({ length: SAMPLES + 1 }, (_, i) => VOLUME_MIN_M * Math.pow(VOLUME_MAX_M / VOLUME_MIN_M, i / SAMPLES));
    const rows = vols.map((v) => ({ v, c: compare({ tokensM: v, outputShare, utilization }, assumptions) }));
    const all = rows.flatMap((r) => ORDER.map((id) => r.c[id].monthly)).filter((x) => x > 0);
    const yMin = Math.pow(10, Math.floor(Math.log10(Math.min(...all))));
    const yMax = Math.pow(10, Math.ceil(Math.log10(Math.max(...all))));
    return { rows, yMin, yMax };
  }, [outputShare, utilization, assumptions]);

  const lx = (v: number) => m.left + ((Math.log10(v) - Math.log10(VOLUME_MIN_M)) / Math.log10(VOLUME_MAX_M / VOLUME_MIN_M)) * pw;
  const ly = (c: number) =>
    m.top + ph - ((Math.log10(Math.max(c, data.yMin)) - Math.log10(data.yMin)) / Math.log10(data.yMax / data.yMin)) * ph;
  const vFromX = (x: number) => VOLUME_MIN_M * Math.pow(VOLUME_MAX_M / VOLUME_MIN_M, Math.min(1, Math.max(0, (x - m.left) / pw)));

  const yTicks: number[] = [];
  for (let t = data.yMin; t <= data.yMax * 1.0001; t *= 10) yTicks.push(t);

  const path = (id: OptionId) =>
    data.rows.map((r, i) => `${i ? "L" : "M"}${lx(r.v).toFixed(1)},${ly(r.c[id].monthly).toFixed(1)}`).join("");

  // Right-edge labels, nudged apart so they never overlap.
  const last = data.rows[data.rows.length - 1]!;
  const endLabels = ORDER.map((id) => ({ id, y: ly(last.c[id].monthly) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < endLabels.length; i++) endLabels[i]!.y = Math.max(endLabels[i]!.y, endLabels[i - 1]!.y + 14);

  const current = Math.min(Math.max(workload.tokensM, VOLUME_MIN_M), VOLUME_MAX_M);
  const currentCosts = compare({ ...workload, tokensM: current }, assumptions);

  // When the API hands straight over to owning (renting never wins), both crossovers are the same point.
  const sameCrossover = cross.apiUntilM !== null && cross.ownFromM !== null && Math.abs(Math.log10(cross.ownFromM / cross.apiUntilM)) < 0.02;
  const markers = sameCrossover
    ? [
        {
          key: "own",
          x: lx(cross.ownFromM!),
          y: ly(compare({ ...workload, tokensM: cross.ownFromM! }, assumptions).own.monthly),
          label: `Owning takes over from the API · ${formatTokensM(cross.ownFromM!)}`,
        },
      ]
    : [
    cross.apiUntilM !== null && {
      key: "api",
      x: lx(cross.apiUntilM),
      y: ly(compare({ ...workload, tokensM: cross.apiUntilM }, assumptions).api.monthly),
      label: `API stops winning · ${formatTokensM(cross.apiUntilM)}`,
    },
    cross.ownFromM !== null && {
      key: "own",
      x: lx(cross.ownFromM),
      y: ly(compare({ ...workload, tokensM: cross.ownFromM }, assumptions).own.monthly),
      label: `Owning wins for good · ${formatTokensM(cross.ownFromM)}`,
    },
  ].filter(Boolean) as { key: string; x: number; y: number; label: string }[];

  const hoverCosts = hoverV === null ? null : compare({ ...workload, tokensM: hoverV }, assumptions);

  return (
    <figure className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="kicker">Cost projection analysis</p>
          <figcaption className="mt-1 text-lg font-bold tracking-tight">Monthly cost as your volume grows</figcaption>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-2" aria-label="Legend">
          {ORDER.map((id) => (
            <li key={id} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded-full" style={{ background: STROKE[id] }} aria-hidden />
              {meta[id].name}
            </li>
          ))}
        </ul>
      </div>

      <div ref={wrapRef} className="relative mt-4 w-full min-w-0">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label={`Line chart of monthly cost from 10M to 100B tokens a month. ${markers.map((mk) => mk.label).join(". ")}.`}>
          {/* Grid and axes */}
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + pw} y1={ly(t)} y2={ly(t)} stroke="var(--line)" strokeWidth={1} />
              <text x={m.left - 8} y={ly(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[10px]">
                {compactUsd(t)}
              </text>
            </g>
          ))}
          {X_TICKS.map((t) => (
            <text key={t} x={lx(t)} y={m.top + ph + 18} textAnchor="middle" className="fill-muted font-mono text-[10px]">
              {formatTokensM(t)}
            </text>
          ))}
          <text x={m.left + pw / 2} y={height - 2} textAnchor="middle" className="fill-muted text-[10px]">
            Tokens per month (log scale)
          </text>

          {/* Series */}
          {ORDER.map((id) => (
            <path
              key={id}
              d={path(id)}
              fill="none"
              stroke={STROKE[id]}
              strokeWidth={2}
              strokeLinejoin="round"
              style={{ transition: "d 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
            />
          ))}

          {/* End labels */}
          {endLabels.map(({ id, y }) => (
            <g key={id}>
              <circle cx={m.left + pw + 8} cy={y} r={3.5} fill={STROKE[id]} />
              <text x={m.left + pw + 15} y={y} dy="0.32em" className="fill-ink-2 text-[11px] font-medium">
                {meta[id].short}
              </text>
            </g>
          ))}

          {/* Crossovers */}
          {markers.map((mk) => {
            const anchor = mk.x < m.left + 90 ? "start" : mk.x > m.left + pw - 90 ? "end" : "middle";
            return (
              <g key={mk.key} style={{ transition: "transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)", transform: `translate(${mk.x}px, ${mk.y}px)` }}>
                <circle r={5.5} fill="var(--surface)" stroke="var(--brand)" strokeWidth={2.5} />
                <text
                  y={mk.key === "api" ? -12 : 20}
                  textAnchor={anchor}
                  className="fill-brand-ink text-[11px] font-semibold"
                  style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 4, strokeLinejoin: "round" }}
                >
                  {mk.label}
                </text>
              </g>
            );
          })}

          {/* You are here */}
          <g style={{ transition: "transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)", transform: `translateX(${lx(current)}px)` }}>
            <line y1={m.top} y2={m.top + ph} stroke="var(--ink)" strokeWidth={1.5} strokeDasharray="4 4" />
            <text y={m.top - 6} textAnchor="middle" className="fill-ink font-mono text-[10px] font-semibold">
              {formatTokensM(current)}
            </text>
            {ORDER.map((id) => (
              <circle
                key={id}
                cy={ly(currentCosts[id].monthly)}
                r={4.5}
                fill={STROKE[id]}
                stroke="var(--surface)"
                strokeWidth={2}
                style={{ transition: "cy 0.7s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
              />
            ))}
          </g>

          {/* Hover crosshair */}
          {hoverV !== null && (
            <line x1={lx(hoverV)} x2={lx(hoverV)} y1={m.top} y2={m.top + ph} stroke="var(--brand)" strokeWidth={1} />
          )}
          <rect
            x={m.left}
            y={m.top}
            width={Math.max(0, pw)}
            height={Math.max(0, ph)}
            fill="transparent"
            onPointerMove={(e) => {
              const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
              setHoverV(vFromX(e.clientX - box.left));
            }}
            onPointerLeave={() => setHoverV(null)}
          />
        </svg>

        {hoverV !== null && hoverCosts && (
          <div
            role="tooltip"
            className="pointer-events-none absolute top-2 z-10 w-52 rounded-xl bg-panel px-3 py-2.5 text-xs text-panel-ink"
            style={{ left: Math.min(Math.max(lx(hoverV) + 12, 0), width - 212) }}
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-panel-muted">{formatTokensM(hoverV)} tokens / month</p>
            <ul className="mt-1.5 space-y-1">
              {ORDER.map((id) => (
                <li key={id} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: STROKE[id] }} aria-hidden />
                    {meta[id].short}
                    {cheapest(hoverCosts) === id && <span className="text-panel-muted">· cheapest</span>}
                  </span>
                  <span className="font-mono">{formatUsd(hoverCosts[id].monthly)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowTable((s) => !s)}
        aria-expanded={showTable}
        className="mt-3 text-xs font-medium text-brand-ink underline underline-offset-2"
      >
        {showTable ? "Hide table" : "View as table"}
      </button>
      {showTable && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
                <th className="py-2 font-medium">Tokens / month</th>
                {ORDER.map((id) => (
                  <th key={id} className="py-2 text-right font-medium">
                    {meta[id].short}
                  </th>
                ))}
                <th className="py-2 text-right font-medium">Cheapest</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {TABLE_VOLUMES.map((v) => {
                const c = compare({ ...workload, tokensM: v }, assumptions);
                return (
                  <tr key={v} className="border-b border-line/70">
                    <td className="py-2">{formatTokensM(v)}</td>
                    {ORDER.map((id) => (
                      <td key={id} className="py-2 text-right">
                        {formatUsd(c[id].monthly)}
                      </td>
                    ))}
                    <td className="py-2 text-right font-sans">{meta[cheapest(c)].short}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
