import { useEffect, useRef, useState } from "react";
import { PHASE_COLOR } from "./ui";
import { MILESTONES, formatMonth, monthIndex, type PhasePlan } from "@/lib/model";

const TODAY = monthIndex(new Date().toISOString().slice(0, 10));

/**
 * Each phase's milestones as bars from construction start to completion. The critical milestone (the one go-live
 * waits for) gets an ink outline and a label; slips show as a hatched extension; commissioning follows the last
 * dependency. Diamonds mark the public target, dots the public go-live date.
 */
export function Gantt({ plans }: { plans: PhasePlan[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  const [table, setTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(Math.max(300, el.clientWidth));
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(300, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const narrow = width < 560;
  const labelW = narrow ? 104 : 168;
  const rowH = 20;
  const phaseH = 30;
  const t0 = Math.floor(Math.min(...plans.map((p) => monthIndex(p.phase.start)))) - 1;
  const ends = plans.flatMap((p) => [p.now.live, p.base.live, p.phase.target ? monthIndex(p.phase.target.date) : 0, p.phase.actual ? monthIndex(p.phase.actual.date) : 0]);
  const t1 = Math.ceil(Math.max(...ends, TODAY)) + 2;
  const pw = width - labelW - 12;
  const x = (m: number) => labelW + ((m - t0) / (t1 - t0)) * pw;

  let y = 28;
  const rows = plans.map((p, i) => {
    const top = y;
    y += phaseH + MILESTONES.length * rowH + 14;
    return { p, i, top };
  });
  const height = y + 4;
  const years: number[] = [];
  for (let m = Math.ceil(t0 / 12) * 12; m <= t1; m += 12) years.push(m);

  return (
    <figure className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <p className="kicker">Timeline</p>
      <figcaption className="mt-1 text-lg font-bold tracking-tight">What each phase is waiting on</figcaption>
      <div ref={wrapRef} className="mt-4 w-full min-w-0">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label={plans.map((p) => `${p.phase.name}: live ${formatMonth(p.now.live)}, waiting on ${MILESTONES.find((m) => m.id === p.now.critical)!.label}`).join(". ")}>
          <defs>
            <pattern id="slip" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--sunken)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--risk)" strokeWidth="2.5" />
            </pattern>
          </defs>
          {years.map((m) => (
            <g key={m}>
              <line x1={x(m)} x2={x(m)} y1={18} y2={height} stroke="var(--line)" />
              <text x={x(m) + 4} y={12} className="fill-muted font-mono text-[10px]">
                {2000 + m / 12}
              </text>
            </g>
          ))}
          {TODAY > t0 && TODAY < t1 && (
            <g>
              <line x1={x(TODAY)} x2={x(TODAY)} y1={18} y2={height} stroke="var(--ink)" strokeDasharray="3 3" />
              <text x={x(TODAY) - 4} y={12} textAnchor="end" className="fill-ink font-mono text-[10px] font-semibold">
                today
              </text>
            </g>
          )}

          {rows.map(({ p, i, top }) => {
            const start = monthIndex(p.phase.start);
            const lastDep = Math.max(...p.now.deps.map((d) => d.at));
            const color = PHASE_COLOR[i]!;
            return (
              <g key={p.phase.id}>
                {/* Phase bar: construction, then commissioning */}
                <text x={0} y={top + 19} className="fill-ink text-[12px] font-bold">
                  {p.phase.name}
                </text>
                <rect x={x(start)} y={top + 6} width={Math.max(2, x(lastDep) - x(start))} height={18} rx={4} fill={color} />
                <rect x={x(lastDep)} y={top + 6} width={Math.max(2, x(p.now.live) - x(lastDep))} height={18} rx={4} fill={color} opacity={0.45} />
                <text x={Math.min(x(p.now.live) + 6, width - 70)} y={top + 19} className="fill-ink font-mono text-[11px] font-semibold">
                  {formatMonth(p.now.live)}
                </text>
                {p.phase.target && (
                  <g transform={`translate(${x(monthIndex(p.phase.target.date))}, ${top + 15})`}>
                    <path d="M0,-7 L7,0 L0,7 L-7,0 Z" fill="var(--surface)" stroke="var(--ink)" strokeWidth={2} />
                    <title>{p.phase.target.label}</title>
                  </g>
                )}
                {p.phase.actual && (
                  <circle cx={x(monthIndex(p.phase.actual.date))} cy={top + 15} r={5.5} fill="var(--ink)" stroke="var(--surface)" strokeWidth={2}>
                    <title>{p.phase.actual.label}</title>
                  </circle>
                )}

                {/* Milestones */}
                {p.now.deps.map((d, k) => {
                  const m = MILESTONES.find((mm) => mm.id === d.id)!;
                  const ry = top + phaseH + k * rowH;
                  const planned = d.at - d.slip;
                  const critical = d.id === p.now.critical;
                  return (
                    <g key={d.id}>
                      <title>
                        {`${m.label}: ${formatMonth(d.at)}${d.slip ? ` (slipped ${d.slip} mo)` : ""}${critical ? " · critical path" : ` · ${d.slack.toFixed(1)} months of slack`}`}
                      </title>
                      <text x={narrow ? 6 : 12} y={ry + 13} className={`text-[11px] ${critical ? "fill-ink font-semibold" : "fill-ink-2"}`}>
                        {narrow ? m.label.split(" ")[0] : m.label}
                      </text>
                      <rect x={x(start)} y={ry + 4} width={Math.max(2, x(planned) - x(start))} height={11} rx={3} fill={color} opacity={critical ? 0.9 : 0.3} stroke={critical ? "var(--ink)" : "none"} strokeWidth={2} />
                      {d.slip > 0 && <rect x={x(planned)} y={ry + 4} width={Math.max(2, x(d.at) - x(planned))} height={11} rx={3} fill="url(#slip)" stroke="var(--risk)" strokeWidth={1} />}
                      {critical && (
                        <text x={Math.min(x(d.at) + 6, width - 54)} y={ry + 13} className="fill-ink font-mono text-[10px] font-semibold">
                          critical
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-2">
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-sm border-2 border-ink bg-sunken" aria-hidden /> Critical path (go-live waits on it)
        </li>
        <li className="flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-sm border border-risk" style={{ background: "repeating-linear-gradient(45deg, var(--risk) 0 2px, transparent 2px 5px)" }} aria-hidden /> Slip
        </li>
        <li className="flex items-center gap-1.5">
          <svg viewBox="-8 -8 16 16" className="size-3" aria-hidden>
            <path d="M0,-6 L6,0 L0,6 L-6,0 Z" fill="none" stroke="var(--ink)" strokeWidth={2} />
          </svg>{" "}
          Public target
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-ink" aria-hidden /> Public go-live
        </li>
        <li>Lighter end of each bar: commissioning</li>
      </ul>
      <button type="button" onClick={() => setTable((v) => !v)} aria-expanded={table} className="mt-3 text-xs font-medium text-ink underline decoration-brand decoration-2 underline-offset-2">
        {table ? "Hide table" : "View as table"}
      </button>
      {table && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
                <th className="py-2 font-medium">Phase</th>
                <th className="py-2 font-medium">Milestone</th>
                <th className="py-2 font-medium">Done by</th>
                <th className="py-2 text-right font-medium">Slack</th>
              </tr>
            </thead>
            <tbody>
              {plans.flatMap((p) =>
                p.now.deps.map((d) => (
                  <tr key={`${p.phase.id}-${d.id}`} className="border-b border-line/70">
                    <td className="py-2">{p.phase.name}</td>
                    <td className="py-2">{MILESTONES.find((m) => m.id === d.id)!.label}</td>
                    <td className="py-2 font-mono">{formatMonth(d.at)}</td>
                    <td className="py-2 text-right font-mono">{d.id === p.now.critical ? "critical" : `${d.slack.toFixed(1)} mo`}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
