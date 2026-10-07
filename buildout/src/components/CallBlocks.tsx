import { Check, X } from "lucide-react";
import type { ReactNode } from "react";

export interface CallCheck {
  label: string;
  holds: boolean;
  /** What changes when it doesn't hold */
  outcome?: ReactNode;
}

export interface CallContent {
  /** Shown first when the case is illustrative: what's real and what isn't */
  demo?: ReactNode;
  decision: ReactNode;
  headline: ReactNode;
  bullets: { label: string; text: ReactNode }[];
  checksIntro?: ReactNode;
  checks: CallCheck[];
  landing: { when: string; what: string[] }[];
  people: ReactNode;
  measures: [string, string, string][];
  measuresNote?: ReactNode;
  judgment: { label: string; text: ReactNode }[];
}

function Block({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <p className="kicker">
        {n} · {title}
      </p>
      <div className="mt-3 text-[15px] leading-7 text-ink-2">{children}</div>
    </section>
  );
}

/**
 * "The call": the recommendation first, then the evidence (children), what would change it, how to land it, how we'd know
 * it worked, and the judgment calls. The same six blocks in every app.
 */
export function CallBlocks({ c, children }: { c: CallContent; children?: ReactNode }) {
  return (
    <>
      {c.demo && <p className="mt-6 rounded-xl border border-dashed border-line bg-sunken px-4 py-3 text-sm leading-6 text-ink-2">{c.demo}</p>}
      <section className="mt-6 rounded-2xl border-2 border-brand bg-brand-soft p-5 sm:p-6">
        <p className="kicker">1 · My recommendation</p>
        <p className="mt-1 text-sm text-muted">{c.decision}</p>
        <p className="mt-2 text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl">{c.headline}</p>
        <ul className="mt-4 space-y-2 text-[15px] leading-7 text-ink-2">
          {c.bullets.map((b) => (
            <li key={b.label}>
              <span className="font-semibold text-ink">{b.label}:</span> {b.text}
            </li>
          ))}
        </ul>
      </section>

      {children && (
        <>
          <p className="kicker mt-10">2 · Why: the evidence</p>
          {children}
        </>
      )}

      <Block n={3} title="What would change my mind">
        {c.checksIntro && <p className="mb-2">{c.checksIntro}</p>}
        <ul className="space-y-2">
          {c.checks.map((k) => (
            <li key={k.label} className="flex gap-2.5">
              {k.holds ? <Check className="mt-1.5 size-4 shrink-0 text-brand" aria-label="Holds" /> : <X className="mt-1.5 size-4 shrink-0 text-ink" aria-label="Changes the answer" />}
              <span>
                {k.label}: {k.holds ? "the recommendation holds." : k.outcome}
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <Block n={4} title="How to land it">
        <div className="grid gap-3 sm:grid-cols-3">
          {c.landing.map((col) => (
            <div key={col.when} className="rounded-xl border border-line p-4">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-ink">{col.when}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm leading-6">
                {col.what.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3">{c.people}</p>
      </Block>

      <Block n={5} title="How we'd know it worked">
        <div className="overflow-auto rounded-lg border border-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-sunken text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Measure</th>
                <th className="px-3 py-2 text-right font-medium">Today</th>
                <th className="px-3 py-2 text-right font-medium">Aim</th>
              </tr>
            </thead>
            <tbody>
              {c.measures.map(([m, t, a]) => (
                <tr key={m} className="border-t border-line">
                  <td className="px-3 py-2">{m}</td>
                  <td className="px-3 py-2 text-right font-mono">{t}</td>
                  <td className="px-3 py-2 text-right font-mono">{a}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {c.measuresNote && <p className="mt-2 text-xs text-muted">{c.measuresNote}</p>}
      </Block>

      <Block n={6} title="My judgment calls">
        <ul className="list-disc space-y-2 pl-5">
          {c.judgment.map((j) => (
            <li key={j.label}>
              <span className="font-semibold text-ink">{j.label}:</span> {j.text}
            </li>
          ))}
        </ul>
      </Block>
    </>
  );
}
