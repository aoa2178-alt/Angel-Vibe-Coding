// The /api/ask server function: request checks, the request sent to Claude, and its guards.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST, buildRequest, readBody } from "../api/ask.js";

// A Messages API reply as the SDK expects it.
const reply = (content, extra = {}) =>
  new Response(JSON.stringify({ id: "msg_1", type: "message", role: "assistant", model: "claude-haiku-5-5", content, stop_reason: "end_turn", usage: { input_tokens: 1, output_tokens: 1 }, ...extra }), {
    headers: { "content-type": "application/json" },
  });

const ask = (body, headers = {}) =>
  POST(
    new Request("https://breakeven-silk.vercel.app/api/ask", {
      method: "POST",
      headers: { origin: "https://breakeven-silk.vercel.app", "x-forwarded-for": "203.0.113.9", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

describe("readBody", () => {
  it("trims and caps the question, context and history", () => {
    const b = readBody({ question: "  Why rent?  ", context: "x".repeat(5000), history: Array(6).fill({ q: "q", a: "a" }) });
    expect(b.question).toBe("Why rent?");
    expect(b.context).toHaveLength(1500);
    expect(b.history).toHaveLength(3);
  });

  it("rejects an empty or missing question", () => {
    expect(readBody({ question: "   " })).toBeNull();
    expect(readBody({})).toBeNull();
    expect(readBody(null)).toBeNull();
  });
});

describe("buildRequest", () => {
  it("sends the scenario with the first question only", () => {
    const r = buildRequest({ question: "And at 30B?", context: "Volume: 2B", history: [{ q: "Why rent?", a: "Because…" }] });
    expect(r.messages.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
    expect(r.messages[0].content).toContain("<scenario>\nVolume: 2B");
    expect(r.messages[2].content).toBe("And at 30B?");
    expect(r.model).toBe("claude-haiku-5-5");
    // Thinking off, so a short answer is never crowded out by thinking.
    expect(r.thinking).toEqual({ type: "disabled" });
    expect(r.max_tokens).toBeGreaterThanOrEqual(1024);
    expect(r.system).toContain("Reference: what Breakeven does");
  });
});

describe("POST /api/ask", () => {
  beforeEach(() => vi.stubEnv("ANTHROPIC_API_KEY", "test-key"));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("refuses other websites", async () => {
    expect((await ask({ question: "Hi" }, { origin: "https://example.com" })).status).toBe(403);
  });

  it("says unavailable when no key is set", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect((await ask({ question: "Hi" })).status).toBe(503);
  });

  it("rejects bad requests", async () => {
    expect((await ask("not json")).status).toBe(400);
    expect((await ask({ question: "x".repeat(9000) })).status).toBe(413);
  });

  it("returns Claude's answer, sending the key only to Anthropic", async () => {
    const fetch = vi.fn(async () => reply([{ type: "text", text: "Renting wins at 2B." }]));
    vi.stubGlobal("fetch", fetch);
    const res = await ask({ question: "Why rent?", context: "Volume: 2B" }, { "x-forwarded-for": "203.0.113.10" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ answer: "Renting wins at 2B." });
    const [url, init] = fetch.mock.calls[0];
    expect(String(url)).toBe("https://api.anthropic.com/v1/messages");
    expect(new Headers(init.headers).get("x-api-key")).toBe("test-key");
  });

  it("limits each visitor to 20 questions a day", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply([{ type: "text", text: "ok" }])));
    const ip = { "x-forwarded-for": "203.0.113.11" };
    for (let i = 0; i < 20; i++) expect((await ask({ question: "Q" }, ip)).status).toBe(200);
    expect((await ask({ question: "Q" }, ip)).status).toBe(429);
  });

  it("reports a reply with no answer text, or a declined one, as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply([{ type: "thinking", thinking: "", signature: "s" }], { stop_reason: "max_tokens" })));
    expect((await ask({ question: "Q" }, { "x-forwarded-for": "203.0.113.13" })).status).toBe(502);
    vi.stubGlobal("fetch", vi.fn(async () => reply([], { stop_reason: "refusal" })));
    expect((await ask({ question: "Q" }, { "x-forwarded-for": "203.0.113.14" })).status).toBe(502);
  });

  it("reports an Anthropic error as unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ type: "error", error: { type: "invalid_request_error", message: "bad" } }), { status: 400, headers: { "content-type": "application/json" } })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await ask({ question: "Q" }, { "x-forwarded-for": "203.0.113.12" })).status).toBe(502);
  });
});
