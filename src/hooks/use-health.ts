import { useEffect } from "react";
import { useEntity } from "@prometheus-ags/prometheus-entity-management";
import { ENTITY } from "@/lib/entity-graph/entities";
import type { QueryResult } from "@/lib/entity-graph/query-result";
import type { HealthStatus } from "@/types";
import { buildUrl } from "@/lib/api-client";

/**
 * The UAR /healthz and /readyz endpoints return HTTP 200 with an EMPTY body
 * (content-length: 0) — not JSON. Using api.get() would call res.json() on
 * an empty body and throw a SyntaxError, making the query appear errored even
 * when the server is reachable. We therefore use raw fetch and synthesise the
 * { status: "ok" } shape ourselves.
 */
async function pingEndpoint(path: string): Promise<HealthStatus> {
  // Never throw: a failed probe is a result ("error"), reported at once rather
  // than retried by the graph engine.
  try {
    const res = await fetch(buildUrl(path));
    if (!res.ok) return { status: "error" };
    // Body may be empty (200 + no JSON) — treat any 2xx as "ok".
    const text = await res.text();
    if (text) {
      try {
        const json = JSON.parse(text) as Record<string, unknown>;
        return { status: (json.status as "ok" | "error") ?? "ok" };
      } catch {
        // Unparseable body — the server answered 2xx, so it is reachable.
      }
    }
    return { status: "ok" };
  } catch {
    return { status: "error" };
  }
}

interface HealthRecord extends HealthStatus {
  id: string;
}

const HEALTH_POLL_MS = 30_000;

/**
 * Poll a runtime health endpoint every 30 s while mounted. A failed check
 * reports `status: "error"` even if an earlier check succeeded.
 */
function useRuntimeProbe(path: "/healthz" | "/readyz"): QueryResult<HealthStatus> {
  const id = path.slice(1);
  const probe = useEntity<HealthStatus, HealthRecord>({
    type: ENTITY.RuntimeHealth,
    id,
    fetch: () => pingEndpoint(path),
    normalize: (status) => ({ ...status, id }),
  });
  const { refetch } = probe;

  useEffect(() => {
    const timer = setInterval(refetch, HEALTH_POLL_MS);
    return () => clearInterval(timer);
  }, [refetch]);

  const value: HealthStatus | undefined = probe.data ? { status: probe.data.status } : undefined;
  const unreachable = value?.status === "error";
  return {
    data: value,
    isLoading: probe.isLoading,
    isError: unreachable,
    error: unreachable ? new Error(`Runtime ${path} check failed`) : null,
  };
}

export function useHealth(): QueryResult<HealthStatus> {
  return useRuntimeProbe("/healthz");
}

export function useReady(): QueryResult<HealthStatus> {
  return useRuntimeProbe("/readyz");
}
