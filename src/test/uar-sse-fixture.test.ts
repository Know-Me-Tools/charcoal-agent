/**
 * Guards the e2e SSE fixture: it must parse with the same framing the chat
 * client uses (blank-line blocks, `event:`/`data:` lines) and contain every
 * AG-UI event the UI renders.
 */
import { describe, expect, it } from "vitest";
import {
  EXPECTED_EVENT_NAMES,
  FIXTURE_FINAL_TEXT,
  toSseBody,
} from "../../e2e/fixtures/sse";

function parseBlocks(body: string): Array<{ event: string; data: unknown }> {
  return body
    .split("\n\n")
    .filter((raw) => raw.trim())
    .map((raw) => {
      let event = "message";
      let data = "";
      for (const line of raw.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data = line.slice(5).trim();
      }
      return { event, data: JSON.parse(data) as unknown };
    });
}

describe("UAR SSE fixture", () => {
  const blocks = parseBlocks(toSseBody());

  it("parses every block as JSON with the client's framing", () => {
    expect(blocks.length).toBeGreaterThan(EXPECTED_EVENT_NAMES.length);
  });

  it("contains every rendered AG-UI event type", () => {
    const names = new Set(blocks.map((b) => b.event));
    for (const name of EXPECTED_EVENT_NAMES) expect(names).toContain(name);
  });

  it("starts with stream.start, ends with done, and streams the final text", () => {
    expect(blocks[0].event).toBe("agui.stream.start");
    expect(blocks.at(-1)?.event).toBe("agui.done");
    const text = blocks
      .filter((b) => b.event === "agui.message.delta")
      .map((b) => (b.data as { delta: { text: string } }).delta.text)
      .join("");
    expect(text.endsWith(FIXTURE_FINAL_TEXT)).toBe(true);
  });
});
