import { useQuery } from "@tanstack/react-query";
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

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => pingEndpoint("/healthz"),
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useReady() {
  return useQuery({
    queryKey: ["ready"],
    queryFn: () => pingEndpoint("/readyz"),
    refetchInterval: 30_000,
    retry: false,
  });
}
