// "Make it yours": plain rules that reorder lessons, spots and slang around a person's picks.
// Standard mode (no picks, or the switch set to Standard) leaves everything in its usual order.
import { LESSONS, type Lesson } from "@/lib/curriculum";
import { SPOTS, type Spot, type SpotCategory } from "@/lib/spots";
import { SLANG, type SlangCategory, type SlangTerm } from "@/lib/slang";

export const REASONS = [
  { id: "just-moved", label: "Just moved", emoji: "📦", because: "you just moved here" },
  { id: "moving-soon", label: "Moving soon", emoji: "🧳", because: "you're moving soon" },
  { id: "studying", label: "Studying here", emoji: "🎓", because: "you're studying here" },
  { id: "visiting", label: "Visiting", emoji: "📸", because: "you're visiting" },
  { id: "local", label: "Born & raised", emoji: "🗽", because: "you're a born-and-raised New Yorker" },
] as const;

export const BOROUGHS = [
  { id: "Manhattan", label: "Manhattan", emoji: "🏙️" },
  { id: "Brooklyn", label: "Brooklyn", emoji: "🌉" },
  { id: "Queens", label: "Queens", emoji: "🚇" },
  { id: "Bronx", label: "The Bronx", emoji: "⚾" },
  { id: "Staten Island", label: "Staten Island", emoji: "⛴️" },
  { id: "elsewhere", label: "Not here yet", emoji: "✈️" },
] as const;

export const WORKS = [
  { id: "student", label: "Student", emoji: "📚", because: "you're a student" },
  { id: "office", label: "Office / finance", emoji: "💼", because: "you work in an office" },
  { id: "tech", label: "Tech / startup", emoji: "💻", because: "you work in tech" },
  { id: "creative", label: "Creative / arts", emoji: "🎨", because: "you're in the arts" },
  { id: "healthcare", label: "Healthcare", emoji: "🩺", because: "you work in healthcare" },
  { id: "hospitality", label: "Hospitality", emoji: "🍽️", because: "you work in hospitality" },
  { id: "remote", label: "Remote / freelance", emoji: "🏠", because: "you work remotely" },
  { id: "parent", label: "Parent / family", emoji: "👶", because: "you're raising a family" },
] as const;

export const LOVES = [
  { id: "food", label: "Food", emoji: "🍜", because: "you love food" },
  { id: "nightlife", label: "Nightlife", emoji: "🌙", because: "you love nightlife" },
  { id: "museums", label: "Museums & art", emoji: "🖼️", because: "you love museums & art" },
  { id: "parks", label: "Parks & outdoors", emoji: "🌳", because: "you love the outdoors" },
  { id: "music", label: "Music", emoji: "🎷", because: "you love music" },
  { id: "sports", label: "Sports", emoji: "⚾", because: "you love sports" },
  { id: "shopping", label: "Shopping", emoji: "🛍️", because: "you love shopping" },
  { id: "saving", label: "Saving money", emoji: "💸", because: "you like saving money" },
  { id: "coffee", label: "Coffee", emoji: "☕", because: "you love coffee" },
] as const;

export type ReasonId = (typeof REASONS)[number]["id"];
export type BoroughId = (typeof BOROUGHS)[number]["id"];
export type WorkId = (typeof WORKS)[number]["id"];
export type LoveId = (typeof LOVES)[number]["id"];

export type Prefs = {
  reason?: ReasonId | undefined;
  borough?: BoroughId | undefined;
  work?: WorkId | undefined;
  loves: LoveId[];
};

export const EMPTY_PREFS: Prefs = { loves: [] };

/** What each lesson, spot category and slang category is about. */
export const LESSON_TAGS: Record<string, string[]> = {
  omny: ["transit", "work", "visit"],
  cadence: ["work", "transit", "visit"],
  bodega: ["food", "budget", "coffee"],
  bagel: ["food", "coffee", "visit"],
  grid: ["visit", "move", "transit"],
  tipping: ["food", "nightlife", "visit", "social"],
  transit: ["transit", "family", "budget", "outdoors"],
  neighborhoods: ["move", "visit", "social"],
  apartment: ["move", "budget", "housing"],
  weather: ["work", "family", "move", "outdoors"],
};

