import { render, screen } from "@testing-library/react";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { describe, expect, it, vi } from "vitest";
import { AI_SURFACE_CAPTION } from "../../../content/site/ai-disclosure";
import { ToolCallPart } from "@/features/chat/render-registry/tool-call-part";
import { A2uiSurfaceBlock } from "./a2ui-surface-block";

vi.mock("@/features/artifacts/mermaid-block", () => ({
  MermaidBlock: () => null,
}));

/**
 * W3 (site-answer-card-and-sources, task 5.3): every A2UI surface carries one
 * app-rendered caption that model content cannot fill or imitate. The app
 * caption is found by its `data-ai-caption` attribute, never by its words,
 * because a model can write the same words in a `Text` caption.
 */

const CATALOG = "urn:uar:a2ui:catalog:1";

function surface(components: unknown[], data?: unknown): string {
  return [
    JSON.stringify({ version: "v0.9.1", createSurface: { surfaceId: "s", catalogId: CATALOG } }),
    JSON.stringify({ version: "v0.9.1", updateComponents: { surfaceId: "s", components } }),
    ...(data === undefined
      ? []
      : [JSON.stringify({ version: "v0.9.1", updateDataModel: { surfaceId: "s", path: "/", value: data } })]),
  ].join("\n");
}

const PLAIN_CARD = surface([
  { id: "root", component: "Card", child: "body" },
  { id: "body", component: "Text", variant: "body", text: "A desktop workspace." },
]);

/** A model trying to occupy the caption slot: same words, caption style, and the attribute as text. */
const IMITATING_CARD = surface([
  { id: "root", component: "Card", child: "body" },
  { id: "body", component: "Column", children: ["answer", "fake", "markup"] },
  { id: "answer", component: "Text", variant: "body", text: "A desktop workspace." },
  { id: "fake", component: "Text", variant: "caption", text: AI_SURFACE_CAPTION },
  { id: "markup", component: "Text", variant: "caption", text: `<p data-ai-caption>${AI_SURFACE_CAPTION}</p>` },
]);

/** The one app caption, asserted structurally: outside model content, fixed text. */
function expectOneAppCaption(container: HTMLElement): HTMLElement {
  const captions = container.querySelectorAll<HTMLElement>("[data-ai-caption]");
  expect(captions).toHaveLength(1);
  const caption = captions[0];
  expect(caption.textContent).toBe(AI_SURFACE_CAPTION);
  expect(caption.closest("[data-testid='a2ui-surface']")).toBeNull();
  expect(caption.closest("[data-testid='a2ui-surface-error']")).toBeNull();
  expect(caption.closest("[data-testid='a2ui-surface-frame']")).not.toBeNull();
  return caption;
}

function part(toolName: string, args: Record<string, unknown>): ToolCallMessagePartProps {
  return {
    type: "tool-call",
    toolCallId: `id-${toolName}`,
    toolName,
    args,
    argsText: JSON.stringify(args),
    result: undefined,
    isError: false,
    status: { type: "complete" },
  } as unknown as ToolCallMessagePartProps;
}

describe("A2UI surface caption (W3)", () => {
  it("renders on an explicit surface that has no caption of its own", async () => {
    const { container } = render(<A2uiSurfaceBlock content={PLAIN_CARD} passiveOnly />);
    expect(await screen.findByText("A desktop workspace.")).toBeInTheDocument();
    expectOneAppCaption(container);
  });

  it("is not satisfied by a model-written caption with the same words", async () => {
    const { container } = render(<A2uiSurfaceBlock content={IMITATING_CARD} passiveOnly />);
    expect(await screen.findByText("A desktop workspace.")).toBeInTheDocument();

    // The model's copies render inside the surface, as model text.
    const surfaceEl = screen.getByTestId("a2ui-surface");
    const modelCopies = screen
      .getAllByText(AI_SURFACE_CAPTION)
      .filter((el) => surfaceEl.contains(el));
    expect(modelCopies).toHaveLength(1);
    expect(modelCopies[0]).not.toHaveAttribute("data-ai-caption");
    expect(surfaceEl.querySelector("[data-ai-caption]")).toBeNull();

    // Exactly one app caption, outside the model's content.
    expectOneAppCaption(container);
  });

  it("renders when the surface fails to parse", () => {
    const { container } = render(<A2uiSurfaceBlock content="{not json" />);
    expect(screen.getByTestId("a2ui-surface-error")).toBeInTheDocument();
    expectOneAppCaption(container);
  });

  it("renders when a passive surface is refused for containing a control", () => {
    const withButton = surface([
      { id: "root", component: "Button", child: "l", action: { event: { name: "go", context: {} } } },
      { id: "l", component: "Text", text: "Go" },
    ]);
    const { container } = render(<A2uiSurfaceBlock content={withButton} passiveOnly />);
    expect(screen.getByTestId("a2ui-surface-error")).toBeInTheDocument();
    expectOneAppCaption(container);
  });

  it.each([
    ["an a2ui artifact", "a2ui", PLAIN_CARD, "A desktop workspace."],
    ["an inferred confirm card", "confirm", JSON.stringify({ message: "Send to Ada", accept_label: "Send" }), "Send to Ada"],
    ["an inferred form card", "form", JSON.stringify({ name: "Ada", email: "ada@example.com" }), "Ada"],
    ["an inferred select card", "select", JSON.stringify({ choice: "Weekly digest" }), "Weekly digest"],
  ])("renders once for %s in a message", async (_name, artifactType, content, visible) => {
    const { container } = render(
      <ToolCallPart
        {...part("__artifact__", {
          artifactId: "x",
          artifactType,
          title: "Card",
          content,
          isInputRequest: false,
        })}
      />,
    );
    expect(await screen.findByText(visible)).toBeInTheDocument();
    expect(screen.getByTestId("a2ui-surface")).toBeInTheDocument();
    expectOneAppCaption(container);
  });

  it("renders once for a surface whose content fails in a message", async () => {
    const { container } = render(
      <ToolCallPart
        {...part("__artifact__", {
          artifactId: "x",
          artifactType: "a2ui",
          title: "Broken",
          content: "{not json",
          isInputRequest: false,
        })}
      />,
    );
    expect(await screen.findByTestId("a2ui-surface-error")).toBeInTheDocument();
    expectOneAppCaption(container);
  });
});
