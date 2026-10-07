import { createServerFn } from "@tanstack/react-start";

/** Adds one to today's anonymous visit total (no personal data). */
export const recordVisit = createServerFn({ method: "POST" }).handler(async () => {
  const { getPool } = await import("./db.server");
  await getPool().query(
    `INSERT INTO daily_visits (visit_date, visit_count) VALUES (current_date, 1)
     ON CONFLICT (visit_date) DO UPDATE SET visit_count = daily_visits.visit_count + 1, updated_at = now()`,
  );
  return { recorded: true };
});
