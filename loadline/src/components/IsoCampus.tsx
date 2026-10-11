import { linkClick } from "./Frame";
import { formatMonth, formatMw, monthIndex, type PhasePlan } from "@/lib/model";

const TODAY = monthIndex(new Date().toISOString().slice(0, 10));

/** Night campus colours (Control room). */
const C = {
  plot: "#18262f",
  road: "#1b2a34",
  dash: "#2f4350",
  top: "#3a4a55",
  left: "#26343d",
  right: "#2e3d47",
  lit: "#35d0c0",
  litTop: "#2b6f69",
  build: "#f2b44c",
  treeTop: "#2a8a66",
  trunk: "#3d4a40",
  white: "#e8eef1",
  panel: "#2c3d55",
};

/* ---------- Isometric projection: x runs down-right, y down-left, z up ---------- */
const U = 20;
const P = (x: number, y: number, z = 0): [number, number] => [(x - y) * U * 0.866, (x + y) * U * 0.5 - z * U];
const pts = (arr: [number, number, number][]) => arr.map(([x, y, z]) => P(x, y, z).map((n) => n.toFixed(1)).join(",")).join(" ");

function Box({ x, y, w, d, h, top = C.top, ghost = false }: { x: number; y: number; w: number; d: number; h: number; top?: string; ghost?: boolean }) {
  const stroke = { stroke: "rgba(0,0,0,.12)", strokeWidth: 0.6, strokeDasharray: ghost ? "4 3" : undefined };
  return (
    <g opacity={ghost ? 0.55 : 1}>
      <polygon points={pts([[x, y + d, 0], [x + w, y + d, 0], [x + w, y + d, h], [x, y + d, h]])} fill={C.left} {...stroke} />
      <polygon points={pts([[x + w, y, 0], [x + w, y + d, 0], [x + w, y + d, h], [x + w, y, h]])} fill={C.right} {...stroke} />
      <polygon points={pts([[x, y, h], [x + w, y, h], [x + w, y + d, h], [x, y + d, h]])} fill={top} {...stroke} />
    </g>
  );
}

function Tree({ x, y }: { x: number; y: number }) {
  const [sx, sy] = P(x, y);
  return (
    <g>
      <line x1={sx} y1={sy} x2={sx} y2={sy - 10} stroke={C.trunk} strokeWidth={2} />
      <circle cx={sx} cy={sy - 15} r={7} fill={C.treeTop} />
    </g>
  );
}

function Turbine({ x, y, delay }: { x: number; y: number; delay: number }) {
  const [sx, sy] = P(x, y);
  return (
    <g>
      <line x1={sx} y1={sy} x2={sx} y2={sy - 62} stroke={C.white} strokeWidth={2} />
      <g className="iso-spin" style={{ animationDelay: `-${delay}s` }}>
        <circle cx={sx} cy={sy - 62} r={2.5} fill={C.white} />
        {[0, 120, 240].map((a) => (
          <line key={a} x1={sx} y1={sy - 62} x2={sx + 22 * Math.cos((a * Math.PI) / 180)} y2={sy - 62 + 22 * Math.sin((a * Math.PI) / 180)} stroke={C.white} strokeWidth={2.2} strokeLinecap="round" />
        ))}
      </g>
    </g>
  );
}

/** A floating page label with a leader line; the whole label is a link. */
function Label({ x, y, z, text, to }: { x: number; y: number; z: number; text: string; to: string }) {
  const [sx, sy] = P(x, y, z);
  return (
    <a href={to} onClick={linkClick(to)} className="iso-label">
      <line x1={sx} y1={sy} x2={sx} y2={sy - 26} stroke={C.white} strokeOpacity={0.5} />
      <rect x={sx - text.length * 5.2 - 10} y={sy - 50} width={text.length * 10.4 + 20} height={24} rx={4} fill="#0d1418" fillOpacity={0.75} stroke={C.lit} strokeOpacity={0.5} />
      <text x={sx} y={sy - 33} textAnchor="middle" fontSize={14} fill={C.white} className="font-display" fontWeight={700} letterSpacing="0.08em">
        {text.toUpperCase()}
      </text>
    </a>
  );
}

/**
 * The campus at night, drawn from the plan: one hall per building, lit when its phase is live and scaffolded (with a crane)
 * while it's still being built, all fed by one substation, with power flowing along the lines. The substation, the newest
 * halls, the clock tower and the office are labelled links to the four pages.
 */
