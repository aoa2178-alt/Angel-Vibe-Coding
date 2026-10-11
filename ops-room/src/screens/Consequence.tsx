import { ArrowRight, Lock } from "lucide-react";
import { MessageList } from "@/components/MessageCard";
import { DeltaChip } from "@/components/Metrics";
import { Button, Card, Eyebrow, SectionTitle } from "@/components/ui";
import type { TimelineEntry } from "@/engine/engine";
import type { Scenario } from "@/engine/types";

export function Consequence({
  scenario,
  entry,
  nextLabel,
  onContinue,
}: {
  scenario: Scenario;
  entry: TimelineEntry;
  nextLabel: string;
  onContinue: () => void;
}) {
  const { decision, option, before, after } = entry;
  return (
    <div className="grid gap-8">
      <div className="animate-rise">
        <Eyebrow>Outcome · {decision.step.split("·")[0].trim()}</Eyebrow>
        <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-sm text-ink-2">
          <Lock className="size-3.5 text-accent" aria-hidden />
          You chose: <span className="font-semibold text-ink">{option.label}</span>
        </p>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{option.outcome.headline}</h1>
        <p className="mt-3 text-base leading-relaxed text-ink-2 sm:text-lg">{option.outcome.body}</p>
      </div>

      <section>
        <SectionTitle>Impact on the dashboard</SectionTitle>
        <Card className="divide-y divide-line">
          {scenario.metrics.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{m.label}</p>
                <p className="text-sm text-muted">
                  {m.describe(before[m.id]) === m.describe(after[m.id]) ? (
                    m.describe(after[m.id])
                  ) : (
                    <>
                      {m.describe(before[m.id])} <span aria-hidden>→</span>
                      <span className="sr-only">to</span> <span className="text-ink-2">{m.describe(after[m.id])}</span>
                    </>
                  )}
                </p>
              </div>
              <DeltaChip metric={m} delta={after[m.id] - before[m.id]} className="shrink-0 px-2 py-1 text-xs" />
            </div>
          ))}
        </Card>
      </section>

      <section>
        <SectionTitle>Reactions</SectionTitle>
        <MessageList messages={option.outcome.messages} people={scenario.people} />
      </section>

      <div className="flex justify-end">
        <Button onClick={onContinue} className="w-full sm:w-auto">
          {nextLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
