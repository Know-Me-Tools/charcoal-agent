import { describe, expect, it } from "vitest";
import { extractUrls } from "./corpus-urls";

describe("extractUrls", () => {
  it("drops the closing backtick of an inline code span", () => {
    expect(extractUrls("Clone `https://example.com/org/prometheus-skill-system`, run it.")).toEqual([
      "https://example.com/org/prometheus-skill-system",
    ]);
  });

  it("drops markdown and sentence trailing characters", () => {
    const text =
      "(https://a.example/x) [https://b.example/y] <https://c.example/z> \"https://d.example/w\" 'https://e.example/v' https://f.example/u. https://g.example/t, https://h.example/s;";
    expect(extractUrls(text)).toEqual([
      "https://a.example/x",
      "https://b.example/y",
      "https://c.example/z",
      "https://d.example/w",
      "https://e.example/v",
      "https://f.example/u",
      "https://g.example/t",
      "https://h.example/s",
    ]);
  });
});
