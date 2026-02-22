/**
 * KnowMe Built-in Skill Manifest
 *
 * Canonical list of skills the KnowMe application provides. On startup the
 * skills-sync hook compares this list against the UAR registry and pushes any
 * missing skills via POST /api/skills — no server-side filesystem preloading
 * or ConfigMap deployment required.
 *
 * Each entry carries enough data to fully reconstruct a working skill on the
 * UAR: name, version, description, triggers, prompt_overlay, and preferred_tools.
 */

export interface KnowMeSkillDefinition {
  /** Stable, machine-readable identifier — must match the skill_id in the UAR. */
  skill_id: string;
  /** Human-readable display name (sent as `name` to POST /api/skills). */
  title: string;
  /** Short description shown in the UI and sent to the UAR. */
  description: string;
  /** Whether this skill should be enabled by default when synced. */
  enabled: boolean;
  /** Optional category for display grouping. */
  category?: "personal" | "productivity" | "knowledge" | "social";
  /**
   * Origin of the skill.
   * - `"knowme"` — a KnowMe-domain skill specific to personal data features.
   * - `"platform"` — a cross-cutting tool skill bundled with charcoal-agent.
   */
  source?: "knowme" | "platform";
  /** Semver version string sent to the UAR on create/update. */
  version?: string;
  /** Keyword and semantic triggers used by the UAR skill matcher. */
  triggers?: {
    keywords?: string[];
    semantic?: string;
  };
  /**
   * Markdown body of the skill — injected into the system prompt when the
   * skill is matched. This is the full SKILL.md body (everything after the
   * YAML frontmatter).
   */
  prompt_overlay?: string;
  /** MCP tool names this skill prefers when executing. */
  preferred_tools?: string[];
}

