import { describe, expect, it } from "vitest";
import { addDays, currentStreak, formatCountdown, msUntilNycMidnight, msUntilWeekReset, nextStreak, nycDate, weekStart } from "@/lib/streak";
import { cleanPrefs, greeting, hasPicks, rankLessons, rankSpots, slangForDay, type Prefs } from "@/lib/personalize";
import { CHALLENGE_POOL, challengeFor } from "@/lib/challenge";
import { creditXp, DAILY_XP_CAP, isCorrectChallengeAnswer, maxXpFor } from "@/lib/rewards";
import { checkNickname, suggestNickname } from "@/lib/nickname";
import { LESSONS } from "@/lib/curriculum";
import { SPOTS } from "@/lib/spots";

describe("streak", () => {
  it("counts once per day, adds a day, and resets after a missed day", () => {
    expect(nextStreak(3, "2026-10-12", "2026-10-12")).toBe(3);
    expect(nextStreak(0, "2026-10-12", "2026-10-12")).toBe(1);
    expect(nextStreak(3, "2026-10-11", "2026-10-12")).toBe(4);
    expect(nextStreak(3, "2026-10-10", "2026-10-12")).toBe(1);
  });
  it("starts new accounts at 1 and lets older accounts keep their streak once", () => {
    expect(nextStreak(0, null, "2026-10-12")).toBe(1);
    expect(nextStreak(4, null, "2026-10-12")).toBe(5);
  });
  it("shows a broken streak as 0 before today's activity", () => {
    expect(currentStreak(5, "2026-10-11", "2026-10-12")).toBe(5);
    expect(currentStreak(5, "2026-10-09", "2026-10-12")).toBe(0);
    expect(currentStreak(5, null, "2026-10-12")).toBe(5);
  });
  it("uses New York dates, not UTC", () => {
    // 11:30pm in New York on Oct 12 is already Oct 13 in UTC.
    expect(nycDate(new Date("2026-10-13T03:30:00Z"))).toBe("2026-10-12");
    expect(nycDate(new Date("2026-10-13T04:30:00Z"))).toBe("2026-10-13");
    expect(msUntilNycMidnight(new Date("2026-10-13T03:30:00Z"))).toBe(30 * 60 * 1000);
  });
  it("starts league weeks on Monday", () => {
    expect(weekStart("2026-10-12")).toBe("2026-10-12"); // Monday
    expect(weekStart("2026-10-18")).toBe("2026-10-12"); // Sunday
    expect(weekStart("2026-10-19")).toBe("2026-10-19");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    // Sunday 11:30pm New York: 30 minutes to the reset.
    expect(msUntilWeekReset(new Date("2026-10-19T03:30:00Z"))).toBe(30 * 60 * 1000);
    expect(formatCountdown((3 * 24 + 4) * 3600 * 1000 + 59000)).toBe("3d 4h");
  });
});

