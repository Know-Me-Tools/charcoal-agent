import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createGraphTestHarness } from "@/test/utils/graph-wrapper";
import { ENTITY } from "./entities";
import { useGraphMutation } from "./use-graph-mutation";

interface Item {
  id: string;
  enabled: boolean;
}

describe("useGraphMutation", () => {
  it("reports pending then success with data and variables", async () => {
    const { wrapper } = createGraphTestHarness();
    let resolve!: (v: Item) => void;
    const apiFn = vi.fn(() => new Promise<Item>((r) => (resolve = r)));
    const { result } = renderHook(
      () => useGraphMutation<string, Item>({ type: ENTITY.Skill, mutate: apiFn }),
      { wrapper },
    );

    act(() => result.current.mutate("s1"));
    await waitFor(() => expect(result.current.isPending).toBe(true));
    expect(result.current.variables).toBe("s1");

    await act(async () => resolve({ id: "s1", enabled: true }));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.isPending).toBe(false);
    expect(result.current.data).toEqual({ id: "s1", enabled: true });
    expect(result.current.error).toBeNull();
  });

  it("exposes the real Error and rejects mutateAsync on failure", async () => {
    const { wrapper } = createGraphTestHarness();
    const failure = new Error("runtime said no");
    const { result } = renderHook(
      () =>
        useGraphMutation<string, Item>({
          type: ENTITY.Skill,
          mutate: () => Promise.reject(failure),
        }),
      { wrapper },
    );

    await act(async () => {
      await expect(result.current.mutateAsync("s1")).rejects.toBe(failure);
    });
    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(failure);
  });

  it("runs hook-level then per-call callbacks", async () => {
    const { wrapper } = createGraphTestHarness();
    const order: string[] = [];
    const { result } = renderHook(
      () =>
        useGraphMutation<string, Item>({
          type: ENTITY.Skill,
          mutate: async (id) => ({ id, enabled: true }),
          onSuccess: () => order.push("hook"),
        }),
      { wrapper },
    );

    await act(async () => {
      result.current.mutate("s1", { onSuccess: () => order.push("call") });
    });
    await waitFor(() => expect(order).toEqual(["hook", "call"]));
  });

  it("calls per-call onError with the failing input", async () => {
    const { wrapper } = createGraphTestHarness();
    const onError = vi.fn();
    const { result } = renderHook(
      () =>
        useGraphMutation<string, Item>({
          type: ENTITY.Skill,
          mutate: () => Promise.reject(new Error("boom")),
        }),
      { wrapper },
    );

    await act(async () => result.current.mutate("s9", { onError }));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.any(Error), "s9"));
  });

  it("invalidates the listed entity types after success", async () => {
    const { wrapper, store } = createGraphTestHarness();
    store.getState().upsertEntity(ENTITY.Agent, "a1", { id: "a1" });
    store.getState().setEntityFetched(ENTITY.Agent, "a1");
    expect(store.getState().entityStates[`${ENTITY.Agent}:a1`]?.stale).toBe(false);

    const { result } = renderHook(
      () =>
        useGraphMutation<string, Item>({
          type: ENTITY.Skill,
          mutate: async (id) => ({ id, enabled: true }),
          invalidateTypes: [ENTITY.Agent],
        }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync("s1");
    });
    expect(store.getState().entityStates[`${ENTITY.Agent}:a1`]?.stale).toBe(true);
  });

  it("applies an optimistic patch and rolls it back on failure", async () => {
    const { wrapper, store } = createGraphTestHarness();
    store.getState().upsertEntity(ENTITY.Skill, "s1", { id: "s1", enabled: true });
    let reject!: (e: Error) => void;
    const { result } = renderHook(
      () =>
        useGraphMutation<string, Item, Item>({
          type: ENTITY.Skill,
          mutate: () => new Promise<Item>((_, r) => (reject = r)),
          optimistic: (id) => ({ id, patch: { enabled: false } }),
        }),
      { wrapper },
    );

    act(() => result.current.mutate("s1"));
    await waitFor(() =>
      expect(store.getState().readEntity<Item>(ENTITY.Skill, "s1")?.enabled).toBe(false),
    );
    await act(async () => reject(new Error("nope")));
    await waitFor(() =>
      expect(store.getState().readEntity<Item>(ENTITY.Skill, "s1")?.enabled).toBe(true),
    );
  });
});
