import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { CITY, LESSONS, type Lesson } from "@/lib/curriculum";
import { HERO_IMAGE, LESSON_IMAGES, CELEBRATION_IMAGES, SOCIAL_IMAGE } from "@/lib/images";
import { SPOTS, SPOT_CATEGORIES, type Spot, type SpotCategory } from "@/lib/spots";
import { CITIES, type City } from "@/lib/cities";
import { SLANG, SLANG_CATEGORIES, type SlangTerm, type SlangCategory } from "@/lib/slang";
import { cn } from "@/lib/utils";
import { AuthPanel } from "@/components/AuthPanel";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { loadLeague, loadProgress, recordActivity, saveLessons, savePrefs, saveSpots, setNickname } from "@/lib/progress.functions";
import { recordVisit } from "@/lib/visits.functions";
import { greeting, hasPicks, rankLessons, rankSpots, slangForDay, type Prefs } from "@/lib/personalize";
import { challengeFor } from "@/lib/challenge";
import { nycDate } from "@/lib/streak";
import { SLANG_DAY_XP, type ActivityKind } from "@/lib/rewards";
import { Onboarding } from "@/components/Onboarding";
import { DailyChallenge } from "@/components/DailyChallenge";
import { League, type LeagueData } from "@/components/League";
import { NycCard } from "@/components/NycCard";
import { SpeakButton } from "@/components/SpeakButton";

type SpotMark = "been" | "want";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Walkin' Here! — Learn NYC in 3 Minutes a Day" },
      {
        name: "description",
        content:
          "Bite-sized daily lessons on OMNY and subway rules, buses and ferries, sidewalk cadence, bodega culture, bagel orders, neighborhood names, apartment hunting, the weather and NYC tipping. Build a streak, earn XP, stop feeling new.",
      },
      { property: "og:title", content: "Walkin' Here! — Learn NYC in 3 Minutes a Day" },
      {
        property: "og:description",
        content:
          "Daily micro-lessons for people who just moved to New York City: subway, buses and ferries, sidewalks, bodegas, bagels, the street grid, neighborhoods, apartments, weather and tipping.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:image",
        content:
          SOCIAL_IMAGE,
      },
      {
        name: "twitter:image",
        content:
          SOCIAL_IMAGE,
      },
    ],
  }),
  component: Index,
});

const LEVELS = [
  "Fresh Off the Bus",
  "Bodega Regular",
  "Crosstown Navigator",
  "Subway Sensei",
  "Certified New Yorker",
];

function levelFor(xp: number) {
  const idx = Math.min(LEVELS.length - 1, Math.floor(xp / 60));
  const floor = idx * 60;
  const pct = idx === LEVELS.length - 1 ? 100 : ((xp - floor) / 60) * 100;
  return { name: LEVELS[idx]!, next: LEVELS[Math.min(LEVELS.length - 1, idx + 1)]!, pct };
}

/* ---------------- shared motion pieces ---------------- */

