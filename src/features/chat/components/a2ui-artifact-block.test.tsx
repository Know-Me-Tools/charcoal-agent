import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { A2uiDisplayBlock, A2uiInputBlock } from "./a2ui-artifact-block";

// Stub MermaidBlock so display-routing can be asserted without waiting on
// the real async Mermaid loader.
vi.mock("@/features/artifacts/mermaid-block", () => ({
  MermaidBlock: ({ source }: { source: string }) => (
    <div data-testid="mermaid-block">{source}</div>
  ),
}));

const CONFIRM_CONTENT = JSON.stringify({
  message: "Add the roadmap review to your calendar?",
  accept_label: "Add",
  cancel_label: "Skip",
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("A2uiInputBlock — response captured gating", () => {
  // Reproduces the defect: the tool part's status becomes "complete" once the
  // request finishes streaming, which is not the same as the user having
  // responded. "Response captured" must not appear on status alone.
  it("does not show Response captured when status is complete and no response was given", () => {
    render(
      <A2uiInputBlock
        runId="run-1"
        artifactId="art-confirm"
        artifactType="confirm"
        title="Add Thursday review to calendar?"
        content={CONFIRM_CONTENT}
        metadata={{}}
        status="complete"
      />,
    );

    expect(screen.queryByText(/response captured/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Skip" })).toBeEnabled();
  });

  it("shows Response captured once a result payload is present, even while status is still running", () => {
    render(
      <A2uiInputBlock
        runId="run-1"
        artifactId="art-confirm"
        artifactType="confirm"
        title="Add Thursday review to calendar?"
        content={CONFIRM_CONTENT}
        metadata={{}}
        status="running"
        result={JSON.stringify({ accepted: true })}
      />,
    );

    expect(screen.getByText(/response captured/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
  });

  it("shows Response captured after the user submits a response successfully", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => "" });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <A2uiInputBlock
        runId="run-1"
        artifactId="art-confirm"
        artifactType="confirm"
        title="Add Thursday review to calendar?"
        content={CONFIRM_CONTENT}
        metadata={{}}
        status="running"
      />,
    );

    expect(screen.queryByText(/response captured/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(screen.getByText(/response captured/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    // Status changes must be announced to screen readers, not just visible.
    expect(screen.getByRole("status")).toHaveTextContent(/response captured/i);
  });

  it("announces Sending in a polite live region while the request is in flight", async () => {
    let resolveFetch!: (v: { ok: boolean; text: () => Promise<string> }) => void;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(
      <A2uiInputBlock
        runId="run-1"
        artifactId="art-confirm"
        artifactType="confirm"
        title="Add Thursday review to calendar?"
        content={CONFIRM_CONTENT}
        metadata={{}}
        status="running"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/sending/i));

    resolveFetch({ ok: true, text: async () => "" });
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/response captured/i));
  });

  it("shows a plain-language error in an alert region and never the raw server body on failure", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 500, text: async () => "internal secret trace" });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <A2uiInputBlock
        runId="run-1"
        artifactId="art-confirm"
        artifactType="confirm"
        title="Add Thursday review to calendar?"
        content={CONFIRM_CONTENT}
        metadata={{}}
        status="running"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() =>
      expect(screen.getByText(/your response was not sent/i)).toBeInTheDocument(),
    );
    expect(screen.queryByText(/internal secret trace/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/response captured/i)).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(/your response was not sent/i);
  });

  it("gives a local JSON-parse failure its own accurate message, distinct from a send failure", () => {
    render(
      <A2uiInputBlock
        runId="run-1"
        artifactId="art-form"
        artifactType="form"
        title="Fill out the form"
        content="{}"
        metadata={{}}
        status="running"
      />,
    );

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "{not valid json" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit" }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/not valid json|isn.t valid json|invalid json/i);
    expect(alert).not.toHaveTextContent(/your response was not sent/i);
  });

  it("gives the form's JSON textarea an accessible name via a properly associated label", () => {
    render(
      <A2uiInputBlock
        runId="run-1"
        artifactId="art-form"
        artifactType="form"
        title="Fill out the form"
        content="{}"
        metadata={{}}
        status="running"
      />,
    );

    // Findable by role and accessible name together — not just present in
    // the DOM — proves the visible label text is programmatically
    // associated via htmlFor/id, not just adjacent text a screen reader
    // wouldn't connect to the field.
    expect(
      screen.getByRole("textbox", { name: /submit json response/i }),
    ).toBeInTheDocument();
  });
});

describe("A2uiDisplayBlock — mermaid routing", () => {
  // Reproduces the defect as it actually reaches the screen: a plain
  // `agui.artifact` event (isInputRequest: false, e.g. the fixture's "Week
  // flow" artifact) is rendered through A2uiDisplayBlock, not ArtifactBlock
  // — the raw pre-wrap content box showed the `graph LR …` source verbatim
  // instead of a diagram.
  it("renders a mermaid-language artifact through MermaidBlock by default, with no click", () => {
    render(
      <A2uiDisplayBlock
        artifactType="diagram"
        title="Week flow"
        content="graph LR\n  Plan --> Build --> Review"
        language="mermaid"
      />,
    );

    expect(screen.getByTestId("mermaid-block")).toHaveTextContent(/graph LR/);
  });

  it("still shows non-mermaid content in the raw content box", () => {
    render(
      <A2uiDisplayBlock
        artifactType="display"
        title="Custom Event"
        content='{"surfaceUpdate":{}}'
        language="json"
      />,
    );

    expect(screen.getByText(/surfaceUpdate/)).toBeInTheDocument();
    expect(screen.queryByTestId("mermaid-block")).not.toBeInTheDocument();
  });
});
