import { createHash, timingSafeEqual } from "node:crypto";

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" }
  });
}

export function errorResponse(status, type, message) {
  return json({ error: { type, message } }, status);
}

const digest = (s) => createHash("sha256").update(s).digest();

// Every endpoint is gated by the shared team access code (TEAM_ACCESS_CODE).
// On Vercel the code is required, so a deployment without one never exposes the Claude key.
// Locally, leaving it unset keeps the tool open for development.
export function checkAccess(request) {
  const code = process.env.TEAM_ACCESS_CODE;
  if (!code) {
    if (process.env.VERCEL) {
      return errorResponse(503, "not_configured", "This deployment has no TEAM_ACCESS_CODE set, so it's locked. Add one in the Vercel project's environment variables and redeploy.");
    }
    return null;
  }
  const given = request.headers.get("x-access-code") || "";
  if (!timingSafeEqual(digest(given), digest(code))) {
    return errorResponse(403, "access_denied", given ? "That access code isn't right." : "Enter the team access code to continue.");
  }
  return null;
}

// Parses a JSON body, refusing anything unreasonably large for this tool.
export async function readJson(request, limit = 400_000) {
  const text = await request.text();
  if (text.length > limit) throw Object.assign(new Error("Request is too large."), { status: 413 });
  try { return text ? JSON.parse(text) : {}; }
  catch { throw Object.assign(new Error("Request body isn't valid JSON."), { status: 400 }); }
}
