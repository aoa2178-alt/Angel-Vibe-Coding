import { Check, X } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { CallShare, HowSolid } from "./CallTools";
import { Fold } from "./Fold";
import { TrustTag, type Trust } from "./ui";

export interface CallCheck {
  label: string;
  holds: boolean;
  /** What changes when it doesn't hold */
  outcome?: ReactNode;
}

export interface CallNumber {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  trust?: Trust;
}

export interface CallContent {
  /** Shown first when the case is illustrative: what's real and what isn't */
  demo?: ReactNode;
  /** The card's label: "Recommendation" unless the app ends in something else (a plan update, a quarterly note) */
  kicker?: string;
  decision: ReactNode;
  headline: ReactNode;
  /** The three numbers behind the call, shown on the card */
  numbers?: CallNumber[];
  bullets: { label: string; text: ReactNode }[];
  /** One line on what the evidence fold holds */
  evidenceSub?: string;
  checksIntro?: ReactNode;
  checks: CallCheck[];
  landing: { when: string; what: string[] }[];
  people: ReactNode;
  measures: [string, string, string][];
  measuresNote?: ReactNode;
  judgment: { label: string; text: ReactNode }[];
}

/**
 * "The call" as a scan: one card with the answer, its three numbers, what would change it, and what comes next. The
 * evidence (children), the stress tests, how to land it, how we'd know it worked, and the judgment calls fold away below,
 * each with a one-line hint. The same layout in every app; folds open for print.
 */
export function CallBlocks({ c, children }: { c: CallContent; children?: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const flips = c.checks.filter((k) => !k.holds);
  const holds = c.checks.length - flips.length;
  const [m0] = c.measures;
  const lower = (t: string) => (/^[A-Z]{2}/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));
  return (
    <div ref={root}>
      {c.demo && <p className="mt-6 rounded-xl border border-dashed border-line bg-sunken px-4 py-3 text-sm leading-6 text-ink-2">{c.demo}</p>}
      <section data-call-text className="mt-6 rounded-2xl border-2 border-brand bg-brand-soft p-5 sm:p-6">
        <p className="kicker">{c.kicker ?? "Recommendation"}</p>
        <p className="mt-1 text-sm text-muted">{c.decision}</p>
        <p className="mt-2 text-xl font-bold leading-snug tracking-tight text-ink sm:text-2xl">{c.headline}</p>
        {c.numbers && c.numbers.length > 0 && (
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {c.numbers.map((n) => (
              <div key={n.label} className="min-w-0 rounded-[10px] border border-line bg-surface p-3.5">
                <dt className="text-xs text-muted">
                  {n.label}
                  {n.trust && <TrustTag kind={n.trust} />}
                </dt>
                <dd className="mt-1 font-mono text-2xl font-semibold tracking-tight text-ink">{n.value}</dd>
                {n.sub && <dd className="text-xs text-muted">{n.sub}</dd>}
              </div>
            ))}
          </dl>
        )}
        {c.checks.length > 0 && (
          <p className="mt-3 rounded-[10px] border border-line bg-surface px-3.5 py-3 text-[15px] leading-6 text-ink-2">
            <span className="font-semibold text-ink">What would change it: </span>
            {flips.length === 1 ? (
              <>
                {lower(flips[0]!.label)}: {flips[0]!.outcome}
                {holds > 0 && ` The other ${holds} stress test${holds === 1 ? "" : "s"} don't change it.`}
              </>
            ) : flips.length > 1 ? (
              `${flips.length} of ${c.checks.length} stress tests change it: ${flips.map((k) => lower(k.label)).join("; ")}. Details below.`
            ) : (
              `none of the ${c.checks.length} stress tests change it.`
            )}
          </p>
        )}
        <ul className="mt-3 space-y-1.5 text-sm leading-6 text-ink-2">
          {c.bullets.map((b) => (
            <li key={b.label}>
              <span className="font-semibold text-ink">{b.label}:</span> {b.text}
            </li>
          ))}
        </ul>
      </section>
      <CallShare root={root} />

      <div className="mt-6 grid gap-3">
        {children && (
          <Fold title="Evidence" sub={c.evidenceSub ?? "The charts and figures behind the call"}>
            {children}
          </Fold>
        )}

        <Fold title="What would change the recommendation" sub={`Holds in ${holds} of ${c.checks.length} stress tests`}>
          <div data-call-text className="text-[15px] leading-7 text-ink-2">
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
          </div>
          <HowSolid checks={c.checks} />
        </Fold>

        <Fold title="Implementation" sub={`${c.landing.map((l) => l.when).join(" · ")}, and who owns each part`}>
          <div data-call-text className="text-[15px] leading-7 text-ink-2">
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
          </div>
        </Fold>

        <Fold title="Success measures" sub={m0 ? `${m0[0]}: ${m0[1]} today, aim ${m0[2]}` : undefined}>
          <div data-call-text>
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
          </div>
        </Fold>

        <Fold title="Judgment calls" sub={c.judgment.map((j) => j.label).join(" · ")}>
          <ul data-call-text className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-ink-2">
            {c.judgment.map((j) => (
              <li key={j.label}>
                <span className="font-semibold text-ink">{j.label}:</span> {j.text}
              </li>
            ))}
          </ul>
        </Fold>
      </div>
    </div>
  );
}
