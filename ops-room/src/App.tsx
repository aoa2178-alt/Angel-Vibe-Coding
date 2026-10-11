import { useEffect, useMemo, useState } from "react";
import { AppHeader, ConfirmDialog, Stepper } from "@/components/AppHeader";
import { MetricsPanel, MetricsStrip } from "@/components/Metrics";
import { END, deriveRun, sanitizeRun } from "@/engine/engine";
import { loadRun, saveRun } from "@/engine/storage";
import type { RunState, Scenario } from "@/engine/types";
import { getScenario, scenarios } from "@/scenarios";
import { Brief } from "@/screens/Brief";
import { Consequence } from "@/screens/Consequence";
import { Debrief } from "@/screens/Debrief";
import { Decision } from "@/screens/Decision";
import { Recommendation } from "@/screens/Recommendation";
import { Welcome } from "@/screens/Welcome";

function restoreRun(): RunState | null {
  const saved = loadRun();
  const scenario = saved && getScenario(saved.scenarioId);
  return saved && scenario ? sanitizeRun(scenario, saved) : null;
}

function newRun(scenarioId: string): RunState {
  return { version: 1, scenarioId, stage: "brief", history: [], memo: {}, startedAt: Date.now() };
}

/** Number of decisions on the longest path through the scenario. */
function pathDepth(scenario: Scenario, id = scenario.startDecision, seen: string[] = []): number {
  const d = scenario.decisions[id];
  if (id === END || !d || seen.includes(id)) return 0;
  return 1 + Math.max(0, ...d.options.map((o) => pathDepth(scenario, o.next, [...seen, id])));
}

export default function App() {
  const [run, setRun] = useState<RunState | null>(restoreRun);
  // A saved run reopens where it left off; "home" only shows when there's no run or the player chose it.
  const [view, setView] = useState<"home" | "run">(() => (run ? "run" : "home"));
  const [confirm, setConfirm] = useState<string | null>(null); // scenario id awaiting a restart confirmation

  useEffect(() => saveRun(run), [run]);

  const scenario = run ? getScenario(run.scenarioId) : null;
  const derived = useMemo(() => (scenario && run ? deriveRun(scenario, run.history) : null), [scenario, run]);

  const stage = run?.stage;
  const historyLength = run?.history.length ?? 0;
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view, stage, historyLength]);

  const start = (scenarioId: string) => {
    setRun(newRun(scenarioId));
    setView("run");
  };

  if (view === "home" || !run || !scenario || !derived) {
    return (
      <>
        <Welcome
          scenarios={scenarios}
          savedRun={run}
          onStart={start}
          onResume={() => setView("run")}
          onStartOver={(scenarioId) => setConfirm(scenarioId)}
        />
        <ConfirmDialog
          open={!!confirm}
          title="Start over?"
          body="Your saved run, including your decisions and your note, will be cleared."
          confirmLabel="Start over"
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm) start(confirm);
            setConfirm(null);
          }}
        />
      </>
    );
  }

  const update = (patch: Partial<RunState>) => setRun((r) => (r ? { ...r, ...patch } : r));
  const depth = pathDepth(scenario);
  const steps = [
    "Brief",
    ...Array.from({ length: depth }, (_, i) => [`Decision ${i + 1}`, "Outcome"]).flat(),
    "Memo",
    "Debrief",
  ];
  const stepIndex = {
    brief: 0,
    decision: 1 + 2 * run.history.length,
    consequence: 2 * run.history.length,
    recommendation: 1 + 2 * depth,
    debrief: 2 + 2 * depth,
  }[run.stage];

  const showDeltas = run.stage === "consequence";
  const metricsProps = {
    metrics: scenario.metrics,
    values: derived.metrics,
    from: showDeltas ? derived.lastEntry?.before : undefined,
    animationKey: `${run.stage}-${run.history.length}`,
  };
  const showMetrics = run.stage !== "debrief";

  let screen: React.ReactNode = null;
  switch (run.stage) {
    case "brief":
      screen = <Brief scenario={scenario} onContinue={() => update({ stage: "decision" })} />;
      break;
    case "decision":
      if (derived.currentDecision) {
        const decisionId = derived.currentDecision.id;
        screen = (
          <Decision
            key={decisionId}
            scenario={scenario}
            decision={derived.currentDecision}
            onCommit={(optionId) => update({ stage: "consequence", history: [...run.history, { decisionId, optionId }] })}
          />
        );
      }
      break;
    case "consequence":
      if (derived.lastEntry) {
        const nextId = derived.lastEntry.option.next;
        const nextDecision = scenario.decisions[nextId];
        screen = (
          <Consequence
            scenario={scenario}
            entry={derived.lastEntry}
            nextLabel={nextId === END || !nextDecision ? "Write your recommendation" : `Next: ${nextDecision.step.split("·")[1]?.trim() ?? nextDecision.step}`}
            onContinue={() => update({ stage: nextId === END ? "recommendation" : "decision" })}
          />
        );
      }
      break;
    case "recommendation":
      screen = (
        <Recommendation
          scenario={scenario}
          timeline={derived.timeline}
          memo={run.memo}
          onChange={(id, value) => update({ memo: { ...run.memo, [id]: value } })}
          onSubmit={() => update({ stage: "debrief" })}
        />
      );
      break;
    case "debrief":
      screen = (
        <Debrief
          scenario={scenario}
          run={derived}
          memo={run.memo}
          onPlayAgain={() => start(scenario.id)}
          onHome={() => setView("home")}
        />
      );
      break;
  }

  return (
    <div className="min-h-dvh">
      <AppHeader title={scenario.title} onHome={() => setView("home")} onRestart={() => setConfirm(scenario.id)}>
        <Stepper steps={steps} current={stepIndex} />
        {showMetrics && (
          <div className="mt-3 lg:hidden">
            <MetricsStrip {...metricsProps} />
          </div>
        )}
      </AppHeader>

      <main className={`mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10 ${showMetrics ? "lg:grid lg:grid-cols-[290px_1fr] lg:gap-10" : ""}`}>
        {showMetrics && (
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <MetricsPanel {...metricsProps} />
            </div>
          </aside>
        )}
        <div className="min-w-0" key={`${run.stage}-${run.history.length}`}>
          {screen}
        </div>
      </main>

      <ConfirmDialog
        open={!!confirm}
        title="Restart this scenario?"
        body="Your decisions and your note will be cleared, and you'll start again from the brief."
        confirmLabel="Restart"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) start(confirm);
          setConfirm(null);
        }}
      />
    </div>
  );
}
