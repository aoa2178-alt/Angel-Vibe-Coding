// Shared types for scenarios and the engine that plays them.
// A scenario is pure data: add a new one by writing another file shaped like
// src/scenarios/four-weeks-to-launch.ts and registering it in src/scenarios/index.ts.

export type MetricId = string;

export type MetricValues = Record<MetricId, number>;

export interface MetricDef {
  id: MetricId;
  label: string;
  /** Used on the compact mobile metric strip. */
  shortLabel: string;
  /** One-line explanation shown under the metric in the brief. */
  hint: string;
  /** true when a bigger number is good for the company (e.g. trust); false for cost or risk. */
  higherIsBetter: boolean;
  /** Plain-language readout for a 0–100 value, e.g. "Est. ship: week 5". */
  describe: (value: number) => string;
}

export interface Person {
  name: string;
  role: string;
  /** Short initials for the avatar chip. */
  initials: string;
  /** Accent used for the avatar chip. */
  tone: "amber" | "sky" | "violet" | "emerald" | "rose" | "slate";
}

export interface Message {
  /** Key into Scenario.people. */
  from: string;
  body: string;
}

export interface Outcome {
  headline: string;
  body: string;
  messages: Message[];
}

export interface Option {
  id: string;
  /** Short label used in the timeline, e.g. "Expedite Kestrel". */
  label: string;
  summary: string;
  benefit: string;
  cost: string;
  uncertainty: string;
  /** Metric changes applied when this option is committed. */
  effects: Partial<MetricValues>;
  /** Revealed only after the player commits. */
  outcome: Outcome;
  /** Labels the debrief rules look for, e.g. "second_source". */
  tags: string[];
  /** Next decision id, or "recommendation" to go to the memo. */
  next: string;
  /** Ideas behind this choice (keys into CONCEPTS in src/engine/concepts.ts), shown in the debrief. */
  concepts?: string[];
}

export interface Decision {
  id: string;
  /** Eyebrow label, e.g. "Decision 1 · Immediate response". */
  step: string;
  title: string;
  situation: string;
  messages: Message[];
  prompt: string;
  options: Option[];
}

export interface RuleCondition {
  /** Every tag listed must be present. */
  tags?: string[];
  /** At least one tag listed must be present. */
  anyTags?: string[];
  /** None of these tags may be present. */
  notTags?: string[];
  /** Final metric thresholds, e.g. { trust: { min: 60 } }. */
  metrics?: Record<MetricId, { min?: number; max?: number }>;
}

export interface DebriefRule {
  when: RuleCondition;
  title: string;
  body: string;
}

export interface MemoField {
  id: string;
  label: string;
  placeholder: string;
  minLength: number;
  /** Quick-fill chips, e.g. names of possible owners. */
  suggestions?: string[];
  multiline?: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  tagline: string;
  intro: string[];
  estMinutes: string;
  role: string;
  /** The deadline you're up against, shown as a countdown ("T–3:00 DAYS") on the case and in the brief. */
  clock?: { label: string; count: number; unit: "days" | "hours" };
  /** The portfolio app that runs this scenario's numbers, linked from the debrief. */
  app?: { name: string; href: string; label: string };
  company: string;
  people: Record<string, Person>;
  metrics: MetricDef[];
  initial: MetricValues;
  brief: {
    goal: string;
    alert: { title: string; body: string };
    facts: { label: string; value: string }[];
    messages: Message[];
  };
  startDecision: string;
  decisions: Record<string, Decision>;
  memo: {
    /** Recipient, e.g. "Dana Okafor, COO". The first word is used as their short name. */
    to: string;
    subject: string;
    intro: string;
    fields: MemoField[];
  };
  debrief: {
    /** First matching profile becomes the headline. The last one should match everything. */
    profiles: DebriefRule[];
    strengths: DebriefRule[];
    blindSpots: DebriefRule[];
    /** Prompts shown next to the player's memo so they can check it themselves. */
    selfCheck: DebriefRule[];
  };
}

export type Stage = "brief" | "decision" | "consequence" | "recommendation" | "debrief";

export interface Choice {
  decisionId: string;
  optionId: string;
}

export interface RunState {
  version: 1;
  scenarioId: string;
  stage: Stage;
  history: Choice[];
  memo: Record<string, string>;
  startedAt: number;
}
