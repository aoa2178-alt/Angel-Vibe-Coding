import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { cleanPrefs, hasPicks, type Prefs } from "./personalize";
import { ACTIVITY_KINDS, creditXp, isCorrectChallengeAnswer, maxXpFor } from "./rewards";
import { currentStreak, nextStreak, nycDate, weekStart } from "./streak";
import { checkNickname } from "./nickname";

const lessonId = z.string().min(1).max(60);
const spotId = z.string().min(1).max(60);
const spotMark = z.enum(["want", "been"]);

/** The signed-in user's id, or an error if the request has no valid session. */
async function requireUserId(): Promise<string> {
  const { getRequest } = await import("@tanstack/react-start/server");
  const { auth } = await import("./auth.server");
  const session = await auth.api.getSession({ headers: getRequest().headers });
  if (!session) throw new Error("Not signed in");
  return session.user.id;
}

async function db() {
  const { getPool } = await import("./db.server");
  return getPool();
}

/** Postgres returns DATE columns as JS Dates at local midnight; turn them back into YYYY-MM-DD. */
function day(value: Date | string | null): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
}

type ProfileRow = {
  xp: number;
  streak: number;
  best_streak: number;
  last_active: Date | string | null;
  week_start: Date | string | null;
  week_xp: number;
  day_date: Date | string | null;
  day_xp: number;
  challenge_date: Date | string | null;
  prefs: unknown;
  personalized: boolean;
  setup_done: boolean;
  nickname: string | null;
  on_board: boolean;
};

const PROFILE_COLUMNS =
  "xp, streak, best_streak, last_active, week_start, week_xp, day_date, day_xp, challenge_date, prefs, personalized, setup_done, nickname, on_board";

/** Everything the home screen needs for the signed-in user. Creates their profile row on first visit. */
export const loadProgress = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const pool = await db();
  const profile = await pool.query<ProfileRow>(
    `INSERT INTO profiles (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING ${PROFILE_COLUMNS}`,
    [userId],
  );
  const lessons = await pool.query<{ lesson_id: string }>(
    "SELECT lesson_id FROM lesson_progress WHERE user_id = $1 AND completed",
    [userId],
  );
  const spots = await pool.query<{ spot_id: string; mark: "want" | "been" }>(
    "SELECT spot_id, mark FROM saved_spots WHERE user_id = $1",
    [userId],
  );
  const row = profile.rows[0]!;
  const today = nycDate();
  const prefs = cleanPrefs(row.prefs);
  return {
    xp: row.xp,
    streak: currentStreak(row.streak, day(row.last_active), today),
    bestStreak: Math.max(row.best_streak, row.streak),
    weekXp: day(row.week_start) === weekStart(today) ? row.week_xp : 0,
    challengeDone: day(row.challenge_date) === today,
    isNew: row.xp === 0 && lessons.rows.length === 0 && !row.last_active,
    prefs: hasPicks(prefs) ? prefs : null,
    personalized: row.personalized,
    setupDone: row.setup_done,
    nickname: row.nickname,
    onBoard: row.on_board,
    lessons: lessons.rows.map((r) => r.lesson_id),
    spots: Object.fromEntries(spots.rows.map((r) => [r.spot_id, r.mark])) as Record<string, "want" | "been">,
  };
});

/**
 * Credit an activity: XP comes from the content (never the browser's number), within a daily cap;
 * it also moves the daily streak and the weekly league total. The daily challenge counts once a day,
 * and only a right answer (checked here) earns its XP.
 */
