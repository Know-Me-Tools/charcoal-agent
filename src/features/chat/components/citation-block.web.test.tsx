/**
 * site-web-search 16.8.2: web sources in the Sources block. Label, marker
 * `W{n}` and host are always visible. A web source's URL is minted by the
 * server, so the title and the visible URL are links (operator request
 * 2026-10-14); a knowledge-base URL stays text unless `isAllowedLink` admits
 * it (D-3). A web source has no excerpt (operator decision 2026-10-13).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/link-policy/is-allowed-link", () => ({
  isAllowedLink: (url: string) => url === "https://allowed.example/doc",
}));

const { CitationList } = await import("./citation-block");

const web = {
  source: "Rust 1.9 released",
  content: "The latest stable release brings **new** things.",
  url: "https://example.org/rust",
  index: 1,
  origin: "web" as const,
  host: "example.org",
};

describe("CitationList: web sources", () => {
  it("shows the Web label, the W marker, the title and the host, always", () => {
    render(<CitationList citations={[web]} />);
    const item = screen.getByRole("list", { name: "Sources" }).querySelector(":scope > li")!;
    expect(item).toHaveTextContent("Web");
    expect(item).toHaveTextContent("W1");
    expect(item).not.toHaveTextContent("[1]");
    expect(item).toHaveTextContent("Rust 1.9 released");
    expect(item).toHaveTextContent("example.org");
  });

  it("makes the title and the visible URL links that open in a new tab, destination shown as text", () => {
    render(<CitationList citations={[web]} />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toHaveAttribute("href", "https://example.org/rust");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(screen.getByText("https://example.org/rust")).toBeInTheDocument();
    expect(screen.getByText("example.org")).toBeInTheDocument();
  });

  it("renders no anchor for a web source whose URL is not plain https", () => {
    render(<CitationList citations={[{ ...web, url: "http://example.org/rust" }, { ...web, index: 2, url: "javascript:alert(1)" }]} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("keeps a knowledge-base URL text unless isAllowedLink admits it", () => {
    render(
      <CitationList
        citations={[
          { source: "faq.md", content: "", index: 1, url: "https://elsewhere.example/doc" },
          { source: "guide.md", content: "", index: 2, url: "https://allowed.example/doc" },
        ]}
      />,
    );
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://allowed.example/doc");
    expect(screen.getByText("https://elsewhere.example/doc")).toBeInTheDocument();
  });

  it("keeps a KB card unchanged beside a web card: [n] for KB, W{n} for web", () => {
    render(<CitationList citations={[{ source: "faq.md", content: "", index: 1 }, web]} />);
    const items = screen.getByRole("list", { name: "Sources" }).querySelectorAll(":scope > li");
    expect(items[0]).toHaveTextContent("[1]");
    expect(items[0]).not.toHaveTextContent("Web");
    expect(items[1]).toHaveTextContent("W1");
  });

  it("never offers an excerpt for a web source, even one persisted with snippet text by an older server", () => {
    // `web.content` carries text: what a citation stored before the
    // no-snippet decision (2026-10-13) holds in PGlite.
    render(<CitationList citations={[web]} />);
    expect(screen.queryByRole("button", { name: "Show excerpt" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    const item = screen.getByRole("list", { name: "Sources" }).querySelector(":scope > li")!;
    expect(item).not.toHaveTextContent("latest stable release");
    expect(item).toHaveTextContent("Web");
    expect(item).toHaveTextContent("W1");
    expect(item).toHaveTextContent("Rust 1.9 released");
    expect(item).toHaveTextContent("example.org");
  });

  it("keeps the excerpt control on a KB card beside a web card", () => {
    render(<CitationList citations={[{ source: "faq.md", content: "The Boss is an agent.", index: 1 }, web]} />);
    const toggles = screen.getAllByRole("button", { name: "Show excerpt" });
    expect(toggles).toHaveLength(1);
    fireEvent.click(toggles[0]);
    expect(screen.getByText("The Boss is an agent.")).toBeInTheDocument();
    expect(screen.queryByText(/latest stable release/)).not.toBeInTheDocument();
  });
});
