import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-2xl border border-line bg-surface p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function Kicker({ children, method }: { children: ReactNode; method?: string }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      <p className="kicker">{children}</p>
      {method && <span className="rounded-full border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">{method}</span>}
    </div>
  );
}

export function NumberField({
  label,
  unit,
  value,
  step,
  min = 0,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  step: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink-2">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(v) && v >= min && (max === undefined || v <= max)) onChange(v);
        }}
        className="mt-1 w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 font-mono text-sm"
      />
      <span className="mt-0.5 block font-mono text-[10px] text-muted">{unit}</span>
    </label>
  );
}

export function Slider({ label, value, display, min, max, step = 1, onChange }: { label: string; value: number; display: string; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-3 text-sm font-medium">
        {label} <span className="font-mono text-brand-ink">{display}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full" />
    </label>
  );
}

export function Stat({ label, value, sub, dark = false }: { label: string; value: ReactNode; sub?: ReactNode; dark?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={`font-mono text-[10px] uppercase tracking-[0.12em] ${dark ? "text-panel-muted" : "text-muted"}`}>{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${dark ? "text-panel-muted" : "text-muted"}`}>{sub}</p>}
    </div>
  );
}

export function SourceLink({ href, children = "source" }: { href: string; children?: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-brand-ink underline underline-offset-2">
      {children}
      <ArrowUpRight className="size-3" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function Pills<T extends string>({ options, value, onChange, label }: { options: { id: T; label: string; blurb?: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={value === o.id}
          title={o.blurb}
          onClick={() => onChange(o.id)}
          className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${value === o.id ? "border-brand bg-brand text-on-brand" : "border-line bg-surface hover:border-brand"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
