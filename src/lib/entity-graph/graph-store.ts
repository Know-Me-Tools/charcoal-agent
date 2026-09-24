import { configureEngine, createGraphStore } from "@prometheus-ags/entity-graph-core";

/**
 * Engine defaults equivalent to the former TanStack QueryClient config
 * (`retry: 1`, `refetchOnWindowFocus: false`, stale immediately).
 */
configureEngine({
  maxRetries: 1,
  revalidateOnFocus: false,
  defaultStaleTime: 0,
});

/** The application's single entity graph (tests create their own). */
export const appGraphStore = createGraphStore();

export type AppGraphStore = typeof appGraphStore;
