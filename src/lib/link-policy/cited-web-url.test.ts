import { describe, expect, it } from "vitest";
import { isCitedWebUrl, normalizeHttpsUrl, splitUrls, toCitedUrlSet } from "./cited-web-url";

const CITED = toCitedUrlSet(["https://example.org/rust", "https://docs.example.net/a?b=1", undefined, "http://x.example/"]);

describe("normalizeHttpsUrl", () => {
  it("accepts a plain https URL and normalizes it", () => {
    expect(normalizeHttpsUrl("https://Example.org")).toBe("https://example.org/");
  });
  it.each(["http://example.org/", "javascript:alert(1)", "data:text/html,x", "https://u:p@example.org/", "not a url", ""])(
    "rejects %s",
    (url) => expect(normalizeHttpsUrl(url)).toBeNull(),
  );
});

describe("isCitedWebUrl", () => {
  it("is true only for a URL in the cited set", () => {
    expect(isCitedWebUrl("https://example.org/rust", CITED)).toBe(true);
    expect(isCitedWebUrl("https://docs.example.net/a?b=1", CITED)).toBe(true);
    expect(isCitedWebUrl("https://evil.example/rust", CITED)).toBe(false);
  });
  it("does not match a lookalike, a suffix, or another scheme", () => {
    expect(isCitedWebUrl("https://example.org.evil.example/rust", CITED)).toBe(false);
    expect(isCitedWebUrl("https://example.org/rust/extra", CITED)).toBe(false);
    expect(isCitedWebUrl("http://example.org/rust", CITED)).toBe(false);
    expect(isCitedWebUrl("https://user@example.org/rust", CITED)).toBe(false);
  });
  it("is false for an empty set", () => {
    expect(isCitedWebUrl("https://example.org/rust", new Set())).toBe(false);
  });
  it("leaves out a cited URL that is not https", () => {
    expect(CITED.size).toBe(2);
  });
});

describe("splitUrls", () => {
  it("separates URLs from text and keeps sentence punctuation outside", () => {
    expect(splitUrls("See https://example.org/rust, then https://docs.example.net/a?b=1.")).toEqual([
      { kind: "text", value: "See " },
      { kind: "url", value: "https://example.org/rust" },
      { kind: "text", value: ", then " },
      { kind: "url", value: "https://docs.example.net/a?b=1" },
      { kind: "text", value: "." },
    ]);
  });
  it("returns plain text as one piece and ignores http", () => {
    expect(splitUrls("nothing http://x.example here")).toEqual([{ kind: "text", value: "nothing http://x.example here" }]);
  });
});
