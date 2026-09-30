// Voice-profile storage. Vercel Blob (a private store connected to the project) on Vercel,
// a local JSON file during development. Every write checks the profile's version first,
// so two teammates editing the same profile can't silently overwrite each other.
//
// Blob's Hobby plan includes 2,000 writes a month, so this store avoids unnecessary writes:
// profiles are listed from one small index file instead of Blob's (billed) list operation,
// and the index is only rewritten when a profile is created, renamed or deleted.
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { BlobPreconditionFailedError, del, get, put } from "@vercel/blob";
import { SEED_PROFILES } from "./seed.js";

const LIMITS = { name: 80, guidelines: 50_000, examples: 100_000, history: 200, undo: 30 };

const blobConfigured = !!(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);
export const storageKind = blobConfigured ? "blob" : process.env.VERCEL ? "none" : "file";

// Keeps only known fields, trimmed to sane sizes.
export function cleanProfile(input, base = {}) {
  const pick = (k, fallback) => (input[k] !== undefined ? input[k] : base[k] !== undefined ? base[k] : fallback);
  return {
    id: base.id || input.id,
    name: String(pick("name", "Untitled")).trim().slice(0, LIMITS.name) || "Untitled",
    guidelines: String(pick("guidelines", "")).slice(0, LIMITS.guidelines),
    examples: String(pick("examples", "")).slice(0, LIMITS.examples),
    history: (Array.isArray(pick("history", [])) ? pick("history", []) : []).slice(0, LIMITS.history),
    undo: (Array.isArray(pick("undo", [])) ? pick("undo", []) : []).map(String).slice(-LIMITS.undo),
    version: base.version || 0,
    createdAt: base.createdAt || input.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export const summary = (p) => ({ id: p.id, name: p.name, createdAt: p.createdAt || p.updatedAt, updatedAt: p.updatedAt });
export const byCreation = (a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name);

// ---------- Vercel Blob (private store) ----------
const INDEX = "profiles/index.json";
const profilePath = (id) => `profiles/${id}.json`;

// Reads bypass the CDN cache so everyone always sees the latest save.
async function readJson(pathname) {
  const res = await get(pathname, { access: "private", useCache: false });
  if (!res || res.statusCode !== 200) return null;
  // Compressed reads report a weak ETag (W/"…"); conditional writes need the plain value.
  return { data: JSON.parse(await new Response(res.stream).text()), etag: res.blob.etag.replace(/^W\//, "") };
}

function writeJson(pathname, data, options = {}) {
  return put(pathname, JSON.stringify(data), {
    access: "private",
    contentType: "application/json",
    cacheControlMaxAge: 60,
    ...options
  });
}

// Applies a change to the index, retrying if another request changed it at the same moment.
async function updateIndex(change) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await readJson(INDEX);
    const next = change(current?.data || []);
    try {
      await writeJson(INDEX, next, current ? { allowOverwrite: true, ifMatch: current.etag } : {});
      return;
    } catch (err) {
      if (!(err instanceof BlobPreconditionFailedError) && !/already exists/i.test(err?.message || "")) throw err;
    }
  }
  throw new Error("Couldn't update the profile list. Try again.");
}

const blobStore = {
  async list() { return (await readJson(INDEX))?.data || []; },
  async get(id) { return (await readJson(profilePath(id)))?.data || null; },
  async create(doc, { skipIndex = false } = {}) {
    const created = { ...doc, version: 1 };
    await writeJson(profilePath(doc.id), created);
    if (!skipIndex) await updateIndex((list) => [...list.filter((p) => p.id !== doc.id), summary(created)]);
    return created;
  },
  async update(id, expected, doc) {
    const current = await readJson(profilePath(id));
    if (!current) return { status: "missing" };
    if (current.data.version !== expected) return { status: "conflict", current: current.data };
    const next = { ...doc, id, version: expected + 1 };
    try {
      await writeJson(profilePath(id), next, { allowOverwrite: true, ifMatch: current.etag });
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError) return { status: "conflict", current: await this.get(id) };
      throw err;
    }
    // The index only holds names, so it's rewritten only when the name changes.
    if (next.name !== current.data.name) {
      await updateIndex((list) => list.map((p) => (p.id === id ? summary(next) : p)));
    }
    return { status: "ok", doc: next };
  },
  async remove(id) {
    await updateIndex((list) => list.filter((p) => p.id !== id));
    await del(profilePath(id));
  },
  async seedOnce() {
    if (await readJson(INDEX)) return;
    const created = [];
    for (const p of SEED_PROFILES) {
      try { created.push(await this.create(cleanProfile(p, { id: p.id }), { skipIndex: true })); }
      catch (err) { if (!/already exists/i.test(err?.message || "")) throw err; }
    }
    try { await writeJson(INDEX, created.map(summary)); }
    catch (err) { if (!/already exists/i.test(err?.message || "")) throw err; }
  }
};

// ---------- Local JSON file (development only) ----------
const DATA_FILE = new URL("../../data/profiles.json", import.meta.url);

async function readFileData() {
  try { return JSON.parse(await readFile(DATA_FILE, "utf8")); }
  catch { return null; }
}
async function writeFileData(data) {
  await mkdir(new URL(".", DATA_FILE), { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

const fileStore = {
  async list() { return Object.values((await readFileData())?.profiles || {}).map(summary); },
  async get(id) { return (await readFileData())?.profiles?.[id] || null; },
  async create(doc) {
    const data = (await readFileData()) || { profiles: {} };
    const created = { ...doc, version: 1 };
    data.profiles[doc.id] = created;
    await writeFileData(data);
    return created;
  },
  async update(id, expected, doc) {
    const data = (await readFileData()) || { profiles: {} };
    const cur = data.profiles[id];
    if (!cur) return { status: "missing" };
    if (cur.version !== expected) return { status: "conflict", current: cur };
    const next = { ...doc, id, version: expected + 1 };
    data.profiles[id] = next;
    await writeFileData(data);
    return { status: "ok", doc: next };
  },
  async remove(id) {
    const data = (await readFileData()) || { profiles: {} };
    delete data.profiles[id];
    await writeFileData(data);
  },
  async seedOnce() {
    if (await readFileData()) return;
    await writeFileData({ profiles: {} });
    for (const p of SEED_PROFILES) await this.create(cleanProfile(p, { id: p.id }));
  }
};

export const store = storageKind === "blob" ? blobStore : storageKind === "file" ? fileStore : null;

export const newId = () => randomUUID();
