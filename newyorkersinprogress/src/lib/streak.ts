// Dates for streaks, the daily challenge and the weekly league, all on New York time.
// Dates are plain "YYYY-MM-DD" strings so they compare and store simply.

export const NYC_TIME_ZONE = "America/New_York";

/** Today's date in New York, as YYYY-MM-DD. */
export function nycDate(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: NYC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The Monday that starts the league week containing this date. */
export function weekStart(date: string): string {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, -((day + 6) % 7));
}

/**
 * The streak after doing something today. Doing more on the same day doesn't add to it, the next
 * day adds one, and a missed day starts over at 1. Accounts from before daily streaks (no date yet)
 * keep the streak they had.
 */
export function nextStreak(streak: number, lastActive: string | null, today: string): number {
  if (lastActive === today) return Math.max(streak, 1);
  if (lastActive === null || lastActive === addDays(today, -1)) return streak + 1;
  return 1;
}

/** The streak to show before doing anything today: it's already broken if the last activity was before yesterday. */
export function currentStreak(streak: number, lastActive: string | null, today: string): number {
  if (lastActive === null || lastActive === today || lastActive === addDays(today, -1)) return streak;
  return 0;
}

/** Milliseconds until midnight in New York. */
export function msUntilNycMidnight(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: NYC_TIME_ZONE,
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  const elapsed = (get("hour") * 3600 + get("minute") * 60 + get("second")) * 1000 + now.getMilliseconds();
  return 24 * 3600 * 1000 - elapsed;
}

/** Milliseconds until the league resets (Monday, midnight, New York time). */
export function msUntilWeekReset(now: Date = new Date()): number {
  const today = nycDate(now);
  const daysLeft = 6 - ((new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7);
  return msUntilNycMidnight(now) + daysLeft * 24 * 3600 * 1000;
}

/** "3d 4h", "5h 12m" or "12m". */
export function formatCountdown(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
