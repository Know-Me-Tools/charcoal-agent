import { describe, expect, it } from "vitest";
import {
  A2UI_BASIC_CATALOG_ID,
  A2UI_MAX_CONTENT_BYTES,
  A2UI_MAX_MESSAGES,
  PASSIVE_A2UI_COMPONENTS,
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

describe("parseA2uiArtifactContent with allowedComponents (public site)", () => {
  const passive = { allowedComponents: PASSIVE_A2UI_COMPONENTS };
  const update = (components: unknown[]) =>
    [
      create(UAR_A2UI_CATALOG_ID),
      JSON.stringify({ version: "v0.9.1", updateComponents: { surfaceId: "s", components } }),
    ].join("\n");

  it("allows only layout and text", () => {
    expect([...PASSIVE_A2UI_COMPONENTS].sort()).toEqual(["Card", "Column", "Divider", "Row", "Text"]);
  });

  it("accepts the answer-card shape and inferred Row layouts", () => {
    const card = update([
      { id: "root", component: "Card", child: "body" },
      { id: "body", component: "Column", children: ["t", "r", "d"] },
      { id: "t", component: "Text", variant: "h3", text: { path: "/title" } },
      { id: "r", component: "Row", children: ["a"] },
      { id: "a", component: "Text", text: "x" },
      { id: "d", component: "Divider" },
    ]);
    expect(parseA2uiArtifactContent(card, passive).ok).toBe(true);
  });

  it.each([
    "Button",
    "TextField",
    "CheckBox",
    "ChoicePicker",
    "DateTimeInput",
    "Slider",
    "Image",
    "Video",
    "AudioPlayer",
    "Icon",
    "List",
    "Modal",
    "Tabs",
    "card",
    "Unknown",
  ])("rejects a %s component", (component) => {
    const content = update([{ id: "root", component: "Card", child: "x" }, { id: "x", component }]);
    expect(parseA2uiArtifactContent(content, passive)).toEqual({ ok: false, reason: "component" });
  });

  it("rejects an action or a function call anywhere in a component update", () => {
    for (const components of [
      [{ id: "root", component: "Text", text: "x", action: { event: { name: "go" } } }],
      [{ id: "root", component: "Text", text: { call: "openUrl", args: { url: "https://evil.example" } } }],
      [{ id: "root", component: "Card", child: "c", x: [{ deep: { action: 1 } }] }, { id: "c", component: "Text", text: "y" }],
    ]) {
      expect(parseA2uiArtifactContent(update(components), passive)).toEqual({
        ok: false,
        reason: "component",
      });
    }
  });

  it("rejects an updateComponents with no component list or a component with no name", () => {
    for (const body of [
      { surfaceId: "s" },
      { surfaceId: "s", components: [{ id: "r" }] },
      { surfaceId: "s", components: [{ id: "r", component: 7 }] },
      { surfaceId: "s", components: ["Card"] },
    ]) {
      const content = [create(UAR_A2UI_CATALOG_ID), JSON.stringify({ version: "v0.9.1", updateComponents: body })].join("\n");
      expect(parseA2uiArtifactContent(content, passive)).toEqual({ ok: false, reason: "component" });
    }
  });

  it("does not restrict data-model values, and leaves the unrestricted parse unchanged", () => {
    const withData = [
      update([{ id: "root", component: "Text", text: { path: "/a" } }]),
      JSON.stringify({ version: "v0.9.1", updateDataModel: { surfaceId: "s", path: "/", value: { action: "plain data" } } }),
    ].join("\n");
    expect(parseA2uiArtifactContent(withData, passive).ok).toBe(true);

    const button = update([{ id: "root", component: "Button", child: "x" }, { id: "x", component: "Text", text: "Go" }]);
    expect(parseA2uiArtifactContent(button).ok).toBe(true);
  });
});
