import { useEffect } from "react";
import { useStore } from "zustand";
import {
  serializeKey,
  useEntities,
  useGraphStoreApi,
} from "@prometheus-ags/prometheus-entity-management";
import type { EntityTypeName } from "./entities";
import { toQueryResult, type QueryResult } from "./query-result";

/** Must mirror the key `useEntities` builds for a query with no view options. */
function defaultListKey(type: EntityTypeName): string {
  return serializeKey([type, { filter: undefined, sort: undefined, search: undefined, limit: undefined, cursor: undefined }]);
}

/**
 * Every row of `type` from its registered UAR transport, as a `QueryResult`.
 * `useEntities` only refetches on mount or explicit `refetch()`, so this hook
 * also refetches when the list is invalidated (marked stale) elsewhere.
 */
export function useRuntimeList<T extends object>(type: EntityTypeName, enabled = true): QueryResult<T[]> {
  const storeApi = useGraphStoreApi();
  const list = useEntities<T>(type, { enabled });
  const key = defaultListKey(type);
  const stale = useStore(storeApi, (s) => s.lists[key]?.stale ?? false);
  const fetching = useStore(storeApi, (s) => s.lists[key]?.isFetching ?? false);
  const { refetch } = list;

  useEffect(() => {
    if (enabled && stale && !fetching) refetch();
  }, [enabled, stale, fetching, refetch]);

  return toQueryResult(
    { isLoading: list.isLoading, error: list.error?.message ?? null },
    list.items,
    list.items.length > 0,
  );
}
