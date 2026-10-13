import { describe, expect, it } from "vitest";
import {
  CITATIONS_PART,
  STEP_GROUP_PART,
  STEP_PART,
  arrangeAssistantParts,
  type ArrangeablePart,
} from "./pseudo-parts";

const text = (t: string): ArrangeablePart => ({ type: "text", text: t });
const cites = (id: string, n: number): ArrangeablePart => ({
  type: "tool-call",
  toolCallId: id,
  toolName: CITATIONS_PART,
  args: { citations: Array.from({ length: n }, (_, i) => ({ source: `${id}-${i}.md`, content: "" })) },
});
const step = (index: number, phase: string): ArrangeablePart => ({
  type: "tool-call",
  toolCallId: `step-${index}`,
  toolName: STEP_PART,
  args: { index, phase, label: `Step ${index}` },
});
const names = (parts: ArrangeablePart[]) => parts.map((p) => p.toolName ?? p.type);

describe("arrangeAssistantParts: Sources after the prose", () => {
  it("moves the Sources block behind the reply text", () => {
    const out = arrangeAssistantParts([cites("c0", 2), text("Answer")], false);
    expect(names(out)).toEqual(["text", CITATIONS_PART]);
  });

  it("merges separated runs into one block and flags streaming", () => {
    const out = arrangeAssistantParts([cites("c0", 1), text("A"), cites("c2", 2), text("B")], true);
    expect(names(out)).toEqual(["text", "text", CITATIONS_PART]);
    expect(out[2].args).toMatchObject({ streaming: true });
    expect(out[2].args.citations).toHaveLength(3);
    expect(out[2].toolCallId).toBe("c0");
  });

  it("keeps the block in place until there is prose", () => {
    const out = arrangeAssistantParts([step(0, "started"), cites("c1", 1), text("")], true);
    expect(names(out)).toEqual([STEP_PART, CITATIONS_PART, "text"]);
  });

  it("does not mutate its input", () => {
    const input = [cites("c0", 1), text("A")];
    arrangeAssistantParts(input, false);
    expect(names(input)).toEqual([CITATIONS_PART, "text"]);
  });
});

describe("arrangeAssistantParts: finished steps", () => {
  it("folds two or more finished steps into one group", () => {
    const out = arrangeAssistantParts([step(0, "finished"), step(1, "finished"), text("A")], false);
    expect(names(out)).toEqual([STEP_GROUP_PART, "text"]);
    expect(out[0].args.steps).toEqual([
      { index: 0, label: "Step 0" },
      { index: 1, label: "Step 1" },
    ]);
  });

  it("leaves a single finished step, and any running or failed step, as rows", () => {
    expect(names(arrangeAssistantParts([step(0, "finished"), text("A")], false))).toEqual([STEP_PART, "text"]);
    expect(
      names(arrangeAssistantParts([step(0, "finished"), step(1, "finished"), step(2, "started")], true)),
    ).toEqual([STEP_GROUP_PART, STEP_PART]);
    expect(names(arrangeAssistantParts([step(0, "failed"), step(1, "failed")], false))).toEqual([
      STEP_PART,
      STEP_PART,
    ]);
  });
});
