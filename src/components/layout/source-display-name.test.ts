import { describe, expect, it } from "vitest";
import { sourceDisplayName } from "./source-display-name";

describe("sourceDisplayName", () => {
  it.each([
    ["the-boss-0123456789ab.md", "The boss"],
    ["0123456789ab_ipfs-sync-for-obsidian.md", "Ipfs sync for obsidian"],
    ["knowme-platforms-and-status.md", "Knowme platforms and status"],
    ["faq.md", "Faq"],
  ])("derives a readable name from the uploaded filename (%s)", (source, expected) => {
    expect(sourceDisplayName(source)).toBe(expected);
  });

  it("leaves a source that is already a title unchanged", () => {
    expect(sourceDisplayName("KnowMe overview")).toBe("KnowMe overview");
  });

  it("falls back to the raw source when nothing readable is left", () => {
    expect(sourceDisplayName("0123456789ab.md")).toBe("0123456789ab.md");
  });
});
