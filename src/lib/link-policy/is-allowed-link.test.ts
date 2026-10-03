import { describe, expect, it, vi } from "vitest";

vi.mock("./corpus-urls", () => ({
  CORPUS_URLS: new Set(["https://github.com/Prometheus-AGS/the-boss/releases"]),
}));
vi.mock("./allowed-hosts", () => ({
  ALLOWED_HOSTS: new Set(["know-me.tools"]),
}));

const { isAllowedLink } = await import("./is-allowed-link");

describe("isAllowedLink", () => {
  it("allows an exact corpus URL string match", () => {
    expect(isAllowedLink("https://github.com/Prometheus-AGS/the-boss/releases")).toBe(true);
  });

  it("allows an exact host match on the site-owned allowlist", () => {
    expect(isAllowedLink("https://know-me.tools/pricing")).toBe(true);
  });

  it("rejects a URL that is neither a corpus match nor an allowlisted host", () => {
    expect(isAllowedLink("https://evil.example/x")).toBe(false);
  });

  it("rejects a lookalike host that merely contains the allowlisted host as a suffix", () => {
    expect(isAllowedLink("https://know-me.tools.evil.example")).toBe(false);
  });

  it("rejects a lookalike host that embeds the allowlisted host in the path, not the host", () => {
    expect(isAllowedLink("https://evil.example/know-me.tools")).toBe(false);
  });

  it("rejects http:, even for an otherwise-allowlisted host", () => {
    expect(isAllowedLink("http://know-me.tools/pricing")).toBe(false);
  });

  it("rejects javascript: URLs", () => {
    expect(isAllowedLink("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: URLs", () => {
    expect(isAllowedLink("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejects a URL carrying userinfo", () => {
    expect(isAllowedLink("https://user:pass@know-me.tools/")).toBe(false);
  });

  it("rejects a punycode-encoded IDN lookalike host", () => {
    // Cyrillic "о" (U+043E) in place of the Latin "o" in "know" — the host
    // punycode-encodes to "xn--..." and so cannot exactly equal the ASCII
    // allowlist entry.
    expect(isAllowedLink("https://knоw-me.tools")).toBe(false);
  });

  it("rejects malformed input", () => {
    expect(isAllowedLink("not a url")).toBe(false);
    expect(isAllowedLink("")).toBe(false);
  });
});
