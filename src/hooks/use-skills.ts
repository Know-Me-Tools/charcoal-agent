import { api } from "@/lib/api-client";
import { ENTITY } from "@/lib/entity-graph/entities";
import { normalizeSkill } from "@/lib/entity-graph/mappers/skills";
import type { QueryResult } from "@/lib/entity-graph/query-result";
import { useGraphMutation } from "@/lib/entity-graph/use-graph-mutation";
import { useRuntimeList } from "@/lib/entity-graph/use-runtime-list";
import type { Skill, UarSkill } from "@/types";

/** Every skill registered in the UAR (GET /api/skills), normalized for the UI. */
export function useSkills(): QueryResult<Skill[]> {
  return useRuntimeList<Skill>(ENTITY.Skill);
}

/**
 * Toggle a skill's enabled state via POST /api/skills/{id}/toggle.
 * The change shows immediately in every view and reverts if the runtime rejects it.
 */
export function useToggleSkill() {
  return useGraphMutation<{ id: string; enabled: boolean }, UarSkill, Skill>({
    type: ENTITY.Skill,
    mutate: ({ id, enabled }) => api.post<UarSkill>(`/api/skills/${id}/toggle`, { enabled }),
    optimistic: ({ id, enabled }) => ({ id, patch: { enabled } }),
    normalize: (raw, input) =>
      raw && typeof raw === "object" && "skill_id" in raw
        ? { id: raw.skill_id, data: normalizeSkill(raw) }
        : // No body returned: the graph shallow-merges, so only `enabled` changes.
          { id: input.id, data: { enabled: input.enabled } as Skill },
  });
}

/**
 * Trigger the UAR to rescan its skills directory.
 * Call this after uploading new skill definitions to the runtime.
 */
export function useRefreshSkills() {
  return useGraphMutation<void, unknown>({
    type: ENTITY.Skill,
    mutate: () => api.post("/api/skills/refresh"),
    invalidateTypes: [ENTITY.Skill],
  });
}
