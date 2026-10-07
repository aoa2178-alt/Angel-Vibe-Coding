import { betterAuth } from "better-auth";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { getPool } from "./db.server";

const googleClientId = process.env["GOOGLE_CLIENT_ID"];
const googleClientSecret = process.env["GOOGLE_CLIENT_SECRET"];

/**
 * Sign-in for Walkin' Here!: email + password, plus Google when its keys are set.
 * Accounts and sessions live in the same Neon database as progress.
 * Env: BETTER_AUTH_SECRET, BETTER_AUTH_URL, DATABASE_URL, GOOGLE_CLIENT_ID/SECRET.
 */
export const auth = betterAuth({
  database: getPool(),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders:
    googleClientId && googleClientSecret
      ? { google: { clientId: googleClientId, clientSecret: googleClientSecret } }
      : {},
  // Must stay last so it sees the cookies every other plugin sets.
  plugins: [tanstackStartCookies()],
});

export type SessionUser = typeof auth.$Infer.Session.user;
