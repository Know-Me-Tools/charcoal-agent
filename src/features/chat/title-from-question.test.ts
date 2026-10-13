import { describe, expect, it } from "vitest";
import { titleFromQuestion } from "./use-thread-naming";

describe("titleFromQuestion", () => {
  it("returns a short question unchanged", () => {
    expect(titleFromQuestion("What does KnowMe do?")).toBe("What does KnowMe do?");
  });

  it("collapses whitespace and newlines", () => {
    expect(titleFromQuestion("  What\n\n does   KnowMe do? ")).toBe("What does KnowMe do?");
  });

  it("cuts a long question at a word boundary with an ellipsis", () => {
    const title = titleFromQuestion(
      "Can you explain how KnowMe keeps my conversations private across devices and teams?",
    );
    expect(title.endsWith("…")).toBe(true);
    expect(title.length).toBeLessThanOrEqual(61);
    expect(title).toBe("Can you explain how KnowMe keeps my conversations private…");
  });

  it("falls back to the default title for an empty question", () => {
    expect(titleFromQuestion("   ")).toBe("New conversation");
  });
});
