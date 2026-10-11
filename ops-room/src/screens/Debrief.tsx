import { useEffect } from "react";
import { ArrowUpRight, CircleCheck, Flag, House, Info, Lightbulb, ListChecks, Map as MapIcon, RotateCcw, TriangleAlert } from "lucide-react";
import { DeltaChip, MetricTile } from "@/components/Metrics";
import { Button, Card, Eyebrow, SectionTitle, cx } from "@/components/ui";
import { CONCEPTS } from "@/engine/concepts";
import { evaluateDebrief, health, metricStatus, type DerivedRun } from "@/engine/engine";
import { pathRows, samePath } from "@/engine/paths";
import { recordEnding } from "@/engine/storage";
import type { Choice, DebriefRule, Scenario } from "@/engine/types";

const STATUS_BAR = { good: "bg-good", watch: "bg-alert", critical: "bg-bad" } as const;

/**
 * Every path through the scenario: one row per first choice, one cell per route from it. Each cell shows the second
 * choice, the debrief headline it earns, and the four final scores as small bars (longer = better for the company).
 */
function PathMap({ scenario, mine }: { scenario: Scenario; mine: Choice[] }) {
  const rows = pathRows(scenario);
  return (
    <div className="grid gap-4">
      {rows.map(({ option, paths }) => (
        <div key={option.id}>
          <p className="mb-2 text-sm font-semibold">{option.label}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {paths.map((p) => {
              const yours = samePath(p.choices, mine);
              const last = p.run.timeline.at(-1);
              return (
                <div
                  key={p.choices.map((c) => c.optionId).join("/")}
                  className={cx("rounded-xl border p-3", yours ? "border-accent bg-accent/10" : "border-line bg-panel-2/40")}
                >
                  <p className="text-xs text-muted">
                    then {last?.option.label}
                    {yours && <span className="ml-1.5 rounded bg-accent px-1.5 py-0.5 font-semibold text-accent-ink">your path</span>}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-snug">{p.profile?.title}</p>
                  <ul className="mt-2 grid gap-1">
                    {scenario.metrics.map((m) => {
                      const v = p.run.metrics[m.id]!;
                      return (
                        <li key={m.id} className="grid grid-cols-[3.5rem_1fr] items-center gap-2 text-[11px] text-muted">
                          <span>{m.shortLabel}</span>
                          <span className="h-1.5 rounded-full bg-line" aria-label={`${m.label}: ${m.describe(v)}`}>
                            <span className={cx("block h-full rounded-full", STATUS_BAR[metricStatus(m, v)])} style={{ width: `${Math.max(4, health(m, v))}%` }} />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function RuleList({ rules, icon: Icon, color, empty }: { rules: DebriefRule[]; icon: typeof CircleCheck; color: string; empty: string }) {
  if (rules.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <ul className="grid gap-3">
      {rules.map((r) => (
        <li key={r.title} className="flex gap-3">
          <Icon className={`mt-0.5 size-5 shrink-0 ${color}`} aria-hidden />
          <div>
            <p className="font-semibold leading-snug">{r.title}</p>
            <p className="mt-1 text-sm text-ink-2">{r.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Debrief({
  scenario,
  run,
  memo,
  onPlayAgain,
  onHome,
}: {
  scenario: Scenario;
  run: DerivedRun;
  memo: Record<string, string>;
  onPlayAgain: () => void;
  onHome: () => void;
}) {
  const result = evaluateDebrief(scenario, run);
  const ending = result.profile?.title;
  // Remember this ending for the shelf on the home page.
  useEffect(() => {
    if (ending) recordEnding(scenario.id, ending);
  }, [scenario.id, ending]);
  const mine: Choice[] = run.timeline.map((t) => ({ decisionId: t.decision.id, optionId: t.option.id }));
  const concepts = [...new Set(run.timeline.flatMap((t) => t.option.concepts ?? []))].filter((c) => c in CONCEPTS);

  return (
    <div className="grid gap-10">
      <div className="animate-rise">
        <Eyebrow>Debrief · {scenario.title}</Eyebrow>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-5xl">{result.profile?.title}</h1>
        <p className="mt-3 max-w-3xl text-base text-ink-2 sm:text-lg">{result.profile?.body}</p>
      </div>

      <section>
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <SectionTitle>Final dashboard</SectionTitle>
          <span className="text-xs text-muted">Change since the brief</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {scenario.metrics.map((m) => (
            <MetricTile key={m.id} metric={m} value={run.metrics[m.id]} from={scenario.initial[m.id]} />
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Your timeline</SectionTitle>
        <ol className="relative grid gap-5 border-l border-line pl-6">
          <li className="relative">
            <span className="absolute -left-[31px] top-1 size-2.5 rounded-full bg-alert ring-4 ring-bg" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Brief</p>
            <p className="mt-0.5 font-semibold">{scenario.brief.alert.title}</p>
          </li>
          {run.timeline.map((t) => (
            <li key={t.decision.id} className="relative">
              <span className="absolute -left-[31px] top-1 size-2.5 rounded-full bg-accent ring-4 ring-bg" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t.decision.step}</p>
              <p className="mt-0.5 font-semibold">
                {t.option.label} <span className="font-normal text-ink-2">· {t.option.outcome.headline}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {scenario.metrics.map((m) => (
                  <span key={m.id} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-2 py-1 text-xs text-ink-2">
                    {m.shortLabel}
                    <DeltaChip metric={m} delta={t.after[m.id] - t.before[m.id]} />
                  </span>
                ))}
              </div>
            </li>
          ))}
          <li className="relative">
            <span className="absolute -left-[31px] top-1 size-2.5 rounded-full bg-good ring-4 ring-bg" aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Recommendation</p>
            <p className="mt-0.5 font-semibold">Note sent to {scenario.memo.to}</p>
          </li>
        </ol>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Flag className="size-5 text-good" aria-hidden /> Tradeoffs you managed well
          </h2>
          <RuleList rules={result.strengths} icon={CircleCheck} color="text-good" empty="No standout strengths on this path. Try a different combination." />
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <TriangleAlert className="size-5 text-alert" aria-hidden /> What you may have overlooked
          </h2>
          <RuleList rules={result.blindSpots} icon={TriangleAlert} color="text-alert" empty="Nothing major slipped through on this path." />
        </Card>
      </div>

      {concepts.length > 0 && (
        <Card className="p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Lightbulb className="size-5 text-accent" aria-hidden /> Ideas behind your calls
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {concepts.map((c) => (
              <li key={c} className="rounded-xl border border-line bg-panel-2/40 p-3">
                <p className="text-sm font-semibold">{CONCEPTS[c]!.label}</p>
                <p className="mt-1 text-sm text-ink-2">{CONCEPTS[c]!.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section>
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          <MapIcon className="size-5 text-accent" aria-hidden /> Every path
        </h2>
        <p className="mb-4 text-sm text-muted">All the routes through this scenario and where each one ends. Longer bars are better for the company.</p>
        <PathMap scenario={scenario} mine={mine} />
      </section>

      {scenario.app && (
        <a
          href={scenario.app.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-4 rounded-2xl border border-accent/50 bg-accent/10 p-5 transition hover:border-accent"
        >
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.12em] text-accent">Run the numbers</span>
            <span className="mt-1 block font-semibold">{scenario.app.label}</span>
            <span className="block text-sm text-ink-2">Opens {scenario.app.name} in a new tab.</span>
          </span>
          <ArrowUpRight className="size-5 shrink-0 text-accent" aria-hidden />
        </a>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="overflow-hidden">
          <div className="border-b border-line bg-panel-2/50 px-5 py-3 text-sm">
            <p className="font-semibold">Your note to {scenario.memo.to}</p>
          </div>
          <dl className="grid gap-4 p-5">
            {scenario.memo.fields.map((f) => (
              <div key={f.id}>
                <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{f.label}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-[15px] text-ink">{memo[f.id]?.trim() || "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card className="p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <ListChecks className="size-5 text-accent" aria-hidden /> Check your note
          </h2>
          <p className="mt-1 text-sm text-muted">
            Your note wasn't scored. There's no AI review in this version. Use these prompts to check it yourself.
          </p>
          <ul className="mt-4 grid gap-3">
            {result.selfCheck.map((r) => (
              <li key={r.title} className="rounded-xl border border-line bg-panel-2/40 p-3">
                <p className="text-sm font-semibold">{r.title}</p>
                <p className="mt-0.5 text-sm text-ink-2">{r.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <div className="flex gap-3 rounded-2xl border border-line bg-panel/60 p-4 text-sm text-ink-2">
        <Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
        <p>
          How this debrief works: the feedback comes from fixed rules tied to the options you chose and your final
          metrics. Every path trades something away, so try a different route to see how the story changes.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onHome}>
          <House className="size-4" aria-hidden />
          Back to home
        </Button>
        <Button onClick={onPlayAgain}>
          <RotateCcw className="size-4" aria-hidden />
          Play again
        </Button>
      </div>
    </div>
  );
}
