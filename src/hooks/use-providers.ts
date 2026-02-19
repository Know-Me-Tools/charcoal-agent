import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Provider,
  Model,
  CreateProviderPayload,
  UpdateProviderPayload,
} from "@/types";

const PROVIDERS_KEY = ["providers"] as const;

export function useProviders() {
  return useQuery({
    queryKey: PROVIDERS_KEY,
    queryFn: () => api.get<Provider[]>("/api/uar/providers"),
  });
}

export function useProvider(id: string | undefined) {
  return useQuery({
    queryKey: ["providers", id],
    queryFn: () => api.get<Provider>(`/api/uar/providers/${id}`),
    enabled: !!id,
  });
}

export function useProviderModels(providerId: string | undefined) {
  return useQuery({
    queryKey: ["providers", providerId, "models"],
    queryFn: () => api.get<Model[]>(`/api/uar/providers/${providerId}/models`),
    enabled: !!providerId,
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProviderPayload) =>
      api.post<Provider>("/api/uar/providers", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProviderPayload & { id: string }) =>
      api.put<Provider>(`/api/uar/providers/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/uar/providers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}

export function useSetDefaultProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/uar/providers/${id}/default`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: async (id: string) => {
      const start = performance.now();
      await api.get(`/api/uar/providers/${id}`);
      return Math.round(performance.now() - start);
    },
  });
}
