import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Skill, CreateSkillPayload } from "@/types";

const SKILLS_KEY = ["skills"] as const;

export function useSkills() {
  return useQuery({
    queryKey: SKILLS_KEY,
    queryFn: () => api.get<Skill[]>("/api/uar/skills"),
  });
}

export function useCreateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSkillPayload) =>
      api.post<Skill>("/api/uar/skills", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: SKILLS_KEY }),
  });
}

export function useUpdateSkill() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<CreateSkillPayload> & { id: string }) =>
      api.put<Skill>(`/api/uar/skills/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: SKILLS_KEY }),
  });
}
