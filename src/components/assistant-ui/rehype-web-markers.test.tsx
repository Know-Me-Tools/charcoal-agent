/**
 * site-web-search 16.8.2: `[Wn]` in the reply resolves to its web citation
 * and, from the operator's request of 2026-10-14, is a link to the citation's
 * server-minted URL that opens in a new tab; an unresolved `[Wn]` stays plain
 * text; an attacker link or image in the same reply stays text (the reply
 * policy still runs), except a link to one of the message's own sources.
 */
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import { buildMarkdownRehypePlugins } from "./markdown-rehype-plugins";
import { webCitationHostsFromParts, type WebCitationHosts } from "./web-citation-markers";

function render(markdown: string, hosts: WebCitationHosts): string {
  return renderToStaticMarkup(
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={buildMarkdownRehypePlugins(undefined, hosts)}>
      {markdown}
    </ReactMarkdown>,
  );
}

const HOSTS: WebCitationHosts = new Map([
  [1, { host: "example.org", url: "https://example.org/rust" }],
  [2, { host: "docs.example.net", url: "https://docs.example.net/a?b=1" }],
  [3, { host: "nourl.example" }],
]);

describe("[Wn] markers in the reply", () => {
  it("resolves [W1] to its web citation, with the host in the title", () => {
    const html = render("Rust 1.9 shipped [W1].", HOSTS);
    expect(html).toContain('data-web-marker="1"');
    expect(html).toContain("Web source from example.org");
    expect(html).toContain("[W1]");
  });

  it("makes a resolved marker a link to the citation URL, in a new tab, with no referrer", () => {
    const html = render("Rust 1.9 shipped [W1].", HOSTS);
    expect(html).toContain('<a href="https://example.org/rust"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('aria-label="Source W1, example.org, opens in a new tab"');
  });

  it("keeps a marker without a usable URL a non-interactive span", () => {
    const html = render("Claim [W3].", HOSTS);
    expect(html).toContain('data-web-marker="3"');
    expect(html).not.toContain("<a ");
  });

  it("never takes the link from the reply text: a markdown link in the marker is not followed", () => {
    const html = render("See [[W1]](https://evil.example/x).", HOSTS);
    expect(html).not.toContain("https://evil.example/x\"");
    expect(html).toContain('href="https://example.org/rust"');
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
    expect(html).not.toContain('href="https://evil.example');
    expect(html).not.toContain("<img");
    expect(html).toContain("https://evil.example/x");
  });

  it("makes a model-written link to one of the message's own sources clickable", () => {
    const html = render("See [the post](https://example.org/rust) and [other](https://evil.example/x).", HOSTS);
    expect(html).toContain('<a href="https://example.org/rust"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toContain('href="https://evil.example');
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
            { source: "a", index: 1, origin: "web", host: "example.org", url: "https://example.org/rust" },
            { source: "b", index: 2 },
            { source: "c", index: 3, origin: "web" },
          ],
        },
      },
    ]);
    expect([...hosts]).toEqual([[1, { host: "example.org", url: "https://example.org/rust" }]]);
  });

  it("drops a URL that is not a plain https URL, keeping the host", () => {
    const hosts = webCitationHostsFromParts([
      {
        type: "tool-call",
        toolName: "__citations__",
        args: {
          citations: [
            { index: 1, origin: "web", host: "a.example", url: "javascript:alert(1)" },
            { index: 2, origin: "web", host: "b.example", url: "http://b.example/x" },
            { index: 3, origin: "web", host: "c.example", url: "https://user:pw@c.example/x" },
          ],
        },
      },
    ]);
    expect([...hosts]).toEqual([
      [1, { host: "a.example" }],
      [2, { host: "b.example" }],
      [3, { host: "c.example" }],
    ]);
  });
});
