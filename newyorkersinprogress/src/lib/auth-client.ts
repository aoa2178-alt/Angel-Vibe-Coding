import { createAuthClient } from "better-auth/react";

// Same-origin: the auth endpoints live at /api/auth/* on this site.
export const authClient = createAuthClient();

export type AuthUser = typeof authClient.$Infer.Session.user;
