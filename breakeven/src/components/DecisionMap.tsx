import { useState } from "react";
import { VERDICT_LABELS, necessity, type Alternatives, type Verdict } from "@/lib/necessity";
import { roiInputsOf, type Plan } from "@/lib/plan";
import type { RoiInputs } from "@/lib/roi";
import { formatMoney } from "@/lib/speedToPower";

/** One color per verdict, always shown with its label (the bar, the legend and the caption all name it). */
const COLORS: Record<Verdict, string> = {
  invest: "#3aa17a",
  pilot: "#a7d8c6",
  defer: "#cfd8dc",
  reject: "#a33a3a",
  "no-ai": "#182536",
};
const ON_DARK: Record<Verdict, boolean> = { invest: true, pilot: false, defer: false, reject: true, "no-ai": true };

type Driver = {
  id: string;
  label: string;
  values: number[];
  now: (i: RoiInputs, a: Alternatives) => number;
  apply: (i: RoiInputs, a: Alternatives, x: number) => [RoiInputs, Alternatives];
  format: (x: number) => string;
};

const pct = (x: number) => `${Math.round(x * 100)}%`;
const range = (from: number, to: number, n: number) => Array.from({ length: n + 1 }, (_, k) => from + ((to - from) * k) / n);

function drivers(i: RoiInputs): Driver[] {
  const setupMax = Math.max(1_000_000, i.setupCost * 4);
  return [
    { id: "resolution", label: "Share AI handles", values: range(0, 1, 100), now: (x) => x.aiSuccess, apply: (x, a, v) => [{ ...x, aiSuccess: v }, a], format: pct },
    { id: "review", label: "Review minutes", values: range(0, 10, 80), now: (x) => x.reviewMinutes, apply: (x, a, v) => [{ ...x, reviewMinutes: v }, a], format: (v) => `${Math.round(v * 4) / 4} min` },
    { id: "setup", label: "Setup cost", values: range(0, setupMax, 80), now: (x) => x.setupCost, apply: (x, a, v) => [{ ...x, setupCost: v }, a], format: formatMoney },
    { id: "rules", label: "Rules coverage", values: range(0, 1, 100), now: (_, a) => a.rulesCoverage, apply: (x, a, v) => [x, { ...a, rulesCoverage: v }], format: pct },
  ];
}

/** Where the decision changes: the verdict across the range of one input, with today's value marked. */
export function DecisionMap({ plan }: { plan: Plan }) {
  const inputs = roiInputsOf(plan);
  const all = drivers(inputs);
  const [id, setId] = useState(all[0]!.id);
  const d = all.find((x) => x.id === id) ?? all[0]!;

  const segments = (() => {
    const out: { verdict: Verdict; from: number; to: number }[] = [];
    for (const v of d.values) {
      const [i, a] = d.apply(inputs, plan.alt, v);
      const verdict = necessity(i, a, plan.assumptions, plan.workload.utilization, plan.templateId).verdict;
      const last = out[out.length - 1];
      if (last && last.verdict === verdict) last.to = v;
      else out.push({ verdict, from: v, to: v });
    }
    return out;
  })();

  const min = d.values[0]!;
  const max = d.values[d.values.length - 1]!;
  const span = max - min || 1;
  const now = Math.min(max, Math.max(min, d.now(inputs, plan.alt)));
  const left = (v: number) => ((v - min) / span) * 100;
  const caption = segments.map((s, k) => `${k === segments.length - 1 ? `${d.format(s.from)} and above` : k === 0 ? `Up to ${d.format(s.to)}` : `${d.format(s.from)}–${d.format(s.to)}`}: ${VERDICT_LABELS[s.verdict]}`);

  return (
    <div className="mt-5 border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold">Where the decision changes</p>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Input to vary">
          {all.map((x) => (
            <button
              key={x.id}
              type="button"
              aria-pressed={x.id === d.id}
              onClick={() => setId(x.id)}
              className={`rounded-[5px] border px-2.5 py-1 text-xs font-medium transition ${x.id === d.id ? "border-brand bg-brand text-white" : "border-line bg-surface text-ink-2 hover:border-brand"}`}
            >
              {x.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mt-8" role="img" aria-label={`${d.label}: ${caption.join("; ")}. Now ${d.format(d.now(inputs, plan.alt))}.`}>
        <div className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-ink" style={{ left: `${left(now)}%` }}>
          Now: {d.format(d.now(inputs, plan.alt))}
        </div>
        <div className="flex h-9 overflow-hidden rounded-[5px]">
          {segments.map((s, k) => {
            const next = segments[k + 1];
            const w = (next ? left(next.from) : 100) - left(s.from);
            return (
              <div
                key={`${s.verdict}-${s.from}`}
                className="flex min-w-0 items-center justify-center overflow-hidden px-1 text-[11px] font-semibold"
                style={{ width: `${w}%`, background: COLORS[s.verdict], color: ON_DARK[s.verdict] ? "#fff" : "#172027" }}
                title={`${VERDICT_LABELS[s.verdict]}`}
              >
                <span className="truncate">{VERDICT_LABELS[s.verdict]}</span>
              </div>
            );
          })}
        </div>
        <div className="absolute -bottom-1 top-0 w-0.5 -translate-x-1/2 bg-ink" style={{ left: `${left(now)}%` }} aria-hidden />
        <div className="mt-1.5 flex justify-between text-[11px] text-muted">
          <span>{d.format(min)}</span>
          <span>{d.format(max)}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">{caption.join(" · ")}. Other inputs held at their current values.</p>
    </div>
  );
}
