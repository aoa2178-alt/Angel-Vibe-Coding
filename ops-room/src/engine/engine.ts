import type {
  Choice,
  Decision,
  DebriefRule,
  MetricDef,
  MetricValues,
  Option,
  RuleCondition,
  RunState,
  Scenario,
} from "./types";

export const END = "recommendation";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function applyEffects(values: MetricValues, effects: Partial<MetricValues>): MetricValues {
  const next = { ...values };
  for (const [id, delta] of Object.entries(effects)) {
    if (typeof delta === "number" && id in next) next[id] = clamp(next[id] + delta);
  }
  return next;
}

export interface TimelineEntry {
  decision: Decision;
  option: Option;
  before: MetricValues;
  after: MetricValues;
}

export interface DerivedRun {
  metrics: MetricValues;
  /** Metrics before the most recent choice, used to show deltas on the consequence screen. */
  previous: MetricValues;
  timeline: TimelineEntry[];
  tags: Set<string>;
  /** The decision the player is facing now, or null once the path has ended. */
  currentDecision: Decision | null;
  lastEntry: TimelineEntry | null;
}

/** Replays the player's choices from the scenario's starting metrics. Unknown choices are ignored. */
export function deriveRun(scenario: Scenario, history: Choice[]): DerivedRun {
  let metrics = { ...scenario.initial };
  let previous = metrics;
  const timeline: TimelineEntry[] = [];
  const tags = new Set<string>();
  let nextId: string = scenario.startDecision;

  for (const choice of history) {
    const decision = scenario.decisions[choice.decisionId];
    const option = decision?.options.find((o) => o.id === choice.optionId);
    if (!decision || !option || decision.id !== nextId) break;
    previous = metrics;
    metrics = applyEffects(metrics, option.effects);
    timeline.push({ decision, option, before: previous, after: metrics });
    option.tags.forEach((t) => tags.add(t));
    nextId = option.next;
  }

  return {
    metrics,
    previous,
    timeline,
    tags,
    currentDecision: nextId === END ? null : (scenario.decisions[nextId] ?? null),
    lastEntry: timeline.at(-1) ?? null,
  };
}

/** Keeps only the choices that still form a valid path, so edited scenario data can't break a saved run. */
export function sanitizeRun(scenario: Scenario, run: RunState): RunState {
  const { timeline } = deriveRun(scenario, run.history);
  const history = run.history.slice(0, timeline.length);
  const reachedEnd = timeline.at(-1)?.option.next === END;
  let stage = run.stage;
  if ((stage === "recommendation" || stage === "debrief") && !reachedEnd) stage = history.length ? "consequence" : "brief";
  if (stage === "consequence" && history.length === 0) stage = "brief";
  if (stage === "decision" && reachedEnd) stage = "consequence";
  return { ...run, history, stage };
}

export type MetricStatus = "good" | "watch" | "critical";

/** 0–100 where 100 is best for the company, regardless of the metric's direction. */
export function health(metric: MetricDef, value: number) {
  return metric.higherIsBetter ? value : 100 - value;
}

export function metricStatus(metric: MetricDef, value: number): MetricStatus {
  const h = health(metric, value);
  if (h >= 60) return "good";
  if (h >= 40) return "watch";
  return "critical";
}

/** "better", "worse" or "same" for a change, taking the metric's direction into account. */
export function deltaQuality(metric: MetricDef, delta: number) {
  if (delta === 0) return "same" as const;
  return (delta > 0) === metric.higherIsBetter ? ("better" as const) : ("worse" as const);
}

export function matches(cond: RuleCondition, tags: Set<string>, metrics: MetricValues) {
  if (cond.tags && !cond.tags.every((t) => tags.has(t))) return false;
  if (cond.anyTags && !cond.anyTags.some((t) => tags.has(t))) return false;
  if (cond.notTags && cond.notTags.some((t) => tags.has(t))) return false;
  if (cond.metrics) {
    for (const [id, { min, max }] of Object.entries(cond.metrics)) {
      const v = metrics[id];
      if (v === undefined) return false;
      if (min !== undefined && v < min) return false;
      if (max !== undefined && v > max) return false;
    }
  }
  return true;
}

export function evaluateDebrief(scenario: Scenario, run: DerivedRun) {
  const pick = (rules: DebriefRule[]) => rules.filter((r) => matches(r.when, run.tags, run.metrics));
  return {
    profile: pick(scenario.debrief.profiles)[0] ?? null,
    strengths: pick(scenario.debrief.strengths),
    blindSpots: pick(scenario.debrief.blindSpots),
    selfCheck: pick(scenario.debrief.selfCheck),
  };
}

/** Dev-time sanity checks on scenario data. Returns a list of problems (empty when the data is sound). */
export function validateScenario(scenario: Scenario): string[] {
  const problems: string[] = [];
  const metricIds = new Set(scenario.metrics.map((m) => m.id));
  const people = new Set(Object.keys(scenario.people));

  for (const id of metricIds) if (!(id in scenario.initial)) problems.push(`initial value missing for metric "${id}"`);
  if (!scenario.decisions[scenario.startDecision]) problems.push(`startDecision "${scenario.startDecision}" not found`);

  const checkMessages = (where: string, msgs: { from: string }[]) =>
    msgs.forEach((m) => !people.has(m.from) && problems.push(`${where}: unknown person "${m.from}"`));
  checkMessages("brief", scenario.brief.messages);

  for (const [key, d] of Object.entries(scenario.decisions)) {
    if (d.id !== key) problems.push(`decision key "${key}" does not match its id "${d.id}"`);
    checkMessages(`decision ${d.id}`, d.messages);
    for (const o of d.options) {
      if (o.next !== END && !scenario.decisions[o.next]) problems.push(`${d.id}/${o.id}: next "${o.next}" not found`);
      for (const m of Object.keys(o.effects)) if (!metricIds.has(m)) problems.push(`${d.id}/${o.id}: unknown metric "${m}"`);
      checkMessages(`${d.id}/${o.id} outcome`, o.outcome.messages);
    }
  }

  // Every path must reach the memo without looping.
  const walk = (id: string, seen: string[]) => {
    if (id === END) return;
    const d = scenario.decisions[id];
    if (!d) return;
    if (seen.includes(id)) return void problems.push(`loop: ${[...seen, id].join(" → ")}`);
    d.options.forEach((o) => walk(o.next, [...seen, id]));
  };
  walk(scenario.startDecision, []);

  if (scenario.debrief.profiles.length === 0) problems.push("debrief needs at least one profile");
  return problems;
}
