import { END, deriveRun, evaluateDebrief, type DerivedRun } from "./engine";
import type { Choice, DebriefRule, Scenario } from "./types";

export interface PathResult {
  choices: Choice[];
  run: DerivedRun;
  profile: DebriefRule | null;
}

/** Every route from the first decision to the memo, each replayed with its final scores and debrief headline. */
export function allPaths(scenario: Scenario): PathResult[] {
  const routes: Choice[][] = [];
  const walk = (id: string, sofar: Choice[], seen: string[]) => {
    const d = scenario.decisions[id];
    if (!d || seen.includes(id)) return;
    for (const o of d.options) {
      const next = [...sofar, { decisionId: d.id, optionId: o.id }];
      if (o.next === END) routes.push(next);
      else walk(o.next, next, [...seen, id]);
    }
  };
  walk(scenario.startDecision, [], []);
  return routes.map((choices) => {
    const run = deriveRun(scenario, choices);
    return { choices, run, profile: evaluateDebrief(scenario, run).profile };
  });
}

/** Paths grouped by their first choice, in option order, for the debrief's path map. */
export function pathRows(scenario: Scenario) {
  const first = scenario.decisions[scenario.startDecision];
  const paths = allPaths(scenario);
  return (first?.options ?? []).map((option) => ({
    option,
    paths: paths.filter((p) => p.choices[0]?.optionId === option.id),
  }));
}

/** True when two choice lists are the same path. */
export const samePath = (a: Choice[], b: Choice[]) =>
  a.length === b.length && a.every((c, i) => c.decisionId === b[i]!.decisionId && c.optionId === b[i]!.optionId);

/** A scenario's distinct endings (debrief titles), in path order. */
export function endingsOf(scenario: Scenario): string[] {
  return [...new Set(allPaths(scenario).map((p) => p.profile?.title).filter((t): t is string => !!t))];
}
