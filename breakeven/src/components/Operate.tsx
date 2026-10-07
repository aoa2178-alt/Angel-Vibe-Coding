import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { NumberField, months, percent } from "./ui";
import type { Plan } from "@/lib/plan";
import { BURST_PRESETS, hybrid, maxUtilizationFor, responseTime, retirement, utilizationCurve, type OpsSettings } from "@/lib/operate";
import { PRICES } from "@/lib/prices";
import { compare, formatUsd } from "@/lib/tco";

type SetPlan = (f: (p: Plan) => Plan) => void;

const seconds = (s: number) => (!Number.isFinite(s) ? "forever" : s < 10 ? `${s.toFixed(1)} s` : `${Math.round(s)} s`);
const gpuCount = (n: number) => `${n.toLocaleString("en-US")} GPU${n === 1 ? "" : "s"}`;

/** Step 2's "Running it well": how hot to run the fleet, how much of it to own, and when to retire it. */
export function RunningItWell({ plan, setPlan }: { plan: Plan; setPlan: SetPlan }) {
  const setOps = (patch: Partial<OpsSettings>) => setPlan((p) => ({ ...p, ops: { ...p.ops, ...patch } }));
  return (
    <section id="running" className="mt-14 scroll-mt-24" aria-label="Running it well">
      <div className="mb-6 max-w-2xl">
        <p className="kicker">Running it well</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">How hot to run it, how much to own, when to retire it</h2>
        <p className="mt-2 text-ink-2">
          Three operating decisions on the same plan, each from a classic operations model. They change the cost above, not just the
          story around it.
        </p>
      </div>
      <div className="grid gap-4">
        <HowHot plan={plan} setPlan={setPlan} setOps={setOps} />
        <div className="grid items-start gap-4 xl:grid-cols-2">
          <BaseAndPeak plan={plan} setOps={setOps} />
          <Retire plan={plan} setOps={setOps} />
        </div>
      </div>
    </section>
  );
}

function Card({ kicker, title, method, children }: { kicker: string; title: string; method: string; children: ReactNode }) {
  return (
    <article className="min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="kicker">{kicker}</p>
          <h3 className="mt-1 text-lg font-bold tracking-tight">{title}</h3>
        </div>
        <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">{method}</span>
      </div>
      <div className="mt-4">{children}</div>
    </article>
  );
}

/* ---------- 1. How hot to run it ---------- */

