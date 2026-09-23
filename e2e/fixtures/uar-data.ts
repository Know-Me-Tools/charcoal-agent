/**
 * Static UAR response fixtures for the offline verification harness.
 * Shapes are typed against the app's own API types so contract drift
 * surfaces at `npm run typecheck`. Timestamps are fixed for stable screenshots.
 */
import type {
  AgentsResponse,
  ProvidersResponse,
  Run,
  Thread,
  UarModel,
  UarSkill,
  UserSettings,
} from "@/types";
import { KNOWME_SKILLS } from "@/lib/skills/knowme-skills";

export const FIXED_TIME = "2026-09-01T09:30:00.000Z";

export const FIXTURE_AGENT_ID = "knowme-assistant";

export const agentsResponse: AgentsResponse = {
  runtime_agents: [
    {
      id: FIXTURE_AGENT_ID,
      kind: "runtime",
      metadata: {
        title: "KnowMe",
        description: "Your personal agent. Remembers context and acts on your behalf.",
        tags: ["personal", "memory"],
      },
      skills: [
        { skill_id: "knowme-profile", title: "KnowMe Profile", enabled: true },
        { skill_id: "web-search", title: "Web Search", enabled: true },
      ],
      prompt: {
        system: "You are KnowMe, a calm and precise personal intelligence.",
        instructions: ["Prefer concise answers.", "Cite sources when you use them."],
      },
      policy: {
        provider: {
          default: { provider: "openai", model: "gpt-5.2" },
          fallbacks: [{ provider: "anthropic", model: "claude-sonnet-5" }],
        },
      },
    },
    {
      id: "research-analyst",
      kind: "runtime",
      metadata: {
        title: "Research Analyst",
        description: "Deep research across the web with citations.",
        tags: ["research"],
      },
      skills: [{ skill_id: "web-search", title: "Web Search", enabled: true }],
      prompt: { system: "You research thoroughly and cite every claim." },
      policy: { provider: { default: { provider: "anthropic", model: "claude-sonnet-5" } } },
    },
  ],
  federated_agents: [
    {
      id: "calendar-concierge",
      kind: "federated",
      metadata: { title: "Calendar Concierge", description: "Schedules and reschedules meetings." },
    },
  ],
};

const models: UarModel[] = [
  {
    id: "gpt-5.2",
    display_name: "GPT-5.2",
    context_window: 400000,
    supports_vision: true,
    supports_tools: true,
    max_output_tokens: 128000,
  },
  {
    id: "gpt-5.2-mini",
    display_name: "GPT-5.2 mini",
    context_window: 400000,
    supports_vision: true,
    supports_tools: true,
    max_output_tokens: 64000,
  },
];

const anthropicModels: UarModel[] = [
  {
    id: "claude-sonnet-5",
    display_name: "Claude Sonnet 5",
    context_window: 1000000,
    supports_vision: true,
    supports_tools: true,
    max_output_tokens: 64000,
  },
];

export const providersResponse: ProvidersResponse = {
  default_id: "openai",
  providers: [
    {
      id: "openai",
      display_name: "OpenAI",
      protocol: "openai",
      base_url: "https://api.openai.com",
      enabled: true,
      default_model: "gpt-5.2",
      models,
    },
    {
      id: "anthropic",
      display_name: "Anthropic",
      protocol: "anthropic",
      base_url: "https://api.anthropic.com",
      enabled: true,
      default_model: "claude-sonnet-5",
      models: anthropicModels,
    },
    {
      id: "local-ollama",
      display_name: "Local Ollama",
      protocol: "openai",
      base_url: "http://127.0.0.1:11434",
      enabled: false,
      models: [],
    },
  ],
};

/** Built-in KnowMe skills (all enabled, so startup sync makes no writes) plus platform skills. */
export const skillsResponse: UarSkill[] = [
  ...KNOWME_SKILLS.map((s) => ({
    skill_id: s.skill_id,
    title: s.title,
    description: s.description,
    version: s.version ?? "1.0.0",
    enabled: true,
    provider_id: "knowme",
    triggers: s.triggers ? { keywords: s.triggers.keywords } : undefined,
    prompt_overlay: s.prompt_overlay,
    preferred_tools: s.preferred_tools,
  })),
  {
    skill_id: "web-search",
    title: "Web Search",
    description: "Search the web and return cited results.",
    version: "2.1.0",
    enabled: true,
    provider_id: "platform",
    triggers: { keywords: ["search", "look up", "find"] },
    preferred_tools: ["web_search"],
  },
  {
    skill_id: "code-runner",
    title: "Code Runner",
    description: "Execute short Python snippets in a sandbox.",
    version: "0.9.0",
    enabled: false,
    provider_id: "platform",
  },
];

export const sessionsResponse: Thread[] = [
  {
    id: "5f1d7a2e-0c1b-4a9e-9d4e-2b7f3c8a1e01",
    title: "Weekly planning",
    agent_id: FIXTURE_AGENT_ID,
    agent_name: "KnowMe",
    created_at: FIXED_TIME,
    updated_at: FIXED_TIME,
  },
];

export const userSettingsResponse: UserSettings = {
  user_id: "user-fixture",
  prompt_caching_enabled: null,
  preferred_scope: "session",
  updated_at: FIXED_TIME,
};

export const runResponse: Run = {
  id: "run-fixture",
  session_id: sessionsResponse[0].id,
  agent_id: FIXTURE_AGENT_ID,
  status: "complete",
  created_at: FIXED_TIME,
};
