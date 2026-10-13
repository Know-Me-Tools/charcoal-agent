import { describe, expect, it } from "vitest";
import { cleanCitationSnippet, citationDisplayName } from "./citation-text";

describe("citationDisplayName", () => {
  it.each([
    ["knowme-platforms-and-status.0123456789ab.md", "KnowMe platforms and status"],
    ["the-boss.a1b2c3d4e5f6.md", "The Boss"],
    ["ipfs-sync-for-obsidian.ffffffffffff.md", "IPFS sync for Obsidian"],
    ["faq.000000000000.md", "FAQ"],
    ["company.md", "Company"],
    ["uar_and_mcp-tools.0123456789ab.md", "UAR and MCP tools"],
    ["how-bossfang-uses-ag-ui-and-a2ui.0123456789ab.md", "How BossFang uses AG-UI and A2UI"],
    ["agui-events.md", "AG-UI events"],
  ])("derives %s -> %s", (raw, expected) => {
    expect(citationDisplayName(raw)).toBe(expected);
  });

  it("leaves a human-readable title unchanged", () => {
    expect(citationDisplayName("Planning guide")).toBe("Planning guide");
    expect(citationDisplayName("KnowMe docs")).toBe("KnowMe docs");
    expect(citationDisplayName("Guide")).toBe("Guide");
    expect(citationDisplayName("README")).toBe("README");
  });

  it("does not strip a hash that is not 12 hex characters", () => {
    expect(citationDisplayName("notes.v2.md")).toBe("Notes.v2");
  });

  it("falls back to the raw value when nothing is left", () => {
    expect(citationDisplayName(".md")).toBe(".md");
    expect(citationDisplayName("  ")).toBe("Source");
  });
});

describe("cleanCitationSnippet", () => {
  it("strips headings, emphasis, list markers and inline code", () => {
    const raw = "## Platforms\n\n- **Desktop**: macOS and *Windows*\n1. `knowme` CLI\n> quoted __note__";
    expect(cleanCitationSnippet(raw)).toBe("Platforms Desktop: macOS and Windows knowme CLI quoted note");
  });

  it("replaces links and images with their label text", () => {
    expect(cleanCitationSnippet("See [the docs](https://know-me.tools/docs) and ![a logo](x.png).")).toBe(
      "See the docs and a logo.",
    );
  });

  it("removes code fences but keeps the code text", () => {
    expect(cleanCitationSnippet("Run:\n```sh\nnpm run dev\n```\nthen open it.")).toBe(
      "Run: npm run dev then open it.",
    );
  });

  it("removes front-matter blocks and front-matter-like lines", () => {
    const raw = "---\ntitle: The Boss\nupdated: 2026-10-01\n---\nThe Boss is a desktop workspace.";
    expect(cleanCitationSnippet(raw)).toBe("The Boss is a desktop workspace.");
    expect(cleanCitationSnippet("source_url: https://x.example\nretrieved: 2026-10-12\nBody text.")).toBe(
      "Body text.",
    );
  });

  it("keeps snake_case words and prose colons intact", () => {
    expect(cleanCitationSnippet("Set memory_enabled to false. Note: this is per turn.")).toBe(
      "Set memory_enabled to false. Note: this is per turn.",
    );
  });

  it("trims long text at a word boundary and adds an ellipsis", () => {
    const raw = "alpha beta gamma delta epsilon zeta eta theta";
    const out = cleanCitationSnippet(raw, 20);
    expect(out).toBe("alpha beta gamma…");
    expect(out.length).toBeLessThanOrEqual(21);
  });

  it("drops trailing punctuation before the ellipsis", () => {
    expect(cleanCitationSnippet("one two, three four five six", 9)).toBe("one two…");
  });

  it("does not add an ellipsis when the text fits", () => {
    expect(cleanCitationSnippet("Short snippet.", 160)).toBe("Short snippet.");
  });

  it("cuts a single overlong word rather than returning nothing", () => {
    expect(cleanCitationSnippet("a".repeat(30), 10)).toBe(`${"a".repeat(10)}…`);
  });

  it("returns an empty string for empty or markup-only input", () => {
    expect(cleanCitationSnippet("")).toBe("");
    expect(cleanCitationSnippet("---\n```\n```")).toBe("");
  });
});
