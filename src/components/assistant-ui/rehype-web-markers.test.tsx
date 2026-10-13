/**
 * site-web-search 16.8.2: `[Wn]` in the reply resolves to its web citation;
 * an unresolved `[Wn]` stays plain text; an attacker link or image in the
 * same reply stays text (the reply policy still runs).
 */
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import { buildMarkdownRehypePlugins } from "./markdown-rehype-plugins";
import { webCitationHostsFromParts } from "./web-citation-markers";

function render(markdown: string, hosts: ReadonlyMap<number, string>): string {
  return renderToStaticMarkup(
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={buildMarkdownRehypePlugins(undefined, hosts)}>
      {markdown}
    </ReactMarkdown>,
  );
}

const HOSTS = new Map([
  [1, "example.org"],
  [2, "docs.example.net"],
]);

describe("[Wn] markers in the reply", () => {
  it("resolves [W1] to its web citation, with the host in the title", () => {
    const html = render("Rust 1.9 shipped [W1].", HOSTS);
    expect(html).toContain('data-web-marker="1"');
    expect(html).toContain("Web source from example.org");
    expect(html).toContain("[W1]");
  });

  it("leaves an unresolved [W4] as plain text, not an element", () => {
    const html = render("Unknown claim [W4].", HOSTS);
    expect(html).not.toContain("data-web-marker");
    expect(html).toContain("[W4]");
  });

  it("resolves nothing when the message has no web citations", () => {
    const html = render("Claim [W1].", new Map());
    expect(html).not.toContain("data-web-marker");
  });

  it("does not treat KB markers [1] as web markers", () => {
    const html = render("KB claim [1].", HOSTS);
    expect(html).not.toContain("data-web-marker");
  });

  it("does not resolve a marker inside code", () => {
    const html = render("Code `[W1]` here.", HOSTS);
    expect(html).not.toContain("data-web-marker");
  });

  it("resolves several markers in one paragraph", () => {
    const html = render("A [W1] and B [W2].", HOSTS);
    expect(html.match(/data-web-marker/g)).toHaveLength(2);
  });

  it("keeps an attacker link and image as text beside a resolved marker", () => {
    const html = render(
      "See [W1] [click](https://evil.example/x) ![pixel](https://tracker.example/p.png)",
      HOSTS,
    );
    expect(html).toContain('data-web-marker="1"');
    expect(html).not.toContain("<a ");
    expect(html).not.toContain("<img");
    expect(html).toContain("https://evil.example/x");
  });
});

describe("webCitationHostsFromParts", () => {
  it("collects web citations from the Sources pseudo-part only", () => {
    const hosts = webCitationHostsFromParts([
      { type: "text", text: "x" },
      {
        type: "tool-call",
        toolName: "__citations__",
        args: {
          citations: [
            { source: "a", index: 1, origin: "web", host: "example.org" },
            { source: "b", index: 2 },
            { source: "c", index: 3, origin: "web" },
          ],
        },
      },
    ]);
    expect([...hosts]).toEqual([[1, "example.org"]]);
  });
});
