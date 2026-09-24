import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { KNOWME_SKILLS } from "@/lib/skills/knowme-skills";
import { createGraphTestHarness } from "@/test/utils/graph-wrapper";
import { mockFetch, type FetchMock } from "@/test/utils/mock-fetch";
import { useSkillsSync } from "./use-skills-sync";
import { useSkills, useToggleSkill } from "./use-skills";

const webSearch = { skill_id: "web-search", title: "Web Search", enabled: true };

let fetchMock: FetchMock;
afterEach(() => fetchMock?.restore());

describe("useToggleSkill", () => {
  it("updates the skill immediately and keeps the runtime's result", async () => {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    fetchMock = mockFetch({
      "GET /api/skills": () => ({ body: [webSearch] }),
      "POST /api/skills/web-search/toggle": async () => {
        await gate;
        return { body: { ...webSearch, enabled: false } };
      },
    });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => ({ skills: useSkills(), toggle: useToggleSkill() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.skills.data?.[0]?.enabled).toBe(true));

    let done!: Promise<unknown>;
    act(() => {
      done = result.current.toggle.mutateAsync({ id: "web-search", enabled: false });
    });
    // The runtime has not answered yet, but every view already shows the change.
    await waitFor(() => expect(result.current.skills.data?.[0]?.enabled).toBe(false));
    expect(result.current.toggle.isPending).toBe(true);

    release();
    await act(async () => {
      await done;
    });
    expect(result.current.toggle.isSuccess).toBe(true);
    expect(result.current.skills.data?.[0]?.enabled).toBe(false);
  });

  it("reverts the optimistic change when the runtime rejects it", async () => {
    fetchMock = mockFetch({
      "GET /api/skills": () => ({ body: [webSearch] }),
      "POST /api/skills/web-search/toggle": () => ({ status: 500, body: { error: "locked" } }),
    });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => ({ skills: useSkills(), toggle: useToggleSkill() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.skills.data?.[0]?.enabled).toBe(true));

    await act(async () => {
      await result.current.toggle.mutateAsync({ id: "web-search", enabled: false }).catch(() => {});
    });
    expect(result.current.skills.data?.[0]?.enabled).toBe(true);
    expect(result.current.toggle.isError).toBe(true);
  });
});

describe("useSkillsSync", () => {
  it("pushes missing built-in skills and refetches the mounted skills list", async () => {
    let registry = [webSearch];
    fetchMock = mockFetch({
      "GET /api/skills": () => ({ body: registry }),
      "POST /api/skills": () => ({ body: {} }),
      "POST /api/skills/refresh": () => {
        registry = [
          webSearch,
          ...KNOWME_SKILLS.map((s) => ({ skill_id: s.skill_id, title: s.title, enabled: true })),
        ];
        return { body: {} };
      },
    });
    const { wrapper } = createGraphTestHarness();
    const { result } = renderHook(() => ({ skills: useSkills(), sync: useSkillsSync() }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.skills.data).toHaveLength(1));

    await act(async () => {
      await result.current.sync.triggerSync();
    });
    expect(fetchMock.calls.filter((c) => c.method === "POST" && c.path === "/api/skills")).toHaveLength(
      KNOWME_SKILLS.length,
    );
    await waitFor(() =>
      expect(result.current.skills.data).toHaveLength(KNOWME_SKILLS.length + 1),
    );
    expect(result.current.sync.missingCount).toBe(0);
  });
});