export const KNOWME_SKILLS: KnowMeSkillDefinition[] = [
  // ── KnowMe domain skills ────────────────────────────────────────────────────

  {
    skill_id: "knowme-profile",
    title: "KnowMe Profile",
    version: "1.0.0",
    description:
      "Accesses and maintains the user's personal profile — name, preferences, background, and identity context.",
    enabled: true,
    category: "personal",
    triggers: {
      keywords: [
        "profile",
        "about me",
        "who am i",
        "my preferences",
        "my background",
        "identity",
        "update profile",
      ],
      semantic:
        "Access or update personal information, preferences, or contextual details about the user's identity.",
    },
    prompt_overlay: `# KnowMe Profile

You have access to the user's personal profile. Use it to:
- Address the user by name and honour stated preferences.
- Provide contextually aware responses that reflect their background.
- Suggest updates when new information is shared.

Always treat profile data with respect and never disclose it to third parties.`,
  },

  {
    skill_id: "knowme-memory",
    title: "KnowMe Memory",
    version: "1.0.0",
    description:
      "Captures and recalls important life events, facts, and preferences the user shares across conversations.",
    enabled: true,
    category: "personal",
    triggers: {
      keywords: [
        "remember",
        "recall",
        "memory",
        "i told you",
        "don't forget",
        "note that",
        "save this",
        "what did i say",
      ],
      semantic:
        "Store or retrieve facts, events, or preferences the user has shared across sessions.",
    },
    prompt_overlay: `# KnowMe Memory

You can store and recall memories across sessions. When the user shares something important:
1. Acknowledge it and confirm you will remember it.
2. Persist the memory so it is available in future conversations.

When the user asks what you remember, surface relevant memories with their context.`,
    preferred_tools: ["memory_store", "memory_recall"],
  },

  {
    skill_id: "knowme-journaling",
    title: "KnowMe Journaling",
    version: "1.0.0",
    description:
      "Facilitates guided journaling, reflection prompts, and emotional check-ins to support personal growth.",
    enabled: true,
    category: "personal",
    triggers: {
      keywords: [
        "journal",
        "reflect",
        "how am i feeling",
        "check in",
        "daily reflection",
        "gratitude",
        "mood",
        "write about",
      ],
      semantic:
        "Guide the user through a journaling or reflection exercise, or capture a journal entry.",
    },
    prompt_overlay: `# KnowMe Journaling

Guide the user through thoughtful journaling and reflection:
- Ask open-ended, empathetic questions.
- Encourage honest self-expression without judgment.
- Summarise themes and offer gentle insights.
- Persist entries so the user can look back over time.`,
  },

  {
    skill_id: "knowme-goals",
    title: "KnowMe Goals",
    version: "1.0.0",
    description:
      "Tracks personal and professional goals, milestones, and progress reports over time.",
    enabled: true,
    category: "productivity",
    triggers: {
      keywords: [
        "goal",
        "objective",
        "target",
        "milestone",
        "progress",
        "track goal",
        "set goal",
        "my goals",
        "OKR",
      ],
      semantic:
        "Create, update, or review personal or professional goals and their progress.",
    },
    prompt_overlay: `# KnowMe Goals

Help the user set, track, and achieve their goals:
1. Clarify the goal using SMART criteria when needed.
2. Break it into milestones with realistic deadlines.
3. Check in on progress and celebrate wins.
4. Offer course-correction strategies when progress stalls.`,
  },

  {
    skill_id: "knowme-relationships",
    title: "KnowMe Relationships",
    version: "1.0.0",
    description:
      "Manages insights about the user's relationships — family, friends, colleagues — to give contextually aware assistance.",
    enabled: true,
    category: "social",
    triggers: {
      keywords: [
        "relationship",
        "friend",
        "family",
        "colleague",
        "partner",
        "contact",
        "people in my life",
        "someone i know",
      ],
      semantic:
        "Access or update information about people in the user's life to provide personalised, context-aware assistance.",
    },
    prompt_overlay: `# KnowMe Relationships

You have context about the people in the user's life. Use it to:
- Reference relevant details when discussing interpersonal situations.
- Help draft thoughtful messages or advice tailored to specific relationships.
- Update relationship context as the user shares new information.

Always handle relationship data with sensitivity and discretion.`,
  },

  {
    skill_id: "knowme-knowledge",
    title: "KnowMe Knowledge",
    version: "1.0.0",
    description:
      "Retrieves information from the user's personal knowledge base and notes.",
    enabled: true,
    category: "knowledge",
    triggers: {
      keywords: [
        "knowledge base",
        "my notes",
        "what do i know about",
        "search my notes",
        "find note",
        "lookup",
        "personal wiki",
      ],
      semantic:
        "Search or retrieve content from the user's personal knowledge base or note collection.",
    },
    prompt_overlay: `# KnowMe Knowledge

You have access to the user's personal knowledge base. When queried:
1. Search for relevant notes or documents.
2. Surface the most pertinent content with context.
3. Suggest related topics the user may find useful.
4. Help the user add new entries to their knowledge base.`,
    preferred_tools: ["knowledge_search", "knowledge_store"],
  },

  {
    skill_id: "knowme-habits",
    title: "KnowMe Habits",
    version: "1.0.0",
    description:
      "Helps track and reinforce daily habits, routines, and behavioural patterns.",
    enabled: true,
    category: "productivity",
    triggers: {
      keywords: [
        "habit",
        "routine",
        "daily",
        "streak",
        "track habit",
        "build habit",
        "morning routine",
        "check in habit",
      ],
      semantic:
        "Track, reinforce, or review daily habits and behavioural routines.",
    },
    prompt_overlay: `# KnowMe Habits

Help the user build and maintain positive habits:
1. Record habit completions and update streaks.
2. Send encouraging check-ins and reminders.
3. Analyse patterns and suggest adjustments.
4. Celebrate consistency and help recover from missed days without judgment.`,
  },

];

/** Look up a KnowMe skill definition by its skill_id. */
export function findKnowMeSkill(
  skill_id: string,
): KnowMeSkillDefinition | undefined {
  return KNOWME_SKILLS.find((s) => s.skill_id === skill_id);
}
