// How much XP each activity can earn. The server uses these to decide what to credit, so XP (and the
// weekly league) can't be inflated by sending made-up numbers.
import { LESSONS } from "@/lib/curriculum";
import { SPOTS } from "@/lib/spots";
import { SLANG } from "@/lib/slang";
import { CHALLENGE_XP, CHALLENGE_POOL } from "@/lib/challenge";

export const ACTIVITY_KINDS = ["lesson", "challenge", "slang-day", "slang-quiz", "spot"] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/** No one earns more than this in a day, however many times they replay things. */
export const DAILY_XP_CAP = 300;
export const SLANG_DAY_XP = 10;
export const SLANG_QUIZ_XP_PER_RIGHT = 8;
export const SLANG_QUIZ_QUESTIONS = 5;

/** The most one activity can earn, or null if the id isn't real content. */
export function maxXpFor(kind: ActivityKind, id: string): number | null {
  switch (kind) {
    case "lesson":
      return LESSONS.find((l) => l.id === id)?.xp ?? null;
    case "challenge":
      return CHALLENGE_POOL.some((item) => item.id === id) ? CHALLENGE_XP : null;
    case "slang-day":
      return SLANG.some((t) => t.id === id) ? SLANG_DAY_XP : null;
    case "slang-quiz":
      return SLANG_QUIZ_XP_PER_RIGHT * SLANG_QUIZ_QUESTIONS;
    case "spot":
      return SPOTS.find((s) => s.id === id)?.xp ?? null;
  }
}

/** XP to credit: what was asked for, no more than the activity's maximum, within what's left of today's cap. */
export function creditXp(requested: number, max: number, earnedToday: number): number {
  const left = Math.max(0, DAILY_XP_CAP - earnedToday);
  return Math.max(0, Math.min(Math.floor(requested), max, left));
}

export function isCorrectChallengeAnswer(id: string, choice: number): boolean {
  return CHALLENGE_POOL.find((item) => item.id === id)?.answer === choice;
}
