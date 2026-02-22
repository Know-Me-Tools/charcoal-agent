import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Skill, UarSkill } from "@/types";

/** Full payload accepted by POST /api/skills. */
export interface CreateSkillPayload {
  name: string;
  version?: string;
  description: string;
  triggers?: { keywords?: string[]; semantic?: string };
  prompt_overlay?: string;
  preferred_tools?: string[];
  enabled?: boolean;
}

const SKILLS_KEY = ["skills"] as const;

/** Map UAR's wire format to the normalized Skill shape used by UI components. */
function normalizeSkill(s: UarSkill): Skill {
  return {
    id: s.skill_id,
    name: s.title,
    description: s.description ?? "",
    version: s.version,
    enabled: s.enabled ?? true,
    provider_id: s.provider_id,
    triggers: s.triggers,
    preferred_tools: s.preferred_tools,
    prompt_overlay: s.prompt_overlay,
  };
}

export function useSkills() {
  return useQuery({
    queryKey: SKILLS_KEY,
    queryFn: async (): Promise<Skill[]> => {
      const raw = await api.get<unknown>("/api/skills");
      // UAR returns a plain array; guard in case it ever wraps the response
      const list: UarSkill[] = Array.isArray(raw)
        ? (raw as UarSkill[])
        : Array.isArray((raw as Record<string, unknown>)?.skills)
          ? ((raw as Record<string, unknown>).skills as UarSkill[])
          : [];
      return list.map(normalizeSkill);
    },
  });
}

/** Toggle a skill's enabled state via POST /api/skills/{id}/toggle. */
export function useToggleSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      api.post<UarSkill>(`/api/skills/${id}/toggle`, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: SKILLS_KEY }),
  });
}

/**
 * Trigger the UAR to rescan its skills directory.
 * Call this after uploading new skill definitions to the runtime.
 */
export function useRefreshSkills() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post("/api/skills/refresh"),
    onSuccess: () => qc.invalidateQueries({ queryKey: SKILLS_KEY }),
  });
}

/** @deprecated Use useToggleSkill instead. Kept for backward compatibility. */
export function useUpdateSkill() {
  return useToggleSkill();
}

/**
 * Dynamically create a new skill on the UAR via POST /api/skills.
 *
 * The UAR will:
 * - Derive the skill_id from the name (lowercase, spaces → dashes)
 * - Persist the skill to the database and to skills/dynamic/ on the filesystem
 * - Immediately register it in the in-memory skill registry
 */
export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSkillPayload) =>
      api.post<UarSkill>("/api/skills", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: SKILLS_KEY }),
  });
}

/**
 * Permanently delete a skill from the UAR by ID via DELETE /api/skills/{id}.
 *
 * This removes the skill from the in-memory registry, the database, and the
 * dynamic filesystem directory (if present). Static filesystem skills loaded
 * from the skills/ volume cannot be deleted this way — disable them instead.
 */
export function useDeleteSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/skills/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: SKILLS_KEY }),
  });
}
