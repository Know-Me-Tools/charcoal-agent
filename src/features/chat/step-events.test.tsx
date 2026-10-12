import { render, screen } from "@testing-library/react";
import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RichMessage, StepContentBlock } from "@/types/chat-content";

// PGlite is not available in jsdom; see use-message-stream.dispatch.test.ts.
vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    throw new Error("no db in tests");
  },
  whenDbReady: () => new Promise<never>(() => {}),
}));

const { useChatMessageStore } = await import("@/stores/chat-message-store");
const { dispatchAguiEvent } = await import("./agui-event-handlers");
const { richMessageToThreadMessageLike } = await import("./use-chat-runtime");
const { ToolCallPart } = await import("./render-registry/tool-call-part");
const { StepBlock } = await import("./components/step-block");

const THREAD = "t-step";
const RUN = "run-step";

function ctx() {
  return { threadId: THREAD, runId: RUN, pendingArgs: new Map<string, string>() };
}

function step(phase: unknown, index: unknown, label: unknown): string {
  return JSON.stringify({ kind: "step", phase, index, label });
}

function emit(data: string) {
  return dispatchAguiEvent("agui.step", data, ctx());
}

function steps(): StepContentBlock[] {
  const msgs = useChatMessageStore.getState().messagesByThread[THREAD] ?? [];
  return msgs.flatMap((m) => m.content).filter((b): b is StepContentBlock => b.type === "step");
}

beforeEach(() => {
  const s = useChatMessageStore.getState();
  s.clearThread(THREAD);
  s.initThread(THREAD, []);
  s.beginStream(THREAD, RUN);
});

describe("agui.step handler", () => {
  it("updates the same block when a step goes from started to finished", () => {
    emit(step("started", 0, "Thinking"));
    emit(step("finished", 0, "Thinking"));
    expect(steps()).toEqual([{ type: "step", index: 0, phase: "finished", label: "Thinking" }]);
  });

  it("keeps different indexes as separate blocks, in arrival order", () => {
    emit(step("started", 0, "Thinking"));
    emit(step("started", 1, "Working"));
    emit(step("failed", 1, "Working"));
    expect(steps().map((s) => [s.index, s.phase])).toEqual([
      [0, "started"],
      [1, "failed"],
    ]);
  });

  it("records a denied step", () => {
    emit(step("denied", 2, "Working"));
    expect(steps()).toEqual([{ type: "step", index: 2, phase: "denied", label: "Working" }]);
  });

  it("ignores an unknown phase", () => {
    emit(step("exploded", 0, "Thinking"));
    expect(steps()).toHaveLength(0);
  });

  it("ignores a missing or empty label", () => {
    emit(JSON.stringify({ kind: "step", phase: "started", index: 0 }));
    emit(step("started", 1, ""));
    emit(step("started", 2, 42));
    expect(steps()).toHaveLength(0);
  });

  it("ignores a bad index", () => {
    emit(step("started", "0", "Thinking"));
    emit(step("started", -1, "Thinking"));
    emit(step("started", 1.5, "Thinking"));
    expect(steps()).toHaveLength(0);
  });

  it("renders at most 20 steps per message", () => {
    for (let i = 0; i < 25; i++) emit(step("started", i, "Working"));
    expect(steps()).toHaveLength(20);
    // A late update to an existing step still applies after the cap is hit.
    emit(step("finished", 3, "Working"));
    expect(steps().find((s) => s.index === 3)?.phase).toBe("finished");
  });
});

describe("step conversion", () => {
  const base = (content: RichMessage["content"], status: RichMessage["status"]): RichMessage => ({
    id: "m1",
    role: "assistant",
    content,
    createdAt: new Date(),
    status,
  });

  it("encodes a step as a pseudo part and keeps metadata", () => {
    const converted = richMessageToThreadMessageLike(
      base([{ type: "step", index: 4, phase: "finished", label: "Thinking" }], "in_progress"),
    );
    expect(converted.metadata).toBeDefined();
    const part = (converted.content as unknown as Array<Record<string, unknown>>)[0];
    expect(part).toMatchObject({
      type: "tool-call",
      toolCallId: "step-4",
      toolName: "__step__",
      args: { index: 4, phase: "finished", label: "Thinking" },
    });
  });

  it("does not leave a step pulsing once its message is settled", () => {
    const started: StepContentBlock = { type: "step", index: 0, phase: "started", label: "Working" };
    const phaseOf = (status: RichMessage["status"]) =>
      (
        (richMessageToThreadMessageLike(base([started], status)).content as unknown as Array<{
          args: { phase: string };
        }>)[0]
      ).args.phase;
    expect(phaseOf("in_progress")).toBe("started");
    expect(phaseOf("complete")).toBe("finished");
    expect(phaseOf("failed")).toBe("failed");
  });
});

describe("StepBlock", () => {
  it("states each phase in words", () => {
    const { rerender } = render(<StepBlock phase="started" label="Thinking" />);
    expect(screen.getByRole("status")).toHaveTextContent("Thinking");
    expect(screen.getByRole("status")).toHaveTextContent("in progress");

    rerender(<StepBlock phase="finished" label="Thinking" />);
    expect(screen.getByRole("status")).toHaveTextContent("done");

    rerender(<StepBlock phase="failed" label="Working" />);
    expect(screen.getByRole("status")).toHaveTextContent("Working");
    expect(screen.getByRole("status")).toHaveTextContent("did not complete");

    rerender(<StepBlock phase="denied" label="Working" />);
    expect(screen.getByRole("status")).toHaveTextContent("not permitted");
  });

  it("is polite and not focusable, with no controls", () => {
    render(<StepBlock phase="started" label="Thinking" />);
    const el = screen.getByRole("status");
    expect(el).not.toHaveAttribute("aria-live", "assertive");
    expect(el).not.toHaveAttribute("tabindex");
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("only the started mark animates, and it stops under reduced motion", () => {
    const { container, rerender } = render(<StepBlock phase="started" label="Thinking" />);
    const mark = container.querySelector("[data-step-mark]");
    expect(mark?.className).toContain("animate-shimmer");
    expect(mark?.className).toContain("motion-reduce:animate-none");

    rerender(<StepBlock phase="finished" label="Thinking" />);
    expect(container.querySelector("[data-step-mark]")?.className).not.toContain("animate-shimmer");
  });

  it("renders the label as plain text, not markup or markdown", () => {
    const label = '<img src=x onerror="alert(1)"> **bold** [a](http://x.test)';
    const { container } = render(<StepBlock phase="started" label={label} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("strong")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent(label);
  });

  it("renders nothing for an unknown phase or missing label", () => {
    const { container, rerender } = render(<StepBlock phase={"nope" as never} label="Thinking" />);
    expect(container).toBeEmptyDOMElement();
    rerender(<StepBlock phase="started" label={undefined as never} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe("ToolCallPart routing", () => {
  it("routes __step__ to the step block", () => {
    const props = {
      type: "tool-call",
      toolCallId: "step-0",
      toolName: "__step__",
      args: { index: 0, phase: "failed", label: "Working" },
      argsText: "",
      result: undefined,
      isError: false,
      status: { type: "complete" },
    } as unknown as ToolCallMessagePartProps;
    render(<ToolCallPart {...props} />);
    expect(screen.getByRole("status")).toHaveTextContent("did not complete");
  });
});
