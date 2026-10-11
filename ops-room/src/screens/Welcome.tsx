import { ArrowRight, Clock, FileText, Play, RotateCcw, Scale, Users } from "lucide-react";
import { Logo } from "@/components/AppHeader";
import { Button, Card, Eyebrow } from "@/components/ui";
import type { RunState, Scenario } from "@/engine/types";

const stageLabel: Record<RunState["stage"], string> = {
  brief: "reading the brief",
  decision: "a decision is waiting",
  consequence: "reviewing an outcome",
  recommendation: "writing your note",
  debrief: "run complete",
};

const HOW = [
  { icon: Users, title: "Read the room", body: "Get the brief and hear from the people around the table." },
  { icon: Scale, title: "Make two calls", body: "Each option has a benefit, a cost and an unknown. Outcomes stay hidden until you commit." },
  { icon: FileText, title: "Own the outcome", body: "Write a short note, see every path you could have taken, then run the numbers." },
];

export function Welcome({
  scenarios,
  savedRun,
  onStart,
  onResume,
  onStartOver,
}: {
  scenarios: Scenario[];
  savedRun: RunState | null;
  onStart: (scenarioId: string) => void;
  onResume: () => void;
  onStartOver: (scenarioId: string) => void;
}) {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center px-4 py-4 sm:px-6">
        <Logo />
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:px-6 sm:pt-12">
        <div className="max-w-2xl animate-rise">
          <Eyebrow>Operations decision simulator</Eyebrow>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">Take the seat. Make the call.</h1>
          <p className="mt-4 text-lg text-ink-2 text-pretty">
            Incomplete information, teams that disagree, and no option that's free. Make the call, then see what it cost.
          </p>
        </div>

        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {HOW.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-accent">
                <Icon className="size-4" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{title}</span>
                <span className="block text-sm text-ink-2">{body}</span>
              </span>
            </li>
          ))}
        </ol>

        <h2 className="mt-12 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Scenarios</h2>
        <div className="mt-3 grid gap-3">
          {scenarios.map((s, i) => {
            const saved = savedRun?.scenarioId === s.id ? savedRun : null;
            return (
              <Card key={s.id} className="animate-rise p-5 sm:p-6 [animation-delay:120ms]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
                      <span className="rounded-full bg-alert/15 px-2.5 py-1 font-semibold text-alert">Scenario {i + 1}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" aria-hidden /> {s.estMinutes}
                      </span>
                      <span>You play: {s.role}</span>
                      {s.app && <span>Numbers: {s.app.name}</span>}
                    </div>
                    <h3 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">{s.title}</h3>
                    <p className="mt-1 text-[15px] text-ink-2">{s.tagline}</p>
                    {saved && <p className="mt-2 text-sm text-muted">Saved in this browser: {stageLabel[saved.stage]}.</p>}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                    {saved ? (
                      <>
                        <Button onClick={onResume}>
                          <Play className="size-4" aria-hidden />
                          {saved.stage === "debrief" ? "View debrief" : "Resume"}
                        </Button>
                        <Button variant="secondary" onClick={() => onStartOver(s.id)}>
                          <RotateCcw className="size-4" aria-hidden />
                          Start over
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => onStart(s.id)}>
                        Start
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="mt-6 text-sm text-muted">No sign-in needed. Your progress saves in this browser. All companies and people are fictional.</p>
      </main>
    </div>
  );
}
