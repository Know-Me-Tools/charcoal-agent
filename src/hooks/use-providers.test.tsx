import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createGraphTestHarness } from "@/test/utils/graph-wrapper";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";
import {
  useSetDefaultProvider,
  useCreateProvider,
  useDeleteProvider,
  useProviderModels,
  useProviders,
  useTestConnection,
} from "./use-providers";

const openai = { id: "openai", display_name: "OpenAI", protocol: "openai", enabled: true };
const anthropic = { id: "anthropic", display_name: "Anthropic", protocol: "anthropic", enabled: true };

let fetchMock: FetchMock;
afterEach(() => fetchMock?.restore());

const countCalls = (path: string, method = "GET") =>
  fetchMock.calls.filter((c) => c.path === path && c.method === method).length;

describe("useProviders", () => {
  it("returns providers and the default id from a single request", async () => {
    fetchMock = mockFetch({
      "GET /api/providers": () => ({ body: { providers: [openai, anthropic], default_id: "anthropic" } }),
    });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useProviders(), { wrapper });

    await waitFor(() => expect(result.current.data?.defaultId).toBe("anthropic"));
    expect(result.current.data?.providers.map((p) => p.id)).toEqual(["openai", "anthropic"]);
    expect(countCalls("/api/providers")).toBe(1);
  });

  it("reports a failure instead of partial data when providers cannot load", async () => {
    fetchMock = mockFetch({ "GET /api/providers": () => ({ status: 500, body: { error: "down" } }) });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useProviders(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
    expect(result.current.isLoading).toBe(false);
  });

  it("withholds data until the default id has loaded", async () => {
    fetchMock = mockFetch({
      "GET /api/providers": () => ({ body: { providers: [openai], default_id: "openai" } }),
    });
    const { wrapper, store } = createGraphTestHarness();
    // Providers already in the graph from another view, default id not yet known.
    store.getState().upsertEntity("Provider", "openai", openai);
    const { result } = renderHook(() => useProviders(), { wrapper });
    expect(result.current.data).toBeUndefined();
    await waitFor(() => expect(result.current.data?.defaultId).toBe("openai"));
  });

  it("refreshes the default id after setting a new default", async () => {
    let defaultId = "openai";
    fetchMock = mockFetch({
      "GET /api/providers": () => ({ body: { providers: [openai, anthropic], default_id: defaultId } }),
      "POST /api/providers/anthropic/default": () => {
        defaultId = "anthropic";
        return { body: {} };
      },
    });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => ({ list: useProviders(), setDefault: useSetDefaultProvider() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.list.data?.defaultId).toBe("openai"));

    await act(async () => {
      await result.current.setDefault.mutateAsync("anthropic");
    });
    await waitFor(() => expect(result.current.list.data?.defaultId).toBe("anthropic"));
  });

  it("accepts the legacy flat-array response", async () => {
    fetchMock = mockFetch({ "GET /api/providers": () => ({ body: [openai] }) });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useProviders(), { wrapper });
    await waitFor(() => expect(result.current.data?.providers).toHaveLength(1));
    expect(result.current.data?.defaultId).toBeUndefined();
  });

  it("refetches the list after a provider is created and after one is deleted", async () => {
    let providers = [openai];
    fetchMock = mockFetch({
      "GET /api/providers": () => ({ body: { providers, default_id: "openai" } }),
      "POST /api/providers": () => {
        providers = [openai, anthropic];
        return { body: { providers, default_id: "openai" } };
      },
      "DELETE /api/providers/openai": () => {
        providers = [anthropic];
        return { body: {} };
      },
    });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(
      () => ({ list: useProviders(), create: useCreateProvider(), remove: useDeleteProvider() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.list.data?.providers).toHaveLength(1));

    await act(async () => {
      await result.current.create.mutateAsync({
        id: "anthropic",
        display_name: "Anthropic",
        protocol: "anthropic",
      });
    });
    await waitFor(() =>
      expect(result.current.list.data?.providers.map((p) => p.id)).toEqual(["openai", "anthropic"]),
    );

    await act(async () => {
      await result.current.remove.mutateAsync("openai");
    });
    await waitFor(() =>
      expect(result.current.list.data?.providers.map((p) => p.id)).toEqual(["anthropic"]),
    );
  });
});