const SPOT_CATEGORY_TAGS: Record<SpotCategory, string[]> = {
  museums: ["culture"],
  hidden: ["culture"],
  parks: ["outdoors"],
  late: ["nightlife"],
  budget: ["budget"],
};

export const SLANG_CATEGORY_TAGS: Record<SlangCategory, string[]> = {
  everyday: ["social"],
  food: ["food", "coffee"],
  streets: ["transit"],
  classics: ["visit", "move", "social"],
};

/** How much each pick cares about each tag. */
const PICK_WEIGHTS: Record<string, Record<string, number>> = {
  "just-moved": { move: 2, transit: 1, budget: 1, housing: 1 },
  "moving-soon": { move: 3, housing: 2, budget: 1 },
  studying: { budget: 2, transit: 1, food: 1, housing: 1 },
  visiting: { visit: 3, food: 1, culture: 1 },
  local: { social: 2, nightlife: 1 },
  student: { budget: 2, social: 1 },
  office: { work: 2, transit: 1 },
  tech: { work: 1, coffee: 1 },
  creative: { culture: 2 },
  healthcare: { work: 1, transit: 1 },
  hospitality: { food: 1, nightlife: 1, social: 1 },
  remote: { coffee: 2, outdoors: 1 },
  parent: { family: 3, outdoors: 1 },
  food: { food: 2 },
  nightlife: { nightlife: 2, music: 1 },
  museums: { culture: 2 },
  parks: { outdoors: 2 },
  music: { music: 2, nightlife: 1 },
  sports: { sports: 2 },
  shopping: { shopping: 2 },
  saving: { budget: 2 },
  coffee: { coffee: 2 },
};

type Weight = { weight: number; because: string };

export function hasPicks(prefs: Prefs | null | undefined): prefs is Prefs {
  return !!prefs && (!!prefs.reason || !!prefs.borough || !!prefs.work || prefs.loves.length > 0);
}

/** Every tag the picks care about, with its total weight and the pick that cares most. */
export function tagWeights(prefs: Prefs): Map<string, Weight> {
  const picks: { id: string; because: string }[] = [];
  const reason = REASONS.find((r) => r.id === prefs.reason);
  if (reason) picks.push(reason);
  const work = WORKS.find((w) => w.id === prefs.work);
  if (work) picks.push(work);
  for (const love of LOVES) if (prefs.loves.includes(love.id)) picks.push(love);

  const weights = new Map<string, Weight & { best: number }>();
  for (const pick of picks) {
    for (const [tag, w] of Object.entries(PICK_WEIGHTS[pick.id] ?? {})) {
      const current = weights.get(tag) ?? { weight: 0, because: pick.because, best: 0 };
      current.weight += w;
      if (w > current.best) {
        current.best = w;
        current.because = pick.because;
      }
      weights.set(tag, current);
    }
  }
  return weights;
}

/** An item's score for these picks, and the reason behind its biggest tag. */
export function scoreTags(tags: string[], weights: Map<string, Weight>): { score: number; because?: string } {
  let score = 0;
  let top = 0;
  let because: string | undefined;
  for (const tag of tags) {
    const w = weights.get(tag);
    if (!w) continue;
    score += w.weight;
    if (w.weight > top) {
      top = w.weight;
      because = w.because;
    }
  }
  return because ? { score, because } : { score };
}