export function IsoCampus({ plans, links }: { plans: PhasePlan[]; links: { power: string; timeline: string; delays: string; brief: string } }) {
  const halls = plans
    .flatMap((p, pi) => Array.from({ length: p.phase.buildings }, (_, k) => ({ p, pi, k, live: p.now.live <= TODAY })))
    .map((h, i) => ({ ...h, x: 1 + (i % 4) * 5.2, y: 1 + Math.floor(i / 4) * 4.4 }));
  const facility = plans.reduce((n, p) => n + p.facilityMw, 0);
  const firstBuild = halls.find((h) => !h.live);
  const lastHall = halls[halls.length - 1]!;
  const sx = 24.5;
  const sy = -0.5;

  // Painter's order: things further back (smaller x + y) first.
  const items: [number, React.ReactNode][] = [];
  halls.forEach((h, i) => {
    const W = 4.2;
    const D = 3;
    const H = 1.3;
    items.push([
      h.x + h.y,
      <g key={`hall-${i}`} className="iso-bld">
        <title>
          {h.p.phase.name}, building {h.k + 1}: {h.live ? `live since ${formatMonth(h.p.now.live)}` : `live ${formatMonth(h.p.now.live)}`}
        </title>
        {h.live ? (
          <>
            <Box x={h.x} y={h.y} w={W} d={D} h={H} top={C.litTop} />
            <polygon points={pts([[h.x + 0.3, h.y + D, 0.45], [h.x + W - 0.3, h.y + D, 0.45], [h.x + W - 0.3, h.y + D, 0.75], [h.x + 0.3, h.y + D, 0.75]])} fill={C.lit} opacity={0.85} />
            <polygon points={pts([[h.x + W, h.y + 0.3, 0.45], [h.x + W, h.y + D - 0.3, 0.45], [h.x + W, h.y + D - 0.3, 0.75], [h.x + W, h.y + 0.3, 0.75]])} fill={C.lit} opacity={0.6} />
            {[0, 1, 2].map((k) => (
              <Box key={k} x={h.x + 0.5 + k * 1.2} y={h.y + 0.8} w={0.7} d={0.7} h={H + 0.35} />
            ))}
          </>
        ) : (
          <>
            <Box x={h.x} y={h.y} w={W} d={D} h={H * 0.7} ghost />
            {[0, 1, 2, 3, 4].map((k) => {
              const [a, b] = P(h.x + (k * W) / 4, h.y + D, 0);
              const [a2, b2] = P(h.x + (k * W) / 4, h.y + D, H);
              return <line key={k} x1={a} y1={b} x2={a2} y2={b2} stroke={C.build} strokeWidth={1} />;
            })}
          </>
        )}
      </g>,
    ]);
  });
  if (firstBuild) {
    const bx = firstBuild.x + 4.6;
    const by = firstBuild.y + 1.2;
    const [x0, y0] = P(bx, by, 0);
    const [x1, y1] = P(bx, by, 4.2);
    const [x2, y2] = P(bx - 4, by, 4.2);
    items.push([
      bx + by + 0.5,
      <g key="crane">
        <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={C.build} strokeWidth={3} />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.build} strokeWidth={2.5} />
        <line x1={x2 + 16} y1={y2 + 8} x2={x2 + 16} y2={y2 + 40} stroke={C.build} strokeWidth={1} />
        <circle cx={x1} cy={y1} r={3} fill={C.build} className="iso-blink" />
      </g>,
    ]);
  }
  items.push([
    sx + sy,
    <g key="substation" className="iso-bld">
      <title>Substation: {formatMw(facility)} of facility power</title>
      <Box x={sx} y={sy} w={5} d={4} h={0.12} top={C.road} />
      {[0, 1, 2].map((k) => (
        <Box key={`t${k}`} x={sx + 0.6 + k * 1.5} y={sy + 0.8} w={1} d={1.1} h={1.2} />
      ))}
      {[0, 1, 2].map((k) => (
        <Box key={`p${k}`} x={sx + 0.8 + k * 1.5} y={sy + 2.6} w={0.5} d={0.5} h={2.2} />
      ))}
    </g>,
  ]);
  items.push([
    15,
    <g key="hq" className="iso-bld">
      <title>Recommendation</title>
      <Box x={0.5} y={13.5} w={3} d={3} h={4.2} />
      <Box x={0.9} y={13.9} w={2.2} d={2.2} h={4.8} top={C.litTop} />
    </g>,
  ]);
  const [tx, ty] = P(9.4, 16.4, 5.2);
  items.push([
    25,
    <g key="tower" className="iso-bld">
      <title>Cost of delay</title>
      <Box x={8.9} y={15.8} w={1.3} d={1.3} h={5.6} />
      <circle cx={tx} cy={ty} r={7} fill={C.top} stroke={C.lit} strokeWidth={1.6} />
      <line x1={tx} y1={ty} x2={tx} y2={ty - 5} stroke={C.white} strokeWidth={1.4} className="iso-spin" style={{ animationDuration: "6s" }} />
    </g>,
  ]);
  ([[5, 18.5], [13, 18], [14.5, 14.5], [25, 18.5], [27, 9], [29, 13], [-1, 10], [6, 13.5], [24, 14]] as const).forEach(([x, y]) => items.push([x + y, <Tree key={`tree-${x}-${y}`} x={x} y={y} />]));
  ([[30.5, -1], [30.5, 4], [30.5, 9]] as const).forEach(([x, y], i) => items.push([x + y + 1, <Turbine key={`wt-${i}`} x={x} y={y} delay={i} />]));
  items.push([
    31,
    <g key="solar">
      {[0, 1].flatMap((r) => [0, 1, 2, 3].map((k) => <Box key={`${r}-${k}`} x={17 + k * 1.6} y={14 + r * 1.6} w={1.3} d={0.9} h={0.15} top={C.panel} />))}
    </g>,
  ]);
  items.sort((a, b) => a[0] - b[0]);

  // Roads around the plot
  const roads = (
    [
      [-2, -3.4, 30, -3.4],
      [-3.4, -2, -3.4, 20],
      [-2, 21.4, 30, 21.4],
    ] as const
  ).map(([ax, ay, bx, by], i) => {
    const w = 1.6;
    const horizontal = ay === by;
    const poly: [number, number, number][] = horizontal
      ? [[ax, ay - w / 2, 0], [bx, by - w / 2, 0], [bx, by + w / 2, 0], [ax, ay + w / 2, 0]]
      : [[ax - w / 2, ay, 0], [ax + w / 2, ay, 0], [bx + w / 2, by, 0], [bx - w / 2, by, 0]];
    const [x1, y1] = P(ax, ay);
    const [x2, y2] = P(bx, by);
    return (
      <g key={i}>
        <polygon points={pts(poly)} fill={C.road} />
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.dash} strokeWidth={1.2} strokeDasharray="8 8" />
      </g>
    );
  });

  // Power lines from the substation to each hall
  const wires = halls.map((h, i) => {
    const [a, b] = P(sx + 0.9, sy + 2.8, 2.2);
    const [c2, d2] = P(h.x + 2, h.y + 1.5, 1.5);
    return (
      <path
        key={i}
        d={`M${a} ${b} Q ${(a + c2) / 2} ${Math.min(b, d2) - 30} ${c2} ${d2}`}
        fill="none"
        stroke={h.live ? C.lit : C.build}
        strokeOpacity={h.live ? 0.8 : 0.35}
        strokeWidth={1.4}
        className={h.live ? "iso-flow" : undefined}
      />
    );
  });

  const [t0x, t0y] = P(-2, 21.4);
  const [t1x, t1y] = P(30, 21.4);
  const [minX] = P(-4, 22);
  const [maxX] = P(31, -4);
  const [, minY] = P(-4, -4, 8);
  const [, maxY] = P(31, 23);
  const build = firstBuild ?? lastHall;
  const live = halls.filter((h) => h.live).length;

  return (
    <svg
      viewBox={`${minX - 220} ${minY - 40} ${maxX - minX + 240} ${maxY - minY + 60}`}
      className="block h-auto w-full"
      role="img"
      aria-label={`Campus: ${live} of ${halls.length} buildings live, ${formatMw(facility)} substation. ${plans.map((p) => `${p.phase.name}: ${p.phase.buildings} building${p.phase.buildings === 1 ? "" : "s"}, live ${formatMonth(p.now.live)}`).join("; ")}.`}
    >
      <polygon points={pts([[-2, -2, 0], [30, -2, 0], [30, 20, 0], [-2, 20, 0]])} fill={C.plot} />
      {roads}
      {wires}
      {items.map(([, node]) => node)}
      <g className="iso-truck" style={{ ["--dx" as string]: `${t1x - t0x}px`, ["--dy" as string]: `${t1y - t0y}px` }}>
        <g transform={`translate(${t0x} ${t0y - 6})`}>
          <rect x={-9} y={-6} width={18} height={9} rx={1.5} fill={C.white} />
          <rect x={7} y={-4} width={6} height={7} rx={1} fill={C.build} />
        </g>
      </g>
      <Label x={sx + 2.5} y={sy + 2} z={2.6} text="Power demand" to={links.power} />
      <Label x={build.x + 2} y={build.y + 1.5} z={firstBuild ? 4.6 : 1.9} text="Delivery schedule" to={links.timeline} />
      <Label x={9.5} y={16.4} z={6.6} text="Cost of delay" to={links.delays} />
      <Label x={2} y={15} z={5.4} text="Recommendation" to={links.brief} />
    </svg>
  );
}
