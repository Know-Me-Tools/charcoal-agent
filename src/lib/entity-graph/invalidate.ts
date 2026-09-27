import type { GraphStore } from "@prometheus-ags/entity-graph-core";
import { listKeyPrefix, type EntityTypeName } from "./entities";

/** Mark every entity and every list of `type` stale so mounted hooks refetch. */
export function invalidateEntityType(store: Pick<GraphStore, "getState">, type: EntityTypeName): void {
  const state = store.getState();
  state.invalidateEntity(type);
  state.invalidateLists(listKeyPrefix(type));
}
