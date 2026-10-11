import type { RunState, Stage } from "./types";

// Bump the suffix if RunState changes shape; older saves are then ignored.
const KEY = "ops-room:run:v1";
const STAGES: Stage[] = ["brief", "decision", "consequence", "recommendation", "debrief"];

function isRunState(value: unknown): value is RunState {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<RunState>;
  return (
    v.version === 1 &&
    typeof v.scenarioId === "string" &&
    typeof v.stage === "string" &&
    STAGES.includes(v.stage) &&
    Array.isArray(v.history) &&
    v.history.every((c) => c && typeof c.decisionId === "string" && typeof c.optionId === "string") &&
    !!v.memo &&
    typeof v.memo === "object" &&
    Object.values(v.memo).every((s) => typeof s === "string") &&
    typeof v.startedAt === "number"
  );
}

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isRunState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveRun(run: RunState | null) {
  try {
    if (run) localStorage.setItem(KEY, JSON.stringify(run));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage can be unavailable (private mode, blocked site data). The run still works; it just won't survive a refresh.
  }
}

// The endings you've reached, by scenario: the debrief titles, in this browser only.
const ENDINGS_KEY = "ops-room:endings:v1";

export function loadEndings(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(ENDINGS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, v]) => Array.isArray(v) && v.every((t) => typeof t === "string"))) as Record<string, string[]>;
  } catch {
    return {};
  }
}

/** Remember an ending; true when it's the first time this browser has reached it. */
export function recordEnding(scenarioId: string, title: string): boolean {
  const all = loadEndings();
  const found = all[scenarioId] ?? [];
  if (found.includes(title)) return false;
  try {
    localStorage.setItem(ENDINGS_KEY, JSON.stringify({ ...all, [scenarioId]: [...found, title] }));
  } catch {
    // No storage: the shelf just won't remember.
  }
  return true;
}

export function clearEndings() {
  try {
    localStorage.removeItem(ENDINGS_KEY);
  } catch {
    // Nothing to clear.
  }
}
