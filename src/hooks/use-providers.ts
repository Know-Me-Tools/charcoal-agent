import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  UarProvider,
  UarModel,
  ProvidersResponse,
  CreateProviderPayload,
  UpdateProviderPayload,
} from "@/types";

const PROVIDERS_KEY = ["providers"] as const;

export interface ProvidersResult {
  providers: UarProvider[];
  /** The ID of the currently default provider, if set. */
  defaultId: string | undefined;
}

export function useProviders() {
  return useQuery({
    queryKey: PROVIDERS_KEY,
    queryFn: async (): Promise<ProvidersResult> => {
      const raw = await api.get<unknown>("/api/providers");

      if (Array.isArray(raw)) {
        // Legacy flat-list response — treat as providers with no default
        return { providers: raw as UarProvider[], defaultId: undefined };
      }

      if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        // UAR returns { providers: UarProvider[], default_id?: string }
        const list = obj.providers ?? obj.data ?? obj.items ?? [];
        const defaultId =
          typeof obj.default_id === "string" ? obj.default_id : undefined;
        if (Array.isArray(list)) {
          return { providers: list as UarProvider[], defaultId };
        }
      }

      return { providers: [], defaultId: undefined };
    },
  });
}

export function useProvider(id: string | undefined) {
  return useQuery({
    queryKey: ["providers", id],
    queryFn: () => api.get<UarProvider>(`/api/providers/${id}`),
    enabled: !!id,
  });
}

export function useProviderModels(providerId: string | undefined) {
  return useQuery({
    queryKey: ["providers", providerId, "models"],
    queryFn: () => api.get<UarModel[]>(`/api/providers/${providerId}/models`),
    enabled: !!providerId,
  });
}

export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProviderPayload) =>
      api.post<ProvidersResponse>("/api/providers", payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}

export function useUpdateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateProviderPayload & { id: string }) =>
      api.put<UarProvider>(`/api/providers/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}

export function useDeleteProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/providers/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}

export function useSetDefaultProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/providers/${id}/default`),
    onSuccess: () => qc.invalidateQueries({ queryKey: PROVIDERS_KEY }),
  });
}

export function useTestConnection() {
  return useMutation({
    mutationFn: async (id: string) => {
      const start = performance.now();
      await api.get(`/api/providers/${id}`);
      return Math.round(performance.now() - start);
    },
  });
}
