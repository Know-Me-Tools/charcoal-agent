import { describe, expect, it } from "vitest";
import { isAllowedReplyImage, isAllowedReplyLink } from "./reply-content-policy";

describe("isAllowedReplyLink relative links", () => {
  it("keeps root paths and anchors", () => {
    expect(isAllowedReplyLink("/pricing")).toBe(true);
    expect(isAllowedReplyLink("#fn-1")).toBe(true);
  });

  it("does not treat a bare word as a link", () => {
    expect(isAllowedReplyLink("evil.example")).toBe(false);
    expect(isAllowedReplyLink("path/to/page")).toBe(false);
  });

  it("rejects the bare-word payload from [https://bank.example](evil.example)", () => {
    expect(isAllowedReplyLink("evil.example")).toBe(false);
  });

  it("still rejects protocol-relative and backslash hosts", () => {
    expect(isAllowedReplyLink("//evil.example/x")).toBe(false);
    expect(isAllowedReplyLink("/\\evil.example/x")).toBe(false);
  });
});

describe("isAllowedReplyImage", () => {
  it("allows exactly the own host and same-origin paths", () => {
    expect(isAllowedReplyImage("https://know-me.tools/a.png")).toBe(true);
    expect(isAllowedReplyImage("/a.png")).toBe(true);
  });

  it("rejects subdomains, which the CSP img-src 'self' does not cover", () => {
    expect(isAllowedReplyImage("https://cdn.know-me.tools/a.png")).toBe(false);
  });

  it("rejects other hosts and lookalikes", () => {
    expect(isAllowedReplyImage("https://evil.example/a.png")).toBe(false);
    expect(isAllowedReplyImage("https://know-me.tools.evil.example/a.png")).toBe(false);
  });
});
