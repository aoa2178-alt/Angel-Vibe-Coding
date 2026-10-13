// Today's challenge: one question a day, drawn from every lesson question and slang quiz.
import { LESSONS } from "@/lib/curriculum";
import { SLANG } from "@/lib/slang";
import { hashString, hasPicks, LESSON_TAGS, SLANG_CATEGORY_TAGS, scoreTags, tagWeights, type Prefs } from "@/lib/personalize";

export const CHALLENGE_XP = 10;

export type ChallengeItem = {
  id: string;
  source: string;
  prompt: string;
  context?: string;
  options: string[];
  answer: number;
  explain: string;
  say?: string;
  tags: string[];
};

export const CHALLENGE_POOL: ChallengeItem[] = [
  ...LESSONS.flatMap((lesson) =>
    lesson.questions.map((q, i): ChallengeItem => ({
      id: `${lesson.id}-${i}`,
      source: `${lesson.emoji} ${lesson.title}`,
      prompt: q.prompt,
      ...(q.context ? { context: q.context } : {}),
      options: q.options,
      answer: q.answer,
      explain: q.explain,
      ...(q.say ? { say: q.say } : {}),
      tags: LESSON_TAGS[lesson.id] ?? [],
    })),
  ),
  ...SLANG.map((term): ChallengeItem => ({
    id: `slang-${term.id}`,
    source: `🗣️ Slang: ${term.term}`,
    prompt: term.quiz.prompt,
    options: term.quiz.options,
    answer: term.quiz.answer,
    explain: `${term.term} means ${term.short.charAt(0).toLowerCase()}${term.short.slice(1)}. ${term.example}`,
    say: term.say ?? term.term,
    tags: SLANG_CATEGORY_TAGS[term.category],
  })),
];

/** The same question for everyone all day (New York date); in "For you" mode, from the matching questions. */
export function challengeFor(date: string, prefs: Prefs | null): ChallengeItem {
  let pool = CHALLENGE_POOL;
  if (hasPicks(prefs)) {
    const weights = tagWeights(prefs);
    const matching = CHALLENGE_POOL.filter((item) => scoreTags(item.tags, weights).score > 0);
    if (matching.length >= 6) pool = matching;
  }
  return pool[hashString(`challenge:${date}`) % pool.length]!;
}
