/**
 * site-web-search 16.8.2: web sources in the Sources block. Label, marker
 * `W{n}` and host are always visible; the URL is text unless `isAllowedLink`
 * admits it (D-3).
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

  it("shows the full URL as text and renders no anchor when the link is not allowed", () => {
    render(<CitationList citations={[web]} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("https://example.org/rust")).toBeInTheDocument();
  });

  it("makes the title a link only when isAllowedLink admits it, and still shows the host", () => {
    render(<CitationList citations={[{ ...web, url: "https://allowed.example/doc", host: "allowed.example" }]} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "https://allowed.example/doc");
    expect(screen.getByText("allowed.example")).toBeInTheDocument();
  });

  it("keeps a KB card unchanged beside a web card: [n] for KB, W{n} for web", () => {
    render(<CitationList citations={[{ source: "faq.md", content: "", index: 1 }, web]} />);
    const items = screen.getByRole("list", { name: "Sources" }).querySelectorAll(":scope > li");
    expect(items[0]).toHaveTextContent("[1]");
    expect(items[0]).not.toHaveTextContent("Web");
    expect(items[1]).toHaveTextContent("W1");
  });

  it("cuts the web excerpt at 160 characters and strips markdown", () => {
    render(<CitationList citations={[{ ...web, content: `**Bold** ${"word ".repeat(80)}` }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Show excerpt" }));
    const text = screen.getByText(/^Bold word/).textContent ?? "";
    expect(text.length).toBeLessThanOrEqual(161);
    expect(text).not.toContain("**");
  });
});
