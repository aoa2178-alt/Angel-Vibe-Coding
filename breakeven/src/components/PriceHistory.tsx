import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PRICES, blended, changeLog } from "@/lib/prices";
import { formatUsd } from "@/lib/tco";

interface Pt {
  t: number;
  v: number;
  label: string;
}
interface Line {
  id: string;
  label: string;
  color: string;
  points: Pt[];
}

const DAY = 86_400_000;
const time = (d: string) => Date.parse(`${d}T00:00:00Z`);
const PROVIDER_COLOR: Record<string, string> = {
  anthropic: "var(--provider-anthropic)",
  openai: "var(--provider-openai)",
  google: "var(--provider-google)",
};

/**
 * Prices over time. API lines are steps (a list price holds until it changes) carried to today; GPU rental is a
 * line between index readings. Log scale for API prices, which fell more than tenfold.
 */
function TimeChart({ lines, log, step, unit, caption, kicker }: { lines: Line[]; log: boolean; step: boolean; unit: (v: number) => string; caption: string; kicker: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(Math.max(280, el.clientWidth));
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(280, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const now = Date.now();
  const all = lines.flatMap((l) => l.points);
  const t0 = Math.min(...all.map((p) => p.t)) - 30 * DAY;
  const t1 = Math.max(now, ...all.map((p) => p.t)) + 15 * DAY;
  const vs = all.map((p) => p.v);
  const lo = log ? Math.pow(10, Math.floor(Math.log10(Math.min(...vs)))) : 0;
  const hi = log ? Math.pow(10, Math.ceil(Math.log10(Math.max(...vs)))) : Math.ceil(Math.max(...vs) / 2) * 2;

  const narrow = width < 560;
  const height = narrow ? 240 : 290;
  const m = { top: 16, right: narrow ? 92 : 132, bottom: 30, left: 50 };
  const pw = width - m.left - m.right;
  const ph = height - m.top - m.bottom;
  const x = (t: number) => m.left + ((t - t0) / (t1 - t0)) * pw;
  const y = (v: number) => m.top + ph - (log ? (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) : v / hi) * ph;

  const path = (l: Line) => {
    const pts = l.points;
    let d = `M${x(pts[0]!.t).toFixed(1)},${y(pts[0]!.v).toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      if (step) d += `H${x(pts[i]!.t).toFixed(1)}`;
      d += `L${x(pts[i]!.t).toFixed(1)},${y(pts[i]!.v).toFixed(1)}`;
    }
    if (step) d += `H${x(now).toFixed(1)}`;
    return d;
  };
  const valueAt = (l: Line, t: number) => {
    const before = l.points.filter((p) => p.t <= t);
    if (before.length === 0) return null;
    if (step) return before[before.length - 1]!;
    // Index readings: show the nearest one.
    return l.points.reduce((best, p) => (Math.abs(p.t - t) < Math.abs(best.t - t) ? p : best));
  };

  const yTicks: number[] = [];
  if (log) for (let v = lo; v <= hi * 1.0001; v *= 10) yTicks.push(v);
  else for (let v = 0; v <= hi + 1e-9; v += hi / 4) yTicks.push(v);
  const years: number[] = [];
  for (let yr = new Date(t0).getUTCFullYear() + 1; time(`${yr}-01-01`) < t1; yr++) years.push(yr);

  // End labels at the right, nudged apart.
  const ends = lines.map((l) => ({ l, y: y(l.points[l.points.length - 1]!.v) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) ends[i]!.y = Math.max(ends[i]!.y, ends[i - 1]!.y + 14);
  const endX = step ? x(now) : x(Math.max(...all.map((p) => p.t)));

  return (
    <figure className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <p className="kicker">{kicker}</p>
      <figcaption className="mt-1 text-lg font-bold tracking-tight">{caption}</figcaption>
      <div ref={wrapRef} className="relative mt-4 w-full min-w-0">
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block" role="img" aria-label={`${caption}. ${lines.map((l) => `${l.label}: ${l.points.map((p) => `${p.label} ${unit(p.v)}`).join(", ")}`).join(". ")}`}>
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + pw} y1={y(t)} y2={y(t)} stroke="var(--line)" />
              <text x={m.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[10px]">
                {unit(t)}
              </text>
            </g>
          ))}
          {years.map((yr) => (
            <text key={yr} x={x(time(`${yr}-01-01`))} y={m.top + ph + 18} textAnchor="middle" className="fill-muted font-mono text-[10px]">
              {yr}
            </text>
          ))}
          {lines.map((l) => (
            <g key={l.id}>
              <path d={path(l)} fill="none" stroke={l.color} strokeWidth={2} strokeLinejoin="round" />
              {l.points.map((p) => (
                <circle key={p.t} cx={x(p.t)} cy={y(p.v)} r={3.5} fill={l.color} stroke="var(--surface)" strokeWidth={1.5} />
              ))}
            </g>
          ))}
          {ends.map(({ l, y: ly }) => (
            <text key={l.id} x={endX + 8} y={ly} dy="0.32em" className="fill-ink-2 text-[11px] font-medium">
              {l.label}
            </text>
          ))}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={m.top} y2={m.top + ph} stroke="var(--brand)" />}
          <rect
            x={m.left}
            y={m.top}
            width={Math.max(0, pw)}
            height={Math.max(0, ph)}
            fill="transparent"
            onPointerMove={(e) => {
              const box = e.currentTarget.ownerSVGElement!.getBoundingClientRect();
              setHover(t0 + ((e.clientX - box.left - m.left) / pw) * (t1 - t0));
            }}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
        {hover !== null && (
          <div role="tooltip" className="pointer-events-none absolute top-2 z-10 w-60 rounded-xl bg-panel px-3 py-2.5 text-xs text-panel-ink" style={{ left: Math.min(Math.max(x(hover) + 12, 0), width - 250) }}>
            <p className="font-mono text-[10px] uppercase tracking-wider text-panel-muted">
              {new Date(hover).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" })}
            </p>
            <ul className="mt-1.5 space-y-1">
              {lines.map((l) => {
                const p = valueAt(l, hover);
                return (
                  <li key={l.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full" style={{ background: l.color }} aria-hidden />
                      {p ? p.label : l.label}
                    </span>
                    <span className="font-mono">{p ? unit(p.v) : "–"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
      <button type="button" onClick={() => setTable((v) => !v)} aria-expanded={table} className="mt-3 text-xs font-medium text-brand-ink underline underline-offset-2">
        {table ? "Hide table" : "View as table"}
      </button>
      {table && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead>
              <tr className="border-b border-line font-mono text-[11px] uppercase tracking-wider text-muted">
                <th className="py-2 font-medium">Date</th>
                <th className="py-2 font-medium">Series</th>
                <th className="py-2 font-medium">Point</th>
                <th className="py-2 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {lines
                .flatMap((l) => l.points.map((p) => ({ l, p })))
                .sort((a, b) => a.p.t - b.p.t)
                .map(({ l, p }) => (
                  <tr key={`${l.id}-${p.t}`} className="border-b border-line/70">
                    <td className="py-2 font-mono">{new Date(p.t).toISOString().slice(0, 10)}</td>
                    <td className="py-2">{l.label}</td>
                    <td className="py-2">{p.label}</td>
                    <td className="py-2 text-right font-mono">{unit(p.v)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}

const usdShort = (v: number) => (v >= 10 ? `$${Math.round(v)}` : `$${v.toFixed(2)}`);

/** The Sources page's price history: what AI costs per million tokens, what an H100 rents for, and every dated point. */
export function PriceHistory() {
  const api: Line[] = PRICES.api.map((s) => ({
    id: s.id,
    label: s.label.replace("Anthropic ", "").replace("OpenAI ", "").replace("Google ", ""),
    color: PROVIDER_COLOR[s.id] ?? "var(--brand)",
    points: s.points.map((p) => ({ t: time(p.date), v: blended(p), label: p.model })),
  }));
  const gpu: Line[] = PRICES.gpu.map((s) => ({
    id: s.id,
    label: "H100",
    color: "var(--brand)",
    points: s.points.map((p) => ({ t: time(p.date), v: p.value, label: new Date(time(p.date)).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }) })),
  }));
  const log = changeLog().slice(0, 8);
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 xl:grid-cols-2">
        <TimeChart lines={api} log step unit={usdShort} kicker="API prices" caption="What AI costs per million tokens (25% output)" />
        <TimeChart lines={gpu} log={false} step={false} unit={(v) => formatUsd(v, 2)} kicker="GPU rental" caption="What an H100 rents for, per GPU-hour" />
      </div>
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <p className="kicker">Latest points</p>
        <ul className="mt-3 divide-y divide-line">
          {log.map((e) => (
            <li key={`${e.series}-${e.date}`} className="grid gap-1 py-3 text-sm sm:grid-cols-[7rem_1fr] sm:gap-4">
              <span className="font-mono text-muted">{e.date}</span>
              <span>
                <span className="font-semibold">{e.series}</span> · {e.what}{" "}
                <a href={e.source} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-brand-ink underline-offset-2 hover:underline">
                  source <ArrowUpRight className="size-3" aria-hidden />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                {e.note && <span className="mt-0.5 block text-xs text-muted">{e.note}</span>}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-5 text-muted">
          A weekly price watcher checks these sources and proposes new points; each one is reviewed before it goes live. The calculator's own
          defaults only change when you choose "Use latest prices" in step 2.
        </p>
      </div>
    </div>
  );
}
