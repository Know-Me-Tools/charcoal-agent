import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { HealthStatus } from "@/types";

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<HealthStatus>("/healthz"),
    refetchInterval: 30000,
  });
}

export function useReady() {
  return useQuery({
    queryKey: ["ready"],
    queryFn: () => api.get<HealthStatus>("/readyz"),
    refetchInterval: 30000,
  });
}
