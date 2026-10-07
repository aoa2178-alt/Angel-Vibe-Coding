import type { CSSProperties } from "react";
import type { OptionId } from "@/lib/tco";

/*
 * Isometric drawings built from boxes. A point (x, y, z) in scene units projects to the screen as
 * sx = (x − y)·cos30°, sy = (x + y)·sin30° − z. Each box shows three faces in flat shades of one tone
 * (top lightest, right darkest), set by CSS variables in styles.css, so they follow light and dark mode.
 */

const C = Math.cos(Math.PI / 6);
const S = 0.5;
const U = 40; // pixels per scene unit

type P = [number, number, number];
type Tone = "base" | "rack" | "blade" | "brand" | OptionId;

interface Shape {
  pts: P[];
  fill: string;
  className?: string;
}
interface Group {
  key: string;
  shapes: Shape[];
  className?: string;
  style?: CSSProperties;
}

const face = (tone: Tone, side: "top" | "left" | "right") => `var(--iso-${tone}-${side})`;

function box(x: number, y: number, z: number, w: number, d: number, h: number, tone: Tone): Shape[] {
  const x1 = x + w;
  const y1 = y + d;
  const z1 = z + h;
  return [
    { pts: [[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]], fill: face(tone, "top") },
    { pts: [[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]], fill: face(tone, "left") },
    { pts: [[x1, y, z], [x1, y1, z], [x1, y1, z1], [x1, y, z1]], fill: face(tone, "right") },
  ];
}

/** A flat circle lying on the plane z, as a polygon. */
function disc(cx: number, cy: number, z: number, r: number, fill: string): Shape {
  const pts: P[] = [];
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a), z]);
  }
  return { pts, fill };
}

/** A small rectangle on a box's front (left) face at depth y, e.g. a status light. */
function frontRect(x0: number, x1: number, y: number, z0: number, z1: number, className: string): Shape {
  return { pts: [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], fill: "", className };
}

const project = ([x, y, z]: P) => [(x - y) * C * U, ((x + y) * S - z) * U];

/** CSS offsets for moving `dist` units along the y axis (toward the viewer's lower left). */
const alongY = (dist: number): CSSProperties =>
  ({ "--iso-dx": `${(C * dist * U).toFixed(1)}px`, "--iso-dy": `${(S * dist * U).toFixed(1)}px` }) as CSSProperties;

