import { describe, expect, it } from "vitest";
import { hasPreviewScripts } from "./preview-scripts";

describe("hasPreviewScripts", () => {
  it.each([
    ["a script element", "<script>alert(1)</script>"],
    ["an uppercase script element in a full document", "<!DOCTYPE html><html><body><SCRIPT src=x.js></SCRIPT></body></html>"],
    ["an inline handler", '<img src="data:," onerror="alert(1)">'],
    ["an uppercase, unquoted inline handler", "<div OnClick=go()>x</div>"],
    ["a javascript: href with case and leading space", '<a href="  JAVASCRIPT:alert(1)">x</a>'],
    ["a javascript: URL split by a tab", '<a href="java\tscript:alert(1)">x</a>'],
    ["a javascript: form action", '<form action="javascript:go()"></form>'],
    ["an SVG handler", '<svg onload="alert(1)"><circle r="2"/></svg>'],
  ])("detects %s", (_label, code) => {
    expect(hasPreviewScripts(code)).toBe(true);
  });

  it.each([
    ["static HTML and CSS", "<style>p{color:red}</style><p>hello</p>"],
    ["the word script in text", "<p>This script is not code: onclick and javascript: are words.</p>"],
    ["a normal link", '<a href="https://example.com/javascript:x">x</a>'],
    ["a data attribute", '<p data-on="1" data-href="javascript:x">x</p>'],
    ["a script tag inside a comment", "<!-- <script>alert(1)</script> --><p>x</p>"],
  ])("does not flag %s", (_label, code) => {
    expect(hasPreviewScripts(code)).toBe(false);
  });
});
