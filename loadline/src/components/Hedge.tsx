import { useEffect, useRef, useState } from "react";
import { Card, NumberField } from "./ui";
import { leadTimeCurve, spares, type HedgeSettings } from "@/lib/hedge";
import { formatMoney, type Campus } from "@/lib/model";
import type { Scenario } from "@/lib/scenario";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const mo = (m: number) => (!Number.isFinite(m) ? "never" : `${Math.round(m)} months`);

/** Step 3's "Hedge the long-lead items": why transformers take years, and how many spares to hold. */
export function Hedge({ s, setS, campus }: { s: Scenario; setS: (s: Scenario) => void; campus: Campus }) {
  const h = s.hedge;
  const set = (patch: Partial<HedgeSettings>) => setS({ ...s, hedge: { ...h, ...patch } });
  const r = spares(campus, s.settings, h);

  return (
    <section className="mt-12" aria-label="Hedge the long-lead items">
      <div className="mb-6 max-w-2xl">
        <p className="kicker">Hedge the long-lead items</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Transformers take years. Hold spares?</h2>
        <p className="mt-2 text-ink-2">
          The longest waits on an AI campus are for grid equipment. Why the wait is so long sets what being short costs, and that sets how many
          spares are worth holding.
        </p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="kicker">01 · Factory physics</p>
              <h3 className="mt-1 text-lg font-bold tracking-tight">Why transformers take years</h3>
            </div>
            <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">Kingman · VUT</span>
          </div>
          <LeadChart h={h} />
          <label className="mt-4 block">
            <span className="flex items-baseline justify-between text-sm font-medium">
              How busy transformer factories are <span className="font-mono text-brand-ink">{pct(h.supplierLoad)}</span>
            </span>
            <input type="range" min={50} max={97} value={Math.round(h.supplierLoad * 100)} onChange={(e) => set({ supplierLoad: Number(e.target.value) / 100 })} className="mt-2 w-full" />
          </label>
          <p className="mt-3 text-sm leading-6 text-ink-2">
            Building one large transformer takes about {h.buildMonths} months of factory work. The quoted lead time is that plus the queue in
            front of it: <span className="font-mono text-ink">build × (variability × u ÷ (1 − u) + 1)</span>. At {pct(h.supplierLoad)} busy that's{" "}
            <span className="font-semibold text-ink">{mo(r.leadMonths)}</span>. Wood Mackenzie's 2025 survey averaged 128 weeks (about 30 months)
            for power transformers, which is what a nearly full factory produces.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <NumberField label="Factory build time" unit="months, with no queue" value={h.buildMonths} step={0.5} min={0.1} onChange={(v) => v > 0 && set({ buildMonths: v })} />
            <NumberField label="Variability" unit="(cₐ² + cₑ²) ÷ 2" value={h.variability} step={0.25} onChange={(v) => set({ variability: v })} />
          </div>
        </Card>

        <Card>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="kicker">02 · Newsvendor</p>
              <h3 className="mt-1 text-lg font-bold tracking-tight">How many spare transformers to hold</h3>
            </div>
            <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">Critical ratio</span>
          </div>
          <div className="mt-4 rounded-xl bg-panel p-4 text-panel-ink">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-panel-muted">Hold across the campus</p>
            <p className="mt-1 font-mono text-4xl font-semibold">
              {r.best} spare{r.best === 1 ? "" : "s"}
            </p>
            <p className="mt-1 text-sm text-panel-muted">
              for {r.units} transformers · covers shortages {pct(r.table[Math.min(4, r.best)]?.covered ?? 1)} of the time
            </p>
          </div>
          <p className="mt-4 text-sm leading-6 text-ink-2">
            Being one transformer short costs about <span className="font-semibold text-ink">{formatMoney(r.underage)}</span>: its share of the
            campus's cost per month late × the {mo(r.leadMonths)} wait for a replacement. A spare that's never needed costs{" "}
            <span className="font-semibold text-ink">{formatMoney(r.overage)}</span> (its price less what you keep). Hold spares until the chance
            of being covered reaches <span className="font-mono text-ink">short ÷ (short + spare) = {(r.criticalRatio * 100).toFixed(1)}%</span>.
          </p>
          <table className="mt-4 w-full text-left font-mono text-xs">
            <thead className="text-muted">
              <tr>
                <th className="py-1 font-medium">Spares</th>
                <th className="py-1 font-medium">Covered</th>
                <th className="py-1 text-right font-medium">Expected cost</th>
              </tr>
            </thead>
            <tbody>
              {r.table.map((row) => (
                <tr key={row.spares} className={`border-t border-line ${row.spares === r.best ? "font-semibold text-ink" : "text-ink-2"}`}>
                  <td className="py-1.5">
                    {row.spares}
                    {row.spares === r.best && <span className="ml-2 rounded-full bg-brand px-1.5 py-0.5 text-[9px] uppercase text-on-brand">best</span>}
                  </td>
                  <td className="py-1.5">{(row.covered * 100).toFixed(row.covered > 0.99 ? 2 : 1)}%</td>
                  <td className="py-1.5 text-right">{formatMoney(row.expectedCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <NumberField label="Chance a unit fails or slips" unit="before go-live (0.03 = 3%)" value={h.failShare} step={0.01} max={1} onChange={(v) => set({ failShare: v })} />
            <NumberField label="Price per transformer" unit="$ millions" value={h.priceM} step={1} onChange={(v) => set({ priceM: v })} />
            <NumberField label="Power per transformer" unit="facility MW it serves" value={h.unitMw} step={10} min={1} onChange={(v) => v >= 1 && set({ unitMw: v })} />
            <NumberField label="Value kept if unused" unit="share of price (0.5 = 50%)" value={h.valueKept} step={0.1} max={1} onChange={(v) => set({ valueKept: v })} />
          </div>
          <p className="mt-3 text-xs leading-5 text-muted">
            One shared pool covers every phase (pooling). Shortages are counted as a Poisson process: {r.units} units × {pct(h.failShare)} ={" "}
            {r.expectedShort.toFixed(2)} expected.
          </p>
        </Card>
      </div>
    </section>
  );
}

function LeadChart({ h }: { h: HedgeSettings }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(480);
  const [hover, setHover] = useState<number | null>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(Math.max(260, el.clientWidth));
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(260, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const curve = leadTimeCurve(h);
  const height = 200;
  const m = { top: 12, right: 14, bottom: 30, left: 44 };
  const pw = width - m.left - m.right;
  const ph = height - m.top - m.bottom;
  const yMax = 60;
  const x = (u: number) => m.left + ((u - 0.5) / 0.47) * pw;
  const y = (v: number) => m.top + ph - (Math.min(v, yMax) / yMax) * ph;
  const path: string[] = [];
  for (const p of curve) {
    path.push(`${path.length ? "L" : "M"}${x(p.load).toFixed(1)},${y(p.months).toFixed(1)}`);
    if (p.months > yMax) break;
  }
  const now = curve.reduce((a, b) => (Math.abs(b.load - h.supplierLoad) < Math.abs(a.load - h.supplierLoad) ? b : a));
  const hovered = hover === null ? null : curve.reduce((a, b) => (Math.abs(b.load - hover) < Math.abs(a.load - hover) ? b : a));
  const reported = 128 / 4.345;
  return (
    <div ref={wrapRef} className="relative mt-4 w-full min-w-0">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
        role="img"
        aria-label={`Lead time rises from ${mo(curve[0]!.months)} at 50% factory load to ${mo(curve.at(-1)!.months)} near full. At ${pct(h.supplierLoad)}: ${mo(now.months)}.`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const u = 0.5 + ((((e.clientX - r.left) / r.width) * width - m.left) / pw) * 0.47;
          setHover(u >= 0.5 && u <= 0.97 ? u : null);
        }}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 12, 24, 36, 48, 60].map((t) => (
          <g key={t}>
            <line x1={m.left} x2={m.left + pw} y1={y(t)} y2={y(t)} stroke="var(--line)" />
            <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[10px]">
              {t === 0 ? "0" : `${t / 12} yr`}
            </text>
          </g>
        ))}
        {[0.5, 0.6, 0.7, 0.8, 0.9].map((t) => (
          <text key={t} x={x(t)} y={m.top + ph + 16} textAnchor="middle" className="fill-muted font-mono text-[10px]">
            {pct(t)}
          </text>
        ))}
        <text x={m.left + pw / 2} y={height - 2} textAnchor="middle" className="fill-muted text-[10px]">
          How busy transformer factories are
        </text>
        <line x1={m.left} x2={m.left + pw} y1={y(reported)} y2={y(reported)} stroke="var(--muted)" strokeDasharray="4 4" />
        <text x={m.left + 4} y={y(reported) - 5} className="fill-muted text-[10px]">
          Reported 2025 average · 128 weeks
        </text>
        <path d={path.join("")} fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinejoin="round" />
        <g style={{ transition: "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)", transform: `translate(${x(now.load)}px, ${y(now.months)}px)` }}>
          <circle r={5.5} fill="var(--surface)" stroke="var(--brand)" strokeWidth={2.5} />
        </g>
        {hovered && <line x1={x(hovered.load)} x2={x(hovered.load)} y1={m.top} y2={m.top + ph} stroke="var(--ink-2)" opacity={0.35} />}
      </svg>
      {hovered && (
        <div role="tooltip" className="pointer-events-none absolute top-2 z-10 rounded-lg bg-panel px-3 py-2 text-xs text-panel-ink" style={{ left: Math.min(Math.max(x(hovered.load) + 10, 0), width - 150) }}>
          <p className="font-mono text-[10px] uppercase tracking-wider text-panel-muted">{pct(hovered.load)} busy</p>
          <p className="mt-0.5">Lead time {mo(hovered.months)}</p>
        </div>
      )}
    </div>
  );
}
