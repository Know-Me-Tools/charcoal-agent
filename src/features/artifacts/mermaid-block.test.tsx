import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MermaidBlock } from "./mermaid-block";

const mermaidRender = vi.fn();
const mermaidInitialize = vi.fn();

vi.mock("mermaid", () => ({
  default: {
    initialize: (...args: unknown[]) => mermaidInitialize(...args),
    render: (...args: unknown[]) => mermaidRender(...args),
  },
}));

// Stub ShikiCodeBlock (async Shiki loader + per-token spans) so the fallback
// source assertions are exact-text-match friendly.
vi.mock("@/features/artifacts/shiki-code-block", () => ({
  ShikiCodeBlock: ({ code }: { code: string }) => <pre data-testid="mermaid-source">{code}</pre>,
}));

describe("MermaidBlock", () => {
  beforeEach(() => {
    mermaidRender.mockReset();
    mermaidInitialize.mockReset();
  });

  it("renders an SVG for valid Mermaid source", async () => {
    mermaidRender.mockResolvedValue({ svg: '<svg viewBox="0 0 10 10"><rect /></svg>' });

    render(<MermaidBlock source="graph LR\n  A-->B" />);

    await waitFor(() => {
      const region = screen.getByRole("region", { name: "Diagram" });
      expect(region.querySelector("svg")).not.toBeNull();
    });
  });

  it("shows the source and a plain-language error label when rendering fails, with no raw exception text", async () => {
    mermaidRender.mockRejectedValue(new Error("Parse error on line 1: unexpected token"));

    render(<MermaidBlock source="not a valid diagram" />);

    await waitFor(() => {
      expect(screen.getByText(/diagram could not be rendered/i)).toBeInTheDocument();
    });
    expect(screen.getByTestId("mermaid-source")).toHaveTextContent("not a valid diagram");
    expect(screen.queryByText(/unexpected token/i)).not.toBeInTheDocument();
  });
});
