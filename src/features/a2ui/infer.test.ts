import { describe, expect, it } from "vitest";
import {
  INFER_MAX_DEPTH,
  INFER_MAX_ENTRIES,
  INFER_MAX_INPUT_BYTES,
  INFER_MAX_STRING_CHARS,
  inferA2uiFromJson,
  inferA2uiFromValue,
} from "./infer";
import { parseA2uiArtifactContent } from "./carrier-adapter";

type Msg = {
  createSurface?: { catalogId: string };
  updateComponents?: { components: Array<Record<string, unknown>> };
};

function components(content: string): Array<Record<string, unknown>> {
  const messages = content.split("\n").map((l) => JSON.parse(l) as Msg);
  return messages.find((m) => m.updateComponents)!.updateComponents!.components;
}

describe("inferA2uiFromValue", () => {
  it("renders a flat object of strings as a Card with one labelled row per field", () => {
    const result = inferA2uiFromValue({ city: "Oslo", temp: "4C" }, { title: "Weather" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(components(result.content)).toEqual([
      { id: "n0", component: "Text", text: "Weather", variant: "h5" },
      { id: "n2", component: "Text", text: "city", variant: "caption" },
      { id: "n3", component: "Text", text: "Oslo" },
      { id: "n1", component: "Row", children: ["n2", "n3"], justify: "spaceBetween" },
      { id: "n5", component: "Text", text: "temp", variant: "caption" },
      { id: "n6", component: "Text", text: "4C" },
      { id: "n4", component: "Row", children: ["n5", "n6"], justify: "spaceBetween" },
      { id: "n7", component: "Column", children: ["n0", "n1", "n4"] },
      { id: "root", component: "Card", child: "n7" },
    ]);
  });

  it("is deterministic and produces a carrier the surface accepts", () => {
    const input = { a: "1", b: { c: "2", d: ["x", "y"] }, e: null, f: 3, g: true };
    const first = inferA2uiFromValue(input);
    const second = inferA2uiFromValue(structuredClone(input));
    expect(first).toEqual(second);
    if (!first.ok) throw new Error("expected ok");
    expect(parseA2uiArtifactContent(first.content).ok).toBe(true);
  });

  it("uses only the nine catalog components and never emits bindings or actions", () => {
    const result = inferA2uiFromValue({ a: "x", b: { c: ["1", "2"] }, d: [{ e: "f" }] });
    if (!result.ok) throw new Error("expected ok");
    const nine = new Set([
      "Text",
      "Button",
      "TextField",
      "CheckBox",
      "ChoicePicker",
      "Row",
      "Column",
      "Card",
      "Divider",
    ]);
    for (const c of components(result.content)) {
      expect(nine.has(c.component as string)).toBe(true);
    }
    expect(result.content).not.toContain('"action"');
    expect(result.content).not.toContain('"path"');
    expect(result.content).not.toContain("call");
  });

  it("keeps agent text literal: markup, bindings and interpolation stay plain strings", () => {
    const hostile = "<script>alert(1)</script> ${/secret} {\"path\":\"/x\"}";
    const result = inferA2uiFromValue({ note: hostile });
    if (!result.ok) throw new Error("expected ok");
    const text = components(result.content).find((c) => c.text === hostile);
    expect(text).toBeDefined();
    expect(typeof text!.text).toBe("string");
  });

  it("renders nested objects and arrays of objects as headed columns", () => {
    const result = inferA2uiFromValue({ user: { name: "Ada" }, items: [{ id: "1" }, { id: "2" }] });
    if (!result.ok) throw new Error("expected ok");
    const headings = components(result.content)
      .filter((c) => c.variant === "h5")
      .map((c) => c.text);
    // Each object in an array is its own numbered group under "items".
    expect(headings).toEqual(["user", "items", "1", "2"]);
  });

  it("joins an array of scalars into one line and shows null as a dash", () => {
    const result = inferA2uiFromValue({ tags: ["a", "b", 3], none: null });
    if (!result.ok) throw new Error("expected ok");
    const texts = components(result.content).map((c) => c.text);
    expect(texts).toContain("a, b, 3");
    expect(texts).toContain("—");
  });

  it.each([
    ["a root array", [1, 2]],
    ["a root scalar", "text"],
    ["null", null],
    ["an empty object", {}],
  ])("refuses %s as unsupported", (_name, value) => {
    expect(inferA2uiFromValue(value)).toEqual({ ok: false, reason: "unsupported" });
  });

  it("refuses nesting deeper than the cap", () => {
    let value: Record<string, unknown> = { leaf: "x" };
    for (let i = 0; i < INFER_MAX_DEPTH + 1; i++) value = { next: value };
    expect(inferA2uiFromValue(value)).toEqual({ ok: false, reason: "too_deep" });
  });

  it("refuses more entries than the cap", () => {
    const wide = Object.fromEntries(
      Array.from({ length: INFER_MAX_ENTRIES + 1 }, (_, i) => [`k${i}`, "v"]),
    );
    expect(inferA2uiFromValue(wide)).toEqual({ ok: false, reason: "too_large" });
  });

  it("refuses a string over the cap and an input over the byte cap", () => {
    expect(inferA2uiFromValue({ a: "x".repeat(INFER_MAX_STRING_CHARS + 1) })).toEqual({
      ok: false,
      reason: "too_long",
    });
    const big = { a: "x".repeat(INFER_MAX_STRING_CHARS), b: "y".repeat(INFER_MAX_STRING_CHARS) };
    const bulky = Object.fromEntries(
      Array.from({ length: 20 }, (_, i) => [`k${i}`, big.a + big.b]),
    );
    expect(JSON.stringify(bulky).length).toBeGreaterThan(INFER_MAX_INPUT_BYTES);
    expect(inferA2uiFromValue(bulky).ok).toBe(false);
  });

  it("accepts a string exactly at the cap", () => {
    expect(inferA2uiFromValue({ a: "x".repeat(INFER_MAX_STRING_CHARS) }).ok).toBe(true);
  });
});

describe("inferA2uiFromJson", () => {
  it("parses a JSON string and refuses text that is not JSON", () => {
    expect(inferA2uiFromJson('{"a":"b"}').ok).toBe(true);
    expect(inferA2uiFromJson("not json")).toEqual({ ok: false, reason: "unsupported" });
  });
});
