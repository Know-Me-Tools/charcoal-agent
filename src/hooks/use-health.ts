import { useEffect } from "react";
import { useEntity } from "@prometheus-ags/prometheus-entity-management";
import { ENTITY } from "@/lib/entity-graph/entities";
import { toQueryResult, type QueryResult } from "@/lib/entity-graph/query-result";
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
  const url = buildUrl(path);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  // Body may be empty (200 + no JSON) — treat any 2xx as "ok".
  try {
    const text = await res.text();
    if (text) {
      const json = JSON.parse(text) as Record<string, unknown>;
      return { status: (json.status as "ok" | "error") ?? "ok" };
    }
  } catch {
    // Ignore parse errors — server is reachable, so mark ok.
  }
  return { status: "ok" };
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

  const value: HealthStatus | undefined = probe.error
    ? { status: "error" }
    : probe.data
      ? { status: probe.data.status }
      : undefined;
  return toQueryResult(probe, value, value !== undefined);
}

export function useHealth(): QueryResult<HealthStatus> {
  return useRuntimeProbe("/healthz");
}

export function useReady(): QueryResult<HealthStatus> {
  return useRuntimeProbe("/readyz");
}
