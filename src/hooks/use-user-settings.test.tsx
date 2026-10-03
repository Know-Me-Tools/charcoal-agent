import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createGraphTestHarness } from "@/test/utils/graph-wrapper";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";
import type { UserSettings } from "@/types";
import { useSaveUserSettings, useUserSettings } from "./use-user-settings";

const settings: UserSettings = {
  user_id: "u1",
  prompt_caching_enabled: null,
  preferred_scope: "session",
  updated_at: "2026-09-01T00:00:00Z",
};

let fetchMock: FetchMock;
afterEach(() => fetchMock?.restore());

describe("useUserSettings", () => {
  it("loads settings when the runtime uses JWT auth", async () => {
    fetchMock = mockFetch({ "GET /api/uar/user/settings": () => ({ body: settings }) });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useUserSettings(true), { wrapper });
    await waitFor(() => expect(result.current.data?.preferred_scope).toBe("session"));
  });

  it("makes no request when JWT auth is not configured", async () => {
    fetchMock = mockFetch({});
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useUserSettings(false), { wrapper });
    await new Promise((r) => setTimeout(r, 50));
    expect(fetchMock.calls).toHaveLength(0);
    expect(result.current.data).toBeUndefined();
  });

  it("exposes a load failure", async () => {
    fetchMock = mockFetch({ "GET /api/uar/user/settings": () => ({ status: 403, body: { error: "forbidden" } }) });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useUserSettings(true), { wrapper });
    // The engine retries once (1 s backoff) before recording the failure.
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
    expect(result.current.isLoading).toBe(false);
  });
});

describe("useSaveUserSettings", () => {
  it("writes the runtime's saved copy into the graph", async () => {
    fetchMock = mockFetch({
      "GET /api/uar/user/settings": () => ({ body: settings }),
      "PUT /api/uar/user/settings": (req) => ({ body: { ...settings, ...(req.body as object) } }),
    });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => ({ read: useUserSettings(true), save: useSaveUserSettings() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.read.data).toBeDefined());

    await act(async () => {
      await result.current.save.mutateAsync({ prompt_caching_enabled: true, preferred_scope: "user" });
    });
    await waitFor(() => expect(result.current.read.data?.preferred_scope).toBe("user"));
    expect(result.current.read.data?.prompt_caching_enabled).toBe(true);
  });

  it("surfaces a save failure as an Error", async () => {
    fetchMock = mockFetch({ "PUT /api/uar/user/settings": () => ({ status: 422, body: { error: "bad scope" } }) });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useSaveUserSettings(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ prompt_caching_enabled: null, preferred_scope: "agent" }).catch(() => {});
    });
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toContain("bad scope");
  });
});
