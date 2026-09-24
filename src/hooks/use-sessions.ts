import { useGraphStoreApi } from "@prometheus-ags/prometheus-entity-management";
import { api } from "@/lib/api-client";
import { ENTITY } from "@/lib/entity-graph/entities";
import { useGraphMutation } from "@/lib/entity-graph/use-graph-mutation";

/**
 * Delete a runtime session (DELETE /api/sessions/{id}), remove it from every
 * graph list, and drop its server transcript. The local thread registry
 * remains the source of truth for the sidebar, so callers treat failures as
 * non-fatal.
 */
export function useDeleteSession() {
  const graph = useGraphStoreApi();
  return useGraphMutation<string, unknown>({
    type: ENTITY.Session,
    mutate: (id) => api.delete(`/api/sessions/${id}`),
    invalidateEntities: (id) => [{ type: ENTITY.SessionTranscript, id }],
    onSuccess: (_result, id) => {
      const state = graph.getState();
      state.removeIdFromAllLists(ENTITY.Session, id);
      state.removeEntity(ENTITY.Session, id);
    },
  });
}
