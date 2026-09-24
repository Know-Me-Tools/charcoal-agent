import type { ReactNode } from "react";
import { createGraphStore } from "@prometheus-ags/entity-graph-core";
import { GraphProvider } from "@/lib/entity-graph/graph-provider";

/** A fresh, isolated entity graph per test plus a `wrapper` for renderHook. */
export function createGraphTestHarness() {
  const store = createGraphStore();
  function wrapper({ children }: { children: ReactNode }) {
    return <GraphProvider store={store}>{children}</GraphProvider>;
  }
  return { store, wrapper };
}
