import { baseParams, claudeErrorResponse, clientFor, noKeyResponse } from "./_lib/claude.js";
import { checkAccess, errorResponse, json, readJson } from "./_lib/http.js";
import {
  ANALYZE_SCHEMA, ANALYZE_SYSTEM, analyzeUserMessage,
  RESOLVE_SCHEMA, RESOLVE_SYSTEM, resolveUserMessage
} from "./_lib/prompts.js";

const ACTIONS = {
  // { guidelines, draft, rewrite, rating, comment } -> { status, new_rules, conflicts, duplicate_of, message, updated_guidelines }
  analyze: {
    system: ANALYZE_SYSTEM,
    schema: ANALYZE_SCHEMA,
    validate: (b) => (String(b.comment || "").trim() ? null : "Write what should change first."),
    user: analyzeUserMessage
  },
  // { guidelines, newRules, decisions } -> { updated_guidelines, summary }
  resolve: {
    system: RESOLVE_SYSTEM,
    schema: RESOLVE_SCHEMA,
    validate: (b) => (Array.isArray(b.decisions) && b.decisions.length ? null : "Missing conflict decisions."),
    user: resolveUserMessage
  }
};

// POST { action: "analyze" | "resolve", ... }: turns feedback into guideline changes.
export async function POST(request) {
  const denied = checkAccess(request);
  if (denied) return denied;

  let body;
  try { body = await readJson(request); }
  catch (err) { return errorResponse(err.status || 400, "bad_request", err.message); }
  const action = ACTIONS[body.action];
  if (!action) return errorResponse(400, "bad_request", "Unknown action.");
  const problem = action.validate(body);
  if (problem) return errorResponse(400, "bad_request", problem);

  const client = clientFor(request);
  if (!client) return noKeyResponse();

  let message;
  try {
    message = await client.beta.messages.create({
      ...baseParams(),
      max_tokens: 16000,
      system: action.system,
      messages: [{ role: "user", content: action.user(body) }],
      output_config: { format: { type: "json_schema", schema: action.schema } }
    }, { signal: request.signal });
  } catch (err) {
    return claudeErrorResponse(err);
  }

  if (message.stop_reason === "refusal") return errorResponse(422, "refusal", "Claude declined to process this feedback. Try rewording it.");
  if (message.stop_reason === "max_tokens") return errorResponse(422, "max_tokens", "Claude's answer was cut off because it was too long. Try shorter feedback.");
  const text = message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  try {
    return json(JSON.parse(text));
  } catch {
    return errorResponse(502, "bad_output", "Claude's answer wasn't in the expected format. Try again.");
  }
}
