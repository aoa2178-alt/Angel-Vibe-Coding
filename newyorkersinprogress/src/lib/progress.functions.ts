import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

/** Everything the home screen needs for the signed-in user. Creates their profile row on first visit. */
export const loadProgress = createServerFn({ method: "GET" }).handler(async () => {
  const userId = await requireUserId();
  const pool = await db();
  const profile = await pool.query<{ xp: number; streak: number }>(
    `INSERT INTO profiles (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING xp, streak`,
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
  return {
    xp: profile.rows[0]!.xp,
    streak: profile.rows[0]!.streak,
    lessons: lessons.rows.map((row) => row.lesson_id),
    spots: Object.fromEntries(spots.rows.map((row) => [row.spot_id, row.mark])) as Record<string, "want" | "been">,
  };
});

export const saveStats = createServerFn({ method: "POST" })
  .validator(z.object({ xp: z.number().int().min(0).max(1_000_000), streak: z.number().int().min(0).max(100_000) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    await (await db()).query(
      "UPDATE profiles SET xp = $2, streak = $3, updated_at = now() WHERE user_id = $1",
      [userId, data.xp, data.streak],
    );
  });

export const saveLessons = createServerFn({ method: "POST" })
  .validator(z.object({ lessons: z.array(z.object({ lessonId, earnedXp: z.number().int().min(0).max(10_000) })).max(200) }))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    const pool = await db();
    for (const lesson of data.lessons) {
      await pool.query(
        `INSERT INTO lesson_progress (user_id, lesson_id, completed, earned_xp, completed_at)
         VALUES ($1, $2, true, $3, now())
         ON CONFLICT (user_id, lesson_id)
         DO UPDATE SET completed = true, earned_xp = EXCLUDED.earned_xp, completed_at = now(), updated_at = now()`,
        [userId, lesson.lessonId, lesson.earnedXp],
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
