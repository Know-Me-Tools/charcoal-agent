/**
 * UAR list transports, registered once at boot. Each maps a runtime endpoint
 * onto the graph's `EntityTransport` contract (`list` → rows, `identify` → id).
 */
import { registerEntityTransport } from "@prometheus-ags/entity-graph-core";
import { api } from "@/lib/api-client";
import type { Agent, AgentsResponse, ProvidersResponse, UarProvider, UarSkill, Skill } from "@/types";
import { ENTITY } from "./entities";
import { uarAgentToAgent } from "./mappers/agents";
import { normalizeSkill } from "./mappers/skills";

export async function fetchAgentRows(): Promise<Agent[]> {
  const res = await api.get<AgentsResponse>("/api/agents");
  return [
    ...(res.runtime_agents ?? []).map((a) => uarAgentToAgent({ ...a, source: "runtime" })),
    ...(res.federated_agents ?? []).map((a) => uarAgentToAgent({ ...a, source: "federated" })),
  ];
}

let providersInFlight: Promise<{ providers: UarProvider[]; defaultId: string | undefined }> | null = null;

/**
 * GET /api/providers, shared by the Provider list and the ProviderRegistry
 * entity so one refresh costs one request. Accepts the current
 * `{ providers, default_id }` shape and the legacy flat array.
 */
export function fetchProvidersResponse(): Promise<{ providers: UarProvider[]; defaultId: string | undefined }> {
  providersInFlight ??= api
    .get<unknown>("/api/providers")
    .then((raw) => {
      if (Array.isArray(raw)) return { providers: raw as UarProvider[], defaultId: undefined };
      const obj = (raw ?? {}) as Record<string, unknown> & Partial<ProvidersResponse>;
      const list = obj.providers ?? obj.data ?? obj.items ?? [];
      return {
        providers: Array.isArray(list) ? (list as UarProvider[]) : [],
        defaultId: typeof obj.default_id === "string" ? obj.default_id : undefined,
      };
    })
    .finally(() => {
      providersInFlight = null;
    });
  return providersInFlight;
}

export async function fetchSkillRows(): Promise<Skill[]> {
  const raw = await api.get<unknown>("/api/skills");
  // UAR returns a plain array; guard in case it ever wraps the response
  const list: UarSkill[] = Array.isArray(raw)
    ? (raw as UarSkill[])
    : Array.isArray((raw as Record<string, unknown>)?.skills)
      ? ((raw as Record<string, unknown>).skills as UarSkill[])
      : [];
  return list.map(normalizeSkill);
}

let registered = false;

/** Idempotent: safe to call from module init and from tests. */
export function registerUarTransports(): void {
  if (registered) return;
  registered = true;
  registerEntityTransport<Agent>(ENTITY.Agent, {
    identify: (row) => row.id,
    authoritative: false,
    list: async () => {
      const rows = await fetchAgentRows();
      return { rows, total: rows.length };
    },
  });
  registerEntityTransport<UarProvider>(ENTITY.Provider, {
    identify: (row) => row.id,
    authoritative: false,
    list: async () => {
      const { providers } = await fetchProvidersResponse();
      return { rows: providers, total: providers.length };
    },
  });
  registerEntityTransport<Skill>(ENTITY.Skill, {
    identify: (row) => row.id,
    authoritative: false,
    list: async () => {
      const rows = await fetchSkillRows();
      return { rows, total: rows.length };
    },
  });
}