export const recordActivity = createServerFn({ method: "POST" })
  .validator(
    z.object({
      kind: z.enum(ACTIVITY_KINDS),
      id: z.string().min(1).max(80),
      xp: z.number().int().min(0).max(10_000).optional(),
      choice: z.number().int().min(0).max(10).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const max = maxXpFor(data.kind, data.id);
    if (max === null) throw new Error("Unknown activity");
    const pool = await db();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("INSERT INTO profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING", [userId]);
      const row = (await client.query<ProfileRow>(`SELECT ${PROFILE_COLUMNS} FROM profiles WHERE user_id = $1 FOR UPDATE`, [userId])).rows[0]!;
      const today = nycDate();
      const week = weekStart(today);
      const lastActive = day(row.last_active);

      let requested = data.xp ?? max;
      let challengeDate = day(row.challenge_date);
      let correct: boolean | undefined;
      if (data.kind === "challenge") {
        if (challengeDate === today) requested = 0;
        else {
          correct = isCorrectChallengeAnswer(data.id, data.choice ?? -1);
          requested = correct ? max : 0;
          challengeDate = today;
        }
      }

      const dayXp = day(row.day_date) === today ? row.day_xp : 0;
      const credited = creditXp(requested, max, dayXp);
      const weekXp = (day(row.week_start) === week ? row.week_xp : 0) + credited;
      const streak = nextStreak(row.streak, lastActive, today);
      const bestStreak = Math.max(row.best_streak, streak);
      const xp = row.xp + credited;

      await client.query(
        `UPDATE profiles SET xp = $2, streak = $3, best_streak = $4, last_active = $5, week_start = $6, week_xp = $7,
           day_date = $5, day_xp = $8, challenge_date = $9, updated_at = now()
         WHERE user_id = $1`,
        [userId, xp, streak, bestStreak, today, week, weekXp, dayXp + credited, challengeDate],
      );
      if (data.kind === "lesson") {
        await client.query(
          `INSERT INTO lesson_progress (user_id, lesson_id, completed, earned_xp, completed_at)
           VALUES ($1, $2, true, $3, now())
           ON CONFLICT (user_id, lesson_id)
           DO UPDATE SET completed = true, earned_xp = GREATEST(lesson_progress.earned_xp, EXCLUDED.earned_xp), completed_at = now(), updated_at = now()`,
          [userId, data.id, credited],
        );
      }
      await client.query("COMMIT");
      return { xp, streak, bestStreak, weekXp, credited, correct, challengeDone: challengeDate === today };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  });

/** Mark lessons done without XP (used once, to carry over what was played before signing up). */
export const saveLessons = createServerFn({ method: "POST" })
  .validator(z.object({ lessons: z.array(z.object({ lessonId })).max(200) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const pool = await db();
    for (const lesson of data.lessons) {
      await pool.query(
        `INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at)
         VALUES ($1, $2, true, now())
         ON CONFLICT (user_id, lesson_id) DO UPDATE SET completed = true, updated_at = now()`,
        [userId, lesson.lessonId],
      );
    }
  });

/** Set (or clear, with mark: null) the "want to go" / "been" mark on one or more places. */
export const saveSpots = createServerFn({ method: "POST" })
  .validator(z.object({ spots: z.array(z.object({ spotId, mark: spotMark.nullable() })).max(200) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const pool = await db();
    for (const spot of data.spots) {
      if (spot.mark) {
        await pool.query(
          `INSERT INTO saved_spots (user_id, spot_id, mark) VALUES ($1, $2, $3)
           ON CONFLICT (user_id, spot_id) DO UPDATE SET mark = EXCLUDED.mark, updated_at = now()`,
          [userId, spot.spotId, spot.mark],
        );
      } else {
        await pool.query("DELETE FROM saved_spots WHERE user_id = $1 AND spot_id = $2", [userId, spot.spotId]);
      }
    }
  });

/** Save "Make it yours" picks and settings. Picks are cleaned to known values; null clears them. */
export const savePrefs = createServerFn({ method: "POST" })
  .validator(
    z.object({
      prefs: z.unknown().optional(),
      personalized: z.boolean().optional(),
      setupDone: z.boolean().optional(),
      onBoard: z.boolean().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    let prefs: Prefs | null | undefined;
    if (data.prefs === null) prefs = null;
    else if (data.prefs !== undefined) {
      const cleaned = cleanPrefs(data.prefs);
      prefs = hasPicks(cleaned) ? cleaned : null;
    }
    await (await db()).query(
      `UPDATE profiles SET
         prefs = CASE WHEN $2 THEN $3::jsonb ELSE prefs END,
         personalized = COALESCE($4, personalized),
         setup_done = COALESCE($5, setup_done),
         on_board = COALESCE($6, on_board),
         updated_at = now()
       WHERE user_id = $1`,
      [userId, prefs !== undefined, prefs ? JSON.stringify(prefs) : null, data.personalized ?? null, data.setupDone ?? null, data.onBoard ?? null],
    );
    return { saved: true };
  });

/** Pick a league nickname. Nicknames are unique, ignoring capitals. */
export const setNickname = createServerFn({ method: "POST" })
  .validator(z.object({ nickname: z.string().max(60) }))
  .handler(async ({ data }): Promise<{ ok: true; nickname: string } | { ok: false; error: string }> => {
    const userId = await requireUserId();
    const checked = checkNickname(data.nickname);
    if (!checked.ok) return checked;
    try {
      await (await db()).query("UPDATE profiles SET nickname = $2, updated_at = now() WHERE user_id = $1", [userId, checked.value]);
      return { ok: true, nickname: checked.value };
    } catch (error) {
      if ((error as { code?: string }).code === "23505") return { ok: false, error: "That nickname is taken. Try another." };
      throw error;
    }
  });

/** This week's league: the top 20 nicknames by XP earned since Monday (New York time), plus your own place. */
export const loadLeague = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const pool = await db();
  const week = weekStart(nycDate());
  const top = await pool.query<{ user_id: string; nickname: string; week_xp: number }>(
    `SELECT user_id, nickname, week_xp FROM profiles
     WHERE on_board AND nickname IS NOT NULL AND week_start = $1 AND week_xp > 0
     ORDER BY week_xp DESC, lower(nickname) LIMIT 20`,
    [week],
  );
  const mine = (
    await pool.query<{ nickname: string | null; on_board: boolean; week_xp: number; week_start: Date | string | null }>(
      "SELECT nickname, on_board, week_xp, week_start FROM profiles WHERE user_id = $1",
      [userId],
    )
  ).rows[0];
  const myWeekXp = mine && day(mine.week_start) === week ? mine.week_xp : 0;
  let rank: number | null = null;
  if (mine?.on_board && mine.nickname && myWeekXp > 0) {
    const ahead = await pool.query<{ n: string }>(
      `SELECT count(*) AS n FROM profiles
       WHERE on_board AND nickname IS NOT NULL AND week_start = $1
         AND (week_xp > $2 OR (week_xp = $2 AND lower(nickname) < lower($3)))`,
      [week, myWeekXp, mine.nickname],
    );
    rank = Number(ahead.rows[0]!.n) + 1;
  }
  return {
    weekStart: week,
    top: top.rows.map((r) => ({ nickname: r.nickname, weekXp: r.week_xp, me: r.user_id === userId })),
    me: { nickname: mine?.nickname ?? null, onBoard: mine?.on_board ?? true, weekXp: myWeekXp, rank },
  };
});
