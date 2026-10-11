import type { Product } from "@/lib/products";

// Very rough continents as polygons in a 100 × 52 box: enough for a dotted-map silhouette, not a real projection.
const LAND: [number, number][][] = [
  [[8, 8], [30, 6], [34, 14], [28, 22], [22, 26], [18, 22], [10, 16]],
  [[24, 28], [32, 28], [34, 36], [30, 48], [26, 46], [24, 36]],
  [[44, 8], [58, 6], [60, 14], [52, 18], [46, 16]],
  [[46, 20], [58, 20], [60, 32], [54, 44], [50, 42], [46, 30]],
  [[58, 6], [90, 8], [92, 20], [80, 26], [70, 24], [62, 18]],
  [[80, 34], [92, 34], [92, 42], [82, 42]],
];
const inside = ([px, py]: [number, number], poly: [number, number][]) => {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};
const DOTS: [number, number][] = [];
for (let x = 2; x < 98; x += 1.6) for (let y = 4; y < 50; y += 1.6) if (LAND.some((p) => inside([x, y], p))) DOTS.push([x, y]);

const PLACE: Record<string, { x: number; y: number; short: string }> = {
  americas: { x: 22, y: 18, short: "Americas" },
  emea: { x: 52, y: 16, short: "EMEA" },
  apac: { x: 78, y: 20, short: "APAC" },
};

/** A dotted world map with the product's regions glowing, each sized by its share of demand. */
export function WorldDots({ product }: { product: Product }) {
  return (
    <svg viewBox="0 0 100 52" className="h-full w-full" role="img" aria-label={`Regions by share of demand: ${product.regions.map((r) => `${r.label} ${Math.round(r.share * 100)}%`).join(", ")}.`}>
      {DOTS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={0.45} className="fill-[#c9cfe2]" />
      ))}
      {product.regions.map((r, i) => {
        const p = PLACE[r.id]!;
        const rad = 1.5 + r.share * 4.5;
        return (
          <g key={r.id}>
            <circle cx={p.x} cy={p.y} r={rad} className="fill-accent opacity-40 [transform-box:fill-box] [transform-origin:center]" style={{ animation: `pulse 2.2s ease-out ${i * 0.6}s infinite` }} />
            <circle cx={p.x} cy={p.y} r={rad * 0.55} className="fill-accent" />
            <text x={p.x} y={p.y + rad + 4} fontSize="2.7" textAnchor="middle" className="fill-ink-2 font-mono">
              {p.short} {Math.round(r.share * 100)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}
