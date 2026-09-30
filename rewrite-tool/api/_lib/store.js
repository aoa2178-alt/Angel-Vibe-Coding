// Voice-profile storage. Upstash Redis (via the Vercel Marketplace) when its credentials are present,
// a local JSON file during development. Every write is a compare-and-set on the profile's version,
// so two teammates editing the same profile can't silently overwrite each other.
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { SEED_PROFILES } from "./seed.js";

const LIMITS = { name: 80, guidelines: 50_000, examples: 100_000, history: 200, undo: 30 };

const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const storageKind = redisUrl && redisToken ? "redis" : process.env.VERCEL ? "none" : "file";

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

// ---------- Upstash Redis (REST) ----------
const PROFILES = "draft-rewriter:profiles";
const VERSIONS = "draft-rewriter:versions";
const SEEDED = "draft-rewriter:seeded";

async function redis(...command) {
  const res = await fetch(redisUrl, {
    method: "POST",
    headers: { authorization: `Bearer ${redisToken}`, "content-type": "application/json" },
    body: JSON.stringify(command)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(`Storage error: ${data.error || res.status}`);
  return data.result;
}

// Returns the new version, -1 if the stored version differs from the expected one, -2 if the profile is gone.
const CAS_SCRIPT = `
local v = tonumber(redis.call('HGET', KEYS[2], ARGV[1]) or '-2')
if v == -2 then return -2 end
if v ~= tonumber(ARGV[2]) then return -1 end
redis.call('HSET', KEYS[1], ARGV[1], ARGV[3])
redis.call('HSET', KEYS[2], ARGV[1], tostring(v + 1))
return v + 1`;

const redisStore = {
  async list() {
    const flat = (await redis("HGETALL", PROFILES)) || [];
    const out = [];
    for (let i = 0; i < flat.length; i += 2) out.push(JSON.parse(flat[i + 1]));
    return out;
  },
  async get(id) {
    const raw = await redis("HGET", PROFILES, id);
    return raw ? JSON.parse(raw) : null;
  },
  async create(doc) {
    const created = { ...doc, version: 1 };
    await redis("HSET", PROFILES, doc.id, JSON.stringify(created));
    await redis("HSET", VERSIONS, doc.id, "1");
    return created;
  },
  async update(id, expected, doc) {
    const next = { ...doc, id, version: expected + 1 };
    const result = await redis("EVAL", CAS_SCRIPT, "2", PROFILES, VERSIONS, id, String(expected), JSON.stringify(next));
    if (result === -2) return { status: "missing" };
    if (result === -1) return { status: "conflict", current: await this.get(id) };
    return { status: "ok", doc: next };
  },
  async remove(id) {
    await redis("HDEL", PROFILES, id);
    await redis("HDEL", VERSIONS, id);
  },
  async seedOnce() {
    if ((await redis("SET", SEEDED, "1", "NX")) !== "OK") return;
    for (const p of SEED_PROFILES) await this.create(cleanProfile(p, { id: p.id }));
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
  async list() { return Object.values((await readFileData())?.profiles || {}); },
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

export const store = storageKind === "redis" ? redisStore : storageKind === "file" ? fileStore : null;

export const newId = () => randomUUID();
