import { describe, expect, it } from "vitest";
import { analyse } from "../../scripts/ops/validate-live.mjs";

const step = (phase: string, label: string) =>
  `event: agui.step\ndata: ${JSON.stringify({ kind: "step", phase, index: 0, label })}\n\n`;

describe("validate-live analyse: agui.step", () => {
  it("counts a denied step and accepts the fixed phases and labels", () => {
    const body = step("started", "Thinking") + step("denied", "Working") + step("finished", "Preparing an answer card");
    const result = analyse(200, body);
    expect(result.counts.denied).toBe(1);
    expect(result.problems).toEqual([]);
  });

  it("reports an unknown phase and an unknown label", () => {
    const result = analyse(200, step("exploded", "Thinking") + step("started", "Calling tool x"));
    expect(result.problems).toEqual(
      expect.arrayContaining([expect.stringContaining("phase 'exploded'"), expect.stringContaining("label 'Calling tool x'")]),
    );
  });
});
