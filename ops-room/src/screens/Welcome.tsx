import { ArrowRight, FileText, Play, RotateCcw, Scale, Users } from "lucide-react";
import { Logo } from "@/components/AppHeader";
import { EndingsShelf } from "@/components/EndingsShelf";
import { Button, Countdown } from "@/components/ui";
import type { RunState, Scenario } from "@/engine/types";

const stageLabel: Record<RunState["stage"], string> = {
  brief: "reading the brief",
  decision: "a decision is waiting",
  consequence: "reviewing an outcome",
  recommendation: "writing your note",
  debrief: "run complete",
};

const HOW = [
  { icon: Users, title: "Read the file", body: "The brief, the numbers, and what each person around the table wants." },
  { icon: Scale, title: "Make two calls", body: "Each option has a benefit, a cost and an unknown. Outcomes stay hidden until you commit." },
  { icon: FileText, title: "Own the ending", body: "Write a short note, see every ending you could have had, then run the numbers." },
];

/** The featured case, as a file dropped on the desk: a few facts, one line blacked out, and the clock. */
function Dossier({ scenario }: { scenario: Scenario }) {
  return (
    <div
      className="relative rotate-[-2deg] border-t-[6px] border-accent bg-panel p-5 font-mono text-[11.5px] leading-[1.75] text-ink shadow-[0_22px_48px_rgb(20_20_30/0.16),0_2px_6px_rgb(20_20_30/0.08)] sm:p-6"
      style={{ animation: "drop 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s both" }}
    >
      <span
        className="absolute right-4 top-4 rotate-[8deg] border-2 border-bad px-2 py-0.5 text-[11px] font-bold tracking-[0.14em] text-bad"
        style={{ animation: "stamp 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.8s both" }}
      >
        URGENT
      </span>
      <p className="pr-24 font-serif text-xl font-extrabold leading-tight sm:text-2xl">Case 01: {scenario.title}</p>
      <dl className="mt-3">
        {scenario.brief.facts.slice(0, 3).map((f) => (
          <div key={f.label} className="flex gap-2">
            <dt className="shrink-0 uppercase text-muted">{f.label}:</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
        <div className="flex gap-2">
          <dt className="shrink-0 uppercase text-muted">Status:</dt>
          <dd>
            <span className="rounded-[1px] bg-ink px-16 text-transparent">classified</span>
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 uppercase text-muted">Assigned to:</dt>
          <dd>You</dd>
        </div>
      </dl>
      {scenario.clock && (
        <div className="mt-4 border-t border-line pt-4">
          <Countdown clock={scenario.clock} />
        </div>
      )}
    </div>
  );
}

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
  const featured = scenarios[0]!;
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Logo />
          <nav aria-label="Sections" className="hidden items-stretch gap-6 self-stretch sm:flex">
            <a href="#cases" className="relative flex items-center text-sm font-semibold text-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-accent">
              Cases
            </a>
            <a href="#how" className="flex items-center text-sm text-muted transition hover:text-ink">
              How it plays
            </a>
            <a href="#endings" className="flex items-center text-sm text-muted transition hover:text-ink">
              Your endings
            </a>
          </nav>
          <a href="#cases" className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-accent px-3.5 py-2 text-sm font-semibold text-accent-ink transition hover:brightness-110">
            Open a case <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="grid items-center gap-10 pb-10 pt-12 sm:pt-16 lg:grid-cols-[1.25fr_1fr]">
          <div className="animate-rise">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">Leadership decision simulator</p>
            <h1 className="mt-4 text-5xl leading-[0.98] text-balance sm:text-7xl">
              Take the seat.
              <br />
              Make the <em className="font-semibold italic text-accent">call.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-2 text-pretty">
              Incomplete information, teams that disagree, and no option that's free. Read the file, make two calls, and see every ending you could
              have had.
            </p>
          </div>
          <div className="px-2 sm:px-6">
            <Dossier scenario={featured} />
          </div>
        </section>

        <section id="how" className="scroll-mt-20 border-t border-line py-8" aria-label="How it plays">
          <ol className="grid gap-5 sm:grid-cols-3">
            {HOW.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-accent/10 text-accent">
                  <Icon className="size-4" aria-hidden />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-ink">{title}</span>
                  <span className="block text-sm text-ink-2">{body}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section id="cases" className="scroll-mt-20" aria-label="Cases">
          <div className="grid overflow-hidden rounded-lg border border-line bg-line [gap:1px] sm:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((s, i) => {
              const saved = savedRun?.scenarioId === s.id ? savedRun : null;
              return (
                <article key={s.id} className="flex animate-rise flex-col bg-panel p-5 transition hover:bg-accent/[0.03] sm:p-6">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                    Case {String(i + 1).padStart(2, "0")}
                    {s.app ? ` · ${s.app.name}` : ""}
                  </p>
                  <h2 className="mt-2 font-serif text-2xl font-extrabold leading-tight">{s.title}</h2>
                  <p className="mt-1.5 font-serif text-[15px] italic leading-snug text-muted">{s.tagline}</p>
                  <p className="mt-3 text-xs text-muted">
                    {s.estMinutes} · You play: {s.role}
                  </p>
                  {s.clock && (
                    <p className="mt-1">
                      <Countdown clock={s.clock} size="sm" />
                    </p>
                  )}
                  <div className="mt-auto flex flex-wrap gap-2 pt-5">
                    {saved ? (
                      <>
                        <Button onClick={onResume} className="min-h-10 rounded-md px-3.5">
                          <Play className="size-4" aria-hidden />
                          {saved.stage === "debrief" ? "View debrief" : "Resume"}
                        </Button>
                        <Button variant="secondary" onClick={() => onStartOver(s.id)} className="min-h-10 rounded-md px-3.5">
                          <RotateCcw className="size-4" aria-hidden />
                          Start over
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => onStart(s.id)} className="min-h-10 rounded-md px-3.5">
                        Open case
                        <ArrowRight className="size-4" aria-hidden />
                      </Button>
                    )}
                  </div>
                  {saved && <p className="mt-2 text-xs text-muted">Saved in this browser: {stageLabel[saved.stage]}.</p>}
                </article>
              );
            })}
          </div>
        </section>

        <EndingsShelf scenarios={scenarios} />

        <p className="mt-6 text-sm text-muted">No sign-in needed. Your progress saves in this browser. All companies and people are fictional.</p>
      </main>
    </div>
  );
}
