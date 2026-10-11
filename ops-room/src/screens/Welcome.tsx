import { ArrowRight, Clock, FileText, Play, RotateCcw, Scale, Users } from "lucide-react";
import { Logo } from "@/components/AppHeader";
import { Button, Card, Eyebrow } from "@/components/ui";
import type { RunState, Scenario } from "@/engine/types";

const stageLabel: Record<RunState["stage"], string> = {
  brief: "reading the brief",
  decision: "a decision is waiting",
  consequence: "reviewing an outcome",
  recommendation: "writing your note to the COO",
  debrief: "run complete",
};

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
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Take the seat. Make the call.
          </h1>
          <p className="mt-4 text-lg text-ink-2 text-pretty">
            The Ops Room drops you into a leadership meeting where the information is incomplete, the teams disagree and
            every option costs something. There's no answer key, only tradeoffs you can defend.
          </p>
        </div>

        <div className="mt-10 grid gap-5">
          {scenarios.map((s) => {
            const saved = savedRun?.scenarioId === s.id ? savedRun : null;
            return (
              <Card key={s.id} className="animate-rise overflow-hidden [animation-delay:120ms]">
                <div className="grid md:grid-cols-[1.4fr_1fr]">
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                      <span className="rounded-full bg-alert/15 px-2.5 py-1 font-semibold text-alert">Scenario 1</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="size-3.5" aria-hidden /> {s.estMinutes}
                      </span>
                      <span>You play: {s.role}</span>
                    </div>
                    <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{s.title}</h2>
                    <p className="mt-1 font-medium text-alert">{s.tagline}</p>
                    <div className="mt-4 grid gap-3 text-[15px] text-ink-2">
                      {s.intro.map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                    </div>

                    <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      {saved ? (
                        <>
                          <Button onClick={onResume}>
                            <Play className="size-4" aria-hidden />
                            {saved.stage === "debrief" ? "View your debrief" : "Resume run"}
                          </Button>
                          <Button variant="secondary" onClick={() => onStartOver(s.id)}>
                            <RotateCcw className="size-4" aria-hidden />
                            Start over
                          </Button>
                        </>
                      ) : (
                        <Button onClick={() => onStart(s.id)}>
                          Start scenario
                          <ArrowRight className="size-4" aria-hidden />
                        </Button>
                      )}
                    </div>
                    {saved && (
                      <p className="mt-3 text-sm text-muted">
                        Saved in this browser: {stageLabel[saved.stage]}.
                      </p>
                    )}
                  </div>

                  <div className="border-t border-line bg-panel-2/40 p-6 sm:p-8 md:border-l md:border-t-0">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">How it plays</h3>
                    <ol className="mt-4 grid gap-4">
                      {[
                        { icon: Users, title: "Read the room", body: "Get the brief and hear from the COO, engineering and commercial." },
                        { icon: Scale, title: "Make two calls", body: "Each option has a benefit, a cost and an unknown. Outcomes stay hidden until you commit." },
                        { icon: FileText, title: "Own the outcome", body: "Write a short note to the COO, then see what you protected and what you missed." },
                      ].map(({ icon: Icon, title, body }) => (
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
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <p className="mt-6 text-sm text-muted">
          No sign-in needed. Your progress saves in this browser, so a refresh won't lose your run. All companies and
          people are fictional.
        </p>
      </main>
    </div>
  );
}