describe("useProviderModels", () => {
  it("loads models per provider and skips when no provider is selected", async () => {
    fetchMock = mockFetch({
      "GET /api/providers/openai/models": () => ({
        body: [{ id: "gpt-5.2", display_name: "GPT-5.2", context_window: 1, supports_vision: true, supports_tools: true, max_output_tokens: 1 }],
      }),
    });
    const { wrapper } = createGraphTestHarness();
    const { result, rerender } = renderHook(({ id }: { id?: string }) => useProviderModels(id), {
      wrapper,
      initialProps: { id: undefined as string | undefined },
    });
    expect(fetchMock.calls).toHaveLength(0);
    expect(result.current.data).toBeUndefined();

    rerender({ id: "openai" });
    await waitFor(() => expect(result.current.data?.[0]?.id).toBe("gpt-5.2"));
  });

  it("never stores a late response for a previous provider under the current one", async () => {
    let releaseSlow!: () => void;
    const slow = new Promise<void>((r) => (releaseSlow = r));
    const model = (id: string) => ({ id, display_name: id, context_window: 1, supports_vision: false, supports_tools: true, max_output_tokens: 1 });
    fetchMock = mockFetch({
      "GET /api/providers/slow/models": async () => {
        await slow;
        return { body: [model("slow-model")] };
      },
      "GET /api/providers/fast/models": () => ({ body: [model("fast-model")] }),
    });
    const { wrapper } = createGraphTestHarness();
    const { result, rerender } = renderHook(({ id }: { id: string }) => useProviderModels(id), {
      wrapper,
      initialProps: { id: "slow" },
    });
    await waitFor(() => expect(fetchMock.calls.some((c) => c.path.includes("/slow/"))).toBe(true));

    rerender({ id: "fast" });
    await waitFor(() => expect(result.current.data?.map((m) => m.id)).toEqual(["fast-model"]));
    await act(async () => {
      releaseSlow();
      await slow;
    });
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.data?.map((m) => m.id)).toEqual(["fast-model"]);
  });

  it("stores each model once, keyed by provider and model id", async () => {
    fetchMock = mockFetch({
      "GET /api/providers/openai/models": () => ({
        body: [
          { id: "gpt-5.2", display_name: "GPT-5.2", context_window: 1, supports_vision: true, supports_tools: true, max_output_tokens: 1 },
          { id: "gpt-5.2-mini", display_name: "mini", context_window: 1, supports_vision: false, supports_tools: true, max_output_tokens: 1 },
        ],
      }),
    });
    const { wrapper, store } = createGraphTestHarness();
    const { result } = renderHook(() => useProviderModels("openai"), { wrapper });
    await waitFor(() => expect(result.current.data).toHaveLength(2));

    const stored = store.getState().entities.ProviderModel ?? {};
    expect(Object.keys(stored).sort()).toEqual(["openai::gpt-5.2", "openai::gpt-5.2-mini"]);

    act(() => {
      store.getState().patchEntity("ProviderModel", "openai::gpt-5.2", { display_name: "Renamed" });
    });
    await waitFor(() => expect(result.current.data?.[0]?.display_name).toBe("Renamed"));
  });
});

describe("useTestConnection", () => {
  it("exposes latency and which provider was tested", async () => {
    fetchMock = mockFetch({ "GET /api/providers/openai": () => ({ body: openai }) });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useTestConnection(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync("openai");
    });
    expect(result.current.variables).toBe("openai");
    expect(typeof result.current.data).toBe("number");
  });
});
