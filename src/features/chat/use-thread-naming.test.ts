import { afterEach, describe, expect, it, vi } from "vitest";
import { generateThreadTitle } from "./use-thread-naming";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("generateThreadTitle streaming fallback", () => {
  it("collects title text once from agui.message.delta, not again from the duplicate dual-mode chunk", async () => {
    // The site server now always forwards `stream: true, stream_mode: "dual"`
    // upstream regardless of what this call sends (site-proxy-hardening task
    // 1.6), so this request's `stream: false` is ignored: UAR's response
    // carries every delta twice, once as `agui.message.delta` and once as an
    // OpenAI-style `event: message` chunk with the same text. Collecting
    // from both doubled every generated title before this fix.
    const sse = [
      `event: agui.message.delta\ndata: ${JSON.stringify({ delta: { text: "Weekly " } })}\n\n`,
      `event: message\ndata: ${JSON.stringify({ choices: [{ delta: { content: "Weekly " } }] })}\n\n`,
      `event: agui.message.delta\ndata: ${JSON.stringify({ delta: { text: "plan" } })}\n\n`,
      `event: message\ndata: ${JSON.stringify({ choices: [{ delta: { content: "plan" } }] })}\n\n`,
      "event: message\ndata: [DONE]\n\n",
    ].join("");

    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(sse, { status: 200, headers: { "content-type": "text/event-stream" } }),
    );

    const title = await generateThreadTitle(
      "What does my week look like?",
      "Here is your plan for the week.",
    );

    expect(title).toBe("Weekly plan");
  });

  it("falls back to 'New conversation' when the stream never carries any agui.message.delta text", async () => {
    const sse = "event: message\ndata: [DONE]\n\n";
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(sse, { status: 200, headers: { "content-type": "text/event-stream" } }),
    );

    const title = await generateThreadTitle("Hi", "Hello");

    expect(title).toBe("New conversation");
  });
});
