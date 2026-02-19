import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Agent, CreateAgentPayload } from "@/types";

const AGENTS_KEY = ["agents"] as const;

export function useAgents() {
  return useQuery({
    queryKey: AGENTS_KEY,
    queryFn: () => api.get<Agent[]>("/api/uar/agents"),
  });
}

export function useAgent(id: string | undefined) {
  return useQuery({
    queryKey: ["agents", id],
    queryFn: () => api.get<Agent>(`/api/uar/agents/${id}`),
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAgentPayload) =>
      api.post<Agent>("/api/uar/agents", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

export function useUpdateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: Partial<CreateAgentPayload> & { id: string }) =>
      api.put<Agent>(`/api/uar/agents/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/uar/agents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}
