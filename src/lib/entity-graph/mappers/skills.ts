import type { Skill, UarSkill } from "@/types";

/** Map UAR's wire format to the normalized Skill shape used by UI components. */
export function normalizeSkill(s: UarSkill): Skill {
  return {
    id: s.skill_id,
    name: s.title,
    description: s.description ?? "",
    version: s.version,
    enabled: s.enabled ?? true,
    provider_id: s.provider_id,
    triggers: s.triggers,
    preferred_tools: s.preferred_tools,
    prompt_overlay: s.prompt_overlay,
  };
}
