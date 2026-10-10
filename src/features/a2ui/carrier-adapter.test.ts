import { describe, expect, it } from "vitest";
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_MAX_CONTENT_BYTES,
  A2UI_MAX_MESSAGES,
  UAR_A2UI_CATALOG_ID,
  parseA2uiArtifactContent,
} from "./carrier-adapter";

const create = (catalogId: string, extra: Record<string, unknown> = {}) =>
  JSON.stringify({ version: "v0.9.1", createSurface: { surfaceId: "s", catalogId }, ...extra });

describe("parseA2uiArtifactContent", () => {
  it("parses NDJSON into messages", () => {
    const content = [
      create(A2UI_BASIC_CATALOG_ID),
      JSON.stringify({ version: "v0.9.1", updateDataModel: { surfaceId: "s", path: "/m", value: "x" } }),
    ].join("\n");
    const result = parseA2uiArtifactContent(content);
    expect(result.ok && result.messages).toHaveLength(2);
  });

  it("drops profile and normalises v0.9 to v0.9.1", () => {
    const line = JSON.stringify({
      version: "v0.9",
      profile: "uar.a2ui/1",
      createSurface: { surfaceId: "s", catalogId: UAR_A2UI_CATALOG_ID },
    });
    const result = parseA2uiArtifactContent(line);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.messages[0]).not.toHaveProperty("profile");
      expect(result.messages[0]?.version).toBe("v0.9.1");
    }
  });

  it.each([
    ["empty", ""],
    ["whitespace only", "  \n \n"],
  ])("rejects %s content", (_name, content) => {
    expect(parseA2uiArtifactContent(content)).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects a line that is not JSON", () => {
    expect(parseA2uiArtifactContent("{not json")).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects a line that is not an object", () => {
    expect(parseA2uiArtifactContent("[1,2]")).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects an unknown protocol version", () => {
    const line = JSON.stringify({ version: "v1.0", createSurface: {} });
    expect(parseA2uiArtifactContent(line)).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects a catalog id this client did not register", () => {
    expect(parseA2uiArtifactContent(create("https://evil.example/catalog.json"))).toEqual({
      ok: false,
      reason: "catalog",
    });
  });

  it("rejects oversized content", () => {
    const content = "x".repeat(A2UI_MAX_CONTENT_BYTES + 1);
    expect(parseA2uiArtifactContent(content)).toEqual({ ok: false, reason: "too_large" });
  });

  it("rejects too many messages", () => {
    const line = JSON.stringify({ version: "v0.9.1", deleteSurface: { surfaceId: "s" } });
    const content = Array.from({ length: A2UI_MAX_MESSAGES + 1 }, () => line).join("\n");
    expect(parseA2uiArtifactContent(content)).toEqual({ ok: false, reason: "too_many_messages" });
  });
});
