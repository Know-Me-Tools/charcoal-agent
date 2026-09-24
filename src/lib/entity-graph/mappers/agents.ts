import type { Agent, UarAgent } from "@/types";

/**
 * Map a UAR runtime/federated agent to the richer Agent shape used by the
 * charcoal-agent UI. For runtime agents the full AgentArtifact is present in
 * the list response, so we extract prompt/policy from their nested fields.
 */
export function uarAgentToAgent(u: UarAgent): Agent {
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