function Confetti({ burst, count = 26 }: { burst: number; count?: number }) {
  const pieces = useMemo(() => {
    const colors = ["var(--signal)", "var(--mint)", "var(--primary)", "var(--lilac)"];
    return Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random();
      const dist = 70 + Math.random() * 120;
      return {
        dx: `${Math.cos(angle) * dist}px`,
        dy: `${Math.sin(angle) * dist + 40}px`,
        rot: `${Math.round(Math.random() * 720 - 360)}deg`,
        color: colors[i % colors.length]!,
        size: 5 + Math.random() * 6,
        delay: Math.random() * 0.12,
        round: i % 3 === 0,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burst, count]);

  if (!burst) return null;

  return (
    <div key={burst} className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-0">
      <span
        className="absolute -left-10 -top-10 size-20 rounded-full border-2 border-signal"
        style={{ animation: "nc-ring 0.7s ease-out forwards" }}
      />
      {pieces.map((p, i) => (
        <span
          key={i}
          className={p.round ? "absolute rounded-full" : "absolute rounded-[2px]"}
          style={{
            width: p.size,
            height: p.size * (p.round ? 1 : 1.7),
            background: p.color,
            ["--dx" as string]: p.dx,
            ["--dy" as string]: p.dy,
            ["--rot" as string]: p.rot,
            animation: `nc-confetti 0.95s cubic-bezier(0.16,0.84,0.44,1) ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

function useCountUp(value: number) {
  const [shown, setShown] = useState(value);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const from = shown;
    const diff = value - from;
    if (diff === 0) return;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 700);
      const eased = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(from + diff * eased));
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return shown;
}

function AmbientCity() {
  const motifs = [
    { icon: "🥯", left: "8%", top: "18%", dur: "9s", delay: "0s" },
    { icon: "☕", left: "78%", top: "12%", dur: "7.5s", delay: "1.2s" },
    { icon: "🥨", left: "62%", top: "34%", dur: "8.5s", delay: "0.6s" },
    { icon: "🗽", left: "90%", top: "42%", dur: "10s", delay: "2s" },
    { icon: "🚦", left: "24%", top: "44%", dur: "8s", delay: "1.6s" },
  ];
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="nc-aurora absolute -top-40 left-1/2 size-[720px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--signal)_22%,transparent),transparent)] blur-2xl" />
      <div
        className="nc-aurora absolute -left-40 top-40 size-[560px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--primary)_16%,transparent),transparent)] blur-2xl"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="nc-aurora absolute -right-40 top-[55%] size-[520px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--mint)_16%,transparent),transparent)] blur-2xl"
        style={{ animationDelay: "-11s" }}
      />

      <div
        className="nc-wave absolute inset-x-0 top-0 h-24 opacity-[0.07]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, var(--foreground) 0 2px, transparent 2px 120px)",
        }}
      />

      {motifs.map((m) => (
        <span
          key={m.icon}
          className="absolute text-3xl opacity-25 sm:text-4xl"
          style={{
            left: m.left,
            top: m.top,
            animation: `nc-float ${m.dur} ease-in-out ${m.delay} infinite`,
          }}
        >
          {m.icon}
        </span>
      ))}

      <span
        className="nc-drift absolute top-[26%] text-4xl opacity-30"
        style={{ animationDuration: "26s" }}
      >
        🚕
      </span>
      <span
        className="nc-drift absolute top-[68%] text-4xl opacity-25"
        style={{ animationDuration: "38s", animationDelay: "-12s" }}
      >
        🚇
      </span>
      <span
        className="nc-drift absolute top-[84%] text-3xl opacity-20"
        style={{ animationDuration: "31s", animationDelay: "-22s" }}
      >
        🚌
      </span>
    </div>
  );
}

function AtlasMap({ completed, onStart, nextId }: { completed: string[]; onStart: (lesson: Lesson) => void; nextId?: string }) {
  // Manhattan from the bottom up to the Bronx, then a second leg through Queens and back down to Brooklyn.
  const points = [
    [198, 326], [218, 280], [230, 230], [238, 177], [245, 124], [256, 70],
    [302, 128], [372, 158], [336, 236], [284, 306],
  ];
  const labelOffsets = [
    [-22, 26], [26, 16], [-26, -10], [-26, -12], [-26, -12], [24, -14],
    [16, -14], [16, -14], [18, 4], [18, 16],
  ];
  const minutes = LESSONS.reduce((n, l) => n + l.minutes, 0);
  const next = nextId ? LESSONS.findIndex((lesson) => lesson.id === nextId) : LESSONS.findIndex((lesson) => !completed.includes(lesson.id));
  return (
    <div className="atlas-paper relative min-h-[440px] overflow-hidden border border-border bg-surface p-5 sm:p-8">
      <div className="absolute right-5 top-5 z-10 text-right"><p className="atlas-kicker">Weekly line</p><p className="mt-1 text-xs text-muted-foreground">{LESSONS.length} stops · {minutes} minutes</p></div>
      <svg viewBox="0 0 500 410" className="h-full min-h-[390px] w-full" role="img" aria-label={`Illustrated map of New York City showing Manhattan, Brooklyn, Queens, the Bronx, Staten Island, and ${LESSONS.length} lesson stops`}>
        <path d="M246 21 C268 28 283 42 286 61 C286 77 275 91 257 102 L224 111 L207 91 L212 61 L228 35 Z" fill="color-mix(in oklab,var(--mint) 22%,var(--surface))" stroke="var(--border)" strokeWidth="2" />
        <path d="M226 91 C239 99 244 116 244 139 C244 176 239 212 235 249 C232 275 223 297 211 315 L191 308 C198 282 203 255 207 225 C212 188 214 151 212 115 Z" fill="color-mix(in oklab,var(--signal) 20%,var(--surface))" stroke="var(--border)" strokeWidth="2" />
        <path d="M217 282 C251 270 283 271 316 288 L343 317 L329 350 L285 372 L218 365 L174 342 L178 311 Z" fill="color-mix(in oklab,var(--primary) 22%,var(--surface))" stroke="var(--border)" strokeWidth="2" />
        <path d="M254 119 C294 99 347 97 399 119 L458 150 L451 211 L408 242 L361 270 L315 280 L272 261 L244 222 Z" fill="color-mix(in oklab,var(--lilac) 16%,var(--surface))" stroke="var(--border)" strokeWidth="2" />
        <path d="M48 302 L95 278 L145 288 L166 326 L144 366 L91 382 L48 356 L35 327 Z" fill="color-mix(in oklab,var(--destructive) 12%,var(--surface))" stroke="var(--border)" strokeWidth="2" />
        <path d="M198 326 C213 302 219 279 225 248 C232 213 237 176 242 139 C247 108 251 85 256 70" fill="none" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" className="atlas-route" />
        <path d="M256 70 C276 92 290 112 302 128 C326 140 350 150 372 158 C360 186 348 212 336 236 C318 262 300 286 284 306" fill="none" stroke="var(--signal)" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 0" opacity=".85" />
        <path d="M292 75 C354 67 411 79 469 105" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 9" opacity=".45" />
        <path d="M202 76 L210 74" stroke="var(--border)" strokeWidth="1" />
        <text x="198" y="80" textAnchor="end" fill="var(--foreground)" fontSize="10" fontWeight="800" opacity=".8" letterSpacing="1">THE BRONX</text>
        <path d="M182 192 L203 192" stroke="var(--border)" strokeWidth="1" />
        <text x="178" y="196" textAnchor="end" fill="var(--foreground)" fontSize="10" fontWeight="800" opacity=".8" letterSpacing="1">MANHATTAN</text>
        <text x="288" y="350" textAnchor="middle" fill="var(--foreground)" fontSize="10" fontWeight="800" opacity=".8" letterSpacing="1">BROOKLYN</text>
        <text x="402" y="228" textAnchor="middle" fill="var(--foreground)" fontSize="10" fontWeight="800" opacity=".8" letterSpacing="1">QUEENS</text>
        <text x="100" y="330" textAnchor="middle" fill="var(--foreground)" fontSize="10" fontWeight="800" opacity=".8" letterSpacing="1">STATEN ISLAND</text>
        {LESSONS.map((lesson, i) => {
          const point = points[i];
          const x = point?.[0] ?? 0;
          const y = point?.[1] ?? 0;
          const offset = labelOffsets[i];
          const dx = offset?.[0] ?? 18;
          const dy = offset?.[1] ?? -18;
          const done = completed.includes(lesson.id);
          const current = i === (next < 0 ? 0 : next);
          return <g key={lesson.id} onClick={() => onStart(lesson)} className="cursor-pointer">
            {current && <circle cx={x} cy={y} r="18" fill="none" stroke="var(--signal)" strokeWidth="2" className="nc-flame" />}
            <circle cx={x} cy={y} r="12" fill={done ? "var(--primary)" : current ? "var(--signal)" : "var(--surface)"} stroke="var(--foreground)" strokeWidth="2" />
            <text x={x} y={y + 4} textAnchor="middle" fill={done || current ? "var(--primary-foreground)" : "var(--foreground)"} fontSize="10" fontWeight="700">{done ? "✓" : i + 1}</text>
            <text x={x + dx} y={y + dy} textAnchor={dx > 0 ? "start" : "end"} fill="var(--foreground)" fontSize="11" fontWeight="700">{lesson.title}</text>
          </g>;
        })}
      </svg>
      <div className="absolute bottom-4 left-5 flex items-center gap-3 text-[11px] text-muted-foreground"><span className="h-px w-10 bg-primary" />Learning route · not to scale</div>
    </div>
  );
}

/* ---------------- shared pieces ---------------- */

function SlangOfDay({
  term,
  onReward,
}: {
  term: SlangTerm;
  onReward: (amount: number) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = picked === term.quiz.answer;

  return (
    <div className="nc-rise rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-sm font-semibold">Slang of the day</h2>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          {term.phonetic}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <p className="font-display text-xl font-semibold">{term.term}</p>
        <SpeakButton text={`${term.say ?? term.term}. ${term.example}`} label={`Hear "${term.term}" said aloud`} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{term.short}</p>

      <p className="mt-4 text-xs font-medium">{term.quiz.prompt}</p>
      <div className="mt-2 space-y-1.5">
        {term.quiz.options.map((o, i) => {
          const chosen = picked === i;
          const reveal = picked !== null;
          return (
            <button
              key={o}
              disabled={reveal}
              onClick={() => {
                setPicked(i);
                if (i === term.quiz.answer) onReward(SLANG_DAY_XP);
              }}
              className={cn(
                "nc-press w-full rounded-xl border px-3 py-2 text-left text-xs transition",
                reveal && i === term.quiz.answer
                  ? "border-mint bg-mint/10 text-mint"
                  : chosen
                    ? "border-signal bg-signal/10"
                    : "border-border bg-surface-2 hover:border-signal/60",
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className="mt-3 text-xs text-muted-foreground">
          {correct ? `+${SLANG_DAY_XP} XP · ` : ""}
          {term.warning}
        </p>
      )}
    </div>
  );
}

/** Kick off a save without blocking the UI; failures are logged, not shown. */
function save(promise: Promise<unknown>) {
  promise.catch((error: unknown) => {
    console.error("Walkin' Here couldn't save:", error instanceof Error ? error.message : error);
  });
}

/* ---------------- page ---------------- */

function Index() {
  const recordVisitFn = useServerFn(recordVisit);
  const loadProgressFn = useServerFn(loadProgress);
  const recordActivityFn = useServerFn(recordActivity);
  const saveLessonsFn = useServerFn(saveLessons);
  const saveSpotsFn = useServerFn(saveSpots);
  const savePrefsFn = useServerFn(savePrefs);
  const setNicknameFn = useServerFn(setNickname);
  const loadLeagueFn = useServerFn(loadLeague);
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const user = session?.user ?? null;
  // The session is re-checked in the background (e.g. when the tab regains focus); only the
  // first check should show the loading screen, or the sign-in form would reset mid-typing.
  const sessionLoadedOnce = useRef(false);
  if (!sessionPending) sessionLoadedOnce.current = true;
  const [progressReady, setProgressReady] = useState(false);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [active, setActive] = useState<Lesson | null>(null);
  // "Make it yours" picks; `personalized` is the For you / Standard switch.
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [personalized, setPersonalized] = useState(true);
  const [setupOpen, setSetupOpen] = useState<null | "first" | "edit" | "nickname">(null);
  const [nickname, setNicknameState] = useState<string | null>(null);
  const [challengeDone, setChallengeDone] = useState(false);
  const [league, setLeague] = useState<LeagueData | null>(null);
  const [leagueLoading, setLeagueLoading] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  // XP from the free lesson played before signing up, shown as a nudge on the sign-up page.
  const [trialXp, setTrialXp] = useState<number | undefined>(undefined);
  const [celebrate, setCelebrate] = useState(0);
  const [tab, setTab] = useState<"learn" | "do" | "slang" | "league" | "account">("learn");
  const [profileOpen, setProfileOpen] = useState(false);
  const [returnTab, setReturnTab] = useState<"learn" | "do" | "slang" | "league">("learn");
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [marks, setMarks] = useState<Record<string, SpotMark>>({});

  /**
   * Credit XP for an activity. The number shows right away; the server then decides what counts
   * (it looks XP up from the content and applies the daily cap) and its totals replace ours.
   */
  function credit(kind: ActivityKind, id: string, amount: number, choice?: number) {
    if (amount > 0) setXp((v) => v + amount);
    if (!user) return;
    recordActivityFn({ data: { kind, id, xp: amount, ...(choice === undefined ? {} : { choice }) } })
      .then((result) => {
        setXp(result.xp);
        setStreak(result.streak);
        setBestStreak(result.bestStreak);
        setChallengeDone(result.challengeDone);
      })
      .catch((error: unknown) => console.error("Walkin' Here couldn't save:", error instanceof Error ? error.message : error));
  }

  function markSpot(spot: Spot, mark: SpotMark) {
    const nextMark = marks[spot.id] === mark ? undefined : mark;
    if (nextMark === "been" && marks[spot.id] !== "been") credit("spot", spot.id, spot.xp);
    setMarks((m) => {
      const next = { ...m };
      if (nextMark) next[spot.id] = nextMark;
      else delete next[spot.id];
      return next;
    });
    if (user) save(saveSpotsFn({ data: { spots: [{ spotId: spot.id, mark: nextMark ?? null }] } }));
  }


  useEffect(() => {
    if (!sessionStorage.getItem("walkin-visit-recorded")) {
      recordVisitFn().then(() => sessionStorage.setItem("walkin-visit-recorded", "1")).catch(() => undefined);
    }
  }, [recordVisitFn]);

  // Load the signed-in user's saved progress; on a first sign-in, upload what they did before signing in.
  const userId = user?.id;
  useEffect(() => {
    if (!userId) {
      setProgressReady(false);
      return;
    }
    let cancelled = false;
    loadProgressFn()
      .then((progress) => {
        if (cancelled) return;
        setXp(progress.xp);
        setStreak(progress.streak);
        setBestStreak(progress.bestStreak);
        setChallengeDone(progress.challengeDone);
        setPrefs(progress.prefs);
        setPersonalized(progress.personalized);
        setNicknameState(progress.nickname);
        if (!progress.setupDone) setSetupOpen("first");
        if (progress.lessons.length) setCompleted(progress.lessons);
        else if (completed.length) {
          // A brand-new account keeps the free lesson played before signing up: the server credits its XP.
          const [trialLesson, ...rest] = completed;
          if (progress.isNew && trialLesson && trialXp) credit("lesson", trialLesson, trialXp);
          else save(saveLessonsFn({ data: { lessons: completed.map((lessonId) => ({ lessonId })) } }));
          if (rest.length) save(saveLessonsFn({ data: { lessons: rest.map((lessonId) => ({ lessonId })) } }));
        }
        if (Object.keys(progress.spots).length) setMarks(progress.spots);
        else if (Object.keys(marks).length) save(saveSpotsFn({ data: { spots: Object.entries(marks).map(([spotId, mark]) => ({ spotId, mark })) } }));
      })
      .catch((error: unknown) => console.error("Walkin' Here couldn't load progress:", error))
      .finally(() => {
        if (!cancelled) setProgressReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // The league loads when its tab opens, and again after each change while it's open.
  useEffect(() => {
    if (!userId || tab !== "league") return;
    let cancelled = false;
    setLeagueLoading(true);
    loadLeagueFn()
      .then((data) => {
        if (!cancelled) setLeague(data);
      })
      .catch((error: unknown) => console.error("Walkin' Here couldn't load the league:", error))
      .finally(() => {
        if (!cancelled) setLeagueLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, tab, xp, nickname]);

  useEffect(() => {
    if (!profileOpen) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setProfileOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);



  const level = useMemo(() => levelFor(xp), [xp]);
  const shownXp = useCountUp(xp);
  const dailyGoal = 60;
  const todayXp = Math.min(dailyGoal, xp % 60);

  const [levelPop, setLevelPop] = useState(0);
  useEffect(() => {
    setLevelPop((n) => n + 1);
  }, [level.name]);

  const spotXp = useMemo(
    () =>
      SPOTS.filter((s) => marks[s.id] === "been").reduce((sum, s) => sum + s.xp, 0),
    [marks],
  );
  const lessonXp = Math.max(0, xp - spotXp);
  const wantSpots = useMemo(() => SPOTS.filter((s) => marks[s.id] === "want"), [marks]);
  // "For you" applies the picks; Standard (or no picks) is the usual app.
  const forYou = personalized && hasPicks(prefs) ? prefs : null;
  const today = nycDate();
  const rankedLessons = useMemo(() => rankLessons(forYou), [forYou]);
  const forYouSpots = useMemo(() => (forYou ? rankSpots(forYou) : null), [forYou]);
  const header = greeting(forYou);
  const slangOfDay = useMemo(() => slangForDay(today, forYou), [today, forYou]);
  const challenge = useMemo(() => challengeFor(today, forYou), [today, forYou]);
  const nextLesson = rankedLessons.find((r) => !completed.includes(r.lesson.id))?.lesson ?? rankedLessons[0]!.lesson;

  function finishLesson(lesson: Lesson, earned: number) {
    const firstTime = !completed.includes(lesson.id);
    if (firstTime) setCompleted((c) => [...c, lesson.id]);
    setActive(null);
    setCelebrate((n) => n + 1);
    if (user) {
      credit("lesson", lesson.id, earned);
      // The last lesson earns the certified card.
      if (firstTime && LESSONS.every((l) => l.id === lesson.id || completed.includes(l.id))) setCardOpen(true);
    } else {
      setXp((v) => v + earned);
      setTrialXp(earned);
    }
  }

  function setMode(next: boolean) {
    setPersonalized(next);
    save(savePrefsFn({ data: { personalized: next } }));
  }

  async function finishSetup(picks: Prefs, chosenNickname: string): Promise<string | null> {
    if (chosenNickname !== nickname) {
      const result = await setNicknameFn({ data: { nickname: chosenNickname } });
      if (!result.ok) return result.error;
      setNicknameState(result.nickname);
    }
    const kept = hasPicks(picks) ? picks : null;
    setPrefs(kept);
    setPersonalized(true);
    setSetupOpen(null);
    save(savePrefsFn({ data: { prefs: kept, personalized: true, setupDone: true } }));
    return null;
  }

  function skipSetup() {
    if (setupOpen === "first") save(savePrefsFn({ data: { setupDone: true } }));
    setSetupOpen(null);
  }

  function resetPicks() {
    setPrefs(null);
    setSetupOpen(null);
    save(savePrefsFn({ data: { prefs: null } }));
  }

  function setOnBoard(onBoard: boolean) {
    setLeague((l) => (l ? { ...l, me: { ...l.me, onBoard } } : l));
    savePrefsFn({ data: { onBoard } })
      .then(() => loadLeagueFn())
      .then(setLeague)
      .catch((error: unknown) => console.error("Walkin' Here couldn't save:", error));
  }

  if (sessionPending && !sessionLoadedOnce.current) {
    return <main className="nyc-glow grid min-h-screen place-items-center"><span className="nc-mascot text-4xl" aria-label="Loading Walkin' Here!">🐦</span></main>;
  }

  if (!user) {
    // Signed out: the course is visible and lesson 1 plays without an account; finishing it nudges toward sign-up.
    // The lesson is kept locally and saved to the account on sign-up (see the progress sync above).
    return (
      <main className="min-h-screen overflow-x-hidden bg-background">
        <AuthPanel user={null} onSignedOut={() => undefined} onTryLesson={setActive} trialXp={trialXp} />
        {active && <LessonPlayer lesson={active} onClose={() => setActive(null)} onFinish={finishLesson} />}
      </main>
    );
  }

  return (
    <main className="theme-taxi nyc-glow relative min-h-screen overflow-x-hidden bg-background">
      <header className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center bg-signal font-display text-lg font-bold text-signal-foreground">
            W
          </span>
          <span
            className="nc-mascot grid size-9 place-items-center border border-border bg-surface text-lg"
            title="Toki, our sassy mascot"
          >
            🐦
          </span>
          <div className="leading-tight">
            <span className="font-display text-lg font-semibold">Walkin' Here!</span>
            <span className="block text-xs font-medium text-muted-foreground">
              Learn NYC in 3 minutes a day
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CitySwitcher />
          <span aria-hidden className="hidden h-6 w-px bg-border sm:block" />
          <span className="rounded-full border border-border bg-surface px-3 py-1.5 font-medium text-signal shadow-sm">
            <span className="nc-flame">🔥</span> {streak}
          </span>
          <span className="hidden rounded-full border border-border bg-surface px-3 py-1.5 font-medium text-primary shadow-sm tabular-nums sm:inline">
            ⚡ {shownXp} XP
          </span>
          <span
            key={levelPop}
            className="nc-pop hidden rounded-full border border-border bg-surface px-3 py-1.5 font-medium text-mint shadow-sm sm:inline"
          >
            {level.name}
          </span>
          <div className="relative" ref={profileMenuRef}>
            <Button
              variant="outline"
              size="sm"
              aria-label="Profile menu"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((open) => !open)}
              className="gap-2 bg-surface"
            >
              {user.image ? <img src={user.image} alt="" className="size-5 rounded-full object-cover" onError={(event) => { event.currentTarget.hidden = true; }} /> : <span aria-hidden>👤</span>}
              <span className="hidden sm:inline">{user.name || "Profile"}</span>
              <span aria-hidden className="text-[10px]">▾</span>
            </Button>
            {profileOpen && (
              <div role="menu" className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-64 rounded-xl border border-border bg-surface p-2 shadow-xl">
                <div className="border-b border-border px-3 py-2">
                  <p className="truncate text-sm font-bold">{user.name || "New Yorker"}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Button role="menuitem" variant="ghost" className="mt-1 w-full justify-start" onClick={() => { if (tab !== "account") setReturnTab(tab); setTab("account"); setProfileOpen(false); }}>View / edit profile</Button>
                <Button role="menuitem" variant="ghost" className="w-full justify-start" onClick={() => { setSetupOpen("edit"); setProfileOpen(false); }}>✨ Your picks</Button>
                <Button role="menuitem" variant="ghost" className="w-full justify-start" onClick={() => { setCardOpen(true); setProfileOpen(false); }}>🪪 Your NYC card</Button>
                <Button role="menuitem" variant="ghost" className="w-full justify-start text-destructive" onClick={async () => { setProfileOpen(false); await authClient.signOut(); setTab("learn"); }}>Sign out</Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <nav
        aria-label="Sections"
        className="relative mx-auto flex max-w-7xl flex-wrap items-center gap-1 gap-y-2 px-6"
      >
        {(
          [
            { id: "learn", label: "Daily lessons", emoji: "📘" },
            { id: "do", label: "Things to Do", emoji: "🗺️" },
            { id: "slang", label: "Slang", emoji: "🗣️" },
            { id: "league", label: "League", emoji: "🏆" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? "page" : undefined}
            className={cn(
              "nc-press rounded-full border px-4 py-2 text-sm font-semibold transition duration-300 hover:-translate-y-0.5",
              tab === t.id
                ? "border-signal bg-signal text-signal-foreground shadow-[0_4px_0_color-mix(in_oklab,var(--signal)_62%,black)]"
                : "border-border bg-surface text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="mr-1.5">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "learn" && (
        <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-10">
          <section className="grid items-end gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="atlas-kicker">{header ? header.kicker : "New York field guide · Edition 01"}</p>
                {hasPicks(prefs) ? (
                  <div role="group" aria-label="Personalization" className="flex rounded-full border border-border bg-surface p-0.5 text-xs font-semibold shadow-sm">
                    {([[true, "✨ For you"], [false, "Standard"]] as const).map(([value, label]) => (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={personalized === value}
                        onClick={() => setMode(value)}
                        className={cn("rounded-full px-3 py-1.5 transition", personalized === value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <button type="button" onClick={() => setSetupOpen("edit")} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm hover:text-foreground">
                    ✨ Make it yours
                  </button>
                )}
              </div>
              <h1 className="mt-4 max-w-xl text-5xl leading-[0.94] sm:text-7xl">Learn the city by walking its lines.</h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground">{header?.subline ?? "Three-minute lessons for the unwritten New York: the subway, the sidewalk, the counter, and the grid."}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button size="lg" onClick={() => setActive(nextLesson)}>Start today's lesson →</Button>
                <span className="text-sm text-muted-foreground">{todayXp}/{dailyGoal} XP today</span>
                <Confetti burst={celebrate} count={34} />
              </div>
            </div>
            <div className="relative">
              <AtlasMap completed={completed} onStart={setActive} nextId={nextLesson.id} />
              <figure className="relative -mt-16 ml-auto w-[48%] border-4 border-background shadow-xl">
                <img src={HERO_IMAGE} alt="Crowds crossing a busy Manhattan street" width={800} height={620} className="aspect-[4/3] w-full object-cover" />
                <figcaption className="bg-surface px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Midtown · 8:41 AM</figcaption>
              </figure>
            </div>
          </section>
          <div className="mt-20 grid gap-14 lg:grid-cols-[1fr_300px]">
          <div className="lg:col-span-2">
            <section className="relative hidden">
              <p className="nc-rise font-mono text-xs uppercase tracking-[0.25em] text-signal">
                Now serving · {CITY}
              </p>
              <h1
                className="nc-rise mt-3 max-w-2xl text-4xl font-bold leading-[1.05] sm:text-5xl"
                style={{ animationDelay: "0.06s" }}
              >
                You moved to New York.
                <br />
                Now learn how it{" "}
                <span className="bg-gradient-to-r from-signal via-primary to-signal bg-clip-text text-transparent nc-shimmer">
                  actually
                </span>{" "}
                works.
              </h1>
              <p
                className="nc-rise mt-4 max-w-xl text-base text-muted-foreground"
                style={{ animationDelay: "0.12s" }}
              >
                Three minutes a day of the stuff nobody tells a new New Yorker: tapping OMNY, walking
                at the right speed, ordering at the bodega, and reading the grid like you've been
                here years.
              </p>

              <figure
                className="nc-rise group relative mt-6 overflow-hidden rounded-3xl border border-border shadow-lg"
                style={{ animationDelay: "0.15s" }}
              >
                <img
                  src={HERO_IMAGE}
                  alt="Crowds crossing a busy Manhattan street at rush hour"
                  width={1600}
                  height={900}
                  className="h-52 w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 sm:h-64"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-transparent" />
                <figcaption className="absolute bottom-0 left-0 right-0 flex flex-wrap items-center gap-2 p-5 font-mono text-xs uppercase tracking-[0.2em] text-background">
                  <span className="rounded-full bg-signal px-3 py-1 text-signal-foreground">
                    Taxi Yellow
                  </span>
                  <span>Midtown · 8:41am · you are late</span>
                </figcaption>
              </figure>

              <div
                className="nc-rise relative mt-6 flex flex-wrap items-center gap-4"
                style={{ animationDelay: "0.18s" }}
              >
                <button
                  onClick={() =>
                    setActive(LESSONS.find((l) => !completed.includes(l.id)) ?? LESSONS[0]!)
                  }
                  className="nc-press rounded-full bg-signal px-7 py-3.5 font-display text-sm font-semibold text-signal-foreground shadow-[0_5px_0_color-mix(in_oklab,var(--signal)_62%,black)] hover:brightness-105"
                >
                  Start today's lesson
                </button>
                <span className="text-sm text-muted-foreground">
                  {todayXp}/{dailyGoal} XP toward today's goal
                </span>
                <Confetti burst={celebrate} count={34} />
              </div>
            </section>

            <DailyChallenge
              key={challenge.id}
              item={challenge}
              done={challengeDone}
              streak={streak}
              onAnswer={(choice) => {
                if (choice === challenge.answer) setCelebrate((n) => n + 1);
                credit("challenge", challenge.id, choice === challenge.answer ? 10 : 0, choice);
              }}
            />

            <section className="relative mt-10 rounded-3xl bg-[#121212] p-4 text-white shadow-xl sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2 px-2">
                <h2 className="font-display text-2xl font-bold">{forYou ? "Your path" : "This week's path"}</h2>
                <p className="text-sm text-[#a8a8a8]">
                  {completed.length}/{LESSONS.length} done · {forYou ? "ordered for you, any order works" : "do them in any order"}
                </p>
              </div>

              <ul className="mt-3">
                {rankedLessons.map(({ lesson, because }, i) => {
                  const done = completed.includes(lesson.id);
                  const isNext = lesson.id === nextLesson.id && !done;
                  const image = LESSON_IMAGES[lesson.id];
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => setActive(lesson)}
                        className={cn(
                          "group grid w-full grid-cols-[28px_52px_1fr_auto] items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-[#1f1f1f] sm:grid-cols-[40px_60px_1fr_auto] sm:gap-4",
                          isNext && "bg-[#1f1f1f]",
                        )}
                      >
                        <span className="text-center font-mono text-sm font-bold text-[#888]">{String(i + 1).padStart(2, "0")}</span>
                        <span className="grid size-[52px] place-items-center overflow-hidden rounded-md bg-[#262626] text-2xl sm:size-[60px]">
                          {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <span aria-hidden>{lesson.emoji}</span>}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{lesson.title}</span>
                          <span className="block truncate text-xs text-[#a8a8a8]">
                            {lesson.minutes} min · {lesson.questions.length} questions{because ? ` · for you: ${because}` : ` · ${lesson.blurb}`}
                          </span>
                        </span>
                        <span className={cn("text-right text-xs font-bold sm:text-sm", done ? "text-mint" : "text-signal")}>
                          {done ? "✓ Done" : isNext ? "Start ▶" : `+${lesson.xp} XP`}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <aside className="border-t-4 border-primary lg:sticky lg:top-6 lg:h-fit lg:self-start">
            <div className="grid divide-y divide-border sm:grid-cols-2 lg:grid-cols-1">
              <div className="nc-rise bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-sm font-semibold">Daily mission</h2>
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-signal">
                    <span className="nc-flame">🔥</span> {streak} day streak
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums">
                  {todayXp}
                  <span className="text-sm font-medium text-muted-foreground">/{dailyGoal} XP</span>
                </p>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="nc-shimmer h-full rounded-full bg-gradient-to-r from-signal via-primary to-signal transition-[width] duration-1000 ease-out"
                    style={{ width: `${(todayXp / dailyGoal) * 100}%` }}
                  />
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{completed.length}/{LESSONS.length} lessons done</span>
                  <span>Longest: {bestStreak} {bestStreak === 1 ? "day" : "days"}</span>
                </div>
              </div>

              <div
                key={levelPop}
                className="nc-rise bg-surface p-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-display text-sm font-semibold">{level.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {Math.round(level.pct)}%
                  </span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="nc-shimmer h-full rounded-full bg-gradient-to-r from-signal via-primary to-signal transition-[width] duration-1000 ease-out"
                    style={{ width: `${level.pct}%` }}
                  />
                </div>
                <dl className="mt-4 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Total XP</dt>
                    <dd className="tabular-nums font-medium">{shownXp}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">From lessons</dt>
                    <dd className="tabular-nums font-medium">{lessonXp}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">From spots visited</dt>
                    <dd className="tabular-nums font-medium">{spotXp}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Next rank</dt>
                    <dd className="font-medium text-mint">{level.next}</dd>
                  </div>
                </dl>
              </div>

              <SlangOfDay
                key={slangOfDay.id}
                term={slangOfDay}
                onReward={(amount) => {
                  credit("slang-day", slangOfDay.id, amount);
                  setCelebrate((n) => n + 1);
                }}
              />

              <div className="nc-rise rounded-2xl border border-border bg-surface p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-display text-sm font-semibold">Want to go</h2>
                  <button
                    onClick={() => setTab("do")}
                    className="text-xs font-semibold text-signal hover:underline"
                  >
                    See all
                  </button>
                </div>
                {wantSpots.length === 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Nothing pinned yet — bookmark a spot in Things to Do.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2.5">
                    {wantSpots.slice(0, 4).map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => setTab("do")}
                          className="nc-press flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2 p-2 text-left transition hover:-translate-y-0.5 hover:border-signal/60"
                        >
                          <img
                            src={s.image}
                            alt=""
                            loading="lazy"
                            className="size-10 shrink-0 rounded-lg object-cover"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-semibold">{s.name}</span>
                            <span className="block truncate text-[11px] text-muted-foreground">
                              {s.neighborhood} · {s.subway}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </aside></div>
        </div>
      )}

      {tab === "do" && (
        <SpotsView
          marks={marks}
          onMark={markSpot}
          onCelebrate={() => setCelebrate((n) => n + 1)}
          forYou={forYouSpots}
          canPersonalize={hasPicks(prefs)}
          personalized={personalized}
          onMode={setMode}
          onSetup={() => setSetupOpen("edit")}
        />
      )}

      {tab === "slang" && (
        <SlangView
          onReward={(amount) => {
            credit("slang-quiz", "quiz", amount);
            setCelebrate((n) => n + 1);
          }}
        />
      )}

      {tab === "league" && (
        <League
          data={league}
          loading={leagueLoading}
          onToggleBoard={setOnBoard}
          onEditNickname={() => setSetupOpen("nickname")}
          onStartChallenge={() => setTab("learn")}
        />
      )}
      {tab === "account" && (
        <div>
          <div className="mx-auto max-w-3xl px-6 pt-8">
            <Button variant="outline" onClick={() => setTab(returnTab)}>← Back to {returnTab === "learn" ? "Daily lessons" : returnTab === "do" ? "Things to Do" : returnTab === "slang" ? "Slang" : "League"}</Button>
          </div>
          <AuthPanel user={user} onSignedOut={() => setTab("learn")} />
        </div>
      )}




      <footer className="relative border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-8 text-sm text-muted-foreground">
          Walkin' Here! · prototype content for {CITY}. Illustrative writing for a demo, not official
          city or MTA guidance.
        </div>
      </footer>

      {active && (
        <LessonPlayer lesson={active} onClose={() => setActive(null)} onFinish={finishLesson} />
      )}

      {setupOpen && (
        <Onboarding
          initial={prefs}
          initialNickname={nickname}
          editing={setupOpen !== "first"}
          startAt={setupOpen === "nickname" ? 4 : 0}
          onFinish={finishSetup}
          onSkip={skipSetup}
          {...(setupOpen === "edit" && hasPicks(prefs) ? { onReset: resetPicks } : {})}
        />
      )}

      {cardOpen && (
        <NycCard
          info={{
            name: nickname ?? user.name ?? "New Yorker",
            rank: level.name,
            xp,
            streak,
            bestStreak,
            lessonsDone: LESSONS.filter((l) => completed.includes(l.id)).length,
            lessonsTotal: LESSONS.length,
            home: prefs?.borough && prefs.borough !== "elsewhere" ? (prefs.borough === "Bronx" ? "The Bronx" : prefs.borough) : null,
          }}
          onClose={() => setCardOpen(false)}
        />
      )}
    </main>
  );
}

/* ---------------- lesson player ---------------- */

function LessonPlayer({
  lesson,
  onClose,
  onFinish,
}: {
  lesson: Lesson;
  onClose: () => void;
  onFinish: (lesson: Lesson, earned: number) => void;
}) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [done, setDone] = useState(false);
  const [burst, setBurst] = useState(0);
  const [shake, setShake] = useState(0);

  const q = lesson.questions[step]!;
  const isLast = step === lesson.questions.length - 1;
  const earned = Math.round((lesson.xp * correctCount) / lesson.questions.length);
  const progress = ((step + (picked !== null ? 1 : 0)) / lesson.questions.length) * 100;

  function choose(i: number) {
    setPicked(i);
    if (i === q.answer) setBurst((n) => n + 1);
    else setShake((n) => n + 1);
    if (i === q.answer) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (isLast) {
      setDone(true);
      setBurst((n) => n + 1);
    } else {
      setStep((s) => s + 1);
      setPicked(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        key={shake}
        className={cn(
          "nc-rise w-full max-w-xl overflow-hidden rounded-t-3xl border border-border bg-surface p-6 shadow-2xl sm:rounded-3xl sm:p-8",
          shake > 0 && picked !== null && picked !== q.answer && "nc-shake",
        )}
      >
        {done ? (
          <div className="relative text-center">
            <Confetti burst={burst} count={40} />
            <span className="-mx-6 -mt-6 mb-5 block overflow-hidden sm:-mx-8 sm:-mt-8">
              <img
                src={correctCount === lesson.questions.length ? CELEBRATION_IMAGES[0] : CELEBRATION_IMAGES[1]}
                alt="New York City view"
                loading="lazy"
                width={1200}
                height={675}
                className="h-40 w-full object-cover"
              />
            </span>
            <p className="nc-pop text-5xl">{correctCount === lesson.questions.length ? "🏆" : "👏"}</p>
            <h2 className="mt-4 text-2xl font-semibold">Lesson complete</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {correctCount} of {lesson.questions.length} right — you earned {earned} XP.
            </p>
            <div className="mx-auto mt-5 h-3 max-w-xs overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-mint to-primary transition-[width] duration-1000 ease-out"
                style={{ width: `${(correctCount / lesson.questions.length) * 100}%` }}
              />
            </div>
            <button
              onClick={() => onFinish(lesson, earned)}
              className="nc-press mt-6 w-full rounded-full bg-signal py-3.5 font-display text-sm font-semibold text-signal-foreground shadow-[0_5px_0_color-mix(in_oklab,var(--signal)_62%,black)]"
            >
              Collect {earned} XP
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                aria-label="Close lesson"
                className="text-xl text-muted-foreground transition hover:rotate-90 hover:text-foreground"
              >
                ✕
              </button>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-mint transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {step + 1}/{lesson.questions.length}
              </span>
            </div>

            <div key={step} className="nc-slide-q relative">
              <p className="mt-7 font-mono text-xs uppercase tracking-[0.2em] text-signal">
                {lesson.emoji} {lesson.title}
              </p>
              {q.context && <p className="mt-3 text-xs text-muted-foreground">{q.context}</p>}
              <h2 className="mt-2 text-xl font-semibold leading-snug">{q.prompt}</h2>

              <div className="relative mt-6 space-y-3">
                <Confetti burst={picked === q.answer ? burst : 0} count={24} />
                {q.options.map((opt, i) => {
                  const state =
                    picked === null
                      ? "idle"
                      : i === q.answer
                        ? "correct"
                        : i === picked
                          ? "wrong"
                          : "dim";
                  return (
                    <button
                      key={opt}
                      disabled={picked !== null}
                      onClick={() => choose(i)}
                      className={cn(
                        "nc-press w-full rounded-2xl border border-border bg-surface-2 px-5 py-4 text-left text-sm shadow-sm transition duration-200",
                        state === "idle" &&
                          "hover:-translate-y-0.5 hover:border-signal/60 hover:shadow-md",
                        state === "correct" && "nc-pop border-mint bg-mint/10 text-mint",
                        state === "wrong" && "border-destructive bg-destructive/10 text-destructive",
                        state === "dim" && "opacity-45",
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {picked !== null && (
                <div className="nc-rise mt-6 rounded-2xl border border-border bg-surface-2 p-4">
                  <p className="font-display text-sm font-semibold">
                    {picked === q.answer ? "Nice — that's the local move." : "Not quite."}
                  </p>
                  <div className="mt-1 flex items-start gap-3">
                    <p className="flex-1 text-sm text-muted-foreground">{q.explain}</p>
                    {q.say && <SpeakButton text={q.say} label="Hear it said" />}
                  </div>
                  <button
                    onClick={next}
                    className="nc-press mt-4 w-full rounded-full bg-signal py-3 font-display text-sm font-semibold text-signal-foreground shadow-[0_5px_0_color-mix(in_oklab,var(--signal)_62%,black)]"
                  >
                    {isLast ? "See results" : "Continue"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- things to do ---------------- */

function SpotsView({
  marks,
  onMark,
  onCelebrate,
  forYou,
  canPersonalize,
  personalized,
  onMode,
  onSetup,
}: {
  marks: Record<string, SpotMark>;
  onMark: (spot: Spot, mark: SpotMark) => void;
  onCelebrate: () => void;
  /** "For you" spots with reasons, or null in Standard mode. */
  forYou: { spot: Spot; because?: string }[] | null;
  canPersonalize: boolean;
  personalized: boolean;
  onMode: (personalized: boolean) => void;
  onSetup: () => void;
}) {
  const [filter, setFilter] = useState<SpotCategory | "all" | "foryou">(forYou ? "foryou" : "all");
  const [open, setOpen] = useState<{ spot: Spot; because?: string | undefined } | null>(null);
  const activeFilter = filter === "foryou" && !forYou ? "all" : filter;
  const reasons = useMemo(() => new Map((forYou ?? []).map((x) => [x.spot.id, x.because])), [forYou]);

  // Shelves for "For you" and "All": picks first (when personalized), then one shelf per category.
  const shelves = useMemo(() => {
    const byCategory = SPOT_CATEGORIES.map((c) => ({
      id: c.id,
      title: `${c.emoji} ${c.label}`,
      note: `${SPOTS.filter((s) => s.category === c.id).length} places`,
      items: SPOTS.filter((s) => s.category === c.id).map((spot) => ({ spot, because: reasons.get(spot.id) })),
    }));
    if (activeFilter === "foryou" && forYou?.length) {
      return [{ id: "picked", title: "Picked for you", note: forYou[0]?.because ? `Because ${forYou[0].because}` : "From your picks", items: forYou }, ...byCategory];
    }
    return byCategory;
  }, [activeFilter, forYou, reasons]);

  const grid = activeFilter !== "all" && activeFilter !== "foryou" ? SPOTS.filter((s) => s.category === activeFilter) : null;
  const beenCount = Object.values(marks).filter((m) => m === "been").length;
  const wantCount = Object.values(marks).filter((m) => m === "want").length;
  const chips = [
    ...(forYou ? [{ id: "foryou" as const, label: "For you", emoji: "✨" }] : []),
    { id: "all" as const, label: "All", emoji: "🗽" },
    ...SPOT_CATEGORIES,
  ];

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      <div className="rounded-3xl bg-[#121212] p-5 text-white shadow-xl sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Things to Do</h1>
            <p className="mt-1 text-sm text-[#a8a8a8]">
              {SPOTS.length} places · {beenCount} been · {wantCount} saved · mark one “Been there” to bank the XP
            </p>
          </div>
          {canPersonalize ? (
            <button type="button" onClick={() => onMode(!personalized)} className="rounded-full bg-[#262626] px-3.5 py-2 text-xs font-semibold text-[#ddd] hover:bg-[#333]">
              {personalized ? "✨ For you · switch to Standard" : "Standard · switch to ✨ For you"}
            </button>
          ) : (
            <button type="button" onClick={onSetup} className="rounded-full bg-[#262626] px-3.5 py-2 text-xs font-semibold text-[#ddd] hover:bg-[#333]">
              ✨ Make it yours
            </button>
          )}
        </div>

        <div role="group" aria-label="Category filters" className="mt-5 flex flex-wrap gap-2">
          {chips.map((c) => {
            const on = activeFilter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                aria-pressed={on}
                className={cn(
                  "nc-press rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition",
                  on ? "bg-signal text-signal-foreground" : "bg-[#262626] text-[#ddd] hover:bg-[#333]",
                )}
              >
                <span aria-hidden className="mr-1">{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {grid ? (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {grid.map((spot) => (
              <li key={spot.id}>
                <SpotTile spot={spot} mark={marks[spot.id]} onOpen={() => setOpen({ spot, because: reasons.get(spot.id) })} />
              </li>
            ))}
          </ul>
        ) : (
          shelves.map((shelf) => (
            <div key={shelf.id} className="mt-7">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-lg font-bold">{shelf.title}</h2>
                <span className="text-xs text-[#a8a8a8]">{shelf.note}</span>
              </div>
              <ul className="mt-3 grid auto-cols-[minmax(150px,1fr)] grid-flow-col gap-4 overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:#3a3a3a_transparent] sm:auto-cols-[minmax(170px,200px)]">
                {shelf.items.map(({ spot, because }) => (
                  <li key={spot.id}>
                    <SpotTile spot={spot} mark={marks[spot.id]} onOpen={() => setOpen({ spot, because })} />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {open && (
        <SpotSheet
          spot={open.spot}
          because={open.because}
          mark={marks[open.spot.id]}
          onMark={onMark}
          onCelebrate={onCelebrate}
          onClose={() => setOpen(null)}
        />
      )}
    </section>
  );
}

/** A square photo tile; opening it shows the details and the Been there / Want to go buttons. */
function SpotTile({ spot, mark, onOpen }: { spot: Spot; mark: SpotMark | undefined; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="group block w-full text-left">
      <span className="relative block aspect-square overflow-hidden rounded-xl bg-[#1f1f1f]">
        <img src={spot.image} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-1.5 py-1 font-mono text-[11px] font-bold text-signal">+{spot.xp} XP</span>
        {mark === "been" && <span className="absolute right-2 top-2 rounded-full bg-mint px-2 py-0.5 text-[11px] font-bold text-white">✓ Been</span>}
        {mark === "want" && <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-black">🔖 Saved</span>}
      </span>
      <span className="mt-2 block truncate text-sm font-bold">{spot.name}</span>
      <span className="block truncate text-xs text-[#a8a8a8]">
        {spot.neighborhood} · {spot.subway.split("·")[0]!.trim()}
      </span>
    </button>
  );
}

/** Details for one place, as a sheet: the tip, the trains, the cost, and the two marks. */
function SpotSheet({
  spot,
  because,
  mark,
  onMark,
  onCelebrate,
  onClose,
}: {
  spot: Spot;
  because?: string | undefined;
  mark: SpotMark | undefined;
  onMark: (spot: Spot, mark: SpotMark) => void;
  onCelebrate: () => void;
  onClose: () => void;
}) {
  const [burst, setBurst] = useState(0);
  const category = SPOT_CATEGORIES.find((c) => c.id === spot.category)!;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function been() {
    if (mark !== "been") {
      setBurst((n) => n + 1);
      onCelebrate();
    }
    onMark(spot, "been");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={spot.name} onClick={onClose}>
      <div className="nc-rise relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-[#181818] text-white shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <Confetti burst={burst} count={26} />
        <div className="relative aspect-[16/9]">
          <img src={spot.image} alt={spot.name} className="h-full w-full object-cover" />
          <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-black/60 text-lg">✕</button>
          <span className="absolute bottom-3 left-3 rounded-full bg-signal px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-signal-foreground">
            {category.emoji} {category.label}
          </span>
        </div>
        {spot.credit && <p className="px-5 pt-1.5 text-right text-[10px] text-[#888]">Photo: {spot.credit}</p>}
        <div className="p-5 sm:p-6">
          <h2 className="font-display text-2xl font-bold">{spot.name}</h2>
          {because && <p className="mt-2 inline-block rounded-full bg-signal/15 px-2.5 py-1 text-xs font-semibold text-signal">✨ For you: {because}</p>}
          <p className="mt-2 text-sm text-[#cfcfcf]">{spot.blurb}</p>
          <dl className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-[#232323] px-3 py-2"><dt className="text-[11px] text-[#999]">Where</dt><dd>{spot.neighborhood}, {spot.borough}</dd></div>
            <div className="rounded-xl bg-[#232323] px-3 py-2"><dt className="text-[11px] text-[#999]">Trains</dt><dd>{spot.subway}</dd></div>
            <div className="rounded-xl bg-[#232323] px-3 py-2"><dt className="text-[11px] text-[#999]">Cost</dt><dd>{spot.cost}</dd></div>
          </dl>
          <div className="mt-4 rounded-2xl border border-signal/30 bg-signal/10 p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-signal">Local pro-tip</p>
            <p className="mt-1.5 text-sm leading-relaxed">{spot.tip}</p>
          </div>
          <div className="mt-5 flex items-center gap-2">
            <button
              type="button"
              onClick={been}
              aria-pressed={mark === "been"}
              className={cn(
                "nc-press flex-1 rounded-full px-4 py-3 text-sm font-bold transition",
                mark === "been" ? "bg-mint text-white" : "bg-signal text-signal-foreground hover:brightness-105",
              )}
            >
              {mark === "been" ? "✓ Been there" : `Been there · +${spot.xp} XP`}
            </button>
            <button
              type="button"
              onClick={() => onMark(spot, "want")}
              aria-pressed={mark === "want"}
              className={cn("nc-press rounded-full px-4 py-3 text-sm font-bold transition", mark === "want" ? "bg-white text-black" : "bg-[#262626] text-[#ddd] hover:bg-[#333]")}
            >
              {mark === "want" ? "🔖 Saved" : "📌 Want to go"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- slang ---------------- */

function cringeLabel(level: number) {
  return level <= 1 ? "Safe for anyone" : level <= 2 ? "Low risk" : level <= 3 ? "Use sparingly" : level <= 4 ? "Insider only" : "Tryhard alert";
}

/** One slang term as a "track": play it, see what it means, open it for the example and the cringe check. */
function SlangCard({ term }: { term: SlangTerm }) {
  const [open, setOpen] = useState(false);
  const cat = SLANG_CATEGORIES.find((c) => c.id === term.category)!;

  return (
    <li className="rounded-2xl bg-gradient-to-br from-[#2a2a2a] to-[#1b1b1b] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={`slang-${term.id}`}
          className="min-w-0 flex-1 text-left"
        >
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#999]">
            {cat.emoji} {cat.label}
          </span>
          <span className="mt-1 block font-display text-2xl font-bold leading-tight">{term.term}</span>
          <span className="block font-mono text-xs text-signal">{term.phonetic}</span>
          <span className="mt-1 block text-sm text-[#bdbdbd]">{term.short}</span>
        </button>
        <SpeakButton variant="play" text={`${term.say ?? term.term}. ${term.example}`} label={`Hear "${term.term}" said aloud`} />
      </div>

      <div className="mt-3 flex items-center gap-2" title={cringeLabel(term.cringe)}>
        <span className="flex flex-1 gap-1" aria-hidden>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={cn("h-1 flex-1 rounded-full", n <= term.cringe ? (term.cringe >= 4 ? "bg-destructive" : "bg-signal") : "bg-[#333]")} />
          ))}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#999]">{cringeLabel(term.cringe)}</span>
      </div>

      {open && (
        <div id={`slang-${term.id}`} className="nc-rise mt-4 border-t border-[#333] pt-4 text-sm">
          <p className="leading-relaxed text-[#ddd]">{term.definition}</p>
          <p className="mt-3 rounded-xl bg-black/30 px-3 py-2 italic text-white">{term.example}</p>
          <p className="mt-3 text-xs leading-relaxed text-[#a8a8a8]">{term.warning}</p>
        </div>
      )}
      <button type="button" onClick={() => setOpen((o) => !o)} className="mt-3 text-xs font-semibold text-signal hover:underline">
        {open ? "Show less" : "What it means & when to use it"}
      </button>
    </li>
  );
}

function SlangView({ onReward }: { onReward: (amount: number, streakCredit: boolean) => void }) {
  const [filter, setFilter] = useState<SlangCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [challenge, setChallenge] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SLANG.filter(
      (t) =>
        (filter === "all" || t.category === filter) &&
        (!q || t.term.toLowerCase().includes(q) || t.short.toLowerCase().includes(q) || t.definition.toLowerCase().includes(q)),
    );
  }, [filter, query]);

  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6">
      <div className="rounded-3xl bg-[#121212] p-5 text-white shadow-xl sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">Slang</h1>
            <p className="mt-1 text-sm text-[#a8a8a8]">{SLANG.length} terms · press ▶ to hear one · say it right, or don't say it at all</p>
          </div>
          <button
            type="button"
            onClick={() => setChallenge(true)}
            className="nc-press rounded-full bg-signal px-5 py-2.5 font-display text-sm font-bold text-signal-foreground hover:brightness-105"
          >
            ⚡ Slang Challenge
          </button>
        </div>

        <label className="relative mt-5 block">
          <span className="sr-only">Search slang</span>
          <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm">🔍</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Look up a word: deadass, brick, pie…"
            className="w-full rounded-full border border-[#333] bg-[#1f1f1f] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-[#888] focus:border-signal"
          />
        </label>

        <div role="group" aria-label="Slang categories" className="mt-4 flex flex-wrap gap-2">
          {[{ id: "all" as const, label: "All slang", emoji: "✨" }, ...SLANG_CATEGORIES].map((c) => {
            const on = filter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id as SlangCategory | "all")}
                aria-pressed={on}
                className={cn("nc-press rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition", on ? "bg-signal text-signal-foreground" : "bg-[#262626] text-[#ddd] hover:bg-[#333]")}
              >
                <span aria-hidden className="mr-1">{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>

        {list.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-[#1f1f1f] p-5 text-sm text-[#bbb]">Nothing matches “{query}”. Try “coffee”, “cold”, or “Manhattan”.</p>
        ) : (
          <ul className="mt-6 grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t) => (
              <SlangCard key={t.id} term={t} />
            ))}
          </ul>
        )}
      </div>

      {challenge && <SlangChallenge onClose={() => setChallenge(false)} onReward={onReward} />}
    </section>
  );
}

function SlangChallenge({
  onClose,
  onReward,
}: {
  onClose: () => void;
  onReward: (amount: number, streakCredit: boolean) => void;
}) {
  const questions = useMemo(() => [...SLANG].sort(() => Math.random() - 0.5).slice(0, 5), []);
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [done, setDone] = useState(false);
  const [burst, setBurst] = useState(0);
  const [shake, setShake] = useState(0);

  const term = questions[step]!;
  const q = term.quiz;
  const isLast = step === questions.length - 1;
  const earned = correct * 8;
  const progress = ((step + (picked !== null ? 1 : 0)) / questions.length) * 100;

  function choose(i: number) {
    setPicked(i);
    if (i === q.answer) {
      setCorrect((c) => c + 1);
      setBurst((n) => n + 1);
    } else setShake((n) => n + 1);
  }

  function next() {
    if (isLast) {
      setDone(true);
      setBurst((n) => n + 1);
    } else {
      setStep((s) => s + 1);
      setPicked(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div
        key={shake}
        className={cn(
          "nc-rise w-full max-w-xl overflow-hidden rounded-t-3xl border border-border bg-surface p-6 shadow-2xl sm:rounded-3xl sm:p-8",
          shake > 0 && picked !== null && picked !== q.answer && "nc-shake",
        )}
      >
        {done ? (
          <div className="relative text-center">
            <Confetti burst={burst} count={40} />
            <p className="nc-pop text-5xl">{correct === questions.length ? "🗽" : "🗣️"}</p>
            <h2 className="mt-4 text-2xl font-semibold">
              {correct === questions.length ? "Deadass fluent." : "Not bad for a transplant."}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {correct} of {questions.length} right — {earned} XP and a streak day.
            </p>
            <div className="mx-auto mt-5 h-3 max-w-xs overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-mint to-primary transition-[width] duration-1000 ease-out"
                style={{ width: `${(correct / questions.length) * 100}%` }}
              />
            </div>
            <button
              onClick={() => {
                onReward(earned, true);
                onClose();
              }}
              className="nc-press mt-6 w-full rounded-full bg-signal py-3.5 font-display text-sm font-semibold text-signal-foreground shadow-[0_5px_0_color-mix(in_oklab,var(--signal)_62%,black)]"
            >
              Collect {earned} XP
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                aria-label="Close challenge"
                className="text-xl text-muted-foreground transition hover:rotate-90 hover:text-foreground"
              >
                ✕
              </button>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-mint transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {step + 1}/{questions.length}
              </span>
            </div>

            <div key={step} className="nc-slide-q relative">
              <p className="mt-7 font-mono text-xs uppercase tracking-[0.2em] text-signal">
                🗣️ Slang Challenge
              </p>
              <h2 className="mt-2 text-xl font-semibold leading-snug">{q.prompt}</h2>

              <div className="relative mt-6 space-y-3">
                <Confetti burst={picked === q.answer ? burst : 0} count={24} />
                {q.options.map((opt, i) => {
                  const state =
                    picked === null
                      ? "idle"
                      : i === q.answer
                        ? "correct"
                        : i === picked
                          ? "wrong"
                          : "dim";
                  return (
                    <button
                      key={opt}
                      disabled={picked !== null}
                      onClick={() => choose(i)}
                      className={cn(
                        "nc-press w-full rounded-2xl border border-border bg-surface-2 px-5 py-4 text-left text-sm shadow-sm transition duration-200",
                        state === "idle" &&
                          "hover:-translate-y-0.5 hover:border-signal/60 hover:shadow-md",
                        state === "correct" && "nc-pop border-mint bg-mint/10 text-mint",
                        state === "wrong" && "border-destructive bg-destructive/10 text-destructive",
                        state === "dim" && "opacity-45",
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {picked !== null && (
                <div className="nc-rise mt-6 rounded-2xl border border-border bg-surface-2 p-4">
                  <p className="font-display text-sm font-semibold">
                    {picked === q.answer ? "Facts. That's it." : `Nope — ${term.term} means ${term.short.toLowerCase()}.`}
                  </p>
                  <p className="mt-1 text-sm italic text-muted-foreground">{term.example}</p>
                  <button
                    onClick={next}
                    className="nc-press mt-4 w-full rounded-full bg-signal py-3 font-display text-sm font-semibold text-signal-foreground shadow-[0_5px_0_color-mix(in_oklab,var(--signal)_62%,black)]"
                  >
                    {isLast ? "See results" : "Continue"}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- city switcher ---------------- */

function CitySwitcher() {
  const [open, setOpen] = useState(false);
  const [voted, setVoted] = useState<string[]>([]);
  const [preview, setPreview] = useState<City | null>(null);
  const active = CITIES.find((c) => c.status === "live")!;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="nc-press flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 font-medium shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-signal/70"
      >
        <span aria-hidden>📍</span>
        <span className="hidden sm:inline">{active.name}</span>
        <span className="sm:hidden">NYC</span>
        <span aria-hidden className="text-muted-foreground">
          ▾
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/25 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-label="Choose your city"
            onClick={(e) => e.stopPropagation()}
            className="nc-rise max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 text-left shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal">
                  Choose your city
                </p>
                <h2 className="mt-1 font-display text-xl font-bold">Where did you just move?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This picks the whole curriculum — not the colours. Colours live in the palette
                  buttons next to this one.
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close city picker"
                className="text-xl text-muted-foreground transition hover:rotate-90 hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <ul className="mt-5 space-y-3">
              {CITIES.map((c, i) => {
                const live = c.status === "live";
                const hasVoted = voted.includes(c.id);
                return (
                  <li
                    key={c.id}
                    className="nc-rise"
                    style={{ animationDelay: `${0.03 + i * 0.04}s` }}
                  >
                    <div
                      className={cn(
                        "rounded-2xl border p-4 transition duration-300",
                        live
                          ? "border-signal bg-signal/10 shadow-sm"
                          : "border-border bg-surface-2 hover:-translate-y-0.5 hover:border-signal/50",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <span aria-hidden className="text-2xl">
                          {c.landmark}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="flex flex-wrap items-center gap-2 font-display text-base font-semibold">
                            <span aria-hidden>{c.flag}</span> {c.name}
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em]",
                                live
                                  ? "bg-mint/15 text-mint"
                                  : "bg-surface text-muted-foreground",
                              )}
                            >
                              {live ? "Active · playing" : "Coming soon"}
                            </span>
                          </p>
                          <p className="text-sm text-signal">{c.tagline}</p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.blurb}</p>
                        </div>
                        {live ? (
                          <span className="shrink-0 text-lg text-mint" aria-label="Selected">
                            ✓
                          </span>
                        ) : (
                          <div className="flex shrink-0 gap-2">
                            <button
                              onClick={() => setPreview(preview?.id === c.id ? null : c)}
                              className="nc-press rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium transition hover:border-signal/60"
                            >
                              Preview
                            </button>
                            <button
                              onClick={() =>
                                setVoted((v) => (v.includes(c.id) ? v : [...v, c.id]))
                              }
                              className={cn(
                                "nc-press rounded-full px-3 py-1.5 text-xs font-semibold transition",
                                hasVoted
                                  ? "bg-mint/15 text-mint"
                                  : "bg-signal text-signal-foreground",
                              )}
                            >
                              {hasVoted ? `Voted · ${c.votes + 1}` : `Vote · ${c.votes}`}
                            </button>
                          </div>
                        )}
                      </div>

                      {preview?.id === c.id && (
                        <p className="nc-rise mt-3 rounded-xl border-l-2 border-signal bg-surface px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                          Sneak peek — {c.name}, {c.country}: {c.blurb} Lessons are being written
                          with locals now. Vote to push it up the queue.
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              Only New York is playable today. Everything else is on the way.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
