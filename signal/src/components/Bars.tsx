import { useState, type ReactNode } from "react";

export interface BarRow {
  label: string;
  /** One or more values, drawn as stacked thin bars in the row */
  values: { value: number; color: string; label?: string }[];
  /** Text at the end of the row (defaults to the first value) */
  note?: ReactNode;
}

/**
 * Horizontal bars with the value printed on every row (so color is never the only cue), an optional dashed target line,
 * a legend when there's more than one series, and a table view.
 */
export function Bars({
  title,
  rows,
  max,
  format,
  target,
  legend,
  ariaLabel,
}: {
  title?: string;
  rows: BarRow[];
  max: number;
  format: (v: number) => string;
  target?: { value: number; label: string };
  legend?: { label: string; color: string }[];
  ariaLabel: string;
}) {
  const [table, setTable] = useState(false);
  const x = (v: number) => `${Math.max(0, Math.min(1, v / (max || 1))) * 100}%`;
  return (
    <figure className="min-w-0">
      {(title || legend) && (
        <figcaption className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-2">
          {title && <span className="text-sm font-semibold text-ink">{title}</span>}
          {legend && (
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              {legend.map((l) => (
                <span key={l.label} className="flex items-center gap-1.5">
                  <span className="size-3 rounded-sm" style={{ background: l.color }} aria-hidden /> {l.label}
                </span>
              ))}
              {target && (
                <span className="flex items-center gap-1.5">
                  <span className="h-3 border-l-2 border-dashed border-ink-2" aria-hidden /> {target.label}
                </span>
              )}
            </span>
          )}
        </figcaption>
      )}
      <ul className="space-y-2.5" aria-label={ariaLabel}>
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[minmax(6rem,9rem)_1fr_auto] items-center gap-3 text-sm">
            <span className="truncate" title={r.label}>
              {r.label}
            </span>
            <span className="relative block">
              {r.values.map((v, k) => (
                <span key={k} className="mb-0.5 block h-2.5 overflow-hidden rounded-full bg-sunken last:mb-0">
                  <span className="glide block h-full rounded-full" style={{ width: x(v.value), background: v.color }} />
                </span>
              ))}
              {target && <span className="absolute -top-1 -bottom-1 border-l-2 border-dashed border-ink-2" style={{ left: x(target.value) }} aria-hidden />}
            </span>
            <span className="min-w-12 text-right font-mono text-xs">{r.note ?? r.values.map((v) => format(v.value)).join(" · ")}</span>
          </li>
        ))}
      </ul>
      {target && !legend && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
          <span className="h-3 border-l-2 border-dashed border-ink-2" aria-hidden /> {target.label}
        </p>
      )}
      <button type="button" onClick={() => setTable((t) => !t)} aria-expanded={table} className="mt-2 text-xs font-medium text-brand-ink underline underline-offset-2 print:hidden">
        {table ? "Hide table" : "Show as a table"}
      </button>
      {table && (
        <div className="mt-2 overflow-auto rounded-lg border border-line">
          <table className="w-full text-left text-xs">
            <thead className="bg-sunken text-muted">
              <tr>
                <th className="px-2 py-1.5 font-medium">Row</th>
                {(legend ?? [{ label: "Value", color: "" }]).map((l) => (
                  <th key={l.label} className="px-2 py-1.5 text-right font-medium">
                    {l.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="font-mono">
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-line">
                  <td className="px-2 py-1 font-sans">{r.label}</td>
                  {r.values.map((v, k) => (
                    <td key={k} className="px-2 py-1 text-right">
                      {format(v.value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}

/** One horizontal stacked bar for parts of a whole (e.g. online / covered but offline / no signal), labeled below. */
export function Stack({ parts, total, format, ariaLabel }: { parts: { label: string; value: number; color: string }[]; total: number; format: (v: number) => string; ariaLabel: string }) {
  return (
    <figure className="min-w-0" aria-label={ariaLabel}>
      <div className="flex h-7 w-full gap-0.5 overflow-hidden rounded-lg">
        {parts.map((p) => (
          <span key={p.label} className="glide block h-full" style={{ width: `${(p.value / (total || 1)) * 100}%`, background: p.color }} title={`${p.label}: ${format(p.value)}`} />
        ))}
      </div>
      <figcaption className="mt-2 grid gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
        {parts.map((p) => (
          <span key={p.label} className="flex items-start gap-1.5">
            <span className="mt-0.5 size-3 shrink-0 rounded-sm" style={{ background: p.color }} aria-hidden />
            <span>
              <span className="text-ink-2">{p.label}</span> <span className="font-mono font-semibold">{format(p.value)}</span>{" "}
              <span className="text-muted">({Math.round((p.value / (total || 1)) * 100)}%)</span>
            </span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
