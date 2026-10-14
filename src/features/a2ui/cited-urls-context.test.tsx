/**
 * A URL in card text is a link only when it is a web citation of the thread
 * (operator request 2026-10-14); anything else the model typed stays text.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { toCitedUrlSet } from "@/lib/link-policy/cited-web-url";
import { CitedUrlsProvider } from "./cited-urls";
import { LinkedText } from "./cited-urls-context";

const CITED = toCitedUrlSet(["https://example.org/rust"]);

function renderText(text: string, cited = CITED) {
  return render(
    <CitedUrlsProvider value={cited}>
      <p>
        <LinkedText text={text} />
      </p>
    </CitedUrlsProvider>,
  );
}

describe("LinkedText", () => {
  it("links a cited URL, opens it in a new tab and keeps the URL as the visible text", () => {
    renderText("Source: https://example.org/rust.");
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.org/rust");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveTextContent("https://example.org/rust");
    // The sentence period stays outside the link.
    expect(link.parentElement).toHaveTextContent("Source: https://example.org/rust (opens in a new tab).");
  });

  it("leaves a URL the thread did not cite as plain text", () => {
    renderText("Go to https://evil.example/login now");
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText(/https:\/\/evil\.example\/login/)).toBeInTheDocument();
  });

  it("links nothing when the thread has no web citations", () => {
    renderText("https://example.org/rust", new Set());
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("links only the cited URL when a card names two", () => {
    renderText("https://example.org/rust and https://evil.example/x");
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });
});
