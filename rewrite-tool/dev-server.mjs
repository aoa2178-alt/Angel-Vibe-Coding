// Local stand-in for Vercel: serves public/ and runs the api/*.js web handlers, streaming included.
// Usage: npm run dev   (reads .env.local if present)
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname);
const publicDir = join(root, "public");
const port = Number(process.env.PORT) || 5175;
if (existsSync(join(root, ".env.local"))) process.loadEnvFile(join(root, ".env.local"));

const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon" };

async function handleApi(req, res, name) {
  if (!/^[a-z-]+$/.test(name) || !existsSync(join(root, "api", `${name}.js`))) {
    res.writeHead(404, { "content-type": "application/json" }).end('{"error":{"type":"not_found","message":"No such endpoint."}}');
    return;
  }
  const mod = await import(pathToFileURL(join(root, "api", `${name}.js`)).href);
  const handler = mod[req.method];
  if (!handler) {
    res.writeHead(405).end();
    return;
  }

  const abort = new AbortController();
  res.on("close", () => { if (!res.writableFinished) abort.abort(); });

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const request = new Request(`http://localhost:${port}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : Buffer.concat(chunks),
    signal: abort.signal
  });

  const response = await handler(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  if (!response.body) { res.end(); return; }
  const reader = response.body.getReader();
  abort.signal.addEventListener("abort", () => reader.cancel().catch(() => {}));
  try {
    for (let r = await reader.read(); !r.done; r = await reader.read()) res.write(r.value);
  } finally {
    res.end();
  }
}

async function handleStatic(req, res, path) {
  const file = normalize(join(publicDir, path === "/" ? "index.html" : path));
  if (!file.startsWith(publicDir)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream", "cache-control": "no-store" }).end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  try {
    if (path.startsWith("/api/")) await handleApi(req, res, path.slice(5));
    else await handleStatic(req, res, path);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.writeHead(500, { "content-type": "application/json" });
    res.end('{"error":{"type":"server_error","message":"Something went wrong on the server."}}');
  }
}).listen(port, () => console.log(`Draft Rewriter on http://localhost:${port}`));