function HowHot({ plan, setPlan, setOps }: { plan: Plan; setPlan: SetPlan; setOps: (p: Partial<OpsSettings>) => void }) {
  const { workload: w, assumptions: a, ops } = plan;
  const q = responseTime(w, a, ops);
  const best = maxUtilizationFor(w, a, ops);
  const cost = compare(w, a).rent.monthly;
  const bestPlan = best === null ? null : { ...w, utilization: best };
  const bestQ = bestPlan ? responseTime(bestPlan, a, ops) : null;
  const bestCost = bestPlan ? compare(bestPlan, a).rent.monthly : null;
  const meets = q.waitSec <= ops.waitTargetSec;
  const differs = best !== null && Math.abs(best - w.utilization) >= 0.01 && bestQ !== null && bestQ.gpus !== q.gpus;
  const compareGpus = q.gpus >= 4 ? 1 : q.gpus * 10;

  return (
    <Card kicker="01 · How hot to run it" title="How fast do answers come back?" method="Factory physics · Little's Law">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0">
          <ResponseChart plan={plan} compareGpus={compareGpus} />
        </div>
        <div className="grid content-start gap-4">
          <div>
            <p className="text-sm font-medium">Traffic</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5" role="group" aria-label="Traffic">
              {BURST_PRESETS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={ops.burst === b.value}
                  onClick={() => setOps({ burst: b.value })}
                  title={b.blurb}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${ops.burst === b.value ? "border-brand bg-brand text-white" : "border-line bg-bg hover:border-brand"}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
          <NumberField label="Longest acceptable wait" unit="seconds in the queue, on average" step={0.5} value={ops.waitTargetSec} onChange={(v) => v > 0 && setOps({ waitTargetSec: v })} />
          <NumberField label="Tokens per request" unit="prompt + answer" step={500} value={ops.requestTokens} onChange={(v) => v >= 1 && setOps({ requestTokens: v })} />
        </div>
      </div>

      <p className="mt-5 text-[15px] leading-7 text-ink-2">
        Your fleet is <span className="font-semibold text-ink">{gpuCount(q.gpus)}</span>, {percent(q.busy)} busy. Each request takes {seconds(q.serviceSec)} of GPU
        time and waits about <span className="font-semibold text-ink">{seconds(q.waitSec)}</span> in line, so answers take {seconds(q.responseSec)}. On average{" "}
        {q.inFlight < 10 ? q.inFlight.toFixed(1) : Math.round(q.inFlight).toLocaleString("en-US")} requests are in the system at once (Little's Law: arrivals × time in system).
      </p>

      <div className={`mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 text-sm leading-6 ${meets ? "border border-line bg-bg" : "bg-brand-soft"}`}>
        <p className="min-w-0 flex-1 text-ink">
          {best === null
            ? `Even sized at 20% busy, requests wait longer than ${seconds(ops.waitTargetSec)}. Shorter requests or faster GPUs are the fix, not more of the same.`
            : !differs
              ? `Your ${percent(w.utilization)} setting meets the ${seconds(ops.waitTargetSec)} target.`
              : meets
                ? `You can size for up to ${percent(best)} busy and still meet the ${seconds(ops.waitTargetSec)} target: ${gpuCount(bestQ!.gpus)} instead of ${q.gpus}, saving ${formatUsd(cost - bestCost!)} a month rented.`
                : `That misses your ${seconds(ops.waitTargetSec)} target. Sizing for ${percent(best)} busy needs ${gpuCount(bestQ!.gpus)} instead of ${q.gpus}: ${formatUsd(bestCost! - cost)} a month more rented, with answers in ${seconds(bestQ!.responseSec)}.`}
        </p>
        {differs && (
          <button
            type="button"
            onClick={() => setPlan((p) => ({ ...p, workload: { ...p.workload, utilization: best! } }))}
            className="shrink-0 rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-ink"
          >
            Use {percent(best!)}
          </button>
        )}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">
        Wait = variability × utilization × time, for {q.gpus === 1 ? "one machine" : `${q.gpus} machines in parallel`} (the Kingman and Sakasegawa formulas). A
        bigger fleet pools its traffic, so it can run hotter for the same wait. Illustrative: real serving batches requests, but the shape holds.
      </p>
    </Card>
  );
}

function ResponseChart({ plan, compareGpus }: { plan: Plan; compareGpus: number }) {
  const { workload: w, assumptions: a, ops } = plan;
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(560);
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    setWidth(Math.max(260, el.clientWidth));
    const ro = new ResizeObserver(([e]) => e && setWidth(Math.max(260, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const q = responseTime(w, a, ops);
  const mine = useMemo(() => utilizationCurve(q.gpus, a, ops), [q.gpus, a, ops]);
  const other = useMemo(() => utilizationCurve(compareGpus, a, ops), [compareGpus, a, ops]);
  const target = q.serviceSec + ops.waitTargetSec;
  const yMax = Math.max(target * 2.5, q.responseSec * 1.6, q.serviceSec * 4);

  const height = 230;
  const m = { top: 14, right: 16, bottom: 34, left: 44 };
  const pw = width - m.left - m.right;
  const ph = height - m.top - m.bottom;
  const x = (b: number) => m.left + b * pw;
  const y = (s: number) => m.top + ph - (Math.min(s, yMax) / yMax) * ph;
  const path = (pts: { busy: number; responseSec: number }[]) => {
    const out: string[] = [];
    for (const p of pts) {
      out.push(`${out.length ? "L" : "M"}${x(p.busy).toFixed(1)},${y(p.responseSec).toFixed(1)}`);
      if (p.responseSec > yMax) break;
    }
    return out.join("");
  };
  const yTicks = [0, yMax / 4, yMax / 2, (3 * yMax) / 4, yMax];
  const hoverPt = hover === null ? null : mine.reduce((b, p) => (Math.abs(p.busy - hover) < Math.abs(b.busy - hover) ? p : b));

  return (
    <figure>
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-xs text-ink-2">
        <span className="font-semibold text-ink">Response time as the fleet gets busier</span>
        <span className="flex flex-wrap gap-x-3 gap-y-1">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-brand" aria-hidden />
            Your fleet ({gpuCount(q.gpus)})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0 w-4 border-t-2 border-dashed border-muted" aria-hidden />
            {gpuCount(compareGpus)}
          </span>
        </span>
      </figcaption>
      <div ref={wrapRef} className="relative mt-2 w-full min-w-0">
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block"
          role="img"
          aria-label={`Response time rises from ${seconds(mine[0]!.responseSec)} toward ${seconds(mine.at(-1)!.responseSec)} as the fleet nears full. You are at ${percent(q.busy)} busy, ${seconds(q.responseSec)}.`}
          onMouseMove={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            const bx = (((e.clientX - r.left) / r.width) * width - m.left) / pw;
            setHover(bx >= 0 && bx <= 1 ? bx : null);
          }}
          onMouseLeave={() => setHover(null)}
        >
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={m.left} x2={m.left + pw} y1={y(t)} y2={y(t)} stroke="var(--line)" />
              <text x={m.left - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted font-mono text-[10px]">
                {t === 0 ? "0" : seconds(t)}
              </text>
            </g>
          ))}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <text key={t} x={x(t)} y={m.top + ph + 16} textAnchor="middle" className="fill-muted font-mono text-[10px]">
              {percent(t)}
            </text>
          ))}
          <text x={m.left + pw / 2} y={height - 2} textAnchor="middle" className="fill-muted text-[10px]">
            How busy the fleet is
          </text>
          <line x1={m.left} x2={m.left + pw} y1={y(target)} y2={y(target)} stroke="var(--brand)" strokeDasharray="4 4" opacity={0.6} />
          <text x={m.left + 4} y={y(target) - 5} className="fill-brand-ink text-[10px] font-semibold">
            Target · {seconds(target)}
          </text>
          <path d={path(other)} fill="none" stroke="var(--muted)" strokeWidth={2} strokeDasharray="5 4" />
          <path d={path(mine)} fill="none" stroke="var(--brand)" strokeWidth={2.5} strokeLinejoin="round" />
          {q.busy <= 1 && (
            <g style={{ transition: "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)", transform: `translate(${x(Math.min(q.busy, 0.97))}px, ${y(q.responseSec)}px)` }}>
              <circle r={5.5} fill="var(--surface)" stroke="var(--brand)" strokeWidth={2.5} />
              <text y={-10} textAnchor="middle" className="fill-ink text-[10px] font-semibold" style={{ paintOrder: "stroke", stroke: "var(--surface)", strokeWidth: 4 }}>
                You are here
              </text>
            </g>
          )}
          {hoverPt && (
            <g>
              <line x1={x(hoverPt.busy)} x2={x(hoverPt.busy)} y1={m.top} y2={m.top + ph} stroke="var(--ink-2)" strokeWidth={1} opacity={0.4} />
              <circle cx={x(hoverPt.busy)} cy={y(hoverPt.responseSec)} r={4} fill="var(--brand)" />
            </g>
          )}
        </svg>
        {hoverPt && (
          <div
            role="tooltip"
            className="pointer-events-none absolute top-2 z-10 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-sm"
            style={{ left: Math.min(Math.max(x(hoverPt.busy) + 10, 0), width - 170) }}
          >
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{percent(hoverPt.busy)} busy</p>
            <p className="mt-0.5">
              Answers in <span className="font-mono font-semibold">{seconds(hoverPt.responseSec)}</span>
            </p>
            <p className="text-muted">Waiting {seconds(hoverPt.waitSec)}</p>
          </div>
        )}
      </div>
      <button type="button" onClick={() => setTable((t) => !t)} aria-expanded={table} className="mt-2 text-xs font-medium text-brand-ink underline underline-offset-2">
        {table ? "Hide table" : "Show as a table"}
      </button>
      {table && (
        <table className="mt-2 w-full text-left font-mono text-xs">
          <thead className="text-muted">
            <tr>
              <th className="py-1 font-medium">Busy</th>
              <th className="py-1 font-medium">Your fleet</th>
              <th className="py-1 font-medium">{gpuCount(compareGpus)}</th>
            </tr>
          </thead>
          <tbody>
            {[0.5, 0.7, 0.8, 0.9, 0.95].map((b) => {
              const pick = (pts: typeof mine) => pts.reduce((best, p) => (Math.abs(p.busy - b) < Math.abs(best.busy - b) ? p : best));
              return (
                <tr key={b} className="border-t border-line">
                  <td className="py-1">{percent(b)}</td>
                  <td className="py-1">{seconds(pick(mine).responseSec)}</td>
                  <td className="py-1">{seconds(pick(other).responseSec)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </figure>
  );
}

/* ---------- 2. Own the base, rent the peaks ---------- */

function BaseAndPeak({ plan, setOps }: { plan: Plan; setOps: (p: Partial<OpsSettings>) => void }) {
  const { workload: w, assumptions: a, ops } = plan;
  const h = hybrid(w, a, ops);
  const rows = [
    { id: "rent", label: "Rent everything", value: h.allRent },
    { id: "own", label: "Own everything", value: h.allOwn },
    { id: "split", label: "Own the base, handle the peak", value: h.best === "split" ? h.hybrid : h.base.monthly + h.peak.monthly },
  ];
  const max = Math.max(...rows.map((r) => r.value)) || 1;
  const winner = h.best;
  const peakHow = { "on-demand": "rent it by the hour, only at peak", rent: "rent it reserved, all day", own: "own it too" }[h.peak.choice];
  return (
    <Card kicker="02 · How much to own" title="Own the base, rent the peaks" method="Flexibility · newsvendor">
      <label className="block">
        <span className="flex items-baseline justify-between text-sm font-medium">
          Peak hours a day <span className="font-mono text-brand-ink">{ops.peakHours} h</span>
        </span>
        <input type="range" min={1} max={23} value={ops.peakHours} onChange={(e) => setOps({ peakHours: Number(e.target.value) })} className="mt-2 w-full" />
      </label>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.id}>
            <div className="flex justify-between gap-3 text-sm">
              <span className={r.id === winner ? "font-semibold text-ink" : "text-ink-2"}>
                {r.label}
                {r.id === winner && <span className="ml-2 rounded-full bg-brand px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase text-white">cheapest</span>}
              </span>
              <span className="font-mono">{formatUsd(r.value)}/mo</span>
            </div>
            <div className="mt-1 h-2.5 rounded-r-[4px] bg-sunken">
              <div className="glide h-full rounded-r-[4px]" style={{ width: `${(r.value / max) * 100}%`, background: r.id === winner ? "var(--brand)" : "var(--ink-2)", opacity: r.id === winner ? 1 : 0.35 }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-6 text-ink-2">
        Your fleet of {gpuCount(h.peakGpus)} is fully busy {ops.peakHours} hours a day and needs {percent(h.offPeakShare)} of itself the rest of the time (that's what
        averages your {percent(w.utilization)} utilization). An owned GPU only pays off if it's busy more than{" "}
        <span className="font-semibold text-ink">{percent(Math.min(h.criticalRatio, 9.99))}</span> of the day: its monthly cost ÷ renting it by the hour all month (the
        newsvendor critical ratio).{" "}
        {h.peakGpus > h.baseGpus
          ? `The peak layer is busy ${percent(h.peakShare)} of the day, so ${peakHow}.`
          : `With ${gpuCount(h.peakGpus)}, there's no separate peak layer to split off.`}
      </p>
      <p className="mt-3 rounded-xl bg-brand-soft p-3 text-sm leading-6 text-ink">
        {winner === "split"
          ? `Flexibility is worth ${formatUsd(h.flexibilityValue)} a month: own ${gpuCount(h.base.gpus)} for the base and ${peakHow.replace("it", `the other ${h.peak.gpus}`)}.`
          : `At this size splitting doesn't pay: ${winner === "own" ? "owning" : "renting"} everything is cheapest.`}
      </p>
      <label className="mt-4 block max-w-[14rem]">
        <span className="block text-xs font-medium text-ink-2">On-demand price vs reserved</span>
        <input
          type="number"
          step={0.1}
          min={0.1}
          value={ops.onDemandPremium}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v) && v > 0) setOps({ onDemandPremium: v });
          }}
          className="mt-1 w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 font-mono text-sm"
        />
        <span className="mt-0.5 block font-mono text-[10px] text-muted">× the reserved rental price</span>
      </label>
    </Card>
  );
}

/* ---------- 3. When to retire ---------- */

function Retire({ plan, setOps }: { plan: Plan; setOps: (p: Partial<OpsSettings>) => void }) {
  const { assumptions: a, ops } = plan;
  const r = retirement(a, ops);
  const series = PRICES.gpu.find((s) => s.id === PRICES.defaults.gpu)!.points;
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const fmtDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  const writeOff = a.depreciationYears * 12;
  const span = Math.max(writeOff + 12, Math.min(120, (r.retireAfterMonths ?? writeOff) + 12));

  // A small chart: renting the same capacity falls each year; keeping it running stays flat.
  const W = 320;
  const H = 120;
  const pad = { l: 8, r: 8, t: 10, b: 18 };
  const x = (mo: number) => pad.l + (mo / span) * (W - pad.l - pad.r);
  const yMax = Math.max(r.rentMonthly, r.keepMonthly) * 1.1;
  const y = (v: number) => pad.t + (1 - v / yMax) * (H - pad.t - pad.b);
  const rentPath = Array.from({ length: 41 }, (_, i) => {
    const mo = (span * i) / 40;
    return `${i ? "L" : "M"}${x(mo).toFixed(1)},${y(r.rentMonthly * Math.pow(1 - ops.rentalDecline, mo / 12)).toFixed(1)}`;
  }).join("");

  return (
    <Card kicker="03 · When to retire it" title="When to retire owned GPUs" method="Capacity retraction · sunk cost">
      <p className="text-sm leading-6 text-ink-2">
        Once bought, the hardware is a sunk cost. Keeping a GPU costs only what it takes to run it: <span className="font-mono text-ink">{formatUsd(r.keepMonthly)}</span> a
        month for support, power and space. Renting the same capacity costs <span className="font-mono text-ink">{formatUsd(r.rentMonthly)}</span> today, and less every
        year.
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 block w-full" role="img" aria-label={`Rental cost falls ${percent(ops.rentalDecline)} a year; keeping costs ${formatUsd(r.keepMonthly)} a month.`}>
        <line x1={x(writeOff)} x2={x(writeOff)} y1={pad.t} y2={H - pad.b} stroke="var(--line)" strokeDasharray="3 3" />
        <text x={x(writeOff)} y={H - 4} textAnchor="middle" className="fill-muted font-mono text-[9px]">
          written off · {a.depreciationYears} yrs
        </text>
        <line x1={x(0)} x2={x(span)} y1={y(r.keepMonthly)} y2={y(r.keepMonthly)} stroke="var(--ink-2)" strokeWidth={2} />
        <text x={x(span)} y={y(r.keepMonthly) - 4} textAnchor="end" className="fill-ink-2 text-[9px]">
          Keep running
        </text>
        <path d={rentPath} fill="none" stroke="var(--brand)" strokeWidth={2} />
        <text x={x(0) + 2} y={y(r.rentMonthly) + 12} className="fill-brand-ink text-[9px]">
          Rent instead
        </text>
        {r.retireAfterMonths !== null && r.retireAfterMonths <= span && (
          <circle cx={x(r.retireAfterMonths)} cy={y(r.keepMonthly)} r={4.5} fill="var(--surface)" stroke="var(--brand)" strokeWidth={2} />
        )}
      </svg>
      <p className="mt-3 rounded-xl bg-brand-soft p-3 text-sm leading-6 text-ink">
        {r.retireAfterMonths === null
          ? "If rental prices don't fall, keeping owned GPUs running stays cheaper than renting."
          : r.retireAfterMonths === 0
            ? "Renting is already cheaper than just running owned GPUs. Retire them now."
            : `Renting gets cheaper than keeping them after about ${months(r.retireAfterMonths)} (${(r.retireAfterMonths / 12).toFixed(1)} years)${
                r.beforeWriteOff ? `, before the ${a.depreciationYears}-year write-off ends. Plan a refresh or a resale.` : ", after they're written off."
              }`}
      </p>
      <label className="mt-4 block max-w-[14rem]">
        <span className="block text-xs font-medium text-ink-2">Rental prices fall each year</span>
        <input
          type="number"
          step={1}
          min={0}
          max={99}
          value={Math.round(ops.rentalDecline * 1000) / 10}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v) && v >= 0 && v < 100) setOps({ rentalDecline: v / 100 });
          }}
          className="mt-1 w-full rounded-lg border border-line bg-bg px-2.5 py-1.5 font-mono text-sm"
        />
        <span className="mt-0.5 block font-mono text-[10px] text-muted">% a year</span>
      </label>
      <p className="mt-2 text-xs leading-5 text-muted">
        Default measured from the price tracker: H100 rental fell from {formatUsd(first.value, 2)} ({fmtDate(first.date)}) to {formatUsd(last.value, 2)} ({fmtDate(last.date)}).
        Resale value would make retiring sooner worthwhile.
      </p>
    </Card>
  );
}
