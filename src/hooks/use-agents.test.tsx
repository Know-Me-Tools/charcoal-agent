import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createGraphTestHarness } from "@/test/utils/graph-wrapper";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";
import { useAgent, useAgents, useCompileAgent } from "./use-agents";

const agentsBody = {
  runtime_agents: [
    {
      id: "knowme",
      metadata: { title: "KnowMe" },
      skills: [{ skill_id: "web-search", title: "Web Search" }],
      prompt: { system: "Be helpful." },
      policy: { provider: { default: { provider: "openai", model: "gpt-5.2" } } },
    },
  ],
  federated_agents: [{ id: "remote", metadata: { title: "Remote" } }],
};

let fetchMock: FetchMock;
afterEach(() => fetchMock?.restore());

describe("useAgents", () => {
  it("flattens runtime and federated agents with their source", async () => {
    fetchMock = mockFetch({ "GET /api/agents": () => ({ body: agentsBody }) });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useAgents(), { wrapper });

    await waitFor(() => expect(result.current.data).toHaveLength(2));
    const [knowme, remote] = result.current.data!;
    expect(knowme).toMatchObject({
      id: "knowme",
      name: "KnowMe",
      source: "runtime",
      provider_id: "openai",
      model_id: "gpt-5.2",
      skills: ["web-search"],
    });
    expect(remote).toMatchObject({ id: "remote", source: "federated" });
  });

  it("reports an error and stops loading when the runtime fails", async () => {
    fetchMock = mockFetch({ "GET /api/agents": () => ({ status: 500, body: { error: "down" } }) });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useAgents(), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeInstanceOf(Error);
    // A failed first load is not an empty list.
    expect(result.current.data).toBeUndefined();
  });
});

describe("useAgents empty runtime", () => {
  it("reports an empty list once the runtime answers with no agents", async () => {
    fetchMock = mockFetch({ "GET /api/agents": () => ({ body: {} }) });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useAgents(), { wrapper });
    await waitFor(() => expect(result.current.data).toEqual([]));
  });
});

describe("useAgent", () => {
  it("derives one agent from the shared list", async () => {
    fetchMock = mockFetch({ "GET /api/agents": () => ({ body: agentsBody }) });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => useAgent("remote"), { wrapper });
    await waitFor(() => expect(result.current.data?.name).toBe("Remote"));
  });
});

describe("useCompileAgent", () => {
  it("posts the agent document and refetches the agent list", async () => {
    fetchMock = mockFetch({
      "GET /api/agents": () => ({ body: agentsBody }),
      "POST /api/compiler/compile": () => ({ body: { ok: true } }),
    });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => ({ list: useAgents(), compile: useCompileAgent() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(2));
    const listCallsBefore = fetchMock.calls.filter((c) => c.path === "/api/agents").length;

    await act(async () => {
      await result.current.compile.mutateAsync({
        name: "Writer",
        description: "Drafts text",
        systemPrompt: "Write clearly.",
        providerId: "openai",
        modelId: "gpt-5.2",
        skills: [],
      });
    });

    const compileCall = fetchMock.calls.find((c) => c.path === "/api/compiler/compile");
    expect((compileCall?.body as { content: string }).content).toContain("# Agent: Writer");
    await waitFor(() =>
      expect(fetchMock.calls.filter((c) => c.path === "/api/agents").length).toBeGreaterThan(
        listCallsBefore,
      ),
    );
  });
});