/** Stable sort, highest score first; ties keep their usual order. */
function rank<T>(items: T[], score: (item: T) => number): T[] {
  return items
    .map((item, i) => ({ item, i, s: score(item) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map((x) => x.item);
}

export type RankedLesson = { lesson: Lesson; because?: string };

/** Lessons in the order to show them. Standard mode (null) is the usual order with no reasons. */
export function rankLessons(prefs: Prefs | null): RankedLesson[] {
  if (!hasPicks(prefs)) return LESSONS.map((lesson) => ({ lesson }));
  const weights = tagWeights(prefs);
  const scored = LESSONS.map((lesson) => ({ lesson, ...scoreTags(LESSON_TAGS[lesson.id] ?? [], weights) }));
  return rank(scored, (x) => x.score).map((x, i) =>
    i < 3 && x.score > 0 && x.because ? { lesson: x.lesson, because: x.because } : { lesson: x.lesson },
  );
}

export function spotTags(spot: Spot): string[] {
  return [...SPOT_CATEGORY_TAGS[spot.category], ...(spot.tags ?? [])];
}

export function nearHome(spot: Spot, borough: BoroughId | undefined): boolean {
  return !!borough && borough !== "elsewhere" && spot.borough.includes(borough);
}

export type RankedSpot = { spot: Spot; because?: string };

/** "For you" spots: anything that matches a pick, best matches first, nearby ones ahead of equals. */
export function rankSpots(prefs: Prefs): RankedSpot[] {
  const weights = tagWeights(prefs);
  const label = BOROUGHS.find((b) => b.id === prefs.borough)?.label;
  return rank(
    SPOTS.map((spot) => {
      const match = scoreTags(spotTags(spot), weights);
      const near = nearHome(spot, prefs.borough);
      return {
        spot,
        score: match.score + (near ? 2 : 0),
        because: match.because && near ? `${match.because}, and it's in ${label}` : match.because ?? (near ? `it's in ${label}` : undefined),
      };
    }).filter((x) => x.score > 0),
    (x) => x.score,
  ).map((x) => (x.because ? { spot: x.spot, because: x.because } : { spot: x.spot }));
}

/** A small, stable number from a string (FNV-1a), for picking "today's" item. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Slang of the day: the same for everyone on a date, or drawn from matching categories in "For you" mode. */
export function slangForDay(date: string, prefs: Prefs | null): SlangTerm {
  let pool = SLANG;
  if (hasPicks(prefs)) {
    const weights = tagWeights(prefs);
    const matching = SLANG.filter((t) => scoreTags(SLANG_CATEGORY_TAGS[t.category], weights).score > 0);
    if (matching.length >= 4) pool = matching;
  }
  return pool[hashString(`slang:${date}`) % pool.length]!;
}

const SUBLINES: Record<ReasonId, string> = {
  "just-moved": "You made it. Start with what matters this week, then learn the rest at your own pace.",
  "moving-soon": "Get ahead before the boxes arrive: apartments, neighborhoods and getting around.",
  studying: "Student-budget New York: getting around, eating well and stretching every dollar.",
  visiting: "Look like a local on your trip: the subway, the food and the tipping math.",
  local: "You know it already. Let's see if you know all of it.",
};

/** The Daily lessons header in "For you" mode, or null for the standard header. */
export function greeting(prefs: Prefs | null): { kicker: string; subline?: string } | null {
  if (!hasPicks(prefs)) return null;
  const home = prefs.borough && prefs.borough !== "elsewhere" ? BOROUGHS.find((b) => b.id === prefs.borough)!.label : "New York";
  const subline = prefs.reason ? SUBLINES[prefs.reason] : undefined;
  return subline ? { kicker: `Your ${home} field guide`, subline } : { kicker: `Your ${home} field guide` };
}

/** Keep only known ids, so stored or sent picks can't carry anything unexpected. */
export function cleanPrefs(raw: unknown): Prefs {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = <T extends { id: string }>(list: readonly T[], value: unknown) =>
    list.find((x) => x.id === value)?.id as T["id"] | undefined;
  const loves = Array.isArray(r["loves"]) ? r["loves"] : [];
  return {
    reason: pick(REASONS, r["reason"]),
    borough: pick(BOROUGHS, r["borough"]),
    work: pick(WORKS, r["work"]),
    loves: LOVES.filter((l) => loves.includes(l.id)).map((l) => l.id),
  };
}
