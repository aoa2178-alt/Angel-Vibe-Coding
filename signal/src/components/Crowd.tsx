import { useState } from "react";
import { Replay, anim, useInView } from "./Motion";

export interface CrowdPart {
  label: string;
  value: number;
  color: string;
}

/** Deterministic pseudo-random 0–1 (the Motion Library's scatter), so the same dot always flies in from the same place. */
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** A round number of people per dot that keeps the crowd under about 250 dots. */
function perDot(total: number) {
  const raw = total / 250;
  const steps = [1e5, 2e5, 5e5, 1e6, 2e6, 5e6, 1e7, 2e7, 5e7];
  return steps.find((s) => s >= raw) ?? 1e8;
}

const fmt = (n: number) => (n >= 1e6 ? `${n / 1e6} million` : `${(n / 1e3).toLocaleString("en-US")} thousand`);

/**
 * Particle Figure (Macro Brief Motion Library): the population as a crowd of dots, each dot a round number of people,
 * colored by group. Dots fly in from scattered positions and settle into place, group by group.
 */
export function Crowd({ parts, format, ariaLabel }: { parts: CrowdPart[]; format: (v: number) => string; ariaLabel: string }) {
  const [run, setRun] = useState(0);
  const view = useInView<HTMLElement>();
  const total = parts.reduce((a, p) => a + p.value, 0);
  const unit = perDot(total);
  // Whole dots per group, rounding so the total matches.
  const counts = parts.map((p) => Math.round(p.value / unit));
  const cols = 25;
  const gap = 20;
  const dots: { x: number; y: number; color: string; group: number }[] = [];
  counts.forEach((c, g) => {
    for (let k = 0; k < c; k++) {
      const i = dots.length;
      dots.push({ x: 10 + (i % cols) * gap, y: 10 + Math.floor(i / cols) * gap, color: parts[g]!.color, group: g });
    }
  });
  const rows = Math.ceil(dots.length / cols);
  const W = cols * gap;
  const H = rows * gap;

  return (
    <figure ref={view.ref} className={`min-w-0 ${view.paused}`}>
      <svg key={run} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full max-w-2xl" role="img" aria-label={ariaLabel}>
        {dots.map((d, i) => (
          <circle
            key={i}
            cx={d.x}
            cy={d.y}
            r={6.5}
            fill={d.color}
            style={{
              ["--mx" as string]: `${(rnd(i, 1) - 0.5) * 420}px`,
              ["--my" as string]: `${(rnd(i, 2) - 0.5) * 260}px`,
              ...anim("assemble", 1000, 150 + d.group * 350 + rnd(i, 7) * 500, "back"),
            }}
          />
        ))}
      </svg>
      <figcaption className="mt-3 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
        {parts.map((p, k) => (
          <span key={p.label} className="flex items-start gap-1.5" style={anim("rise", 400, 1200 + k * 120, "back")}>
            <span className="mt-0.5 size-3 shrink-0 rounded-full" style={{ background: p.color }} aria-hidden />
            <span>
              <span className="text-ink-2">{p.label}</span> <span className="font-mono font-semibold">{format(p.value)}</span>{" "}
              <span className="text-muted">({Math.round((p.value / (total || 1)) * 100)}%)</span>
            </span>
          </span>
        ))}
      </figcaption>
      <p className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>Each dot is about {fmt(unit)} people.</span>
        <Replay onClick={() => setRun((v) => v + 1)} />
      </p>
    </figure>
  );
}
