import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import type { Fact } from "@/lib/model";

export const PHASE_COLOR = ["var(--phase-1)", "var(--phase-2)", "var(--phase-3)"];

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

export function Confidence({ level }: { level: string }) {
  return (
    <span className="shrink-0 rounded-full border border-line bg-bg px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-2">
      {level}
    </span>
  );
}

export function SourceLink({ href, children = "source" }: { href: string; children?: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 font-medium text-ink underline decoration-brand decoration-2 underline-offset-2">
      {children}
      <ArrowUpRight className="size-3" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function FactList({ facts }: { facts: Fact[] }) {
  return (
    <ul className="divide-y divide-line">
      {facts.map((f) => (
        <li key={f.text} className="flex items-start justify-between gap-3 py-3 text-sm leading-6 text-ink-2">
          <span>
            {f.text} <SourceLink href={f.source} />
          </span>
          <Confidence level={f.confidence} />
        </li>
      ))}
    </ul>
  );
}

export function Stat({ label, value, sub, dark = false }: { label: string; value: ReactNode; sub?: ReactNode; dark?: boolean }) {
  return (
    <div className="min-w-0">
      <p className={`font-mono text-[10px] uppercase tracking-[0.12em] ${dark ? "text-panel-muted" : "text-muted"}`}>{label}</p>
      <p className="mt-1.5 font-mono text-xl font-semibold tracking-tight sm:text-2xl">{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${dark ? "text-panel-muted" : "text-muted"}`}>{sub}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-5 sm:p-6 ${className}`}>{children}</section>;
}
