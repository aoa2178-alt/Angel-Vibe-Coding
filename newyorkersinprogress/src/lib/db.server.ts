import { Pool } from "pg";

let pool: Pool | undefined;

/**
 * Shared Postgres pool for the Neon database that Vercel connects to this project
 * (DATABASE_URL is added by the Neon integration; for local dev, pull it with
 * `vercel env pull .env.local`).
 */
export function getPool(): Pool {
  if (!pool) {
    // The Neon integration was connected with the prefix "DATABASE_URL", so Vercel names it DATABASE_URL_DATABASE_URL.
    const connectionString = process.env["DATABASE_URL"] ?? process.env["DATABASE_URL_DATABASE_URL"];
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set. Connect the Neon database to this Vercel project, then run `vercel env pull .env.local`.");
    }
    pool = new Pool({ connectionString, max: 5 });
  }
  return pool;
}
