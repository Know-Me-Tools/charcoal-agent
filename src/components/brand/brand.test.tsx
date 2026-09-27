import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KnowMeLockup, KnowMeMark, KnowMeWordmark } from "./index";

describe("KnowMeMark", () => {
  it("draws the ember node from the brand token and the body in currentColor", () => {
    const { container } = render(<KnowMeMark />);
    const node = container.querySelector("circle");
    expect(node?.getAttribute("fill")).toBe("var(--km-ember)");
    expect(container.querySelector("rect")?.getAttribute("fill")).toBe("currentColor");
  });

  it("is decorative by default and named when labelled", () => {
    const { container, rerender } = render(<KnowMeMark />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    rerender(<KnowMeMark label="KnowMe" />);
    expect(screen.getByRole("img", { name: "KnowMe" })).toBeInTheDocument();
  });

  it("never renders below the 16px favicon minimum", () => {
    const { container } = render(<KnowMeMark size={8} />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "16");
  });
});

describe("KnowMeWordmark", () => {
  it('renders "Know" + ember "Me" read as one word', () => {
    render(<KnowMeWordmark />);
    const word = screen.getByRole("img", { name: "KnowMe" });
    expect(word).toHaveAttribute("data-slot", "knowme-wordmark");
    expect(word).toHaveTextContent("KnowMe");
    expect(screen.getByText("Me")).toHaveClass("text-ember");
  });
});

describe("KnowMeLockup", () => {
  it.each([
    ["nav", 28],
    ["footer", 24],
    ["hero", 56],
  ] as const)("%s variant uses the brand mark size %ipx", (variant, size) => {
    const { container } = render(<KnowMeLockup variant={variant} />);
    expect(container.querySelector("svg")).toHaveAttribute("width", String(size));
  });

  it("exposes a single accessible name", () => {
    render(<KnowMeLockup />);
    expect(screen.getByLabelText("KnowMe")).toBeInTheDocument();
    expect(screen.getAllByLabelText("KnowMe")).toHaveLength(1);
  });
});
