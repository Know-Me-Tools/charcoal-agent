import { describe, expect, it } from "vitest";
import { findOpenFence } from "./streaming-fence";

describe("findOpenFence", () => {
  it("returns null when there are no fences", () => {
    expect(findOpenFence("just some prose\nwith lines")).toBeNull();
  });

  it("returns null for a closed backtick fence", () => {
    expect(findOpenFence("```ts\nconst x = 1;\n```\n")).toBeNull();
  });

  it("returns null for a closed tilde fence", () => {
    expect(findOpenFence("~~~python\nprint(1)\n~~~")).toBeNull();
  });

  it("detects an unterminated backtick fence with its language tag and offset", () => {
    const text = "intro\n\n```ts\nconst x = 1;\n";
    expect(findOpenFence(text)).toEqual({
      markerStart: text.indexOf("```"),
      marker: "`",
      fenceLength: 3,
      language: "ts",
      content: "const x = 1;",
    });
  });

  it("detects an unterminated tilde fence", () => {
    const text = "intro\n\n~~~~mermaid\ngraph LR\n";
    expect(findOpenFence(text)).toEqual({
      markerStart: text.indexOf("~~~~"),
      marker: "~",
      fenceLength: 4,
      language: "mermaid",
      content: "graph LR",
    });
  });

  it("treats a fence whose opener is the last line as open with no language", () => {
    const text = "intro\n```";
    expect(findOpenFence(text)).toEqual({
      markerStart: 6,
      marker: "`",
      fenceLength: 3,
      language: "",
      content: "",
    });
  });

  it("does not close a longer opening fence on a shorter run (nested longer fences)", () => {
    const text = "`````\nconst x = 1;\n```\n";
    expect(findOpenFence(text)).toMatchObject({ marker: "`", fenceLength: 5 });
  });

  it("closes a longer opening fence only on a run at least as long", () => {
    expect(findOpenFence("`````\ncode\n```\nmore\n`````\n")).toBeNull();
  });

  it("lets a longer run close a shorter opener", () => {
    expect(findOpenFence("```\ncode\n`````\n")).toBeNull();
  });

  it("treats a fence-like line inside another fence as content (other marker)", () => {
    const text = "```\n~~~\n";
    expect(findOpenFence(text)).toMatchObject({ marker: "`", fenceLength: 3 });
  });

  it("treats a shorter same-marker line inside a fence as content", () => {
    const text = "~~~~\n```\n";
    expect(findOpenFence(text)).toMatchObject({ marker: "~", fenceLength: 4 });
  });

  it("does not treat a same-marker line with trailing text as a closer", () => {
    const text = "```\ncode\n```js\n";
    expect(findOpenFence(text)).toMatchObject({ marker: "`" });
  });

  it("captures only the last unterminated fence when an earlier fence is closed", () => {
    const text = "```ts\nclosed\n```\n\ntext\n\n```python\nopen\n";
    const open = findOpenFence(text);
    expect(open).toMatchObject({ marker: "`", language: "python" });
    expect(open?.markerStart).toBe(text.indexOf("```python"));
  });

  it("does not open a fence when the backtick info string contains a backtick", () => {
    expect(findOpenFence("```foo`bar\ncode\n")).toBeNull();
  });

  it("opens a fence indented up to three spaces and matches the mdast offset", () => {
    const text = "intro\n\n  ```ts\ncode\n";
    expect(findOpenFence(text)?.markerStart).toBe(text.indexOf("```"));
  });

  it("does not open a fence indented four spaces (indented code block)", () => {
    expect(findOpenFence("    ```ts\ncode\n")).toBeNull();
  });

  it("closes a fence on an indented closing run with trailing whitespace", () => {
    expect(findOpenFence("```\ncode\n  ```  \n")).toBeNull();
  });

  it("ignores a backtick run that does not start its line (inline code span)", () => {
    expect(findOpenFence("some ```inline code\n")).toBeNull();
  });
});
