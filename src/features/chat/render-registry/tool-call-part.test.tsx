import { render, screen } from "@testing-library/react";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { describe, expect, it, vi } from "vitest";
import { richMessageToThreadMessageLike } from "@/features/chat/use-chat-runtime";
import type { RichMessage } from "@/types/chat-content";
import { ToolCallPart } from "./tool-call-part";

vi.mock("@/features/artifacts/mermaid-block", () => ({
  MermaidBlock: ({ source }: { source: string }) => <div data-testid="mermaid-block">{source}</div>,
}));

/** Builds the subset of assistant-ui's tool-call part props that ToolCallPart reads. */
function part(
  toolName: string,
  args: Record<string, unknown>,
  extra: Partial<ToolCallMessagePartProps> = {},
): ToolCallMessagePartProps {
  return {
    type: "tool-call",
    toolCallId: `id-${toolName}`,
    toolName,
    args,
    argsText: JSON.stringify(args),
    result: undefined,
    isError: false,
    status: { type: "complete" },
    ...extra,
  } as unknown as ToolCallMessagePartProps;
}

/**
 * agui-render-registry task 1.1: characterization of the pseudo-tool-name
 * dispatch (`use-chat-runtime.ts` encodes rich blocks as tool calls named
 * `__skill__`, `__context__`, ...). The registry refactor (task 1.6) must
 * keep each of these rendering the same block.
 */
