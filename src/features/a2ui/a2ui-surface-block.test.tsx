import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { A2uiSurfaceBlock } from "./a2ui-surface-block";

/**
 * The surface UAR emitted in the carrier spike (evidence 13, primary capture),
 * `content` verbatim: Card > Column > [Text bound to /message, Button].
 */
const CAPTURED_SURFACE = [
  '{"version":"v0.9.1","createSurface":{"surfaceId":"spike-card","catalogId":"https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json"}}',
  '{"version":"v0.9.1","updateComponents":{"surfaceId":"spike-card","components":[{"id":"root","component":"Card","child":"body"},{"id":"body","component":"Column","children":["heading","go"]},{"id":"heading","component":"Text","text":{"path":"/message"}},{"id":"go","component":"Button","child":"goLabel","action":{"event":{"name":"spikeContinue","context":{}}}},{"id":"goLabel","component":"Text","text":"Continue"}]}}',
  '{"version":"v0.9.1","updateDataModel":{"surfaceId":"spike-card","path":"/message","value":"Hello from the spike"}}',
].join("\n");

describe("A2uiSurfaceBlock", () => {
  it("renders the captured UAR surface as components", async () => {
    render(<A2uiSurfaceBlock content={CAPTURED_SURFACE} title="Spike" />);
    expect(await screen.findByText("Hello from the spike")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Continue" })).toBeTruthy();
    expect(screen.queryByTestId("a2ui-surface-error")).toBeNull();
  });

  it("shows a Button with an action disabled, and activating it does nothing", async () => {
    render(<A2uiSurfaceBlock content={CAPTURED_SURFACE} />);
    const button = (await screen.findByRole("button", { name: "Continue" })) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await userEvent.click(button);
    expect(screen.getByText("Hello from the spike")).toBeTruthy();
  });

  it.each([
    ["malformed content", "{not json"],
    ["a catalog it did not register", '{"version":"v0.9.1","createSurface":{"surfaceId":"s","catalogId":"https://evil.example/c.json"}}'],
    [
      "a component outside the nine",
      [
        '{"version":"v0.9.1","createSurface":{"surfaceId":"s","catalogId":"urn:uar:a2ui:catalog:1"}}',
        '{"version":"v0.9.1","updateComponents":{"surfaceId":"s","components":[{"id":"root","component":"Video","url":"https://example.com/v.mp4"}]}}',
      ].join("\n"),
    ],
  ])("shows a plain notice for %s", (_name, content) => {
    render(<A2uiSurfaceBlock content={content} />);
    expect(screen.getByTestId("a2ui-surface-error")).toBeTruthy();
    expect(screen.queryByTestId("a2ui-surface")).toBeNull();
  });
});