describe("personalization", () => {
  const movingTech: Prefs = { reason: "moving-soon", borough: "Brooklyn", work: "tech", loves: ["food", "nightlife", "saving"] };

  it("standard mode is exactly the usual lesson order with no reasons", () => {
    const ranked = rankLessons(null);
    expect(ranked.map((r) => r.lesson.id)).toEqual(LESSONS.map((l) => l.id));
    expect(ranked.every((r) => !r.because)).toBe(true);
    expect(rankLessons({ loves: [] }).map((r) => r.lesson.id)).toEqual(LESSONS.map((l) => l.id));
  });

  it("moving soon puts apartment hunting first, with a reason", () => {
    const ranked = rankLessons({ reason: "moving-soon", loves: [] });
    expect(ranked[0]!.lesson.id).toBe("apartment");
    expect(ranked[0]!.because).toBe("you're moving soon");
    expect(ranked.length).toBe(LESSONS.length);
  });

  it("each pick moves its own lessons up", () => {
    const position = (prefs: Prefs, id: string) => rankLessons(prefs).findIndex((r) => r.lesson.id === id);
    const base = (id: string) => LESSONS.findIndex((l) => l.id === id);
    expect(position({ reason: "visiting", loves: [] }, "tipping")).toBeLessThan(base("tipping"));
    expect(position({ work: "parent", loves: [] }, "weather")).toBeLessThan(base("weather"));
    expect(position({ loves: ["food"] }, "bagel")).toBeLessThan(base("bagel"));
  });

  it("For you spots favor interests, then home borough", () => {
    const ranked = rankSpots(movingTech);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.length).toBeLessThan(SPOTS.length);
    const top = ranked.slice(0, 4).map((r) => r.spot);
    expect(top.some((s) => s.borough === "Brooklyn")).toBe(true);
    expect(ranked.every((r) => r.because)).toBe(true);
    // A sports fan in the Bronx sees the bleachers first.
    expect(rankSpots({ borough: "Bronx", loves: ["sports"] })[0]!.spot.id).toBe("yankees");
  });

  it("every borough has spots to recommend", () => {
    for (const b of ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"]) {
      expect(SPOTS.some((s) => s.borough.includes(b))).toBe(true);
    }
  });

  it("greets by borough and reason", () => {
    expect(greeting(null)).toBeNull();
    expect(greeting(movingTech)?.kicker).toBe("Your Brooklyn field guide");
    expect(greeting({ borough: "elsewhere", loves: ["food"] })?.kicker).toBe("Your New York field guide");
  });

  it("cleans unknown or extra values out of stored picks", () => {
    expect(cleanPrefs({ reason: "hacker", borough: "Queens", loves: ["food", "<script>", "food"], extra: 1 })).toEqual({
      reason: undefined,
      borough: "Queens",
      work: undefined,
      loves: ["food"],
    });
    expect(hasPicks(cleanPrefs(null))).toBe(false);
  });

  it("slang of the day is stable for a date", () => {
    expect(slangForDay("2026-10-12", null).id).toBe(slangForDay("2026-10-12", null).id);
  });
});

describe("daily challenge", () => {
  it("draws from every lesson question and slang quiz", () => {
    expect(CHALLENGE_POOL.length).toBe(LESSONS.reduce((n, l) => n + l.questions.length, 0) + 18);
    expect(new Set(CHALLENGE_POOL.map((c) => c.id)).size).toBe(CHALLENGE_POOL.length);
  });
  it("is the same all day and changes across days", () => {
    expect(challengeFor("2026-10-12", null).id).toBe(challengeFor("2026-10-12", null).id);
    const week = ["12", "13", "14", "15", "16", "17", "18"].map((d) => challengeFor(`2026-10-${d}`, null).id);
    expect(new Set(week).size).toBeGreaterThan(3);
  });
  it("For you mode picks a matching question", () => {
    const item = challengeFor("2026-10-12", { reason: "moving-soon", loves: [] });
    expect(item.tags.some((t) => ["move", "budget"].includes(t))).toBe(true);
  });
});

describe("XP rules", () => {
  it("looks up XP from the content, not the request", () => {
    expect(maxXpFor("lesson", "omny")).toBe(30);
    expect(maxXpFor("lesson", "made-up")).toBeNull();
    expect(maxXpFor("spot", "yankees")).toBe(15);
    expect(maxXpFor("challenge", CHALLENGE_POOL[0]!.id)).toBe(10);
  });
  it("never credits more than the maximum or the daily cap", () => {
    expect(creditXp(1_000_000, 30, 0)).toBe(30);
    expect(creditXp(25, 30, 0)).toBe(25);
    expect(creditXp(30, 30, DAILY_XP_CAP - 5)).toBe(5);
    expect(creditXp(30, 30, DAILY_XP_CAP)).toBe(0);
    expect(creditXp(-50, 30, 0)).toBe(0);
  });
  it("checks challenge answers on the server side", () => {
    const item = CHALLENGE_POOL[0]!;
    expect(isCorrectChallengeAnswer(item.id, item.answer)).toBe(true);
    expect(isCorrectChallengeAnswer(item.id, item.answer + 1)).toBe(false);
  });
});

describe("nicknames", () => {
  it("accepts tidy names and rejects bad ones", () => {
    expect(checkNickname("  Bagel   Boss ")).toEqual({ ok: true, value: "Bagel Boss" });
    expect(checkNickname("ab").ok).toBe(false);
    expect(checkNickname("a".repeat(21)).ok).toBe(false);
    expect(checkNickname("Bagel<b>").ok).toBe(false);
    expect(checkNickname("Sh it head").ok).toBe(false);
  });
  it("suggests valid nicknames", () => {
    for (let i = 0; i < 50; i++) expect(checkNickname(suggestNickname()).ok).toBe(true);
  });
});
