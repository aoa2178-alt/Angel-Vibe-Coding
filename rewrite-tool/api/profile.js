import { checkAccess, errorResponse, json, readJson } from "./_lib/http.js";
import { cleanProfile, store } from "./_lib/store.js";

function guard(request) {
  const denied = checkAccess(request);
  if (denied) return { denied };
  if (!store) return { denied: errorResponse(503, "not_configured", "No storage is connected.") };
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return { denied: errorResponse(400, "bad_request", "Missing profile id.") };
  return { id };
}

const notFound = () => errorResponse(404, "not_found", "This profile no longer exists. A teammate may have deleted it.");

// GET ?id=: one profile with its guidelines, examples, history and undo stack.
export async function GET(request) {
  const { denied, id } = guard(request);
  if (denied) return denied;
  const profile = await store.get(id);
  return profile ? json({ profile }) : notFound();
}

// PUT ?id= { version, ...fields }: save changes, but only if nobody else saved since `version`.
export async function PUT(request) {
  const { denied, id } = guard(request);
  if (denied) return denied;
  let body;
  try { body = await readJson(request); }
  catch (err) { return errorResponse(err.status || 400, "bad_request", err.message); }
  if (!Number.isInteger(body.version)) return errorResponse(400, "bad_request", "Missing profile version.");

  const current = await store.get(id);
  if (!current) return notFound();
  const result = await store.update(id, body.version, cleanProfile(body, current));
  if (result.status === "missing") return notFound();
  if (result.status === "conflict") {
    return json({ error: { type: "conflict", message: "A teammate changed this profile after you loaded it." }, current: result.current }, 409);
  }
  return json({ profile: result.doc });
}

// DELETE ?id=: remove a profile (the last one can't be deleted).
export async function DELETE(request) {
  const { denied, id } = guard(request);
  if (denied) return denied;
  if ((await store.list()).length <= 1) return errorResponse(400, "bad_request", "You can't delete the only profile.");
  await store.remove(id);
  return json({ ok: true });
}
