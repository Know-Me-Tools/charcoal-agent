import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createGraphTestHarness } from "@/test/utils/graph-wrapper";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";

vi.mock("@/lib/db/pglite", () => ({
  getDbInstance: () => ({ getMessages: async () => [] }),
}));

const { useChatMessages } = await import("./use-chat-messages");

let fetchMock: FetchMock;
afterEach(() => fetchMock?.restore());

describe("useChatMessages server-transcript fallback", () => {
  it("stops loading and exposes the error when the transcript request fails", async () => {
    useThreadRegistryStore.setState((s) => ({
      ...s,
      threads: {
        ...s.threads,
        t1: { id: "t1", sessionId: "t1", title: "Persisted", isEphemeral: false, createdAt: "", updatedAt: "" },
      },
    }));
    fetchMock = mockFetch({
      "GET /api/sessions/t1/messages": () => ({ status: 404, body: { error: "no such session" } }),
    });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useChatMessages("t1"), { wrapper });

    await waitFor(() => expect(result.current.transcriptError).not.toBeNull(), { timeout: 5000 });
    expect(result.current.isLoading).toBe(false);
  });
});
