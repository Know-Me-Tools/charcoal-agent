import { describe, expect, it, vi } from "vitest";
import { createRenderRegistry, type RenderKey } from "./registry";
import { DEFAULT_RENDER_ENTRIES, defaultRenderRegistry } from "./default-entries";
import { AGUI_EVENT_HANDLERS } from "@/features/chat/agui-event-handlers";

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => {
    throw new Error("no db in tests");
  },
  whenDbReady: () => new Promise<never>(() => {}),
}));

describe("createRenderRegistry", () => {
  it("resolves an exact entry", () => {
    const registry = createRenderRegistry([
      { kind: "event", name: "agui.done", disposition: "render", reason: "r" },
    ]);
    expect(registry.resolve({ kind: "event", name: "agui.done" })).toEqual({
      disposition: "render",
      reason: "r",
      known: true,
    });
  });

  it("hides an unknown key and reports it once per lookup", () => {
    const onUnknown = vi.fn();
    const registry = createRenderRegistry([], { onUnknown });
    const key: RenderKey = { kind: "artifact", name: "mystery" };
    expect(registry.resolve(key)).toMatchObject({ disposition: "hide", known: false });
    expect(onUnknown).toHaveBeenCalledWith(key);
  });

  it("keeps key kinds apart", () => {
    const onUnknown = vi.fn();
    const registry = createRenderRegistry(
      [{ kind: "artifact", name: "a2ui", disposition: "adapt", reason: "r" }],
      { onUnknown },
    );
    expect(registry.resolve({ kind: "event", name: "a2ui" }).known).toBe(false);
  });

  it("prefers an exact entry over a wildcard, and the longest wildcard over a shorter one", () => {
    const registry = createRenderRegistry([
      { kind: "event", name: "agui.*", disposition: "hide", reason: "all" },
      { kind: "event", name: "agui.subagent.*", disposition: "render", reason: "subagent" },
      { kind: "event", name: "agui.subagent.error", disposition: "adapt", reason: "exact" },
    ]);
    expect(registry.resolve({ kind: "event", name: "agui.subagent.started" }).reason).toBe("subagent");
    expect(registry.resolve({ kind: "event", name: "agui.subagent.error" }).reason).toBe("exact");
    expect(registry.resolve({ kind: "event", name: "agui.other" }).reason).toBe("all");
  });

  it("warns in development, once per unknown key, by default", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const registry = createRenderRegistry([]);
    registry.resolve({ kind: "event", name: "agui.never.seen.before" });
    registry.resolve({ kind: "event", name: "agui.never.seen.before" });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toContain("agui.never.seen.before");
    warn.mockRestore();
  });
});

describe("default entries", () => {
  it.each([
    "provider_event",
    "attempt_manifest",
    "effective_run_policy",
    "turn_manifest",
  ])("hides the %s diagnostic artifact", (name) => {
    expect(defaultRenderRegistry.resolve({ kind: "artifact", name }).disposition).toBe("hide");
  });

  it.each(["runtime.run", "runtime.step", "agui.budget.alert", "agui.guardrail", "agui.mcp.state", "agui.quality.sycophancy"])(
    "hides the %s diagnostic event",
    (name) => {
      expect(defaultRenderRegistry.resolve({ kind: "event", name }).disposition).toBe("hide");
    },
  );

  it("adapts the A2UI carriers", () => {
    expect(defaultRenderRegistry.resolve({ kind: "artifact", name: "a2ui" }).disposition).toBe("adapt");
    expect(defaultRenderRegistry.resolve({ kind: "event", name: "agui.state.patch" }).disposition).toBe("adapt");
  });

  it("every render or adapt event entry has a stream handler, and every handler has an entry", () => {
    const shown = DEFAULT_RENDER_ENTRIES.filter((e) => e.kind === "event" && e.disposition !== "hide").map(
      (e) => e.name,
    );
    expect([...shown].sort()).toEqual(Object.keys(AGUI_EVENT_HANDLERS).sort());
  });
});
