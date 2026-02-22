import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Agent,
  AgentsResponse,
  UarAgent,
  CompileAgentPayload,
  CompileAgentResponse,
} from "@/types";

const AGENTS_KEY = ["agents"] as const;

/**
 * Map a UAR runtime/federated agent to the richer Agent shape used by the
 * charcoal-agent UI. For runtime agents the full AgentArtifact is present in
 * the list response, so we extract prompt/policy from their nested fields.
 */
function uarAgentToAgent(u: UarAgent): Agent {
  return {
    id: u.id,
    name: u.metadata?.title ?? u.id,
    system_prompt: u.prompt?.system ?? "",
    provider_id: u.policy?.provider?.default?.provider ?? "",
    model_id: u.policy?.provider?.default?.model ?? "",
    skills: (u.skills ?? []).map((s) => s.skill_id),
    enabled: true,
    created_at: "",
    updated_at: "",
    // Extra UAR fields surfaced for display
    source: u.source,
    kind: u.kind,
    metadata: u.metadata,
    rawSkills: u.skills,
  };
}

/**
 * Fetch agents from UAR (GET /api/agents) and flatten runtime + federated
 * agents into a single list, each annotated with a `source` field.
 */
export function useAgents() {
  return useQuery({
    queryKey: AGENTS_KEY,
    queryFn: async () => {
      const res = await api.get<AgentsResponse>("/api/agents");
      const runtime = (res.runtime_agents ?? []).map((a) =>
        uarAgentToAgent({ ...a, source: "runtime" }),
      );
      const federated = (res.federated_agents ?? []).map((a) =>
        uarAgentToAgent({ ...a, source: "federated" }),
      );
      return [...runtime, ...federated];
    },
  });
}

/**
 * Derive a single agent from the already-cached list query.
 * The UAR has no GET /api/agents/:id endpoint; the list response contains
 * the full AgentArtifact for each runtime agent, so we filter from there.
 */
export function useAgent(id: string | undefined) {
  const result = useAgents();
  return {
    ...result,
    data: id ? result.data?.find((a) => a.id === id) : undefined,
  };
}

// ── Compiler-backed create / update ──────────────────────────────────────────

export interface CompileAgentInput {
  name: string;
  description: string;
  systemPrompt: string;
  providerId: string;
  modelId: string;
  skills: string[];
}

/**
 * Build a complete UAR-AGENT-MD document from form fields.
 * All 16 required sections are included; non-configurable ones use safe defaults.
 */
function buildAgentMd({
  name,
  description,
  systemPrompt,
  providerId,
  modelId,
  skills,
}: CompileAgentInput): string {
  const skillList =
    skills.length > 0
      ? skills.map((s) => `  - "${s}"`).join("\n")
      : "  skills: []";

  const skillsYaml =
    skills.length > 0 ? `skills:\n${skillList}` : "skills: []";

  // Escape double-quotes in user-supplied strings to keep YAML valid.
  const esc = (s: string) => s.replace(/"/g, '\\"').replace(/\n/g, "\\n");

  return `# Agent: ${name}

## Metadata
\`\`\`yaml
version: "1.0.0"
description: "${esc(description)}"
tags: []
\`\`\`

## Identity
\`\`\`yaml
name: "${esc(name)}"
role: "assistant"
persona: "${esc(name)}"
system_prompt: "${esc(systemPrompt)}"
\`\`\`

## UI
\`\`\`yaml
forms: []
artifacts: []
actions: []
\`\`\`

## Capabilities
\`\`\`yaml
streaming: true
file_upload: false
\`\`\`

## Skills
\`\`\`yaml
${skillsYaml}
\`\`\`

## Tools
\`\`\`yaml
tools: []
allow: []
deny: []
\`\`\`

## MCP Servers
\`\`\`yaml
servers: []
\`\`\`

## Knowledge Base
\`\`\`yaml
sources: []
\`\`\`

## Memory Model
\`\`\`yaml
conversation:
  enabled: true
  max_turns: 50
\`\`\`

## A2A Contracts
\`\`\`yaml
endpoints: []
dependencies: []
\`\`\`

## Governance
\`\`\`yaml
cedar_policies: []
audit:
  enabled: true
\`\`\`

## Budgets & Constraints
\`\`\`yaml
max_tokens_per_turn: 4096
timeout_seconds: 300
\`\`\`

## Execution Model
\`\`\`yaml
mode: "sequential"
max_iterations: 10
\`\`\`

## Observability
\`\`\`yaml
tracing:
  enabled: true
metrics:
  enabled: false
logging:
  level: "info"
\`\`\`

## Deployment Profiles
\`\`\`yaml
profiles:
  - id: default
    provider:
      name: "${esc(providerId)}"
      model: "${esc(modelId)}"
\`\`\`
`;
}

/**
 * Compile an agent via POST /api/compiler/compile.
 * Works for both create and update — the UAR overwrites the existing agent
 * when the name matches an already-compiled spec.
 */
export function useCompileAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CompileAgentInput) => {
      const payload: CompileAgentPayload = { content: buildAgentMd(input) };
      return api.post<CompileAgentResponse>("/api/compiler/compile", payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

/** Update per-agent memory settings via PATCH /api/agents/{id}. */
export function useUpdateAgentMemory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      memory_enabled,
      memory_auto_capture,
      memory_inject_context,
      memory_scope,
    }: {
      id: string;
      memory_enabled?: boolean | null;
      memory_auto_capture?: boolean | null;
      memory_inject_context?: boolean | null;
      memory_scope?: string;
    }) => {
      const body: Record<string, unknown> = {};
      if (memory_enabled !== undefined && memory_enabled !== null)
        body.memory_enabled = memory_enabled;
      if (memory_auto_capture !== undefined && memory_auto_capture !== null)
        body.memory_auto_capture = memory_auto_capture;
      if (memory_inject_context !== undefined && memory_inject_context !== null)
        body.memory_inject_context = memory_inject_context;
      if (memory_scope !== undefined) body.memory_scope = memory_scope;
      return api.patch<Agent>(`/api/agents/${id}`, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}

/** Delete an agent from the UAR. */
export function useDeleteAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/agents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: AGENTS_KEY }),
  });
}
