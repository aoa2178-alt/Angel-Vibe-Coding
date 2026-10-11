import { ArrowRight, Target, TriangleAlert } from "lucide-react";
import { MessageList } from "@/components/MessageCard";
import { Button, Card, Eyebrow, SectionTitle } from "@/components/ui";
import type { Scenario } from "@/engine/types";

export function Brief({ scenario, onContinue }: { scenario: Scenario; onContinue: () => void }) {
  const { brief } = scenario;
  return (
    <div className="grid gap-8">
      <div className="animate-rise">
        <Eyebrow>Situation brief</Eyebrow>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl">{scenario.title}</h1>
        <p className="mt-2 text-ink-2">
          You're the {scenario.role} at {scenario.company}. Here's what you're walking into.
        </p>
      </div>

      <div className="grid gap-3">
        <Card className="flex gap-3 p-4 sm:p-5">
          <Target className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">The goal</p>
            <p className="mt-1 text-lg font-semibold leading-snug">{brief.goal}</p>
          </div>
        </Card>

        <div className="flex gap-3 rounded-2xl border border-alert/40 bg-alert/[0.07] p-4 sm:p-5" role="alert">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-alert" aria-hidden />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-alert">Incoming · Supplier alert</p>
            <p className="mt-1 text-lg font-semibold leading-snug">{brief.alert.title}</p>
            <p className="mt-1.5 text-[15px] text-ink-2">{brief.alert.body}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]">
          {brief.facts.map((f) => (
            <div key={f.label} className="rounded-xl border border-line bg-panel px-3.5 py-3">
              <dt className="text-xs text-muted">{f.label}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section>
        <SectionTitle>What you're balancing</SectionTitle>
        <ul className="grid gap-2 sm:grid-cols-2">
          {scenario.metrics.map((m) => (
            <li key={m.id} className="rounded-xl border border-line bg-panel/60 p-3.5">
              <p className="text-sm font-semibold">{m.label}</p>
              <p className="mt-0.5 text-sm text-ink-2">{m.hint}</p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <SectionTitle>Leadership channel</SectionTitle>
        <MessageList messages={brief.messages} people={scenario.people} />
      </section>

      <div className="flex justify-end">
        <Button onClick={onContinue} className="w-full sm:w-auto">
          Go to the first decision
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}
