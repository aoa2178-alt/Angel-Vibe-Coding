import { anim, useInView } from "./Motion";
import { PHASE_COLOR } from "./ui";
import { formatMonth, formatMw, monthIndex, type PhasePlan } from "@/lib/model";

const TODAY = monthIndex(new Date().toISOString().slice(0, 10));

/**
 * The campus as a drawing on grid paper: one block per building, coloured by phase, filled once that phase is live and
 * outlined while it's still being built, all fed from one substation sized to the campus's facility power.
 */
export function SitePlan({ plans }: { plans: PhasePlan[] }) {
  const view = useInView<HTMLDivElement>();
  const buildings = plans.flatMap((p, i) => Array.from({ length: p.phase.buildings }, (_, k) => ({ p, i, k })));
  const cols = Math.min(4, buildings.length);
  const rows = Math.ceil(buildings.length / cols);
  const bw = 112;
  const bh = 64;
  const gap = 18;
  const left = 24;
  const top = 24;
  const subX = left + cols * (bw + gap) + 34;
  const W = subX + 96;
  const H = top + rows * (bh + gap) + 6;
  const facility = plans.reduce((n, p) => n + p.facilityMw, 0);
  const label = buildings.map(({ p, k }) => `${p.phase.name} building ${k + 1}: ${p.now.live <= TODAY ? "live" : `live ${formatMonth(p.now.live)}`}`).join("; ");

  return (
    <div ref={view.ref} className={view.paused}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Site plan, ${formatMw(facility)} substation. ${label}.`}>
        <defs>
          <pattern id="site-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0H0V20" fill="none" stroke="var(--line)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={H} fill="url(#site-grid)" />
        {Array.from({ length: rows }, (_, r) => {
          const y = top + r * (bh + gap) + bh / 2;
          return <line key={r} x1={left + cols * (bw + gap) - gap} x2={subX} y1={y} y2={y} stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="4 4" />;
        })}
        {buildings.map(({ p, i, k }, n) => {
          const x = left + (n % cols) * (bw + gap);
          const y = top + Math.floor(n / cols) * (bh + gap);
          const live = p.now.live <= TODAY;
          return (
            <g key={`${p.phase.id}-${k}`} style={anim("pop", 500, 120 + n * 70, "back")} className="[transform-box:fill-box] [transform-origin:center]">
              <rect x={x} y={y} width={bw} height={bh} fill={PHASE_COLOR[i]} fillOpacity={live ? 0.28 : 0} stroke={PHASE_COLOR[i]} strokeWidth="2" strokeDasharray={live ? undefined : "5 4"} />
              <text x={x + 8} y={y + 18} fontSize="11" fill="var(--ink)" fontFamily="var(--font-mono)">
                {p.phase.name.length > 12 ? `P${i + 1}` : p.phase.name}
              </text>
              <text x={x + 8} y={y + bh - 10} fontSize="11" fill="var(--muted)" fontFamily="var(--font-mono)">
                {formatMw(p.facilityMw / p.phase.buildings)}
              </text>
            </g>
          );
        })}
        <g style={anim("fade", 600, 200)}>
          <rect x={subX} y={top} width={72} height={rows * (bh + gap) - gap} fill="var(--surface)" stroke="var(--ink)" strokeWidth="2" />
          <text x={subX + 36} y={top + 20} fontSize="10.5" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)">
            SUB-
          </text>
          <text x={subX + 36} y={top + 33} fontSize="10.5" textAnchor="middle" fill="var(--ink)" fontFamily="var(--font-mono)">
            STATION
          </text>
          <text x={subX + 36} y={top + rows * (bh + gap) - gap - 10} fontSize="11" textAnchor="middle" fill="var(--brand-ink)" fontFamily="var(--font-mono)" fontWeight="600">
            {formatMw(facility)}
          </text>
        </g>
      </svg>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted">
        {plans.map((p, i) => (
          <li key={p.phase.id} className="flex items-center gap-1.5">
            <span className="size-2.5" style={{ background: PHASE_COLOR[i] }} aria-hidden />
            {p.phase.name}: {p.phase.buildings} building{p.phase.buildings === 1 ? "" : "s"}, {p.now.live <= TODAY ? "live" : `live ${formatMonth(p.now.live)}`}
          </li>
        ))}
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 border border-dashed border-muted" aria-hidden /> Outline: under construction
        </li>
      </ul>
    </div>
  );
}
