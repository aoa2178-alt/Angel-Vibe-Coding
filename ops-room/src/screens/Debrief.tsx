import { CircleCheck, Flag, House, Info, ListChecks, RotateCcw, TriangleAlert } from "lucide-react";
import { DeltaChip, MetricTile } from "@/components/Metrics";
import { Button, Card, Eyebrow, SectionTitle } from "@/components/ui";
import { evaluateDebrief, type DerivedRun } from "@/engine/engine";
import type { DebriefRule, Scenario } from "@/engine/types";

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
