import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useEntity, useGraphStoreApi } from "@prometheus-ags/prometheus-entity-management";
import { api } from "@/lib/api-client";
import { ENTITY, REGISTRY_ID, providerModelId } from "@/lib/entity-graph/entities";
import { toQueryResult, type QueryResult } from "@/lib/entity-graph/query-result";
import { fetchProvidersResponse } from "@/lib/entity-graph/transports";
import { useGraphMutation } from "@/lib/entity-graph/use-graph-mutation";
import { useRuntimeList } from "@/lib/entity-graph/use-runtime-list";
import type {
  UarProvider,
  UarModel,
  ProvidersResponse,
  CreateProviderPayload,
  UpdateProviderPayload,
} from "@/types";

export interface ProvidersResult {
  providers: UarProvider[];
  /** The ID of the currently default provider, if set. */
  defaultId: string | undefined;
}

interface ProviderRegistry {
  id: string;
  defaultId: string | undefined;
}

interface ProviderModelSet {
  id: string;
  modelIds: string[];
}

/** Everything a provider change can affect: the list and the default-id registry. */
const PROVIDER_TYPES = [ENTITY.Provider, ENTITY.ProviderRegistry];

/**
 * Providers (normalized, one record per id) plus the runtime's default id.
 * Both come from one GET /api/providers request.
 */
export function useProviders(): QueryResult<ProvidersResult> {
  const list = useRuntimeList<UarProvider>(ENTITY.Provider);
  const registry = useEntity<ProviderRegistry, ProviderRegistry>({
    type: ENTITY.ProviderRegistry,
    id: REGISTRY_ID,
    fetch: async () => {
      const { defaultId } = await fetchProvidersResponse();
      return { id: REGISTRY_ID, defaultId };
    },
    normalize: (raw) => raw,
  });

  const value: ProvidersResult = {
    providers: list.data ?? [],
    defaultId: registry.data?.defaultId,
  };
  // The default id is part of the result: its loading and failure count too.
  const registryError = registry.error ? new Error(registry.error) : null;
  const error = list.error ?? registryError;
  const isLoading = list.isLoading || (registry.isLoading && !registryError);
  // `useEntity` reports an unloaded record as `null`; `!= null` also covers undefined.
  const settled = list.data !== undefined && (registry.data != null || registryError !== null);
  return {
    data: settled ? value : undefined,
    isLoading,
    isError: error !== null,
    error,
  };
}

/**
 * Models for one provider (GET /api/providers/{id}/models). Each model is its
 * own graph record (`ProviderModel`, id `${providerId}::${modelId}`); the
 * provider's `ProviderModelSet` keeps their order.
 */
export function useProviderModels(providerId: string | undefined): QueryResult<UarModel[]> {
  const storeApi = useGraphStoreApi();
  const set = useEntity<ProviderModelSet, ProviderModelSet>({
    type: ENTITY.ProviderModelSet,
    id: providerId,
    // Keys derive from the requested id, so a late response for a previously
    // selected provider is never stored under the current one.
    fetch: async (requested) => {
      const id = String(requested);
      const raw = await api.get<UarModel[]>(`/api/providers/${id}/models`);
      const models = Array.isArray(raw) ? raw : [];
      const graph = storeApi.getState();
      const modelIds = models.map((model) => {
        const key = providerModelId(id, model.id);
        graph.upsertEntity(ENTITY.ProviderModel, key, { ...model });
        graph.setEntityFetched(ENTITY.ProviderModel, key);
        return key;
      });
      return { id, modelIds };
    },
    normalize: (modelSet) => modelSet,
    enabled: !!providerId,
  });
  const models = useStore(
    storeApi,
    useShallow((state) =>
      (set.data?.modelIds ?? [])
        .map((key) => state.readEntity<UarModel>(ENTITY.ProviderModel, key))
        .filter((m): m is UarModel => m !== null),
    ),
  );
  if (!providerId) {
    // Disabled query: no data rather than an empty list.
    return { data: undefined, isLoading: false, isError: false, error: null };
  }
  return toQueryResult(set, models, !!set.data);
}

export function useCreateProvider() {
  return useGraphMutation<CreateProviderPayload, ProvidersResponse>({
    type: ENTITY.Provider,
    mutate: (payload) => api.post<ProvidersResponse>("/api/providers", payload),
    invalidateTypes: PROVIDER_TYPES,
  });
}

export function useUpdateProvider() {
  return useGraphMutation<UpdateProviderPayload & { id: string }, UarProvider, UarProvider>({
    type: ENTITY.Provider,
    mutate: ({ id, ...payload }) => api.put<UarProvider>(`/api/providers/${id}`, payload),
    normalize: (provider, input) => ({ id: provider?.id ?? input.id, data: provider }),
    invalidateTypes: PROVIDER_TYPES,
    invalidateEntities: (input) => [{ type: ENTITY.ProviderModelSet, id: input.id }],
  });
}

export function useDeleteProvider() {
  return useGraphMutation<string, unknown>({
    type: ENTITY.Provider,
    mutate: (id) => api.delete(`/api/providers/${id}`),
    invalidateTypes: PROVIDER_TYPES,
  });
}

export function useSetDefaultProvider() {
  return useGraphMutation<string, unknown>({
    type: ENTITY.ProviderRegistry,
    mutate: (id) => api.post(`/api/providers/${id}/default`),
    invalidateTypes: PROVIDER_TYPES,
  });
}

/** Round-trip latency (ms) of GET /api/providers/{id}; `variables` tells which row is being tested. */
export function useTestConnection() {
  return useGraphMutation<string, number>({
    type: ENTITY.Provider,
    mutate: async (id) => {
      const start = performance.now();
      await api.get(`/api/providers/${id}`);
      return Math.round(performance.now() - start);
    },
  });
}