function Scene({ groups, label, className, pad = 6 }: { groups: Group[]; label: string; className?: string; pad?: number }) {
  const all = groups.flatMap((g) => g.shapes.flatMap((s) => s.pts.map(project)));
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  const w = Math.max(...xs) - minX + pad;
  const h = Math.max(...ys) - minY + pad;
  return (
    <svg viewBox={`${minX.toFixed(1)} ${minY.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`} {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })} className={`iso-tones ${className ?? ""}`}>
      {groups.map((g) => (
        <g key={g.key} className={g.className} style={g.style}>
          {g.shapes.map((s, i) => (
            <polygon
              key={i}
              points={s.pts.map((p) => project(p).map((n) => n.toFixed(1)).join(",")).join(" ")}
              className={s.className}
              style={s.fill ? { fill: s.fill } : undefined}
              stroke="var(--iso-edge)"
              strokeWidth={1}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** A rack with `n` server blades on its front face; the blades slide in and their lights take the winner's color. */
function rack(key: string, x: number, y: number, w: number, d: number, h: number, n: number, delay: number): Group[] {
  const groups: Group[] = [{ key, shapes: box(x, y, 0, w, d, h, "rack") }];
  const pitch = (h - 0.3) / n;
  for (let j = 0; j < n; j++) {
    const z = 0.2 + j * pitch;
    const bh = pitch * 0.72;
    const bx = x + 0.12;
    const bw = w - 0.24;
    const front = y + d + 0.14;
    groups.push({
      key: `${key}-b${j}`,
      className: "iso-slide",
      style: { ...alongY(1.4), animationDelay: `${delay + j * 70}ms` },
      shapes: [
        ...box(bx, y + d, z, bw, 0.14, bh, "blade"),
        frontRect(bx + bw - 0.34, bx + bw - 0.14, front, z + bh / 2 - 0.06, z + bh / 2 + 0.06, "iso-led"),
      ],
    });
  }
  return groups;
}

/** The hero: three server racks on a floor, a GPU board in front, and tokens flowing toward the racks. */
export function IsoHero({ className }: { className?: string }) {
  const groups: Group[] = [{ key: "floor", shapes: box(0, 0, -0.35, 9.2, 6.6, 0.35, "base") }];
  [0.8, 2.75, 4.7].forEach((x, i) => groups.push(...rack(`r${i}`, x, 0.6, 1.6, 1.7, 4.4, 8, 150 + i * 220)));
  for (let k = 0; k < 5; k++) {
    groups.push({
      key: `t${k}`,
      className: "iso-token",
      style: { ...alongY(1.5), animationDelay: `${k * 640}ms` },
      shapes: box(1.1 + k * 0.95, 4.4, 0, 0.42, 0.42, 0.42, "api"),
    });
  }
  groups.push({ key: "board", shapes: box(6.3, 3.6, 0, 2.5, 2.4, 0.22, "rack") });
  groups.push({
    key: "chips",
    shapes: [
      ...box(6.55, 3.85, 0.22, 0.42, 0.42, 0.16, "blade"),
      ...box(8.13, 3.85, 0.22, 0.42, 0.42, 0.16, "blade"),
      ...box(6.55, 5.33, 0.22, 0.42, 0.42, 0.16, "blade"),
      ...box(8.13, 5.33, 0.22, 0.42, 0.42, 0.16, "blade"),
      ...box(7.1, 4.4, 0.22, 1.0, 1.0, 0.34, "own"),
    ],
  });
  return <Scene groups={groups} label="Isometric drawing of GPU server racks on a data center floor, with tokens flowing in and a GPU board in front" className={className} />;
}

export type IsoKind = "tokens" | "datacenter" | "gpu" | "power";

/** Small decorative drawings for the "What it compares" cards; each has one part in its option's color. Rack lights use the surrounding theme-* class. */
export function IsoIcon({ kind, className }: { kind: IsoKind; className?: string }) {
  let groups: Group[];
  switch (kind) {
    case "tokens":
      groups = [
        { key: "t0", shapes: box(0, 0, 0, 2.2, 2.2, 0.28, "base") },
        { key: "t1", shapes: box(0, 0, 0.42, 2.2, 2.2, 0.28, "base") },
        { key: "t2", shapes: box(0, 0, 0.84, 2.2, 2.2, 0.28, "api") },
        { key: "c", shapes: box(0.8, 0.8, 1.6, 0.6, 0.6, 0.6, "api") },
      ];
      break;
    case "datacenter":
      groups = [{ key: "pad", shapes: box(-0.3, -0.3, -0.2, 2.6, 2.3, 0.2, "rent") }, ...rack("r", 0.15, 0, 1.6, 1.4, 2.8, 5, 0)];
      break;
    case "gpu":
      groups = [
        { key: "pcb", shapes: box(0, 0, 0, 2.8, 2.2, 0.2, "rack") },
        {
          key: "mem",
          shapes: [
            ...box(0.2, 0.2, 0.2, 0.45, 0.45, 0.16, "blade"),
            ...box(2.15, 0.2, 0.2, 0.45, 0.45, 0.16, "blade"),
            ...box(0.2, 1.55, 0.2, 0.45, 0.45, 0.16, "blade"),
            ...box(2.15, 1.55, 0.2, 0.45, 0.45, 0.16, "blade"),
          ],
        },
        { key: "die", shapes: box(0.85, 0.6, 0.2, 1.1, 1.0, 0.42, "own") },
      ];
      break;
    case "power":
      groups = [
        { key: "unit", shapes: box(0, 0, 0, 2, 1.8, 1.3, "base") },
        { key: "fan", shapes: [disc(1, 0.9, 1.3, 0.72, face("brand", "left")), disc(1, 0.9, 1.3, 0.22, face("brand", "top"))] },
        { key: "cell", shapes: box(2.3, 0.5, 0, 0.8, 1.3, 0.9, "brand") },
      ];
      break;
  }
  return <Scene groups={groups} label="" className={className} pad={4} />;
}
