import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MermaidBlock } from "./mermaid-block";

const mermaidRender = vi.fn();
const mermaidInitialize = vi.fn();
const mermaidParse = vi.fn();

vi.mock("mermaid", () => ({
  default: {
    parse: (...args: unknown[]) => mermaidParse(...args),
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
    mermaidParse.mockReset();
    mermaidParse.mockResolvedValue({ diagramType: "flowchart" });
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

  it("shows the fallback and never calls render when parse rejects, leaving nothing in document.body", async () => {
    mermaidParse.mockRejectedValue(new Error("Syntax error in text"));

    render(<MermaidBlock source="graph LR\n  A--" />);

    await waitFor(() => {
      expect(screen.getByText(/diagram could not be rendered/i)).toBeInTheDocument();
    });
    expect(mermaidRender).not.toHaveBeenCalled();
    expect(screen.queryByText(/syntax error/i)).not.toBeInTheDocument();
    expect(document.body.querySelector('[id^="dmermaid-"], svg[id^="mermaid-"]')).toBeNull();
  });

  it("removes a body-level node left by a failed render", async () => {
    mermaidRender.mockImplementation(async (id: string) => {
      for (const nodeId of [`d${id}`, id]) {
        const node = document.createElement("div");
        node.id = nodeId;
        document.body.appendChild(node);
      }
      throw new Error("render failed");
    });

    render(<MermaidBlock source="graph LR\n  A-->B" />);

    await waitFor(() => {
      expect(screen.getByText(/diagram could not be rendered/i)).toBeInTheDocument();
    });
    expect(document.body.querySelector('[id^="dmermaid-"], [id^="mermaid-"]')).toBeNull();
  });

  it("initializes Mermaid with suppressErrorRendering", async () => {
    mermaidRender.mockResolvedValue({ svg: "<svg></svg>" });

    render(<MermaidBlock source="graph LR\n  A-->B" />);

    await waitFor(() => expect(mermaidInitialize).toHaveBeenCalled());
    expect(mermaidInitialize.mock.calls[0][0]).toMatchObject({ suppressErrorRendering: true });
  });

  // site-reply-content-hardening 3.3: Mermaid's SVG is injected with
  // dangerouslySetInnerHTML, so its label and click handling must stay in
  // strict mode even if a future Mermaid release changes its default.
  it("initializes Mermaid with securityLevel strict", async () => {
    mermaidRender.mockResolvedValue({ svg: "<svg></svg>" });

    render(<MermaidBlock source="graph LR\n  A-->B" />);

    await waitFor(() => expect(mermaidInitialize).toHaveBeenCalled());
    for (const [config] of mermaidInitialize.mock.calls) {
      expect(config).toMatchObject({ securityLevel: "strict" });
    }
  });
});