describe("ToolCallPart dispatch (characterization)", () => {
  it("__skill__ renders the skill activation block", () => {
    render(<ToolCallPart {...part("__skill__", { skillId: "s1", skillName: "Planner", status: "complete" })} />);
    expect(screen.getByText("Planner")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("__context__ renders the context update block", () => {
    render(
      <ToolCallPart
        {...part("__context__", {
          strategy: "sliding_window",
          messagesRemoved: 2,
          tokensSaved: 0,
          wasApplied: true,
          summaryGenerated: false,
        })}
      />,
    );
    expect(screen.getByText("Context managed")).toBeInTheDocument();
    expect(screen.getByText("2 messages compacted")).toBeInTheDocument();
  });

  it("__citation__ renders the citation block", () => {
    render(<ToolCallPart {...part("__citation__", { source: "Guide", content: "Snip" })} />);
    expect(screen.getByText("Guide")).toBeInTheDocument();
    expect(screen.getByText("Snip")).toBeInTheDocument();
  });

  it("__denied__ renders a blocked tool call", () => {
    render(<ToolCallPart {...part("__denied__", { toolName: "activate_skill", reason: "No" })} />);
    expect(screen.getByText("activate_skill")).toBeInTheDocument();
    expect(screen.getByText("Blocked by policy")).toBeInTheDocument();
  });

  it("__memory_recall__ and __memory_mutation__ render memory blocks", () => {
    render(
      <>
        <ToolCallPart {...part("__memory_recall__", { items: [{ key: "k", value: "v", source: "s" }], count: 1 })} />
        <ToolCallPart
          {...part("__memory_mutation__", {
            operation: "add",
            memoryId: "m1",
            content: "Prefers Mondays",
            scope: "user",
            memoryType: "preference",
          })}
        />
      </>,
    );
    expect(screen.getByText("Memory recalled")).toBeInTheDocument();
    expect(screen.getByText("Prefers Mondays")).toBeInTheDocument();
  });

  it("__artifact_input__ renders the A2UI input block", () => {
    render(
      <ToolCallPart
        {...part("__artifact_input__", {
          runId: "r1",
          artifactId: "a1",
          artifactType: "confirm",
          title: "Add it?",
          content: JSON.stringify({ message: "Add?", accept_label: "Add", cancel_label: "Skip" }),
          metadata: {},
        })}
      />,
    );
    expect(screen.getByText("Add it?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("__artifact__ (display) renders the display block with its type and content", () => {
    render(
      <ToolCallPart
        {...part("__artifact__", {
          artifactId: "a2",
          artifactType: "code",
          title: "checklist.md",
          content: "- [x] Tokens",
          language: "markdown",
          isInputRequest: false,
        })}
      />,
    );
    expect(screen.getByText("checklist.md")).toBeInTheDocument();
    expect(screen.getByText("code")).toBeInTheDocument();
    expect(screen.getByText("- [x] Tokens")).toBeInTheDocument();
  });

  it("a real tool name renders the generic tool-call block", () => {
    render(<ToolCallPart {...part("web_search", { q: "x" }, { result: "ok" })} />);
    expect(screen.getByText("web_search")).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});

/** The tool-call parts the real converter produces for a stored message. */
function convertedParts(message: RichMessage): ToolCallMessagePartProps[] {
  const converted = richMessageToThreadMessageLike(message);
  return (converted.content as ReadonlyArray<{ type: string }>)
    .filter((p) => p.type === "tool-call")
    .map((p) => ({ ...p, status: { type: "complete" } }) as unknown as ToolCallMessagePartProps);
}

describe("ToolCallPart: registry-driven rendering (tasks 1.7, 1.8)", () => {
  it("a persisted provider_event artifact renders nothing, while a code artifact beside it still renders", () => {
    // The shape a PGlite row is rehydrated into (RichMessage), as stored before this change.
    const persisted: RichMessage = {
      id: "a-persisted",
      role: "assistant",
      createdAt: new Date("2026-10-09T10:00:00Z"),
      status: "complete",
      content: [
        { type: "text", text: "Here is the plan." },
        {
          type: "artifact",
          artifactId: "art-provider",
          artifactType: "provider_event",
          title: "provider_event",
          content: JSON.stringify({ model: "gpt-x", event: "response.completed" }),
          language: "json",
          isInputRequest: false,
          metadata: {},
        },
        {
          type: "artifact",
          artifactId: "art-code",
          artifactType: "code",
          title: "checklist.md",
          content: "- [x] Tokens",
          isInputRequest: false,
          metadata: {},
        },
      ],
    };

    const parts = convertedParts(persisted);
    expect(parts).toHaveLength(2);
    const { container } = render(
      <>
        {parts.map((p) => (
          <ToolCallPart key={p.toolCallId} {...p} />
        ))}
      </>,
    );
    expect(container.textContent).not.toContain("provider_event");
    expect(container.textContent).not.toContain("gpt-x");
    expect(screen.getAllByText("Artifact")).toHaveLength(1);
    expect(screen.getByText("checklist.md")).toBeInTheDocument();
  });

  it.each(["attempt_manifest", "effective_run_policy", "turn_manifest", "some_new_type"])(
    "an artifact of type %s renders nothing",
    (artifactType) => {
      const { container } = render(
        <ToolCallPart
          {...part("__artifact__", {
            artifactId: "x",
            artifactType,
            title: "t",
            content: "{\"secret\":1}",
            isInputRequest: false,
          })}
        />,
      );
      expect(container).toBeEmptyDOMElement();
    },
  );

  it("an a2ui artifact (adapt) renders as an A2UI surface, not a code block", async () => {
    const content = [
      '{"version":"v0.9.1","createSurface":{"surfaceId":"s","catalogId":"urn:uar:a2ui:catalog:1"}}',
      '{"version":"v0.9.1","updateComponents":{"surfaceId":"s","components":[{"id":"root","component":"Card","child":"t"},{"id":"t","component":"Text","text":"Hello surface"}]}}',
    ].join("\n");
    render(
      <ToolCallPart
        {...part("__artifact__", {
          artifactId: "s",
          artifactType: "a2ui",
          title: "Surface",
          content,
          language: "application/a2ui+json",
          isInputRequest: false,
        })}
      />,
    );
    expect(await screen.findByText("Hello surface")).toBeInTheDocument();
    expect(screen.getByTestId("a2ui-surface")).toBeInTheDocument();
  });

  it("a display-only confirm artifact is inferred into a read-only A2UI surface", async () => {
    render(
      <ToolCallPart
        {...part("__artifact__", {
          artifactId: "c1",
          artifactType: "confirm",
          title: "Send the email?",
          content: JSON.stringify({ message: "Send to Ada", accept_label: "Send" }),
          isInputRequest: false,
        })}
      />,
    );
    expect(await screen.findByText("Send to Ada")).toBeInTheDocument();
    expect(screen.getByTestId("a2ui-surface")).toBeInTheDocument();
  });

  it("a confirm input request keeps its interactive form", () => {
    render(
      <ToolCallPart
        {...part("__artifact_input__", {
          runId: "r",
          artifactId: "c2",
          artifactType: "confirm",
          title: "Send the email?",
          content: JSON.stringify({ message: "Send to Ada" }),
          metadata: {},
        })}
      />,
    );
    expect(screen.queryByTestId("a2ui-surface")).not.toBeInTheDocument();
  });

  it("__cancelled__ shows a cancelled state with token usage", () => {
    render(<ToolCallPart {...part("__cancelled__", { usage: { input_tokens: 1200, output_tokens: 34 } })} />);
    expect(screen.getByRole("status")).toHaveTextContent("Run cancelled");
    expect(screen.getByText("1,200 input tokens")).toBeInTheDocument();
    expect(screen.getByText("34 output tokens")).toBeInTheDocument();
  });

  it("__cancelled__ without usage shows the cancelled state alone", () => {
    render(<ToolCallPart {...part("__cancelled__", {})} />);
    expect(screen.getByRole("status")).toHaveTextContent(/^Run cancelled$/);
  });

  it("__approval__ is a read-only indicator", () => {
    render(<ToolCallPart {...part("__approval__", { toolName: "send_email", reason: "External side effect" })} />);
    expect(screen.getByText("send_email")).toBeInTheDocument();
    expect(screen.getByText("Needs approval")).toBeInTheDocument();
    // Only the expand toggle: no approve or deny controls.
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("__subagent__ renders the lifecycle as a tool-call block", () => {
    render(<ToolCallPart {...part("__subagent__", { path: "/root/research", status: "cancelled" })} />);
    expect(screen.getByText("Subagent /root/research")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });
});
