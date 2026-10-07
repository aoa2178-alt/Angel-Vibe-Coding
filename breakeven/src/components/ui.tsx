import type { ReactNode } from "react";

export const months = (m: number) => `${m < 10 ? m.toFixed(1) : Math.round(m).toLocaleString("en-US")} month${m === 1 ? "" : "s"}`;
export const percent = (x: number) => `${Math.round(x * 100).toLocaleString("en-US")}%`;

export function NumberField({
  label,
  unit,
  step,
  value,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  step: number;
  value: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium">{label}</span>
      <input
        type="number"
        min={0}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(v) && v >= 0) onChange(v);
        }}
        className="mt-1 w-full rounded-lg border border-line bg-bg px-3 py-2 font-mono text-sm"
      />
      <span className="mt-0.5 block font-mono text-[11px] text-muted">{unit}</span>
    </label>
  );
}

export function PanelStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/75">{label}</p>
      <p className="mt-1.5 font-mono text-base font-semibold sm:text-xl">{children}</p>
    </div>
  );
}

export function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface p-4">
      <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1 font-mono text-lg font-semibold sm:text-xl">{value}</dd>
    </div>
  );
}

export function Callout({ children }: { children: ReactNode }) {
  return <p className="rounded-2xl border border-line bg-brand-soft p-4 text-sm leading-6 text-ink sm:p-5">{children}</p>;
}

export function joinLabels(labels: string[]) {
  if (labels.length === 0) return "your other priorities";
  return labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}
