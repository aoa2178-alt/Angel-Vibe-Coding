import { useState } from "react";
import { Replay, anim, useInView } from "./Motion";

export interface ReachPart {
  label: string;
  value: number;
  color: string;
}

/**
 * Signal reach: a tower with the population drawn as arcs around it. The bands inside the signal are people who are
 * online, then people with a signal who aren't; the faded band beyond the black arc is people with no signal at all.
 * Each band's area is proportional to its share of the population. Parts are expected in that order (inside out).
 */
export function Reach({ parts, format, ariaLabel }: { parts: ReachPart[]; format: (v: number) => string; ariaLabel: string }) {
  const [run, setRun] = useState(0);
  const view = useInView<HTMLElement>();
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  const W = 720;
  const H = 330;
  const cx = W / 2;
  const cy = H - 26;
  const r0 = 34;
  const R = 300;
  // Radius for a cumulative share, so each band's area matches its share of people.
  const radius = (share: number) => Math.sqrt(r0 * r0 + share * (R * R - r0 * r0));
  let cum = 0;
  const bands = parts.map((p) => {
    const inner = radius(cum);
    cum += p.value / total;
    return { ...p, inner, outer: radius(cum) };
  });
  const arc = (r: number) => `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const last = bands.length - 1;

  return (
    <figure ref={view.ref} className={`min-w-0 ${view.paused}`}>
      <svg key={run} viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-4xl" role="img" aria-label={ariaLabel}>
        {/* Each band as one thick wave, with a small gap between bands, rippling out from the tower */}
        {bands.map((band, i) => (
          <path
            key={band.label}
            d={arc((band.inner + band.outer) / 2)}
            fill="none"
            stroke={band.color}
            strokeWidth={Math.max(12, band.outer - band.inner - 8)}
            strokeOpacity={i === last ? 0.45 : 1}
            style={anim("fade", 450, 150 + i * 300)}
          />
        ))}
        {/* Where the signal ends */}
        <path d={arc(bands[last]?.inner ?? R)} fill="none" stroke="var(--ink)" strokeWidth="1.5" style={anim("fade", 500, 900)} />
        <line x1={0} x2={W} y1={cy} y2={cy} stroke="var(--line)" />
        {/* The tower */}
        <g style={anim("rise", 500, 0)}>
          <path d={`M ${cx} ${cy} V ${cy - 26}`} stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
          <circle cx={cx} cy={cy - 30} r="6" fill="var(--accent)" stroke="var(--ink)" strokeWidth="2" />
        </g>
        {bands.map((b, i) => {
          const r = (b.inner + b.outer) / 2;
          const angle = Math.PI * (0.3 + i * 0.12);
          // The outer (no-signal) label sits just outside the faded band.
          const x = i === last ? cx - b.outer - 22 : cx + r * Math.cos(Math.PI - angle);
          const y = i === last ? cy - 30 : cy - r * Math.sin(Math.PI - angle);
          // White on the deep teal band; dark ink on the light yellow band and outside.
          return (
            <text key={b.label} x={x} y={y} textAnchor={i === last ? "end" : "middle"} fontSize="17" fontWeight="600" fill={i === 0 ? "#ffffff" : "var(--ink)"} fontFamily="var(--font-sans)" style={anim("fade", 400, 700 + i * 260)}>
              {Math.round((b.value / total) * 100)}%
            </text>
          );
        })}
      </svg>
      <figcaption className="mt-3 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
        {parts.map((p, k) => (
          <span key={p.label} className="flex items-start gap-1.5" style={anim("rise", 400, 1100 + k * 120, "back")}>
            <span
              className="mt-0.5 size-3 shrink-0 rounded-sm"
              style={{ background: p.color, opacity: k === last ? 0.45 : 1 }}
              aria-hidden
            />
            <span>
              <span className="text-ink-2">{p.label}</span> <span className="font-mono font-semibold">{format(p.value)}</span>{" "}
              <span className="text-muted">({Math.round((p.value / total) * 100)}%)</span>
            </span>
          </span>
        ))}
      </figcaption>
      <p className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>Band areas are proportional to people; the solid arc marks where the signal ends.</span>
        <Replay onClick={() => setRun((v) => v + 1)} />
      </p>
    </figure>
  );
}
