/** Deterministic pseudo-random 0–1, so the skyline doesn't change between renders. */
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const PANO = { online: "#0b4f5c", covered: "#4fa3b0", noSignal: "#c4b5e6", lit: "#e9a91c" };

/**
 * The access gap as a landscape, left to right in proportion to the population: a lit city (online), teal villages with a
 * signal but not online, then the tower where the signal ends and lilac villages beyond it (no signal). Each group is
 * labelled on the ground with its count.
 */
export function Panorama({
  online,
  covered,
  noSignal,
  format,
  ariaLabel,
}: {
  online: number;
  covered: number;
  noSignal: number;
  format: (v: number) => string;
  ariaLabel: string;
}) {
  const W = 1200;
  const base = 300;
  const H = 400;
  const pop = online + covered + noSignal || 1;
  const x0 = 40;
  const span = W - 80;
  const x1 = x0 + (online / pop) * span;
  const x2 = x0 + ((online + covered) / pop) * span;

  const city = [];
  for (let x = x0 + 6, i = 0; x < x1 - 14; x += 22, i++) {
    const h = 26 + rnd(i, 1) * (x < x0 + (x1 - x0) * 0.6 ? 120 : 55);
    city.push(
      <g key={`c${i}`}>
        <rect x={x} y={base - h} width={18} height={h} fill={PANO.online} />
        {Array.from({ length: Math.floor(h / 14) }, (_, j) => (
          <g key={j}>
            <rect x={x + 4} y={base - h + 6 + j * 14} width={4} height={5} fill={PANO.lit} opacity={0.9} />
            <rect x={x + 10} y={base - h + 6 + j * 14} width={4} height={5} fill={PANO.lit} opacity={rnd(i, j + 3) > 0.3 ? 0.9 : 0.2} />
          </g>
        ))}
      </g>,
    );
  }
  const house = (x: number, y: number, w: number, color: string, key: string) => (
    <g key={key} fill={color}>
      <rect x={x} y={y - w * 0.66} width={w} height={w * 0.66} />
      <path d={`M${x - 2} ${y - w * 0.66} L${x + w / 2} ${y - w * 1.1} L${x + w + 2} ${y - w * 0.66}Z`} />
    </g>
  );
  const mid = [];
  for (let x = x1 + 10, i = 0; x < x2 - 22; x += 32, i++) mid.push(house(x, base - rnd(i, 7) * 5, 18, PANO.covered, `m${i}`));
  const far = [];
  for (let x = x2 + 20, i = 0; x < W - 30; x += 30, i++) far.push(house(x, base - rnd(i, 9) * 4, 14, "#a796d4", `f${i}`));
  const tH = 140;
  const label = (x: number, title: string, value: string, color: string, anchor: "start" | "end" = "start") => (
    <g>
      <text x={x} y={base + 34} fontSize={14} textAnchor={anchor} className="fill-ink-2">
        {title}
      </text>
      <text x={x} y={base + 60} fontSize={22} fontWeight={600} textAnchor={anchor} fill={color} className="font-mono">
        {value}
      </text>
    </g>
  );
  // Keep the last label inside the frame when the no-signal stretch is short.
  const farAnchor = W - x2 < 150 ? "end" : "start";

  return (
    <figure className="min-w-0">
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id="pano-sky" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#f3f7f8" />
          <stop offset=".55" stopColor="#e7eef0" />
          <stop offset="1" stopColor="#dcd5ec" />
        </linearGradient>
        <radialGradient id="pano-glow">
          <stop offset="0" stopColor="#e9a91c" stopOpacity=".7" />
          <stop offset="1" stopColor="#e9a91c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={base} fill="url(#pano-sky)" rx={6} />
      <rect y={base} width={W} height={H - base} fill="#e3ecee" />
      <line x1={0} y1={base} x2={W} y2={base} stroke="#0f2a30" strokeOpacity={0.3} />
      {[1, 2, 3].map((k) => (
        <path key={k} d={`M ${x2 - k * 60} ${base - tH} A ${k * 60} ${k * 60} 0 0 1 ${x2 + k * 60} ${base - tH}`} fill="none" stroke={PANO.lit} strokeOpacity={0.7 - k * 0.15} strokeWidth={2} />
      ))}
      {city}
      {mid}
      {far}
      <circle cx={x2} cy={base - tH} r={36} fill="url(#pano-glow)" />
      <g stroke="#0a2328">
        <line x1={x2 - 12} y1={base} x2={x2} y2={base - tH} strokeWidth={3} />
        <line x1={x2 + 12} y1={base} x2={x2} y2={base - tH} strokeWidth={3} />
        {[0.25, 0.5, 0.75].map((k) => (
          <line key={k} x1={x2 - 12 * (1 - k)} y1={base - tH * k} x2={x2 + 12 * (1 - k)} y2={base - tH * k} strokeWidth={2} />
        ))}
      </g>
      <circle cx={x2} cy={base - tH} r={4.5} fill="#ffe7a8" />
      <line x1={x2} y1={base + 6} x2={x2} y2={base + 70} stroke="#0f2a30" strokeDasharray="3 3" strokeOpacity={0.5} />
      <line x1={x1} y1={base + 6} x2={x1} y2={base + 70} stroke="#0f2a30" strokeDasharray="3 3" strokeOpacity={0.3} />
      {label(x0, "Online", format(online), PANO.online)}
      {x2 - x1 > 120 && label(x1 + 10, "Signal, not online", format(covered), "#2f7f8c")}
      {label(farAnchor === "end" ? W - 40 : x2 + 14, "No signal", format(noSignal), "#6b5a9e", farAnchor)}
    </svg>
      {/* On a phone the labels in the drawing get small: repeat them as a legend. */}
      <dl className="mt-3 grid gap-1 text-sm sm:hidden">
        {(
          [
            ["Online", online, PANO.online],
            ["Signal, not online", covered, PANO.covered],
            ["No signal", noSignal, "#a796d4"],
          ] as const
        ).map(([k, v, color]) => (
          <div key={k} className="flex items-center justify-between gap-3">
            <dt className="inline-flex items-center gap-2 text-ink-2">
              <i className="inline-block size-2.5 rounded-[3px]" style={{ background: color }} />
              {k}
            </dt>
            <dd className="font-mono font-semibold">{format(v)}</dd>
          </div>
        ))}
      </dl>
    </figure>
  );
}
