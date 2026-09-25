import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ArtifactBlock } from "./artifact-block";

// Stub the heavy renderers so routing can be asserted without waiting on the
// real Shiki/Mermaid async loaders.
vi.mock("@/features/artifacts/shiki-code-block", () => ({
  ShikiCodeBlock: ({ code, language }: { code: string; language?: string }) => (
    <div data-testid="shiki-code-block" data-language={language}>
      {code}
    </div>
  ),
}));

vi.mock("@/features/artifacts/mermaid-block", () => ({
  MermaidBlock: ({ source }: { source: string }) => (
    <div data-testid="mermaid-block">{source}</div>
  ),
}));

const MERMAID_SOURCE = "graph LR\n  Plan --> Build --> Review";

describe("ArtifactBlock", () => {
  // Reproduces the "Mermaid artifact renders as source text" defect as it
  // actually shows up in the app: the fixture's "Week flow" artifact (type
  // "diagram", language "mermaid") is rendered in its DEFAULT, unclicked
  // state — the card is never expanded by the user. The card must show the
  // rendered diagram by default, not the raw `graph LR …` source, with the
  // source still reachable through MermaidBlock's own Source toggle.
  it.each(["diagram", "code"])(
    "renders a mermaid-language %s artifact through MermaidBlock by default, with no click",
    (artifactType) => {
      render(
        <ArtifactBlock
          artifactId="art-mermaid"
          artifactType={artifactType}
          title="Week flow"
          content={MERMAID_SOURCE}
          language="mermaid"
          isInputRequest={false}
        />,
      );

      expect(screen.getByTestId("mermaid-block")).toHaveTextContent(/graph LR/);
      expect(screen.queryByTestId("shiki-code-block")).not.toBeInTheDocument();
    },
  );

  it("still routes a non-mermaid code artifact to ShikiCodeBlock", () => {
    render(
      <ArtifactBlock
        artifactId="art-code"
        artifactType="code"
        title="checklist.md"
        content="- [x] Tokens\n- [ ] Surfaces"
        language="markdown"
        isInputRequest={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /expand/i }));

    expect(screen.getByTestId("shiki-code-block")).toHaveTextContent("Tokens");
    expect(screen.queryByTestId("mermaid-block")).not.toBeInTheDocument();
  });
});
