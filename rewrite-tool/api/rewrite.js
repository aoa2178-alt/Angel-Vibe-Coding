import { baseParams, claudeErrorResponse, clientFor, noKeyResponse } from "./_lib/claude.js";
import { checkAccess, errorResponse, readJson } from "./_lib/http.js";
import { REWRITE_SCHEMA, REWRITE_SYSTEM, rewriteUserMessage } from "./_lib/prompts.js";

// POST { guidelines, examples, draft }: streams the Messages API events back to the page as server-sent events.
export async function POST(request) {
  const denied = checkAccess(request);
  if (denied) return denied;

  let body;
  try { body = await readJson(request); }
  catch (err) { return errorResponse(err.status || 400, "bad_request", err.message); }
  if (!String(body.draft || "").trim()) return errorResponse(400, "bad_request", "Paste a draft to rewrite first.");

  const client = clientFor(request);
  if (!client) return noKeyResponse();

  let stream;
  try {
    // Awaiting create() surfaces auth, rate-limit and validation errors before any bytes are sent.
    stream = await client.beta.messages.create({
      ...baseParams(),
      max_tokens: 64000,
      stream: true,
      system: REWRITE_SYSTEM,
      messages: [{ role: "user", content: rewriteUserMessage(body) }],
      output_config: { format: { type: "json_schema", schema: REWRITE_SCHEMA } }
    }, { signal: request.signal });
  } catch (err) {
    return claudeErrorResponse(err);
  }

  const encoder = new TextEncoder();
  const sse = (event) => encoder.encode(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) controller.enqueue(sse(event));
      } catch (err) {
        if (!request.signal?.aborted) {
          controller.enqueue(sse({ type: "error", error: { type: "stream_error", message: err.message || "The stream was interrupted." } }));
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.controller.abort();
    }
  });

  return new Response(readable, {
    headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" }
  });
}
