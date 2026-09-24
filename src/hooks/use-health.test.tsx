import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createGraphTestHarness } from "@/test/utils/graph-wrapper";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";
import { useHealth } from "./use-health";

let fetchMock: FetchMock;
afterEach(() => fetchMock?.restore());

describe("useHealth", () => {
  it("treats an empty 200 body as reachable", async () => {
    fetchMock = mockFetch({ "GET /healthz": () => ({ status: 200 }) });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useHealth(), { wrapper });
    await waitFor(() => expect(result.current.data?.status).toBe("ok"));
    expect(result.current.isError).toBe(false);
  });

  it("reports an error status when the runtime is unreachable", async () => {
    fetchMock = mockFetch({ "GET /healthz": () => ({ status: 503 }) });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useHealth(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
    expect(result.current.data?.status).toBe("error");
    expect(result.current.isLoading).toBe(false);
  });
});
