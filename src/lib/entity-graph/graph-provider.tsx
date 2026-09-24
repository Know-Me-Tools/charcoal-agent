import type { ReactNode } from "react";
import { GraphStoreProvider } from "@prometheus-ags/prometheus-entity-management";
import { appGraphStore, type AppGraphStore } from "./graph-store";

interface GraphProviderProps {
  children: ReactNode;
  /** Override for tests; defaults to the app graph. */
  store?: AppGraphStore;
}

/** Scopes every entity-graph hook in the tree to one application-owned graph. */
export function GraphProvider({ children, store = appGraphStore }: GraphProviderProps) {
  return <GraphStoreProvider store={store}>{children}</GraphStoreProvider>;
}
