import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/link-policy/is-allowed-link", () => ({
  isAllowedLink: (url: string) => url === "https://allowed.example/doc",
}));

const { CitationBlock } = await import("./citation-block");

describe("CitationBlock", () => {
  it("renders an allowed URL as a link", () => {
    render(
      <CitationBlock
        source="KnowMe docs"
        content="An allowed source."
        url="https://allowed.example/doc"
      />,
    );

    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://allowed.example/doc");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders a disallowed URL as plain text showing the full destination, not a link", () => {
    render(
      <CitationBlock
        source="Suspicious source"
        content="A disallowed source."
        url="https://evil.example/x"
      />,
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("https://evil.example/x")).toBeInTheDocument();
  });

  it("renders no link and no URL text when no url is given", () => {
    render(<CitationBlock source="No URL" content="Just text." />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});

const { CitationList } = await import("./citation-block");

describe("CitationBlock display cleanup", () => {
  it("shows a readable name for an uploaded file name and a plain-text excerpt", () => {
    render(
      <CitationBlock
        source="knowme-platforms-and-status.0123456789ab.md"
        content={"## Platforms\n- **Desktop** is [available](https://know-me.tools/download)."}
      />,
    );

    expect(screen.getByText("KnowMe platforms and status")).toBeInTheDocument();
    expect(screen.getByText("Platforms Desktop is available.")).toBeInTheDocument();
    expect(screen.queryByText(/0123456789ab/)).not.toBeInTheDocument();
  });
});

describe("CitationList", () => {
  const citations = [
    { source: "the-boss.0123456789ab.md", content: "The Boss is a desktop workspace.", index: 2 },
    { source: "Planning guide", content: "Plan first.", url: "https://allowed.example/doc" },
    { source: "Elsewhere", content: "Off-site.", url: "https://evil.example/x" },
  ];

  it("renders one Sources heading over a single numbered list, in order", () => {
    render(<CitationList citations={citations} />);

    expect(screen.getAllByText("Sources")).toHaveLength(1);
    const list = screen.getByRole("list", { name: "Sources" });
    const items = list.querySelectorAll(":scope > li");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("The Boss");
    expect(items[1]).toHaveTextContent("Planning guide");
    expect(items[2]).toHaveTextContent("Elsewhere");
  });

  it("shows the stream marker when present and the position otherwise", () => {
    render(<CitationList citations={citations} />);
    const items = screen.getByRole("list", { name: "Sources" }).querySelectorAll(":scope > li");

    expect(items[0]).toHaveTextContent("[2]");
    expect(items[0]).toHaveAttribute("value", "2");
    expect(items[1]).toHaveTextContent("[2]");
    expect(items[2]).toHaveTextContent("[3]");
  });

  it("keeps the link rule per item: allowed hosts link, others show the URL as text", () => {
    render(<CitationList citations={citations} />);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "https://allowed.example/doc");
    expect(screen.getByText("https://evil.example/x")).toBeInTheDocument();
  });

  it("renders nothing for an empty list", () => {
    const { container } = render(<CitationList citations={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
