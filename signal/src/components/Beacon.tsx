/** Deterministic pseudo-random 0–1, so a country's crowd always lands in the same places. */
const rnd = (i: number, k: number) => {
  const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/** A round number of people per dot that keeps the plain under about 600 dots. */
export function beaconPerDot(total: number) {
  const steps = [1e4, 2e4, 5e4, 1e5, 2e5, 5e5, 1e6, 2e6, 5e6, 1e7];
  return steps.find((s) => s >= total / 600) ?? 2e7;
}

export const BEACON_COLORS = { online: "#ffd56b", covered: "#4fa3b0", noSignal: "#c4b5e6" };

/**
 * The landing's beacon: one lit tower alone on a wide plain under a dusk sky. The plain is dotted with the country's
 * people, a round number per dot: lit gold nearest the tower (online), teal further out (a signal but not online), lilac
 * at the edges (no signal). Static: nothing moves.
 */
export function Beacon({ online, covered, noSignal, ariaLabel }: { online: number; covered: number; noSignal: number; ariaLabel: string }) {
  const W = 1200;
  const H = 700;
  const tx = 600;
  const hy = 430;
  const pop = online + covered + noSignal;
  const per = beaconPerDot(pop);
  const n = Math.max(1, Math.round(pop / per));
  const nOn = Math.round(online / per);
  const nCov = Math.round(covered / per);
  const pts = Array.from({ length: n }, (_, i) => {
    const a = (rnd(i, 1) - 0.5) * Math.PI * 0.95;
    const d = rnd(i, 2) ** 0.8;
    return [tx + Math.sin(a) * d * 640, hy + 14 + Math.cos(a) * d * 230 * (0.4 + d * 0.6)] as const;
  }).sort((p, q) => Math.hypot((p[0] - tx) / 3, p[1] - hy) - Math.hypot((q[0] - tx) / 3, q[1] - hy));
  const top = hy - 190;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full" role="img" aria-label={ariaLabel}>
      <defs>
        <linearGradient id="beacon-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#061c21" />
          <stop offset=".6" stopColor="#173f47" />
          <stop offset="1" stopColor="#a7764a" />
        </linearGradient>
        <radialGradient id="beacon-glow">
          <stop offset="0" stopColor="#ffd56b" stopOpacity=".95" />
          <stop offset=".4" stopColor="#e9a91c" stopOpacity=".35" />
          <stop offset="1" stopColor="#e9a91c" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="beacon-pool" cx=".5" cy="0" r=".7">
          <stop offset="0" stopColor="#e9a91c" stopOpacity=".28" />
          <stop offset="1" stopColor="#e9a91c" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={W} height={hy} fill="url(#beacon-sky)" />
      <rect y={hy} width={W} height={H - hy} fill="#0b2a30" />
      <ellipse cx={tx} cy={hy} rx={520} ry={200} fill="url(#beacon-pool)" />
      <line x1={0} y1={hy} x2={W} y2={hy} stroke="#d9a76a" strokeOpacity={0.5} />
      {pts.map(([x, y], i) => (
        <circle
          key={i}
          cx={x.toFixed(1)}
          cy={y.toFixed(1)}
          r={(1.2 + ((y - hy) / 260) * 2.4).toFixed(2)}
          fill={i < nOn ? BEACON_COLORS.online : i < nOn + nCov ? BEACON_COLORS.covered : BEACON_COLORS.noSignal}
          opacity={i < nOn ? 0.95 : 0.75}
        />
      ))}
      <circle cx={tx} cy={top} r={120} fill="url(#beacon-glow)" />
      <g stroke="#0a2328">
        <line x1={tx - 14} y1={hy} x2={tx} y2={top} strokeWidth={3} />
        <line x1={tx + 14} y1={hy} x2={tx} y2={top} strokeWidth={3} />
        {[0.25, 0.5, 0.75].map((k) => (
          <line key={k} x1={tx - 14 * (1 - k)} y1={hy - 190 * k} x2={tx + 14 * (1 - k)} y2={hy - 190 * k} strokeWidth={2} />
        ))}
      </g>
      <circle cx={tx} cy={top} r={40} fill="url(#beacon-glow)" />
      <circle cx={tx} cy={top} r={5} fill="#ffe7a8" />
    </svg>
  );
}
