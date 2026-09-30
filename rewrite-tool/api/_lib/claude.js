import Anthropic from "@anthropic-ai/sdk";
import { MODEL } from "./prompts.js";
import { errorResponse } from "./http.js";

// Server-side fallback: if Claude Opus 5's safety classifiers decline a request, the API retries it on another model.
const FALLBACK_BETA = "server-side-fallback-2026-07-01";

export const hasServerKey = () => !!process.env.ANTHROPIC_API_KEY;

// Uses the server's key when one is configured. Otherwise a key typed into the page (x-anthropic-key) is used
// for this one request only and never stored.
export function clientFor(request) {
  const apiKey = process.env.ANTHROPIC_API_KEY || request.headers.get("x-anthropic-key") || "";
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export function baseParams() {
  return { model: MODEL, betas: [FALLBACK_BETA], fallbacks: "default" };
}

export function noKeyResponse() {
  return errorResponse(400, "no_api_key", "No Claude API key is configured. Set ANTHROPIC_API_KEY on the server, or paste a key into the page.");
}

// Maps SDK errors to HTTP responses the page understands. Most specific first.
export function claudeErrorResponse(err) {
  if (err instanceof Anthropic.APIUserAbortError) return errorResponse(499, "aborted", "Request was cancelled.");
  if (err instanceof Anthropic.AuthenticationError) {
    return errorResponse(401, "authentication_error", hasServerKey()
      ? "The server's Claude API key wasn't accepted. Ask whoever set up the deployment to check ANTHROPIC_API_KEY."
      : "That API key wasn't accepted. Check that you copied the whole key, and that it hasn't been revoked.");
  }
  if (err instanceof Anthropic.RateLimitError) return errorResponse(429, "rate_limit_error", "You've hit a rate limit or the credit balance is too low. Wait a moment and try again.");
  if (err instanceof Anthropic.APIConnectionError) return errorResponse(502, "connection_error", "The server couldn't reach the Claude API. Try again in a moment.");
  if (err instanceof Anthropic.APIError) {
    const status = err.status && err.status >= 400 ? err.status : 502;
    return errorResponse(status, err.error?.error?.type || "api_error", err.error?.error?.message || err.message);
  }
  if (err?.status) return errorResponse(err.status, "bad_request", err.message);
  console.error(err);
  return errorResponse(500, "server_error", "Something went wrong on the server.");
}
