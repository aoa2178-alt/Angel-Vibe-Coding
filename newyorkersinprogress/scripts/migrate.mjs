// Creates/updates the database tables: Better Auth's tables, then db/schema.sql.
// Usage (from newyorkersinprogress/): node --env-file=.env.local scripts/migrate.mjs
import { readFile } from "node:fs/promises";
import pg from "pg";
import { getMigrations } from "better-auth/db/migration";

const connectionString = process.env.DATABASE_URL ?? process.env.DATABASE_URL_DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Run `vercel env pull .env.local` first.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
try {
  // Must match the table-affecting options in src/lib/auth.server.ts.
  const { toBeCreated, toBeAdded, runMigrations } = await getMigrations({
    database: pool,
    emailAndPassword: { enabled: true },
  });
  console.log(`Better Auth: ${toBeCreated.length} table(s) to create, ${toBeAdded.length} to update`);
  await runMigrations();

  const schema = await readFile(new URL("../db/schema.sql", import.meta.url), "utf8");
  await pool.query(schema);

  const { rows } = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
  );
  console.log("Tables:", rows.map((row) => row.table_name).join(", "));
} finally {
  await pool.end();
}
