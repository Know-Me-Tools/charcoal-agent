import { api } from "@/lib/api-client";
import { ENTITY } from "@/lib/entity-graph/entities";
import { useGraphMutation } from "@/lib/entity-graph/use-graph-mutation";

/**
 * Delete a runtime session (DELETE /api/sessions/{id}) and drop its server
 * transcript from the graph. The local thread registry remains the source of
 * truth for the sidebar, so callers treat failures as non-fatal.
 */
export function useDeleteSession() {
  return useGraphMutation<string, unknown>({
    type: ENTITY.Session,
    mutate: (id) => api.delete(`/api/sessions/${id}`),
    invalidateEntities: (id) => [{ type: ENTITY.SessionTranscript, id }],
  });
}
