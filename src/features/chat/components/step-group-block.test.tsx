import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StepBlock, StepGroupBlock } from "./step-block";

describe("StepGroupBlock", () => {
  const steps = [
    { index: 0, label: "Thinking" },
    { index: 1, label: "Searching the knowledge base" },
  ];

  it("collapses finished steps into one 'N steps' line that expands to the rows", () => {
    render(<StepGroupBlock steps={steps} />);
    const trigger = screen.getByRole("button", { name: /2 steps/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Searching the knowledge base")).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Searching the knowledge base")).toBeInTheDocument();
  });
});

describe("StepBlock", () => {
  it("has no filled container (Flat 2.0 stripe removed)", () => {
    render(<StepBlock phase="started" label="Thinking" />);
    const row = screen.getByRole("status");
    expect(row.className).not.toMatch(/\bbg-/);
    expect(row.className).toContain("max-w-[65ch]");
  });
});
