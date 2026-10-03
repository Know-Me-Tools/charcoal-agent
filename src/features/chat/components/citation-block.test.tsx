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
