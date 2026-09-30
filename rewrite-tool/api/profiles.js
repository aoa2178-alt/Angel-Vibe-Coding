import { checkAccess, errorResponse, json, readJson } from "./_lib/http.js";
import { byCreation, cleanProfile, newId, store, summary } from "./_lib/store.js";

const noStorage = () => errorResponse(503, "not_configured", "No storage is connected. Add a private Vercel Blob store to the project (Storage → Create → Blob, then connect it to this project) and redeploy.");

// GET: list voice profiles (creates the starter profiles the first time).
export async function GET(request) {
  const denied = checkAccess(request);
  if (denied) return denied;
  if (!store) return noStorage();
  await store.seedOnce();
  const profiles = (await store.list()).map(summary).sort(byCreation);
  return json({ profiles });
}

// POST { name, guidelines?, examples? }: create a profile.
export async function POST(request) {
  const denied = checkAccess(request);
  if (denied) return denied;
  if (!store) return noStorage();
  let body;
  try { body = await readJson(request); }
  catch (err) { return errorResponse(err.status || 400, "bad_request", err.message); }
  if (!String(body.name || "").trim()) return errorResponse(400, "bad_request", "Give the profile a name.");
  const profile = await store.create(cleanProfile({ ...body, history: [], undo: [] }, { id: newId() }));
  return json({ profile }, 201);
}
