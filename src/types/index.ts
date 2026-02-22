// Domain model types for the KnowMe agent runtime

// ── UAR API shapes (from /api/agents, /api/skills) ──────────────────────────

/** Metadata attached to a UAR runtime agent. */
export interface UarAgentMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  author?: string;
  icon?: string;
}

/** A skill entry as returned by GET /api/agents (embedded in agent). */
export interface UarSkillRef {
  skill_id: string;
  title: string;
  description?: string;
  provider_id?: string;
  enabled?: boolean;
}

/** System prompt and instructions from an AgentArtifact. */
export interface UarAgentPrompt {
  system: string;
  instructions?: string[];
}

/** A provider/model pair used in policy selections. */
export interface UarAgentProviderSelection {
  provider: string;
  model: string;
}

/** Provider routing policy from an AgentArtifact. */
export interface UarAgentPolicy {
  provider: {
    default: UarAgentProviderSelection;
    fallbacks?: UarAgentProviderSelection[];
  };
}

/** A runtime or federated agent as returned by GET /api/agents. */
export interface UarAgent {
  id: string;
  kind?: string;
  metadata?: UarAgentMetadata;
  skills?: UarSkillRef[];
  /** Source list the agent came from — added client-side after flattening. */
  source?: "runtime" | "federated";
  /**
   * Nested fields present for runtime agents (full AgentArtifact from UAR).
   * Federated agents omit these.
   */
  prompt?: UarAgentPrompt;
  policy?: UarAgentPolicy;
}

/** Response shape from GET /api/agents. */
export interface AgentsResponse {
  runtime_agents?: UarAgent[];
  federated_agents?: UarAgent[];
}

/** A skill as returned by GET /api/skills (UAR). */
export interface UarSkill {
  skill_id: string;
  title: string;
  description?: string;
  version?: string;
  enabled?: boolean;
  provider_id?: string;
  triggers?: {
    keywords?: string[];
    semantic?: string;
  };
  preferred_tools?: string[];
  prompt_overlay?: string;
}

// ── Providers ────────────────────────────────────────────────────────────────

/**
 * Model entry as returned by GET /api/providers and GET /api/providers/{id}/models.
 * All nullable fields reflect that the UAR may not populate them for every model.
 */
export interface UarModel {
  id: string;
  display_name: string | null;
  context_window: number | null;
  supports_vision: boolean;
  supports_tools: boolean;
  max_output_tokens: number | null;
}

/**
 * Provider config as returned by GET /api/providers (matches Rust ProviderConfig).
 * The top-level ProvidersResponse carries `default_id`; providers themselves do
 * not have an `is_default` field.
 */
export interface UarProvider {
  id: string;
  display_name: string;
  protocol: string;
  base_url?: string;
  api_key?: string;
  enabled: boolean;
  default_model?: string;
  /** Models embedded directly in the provider object (same shape as /models endpoint). */
  models?: UarModel[];
}

/** Full response from GET /api/providers */
export interface ProvidersResponse {
  providers: UarProvider[];
  default_id?: string;
}

/** @deprecated Use UarProvider — kept for backward compatibility only */
export interface Provider {
  id: string;
  name: string;
  base_url: string;
  api_key_set: boolean;
  enabled: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * @deprecated Use UarModel — kept for backward compat with any legacy code.
 * The UAR API returns `id` (not `model_id`) and `display_name` (not `name`).
 */
export interface Model {
  id: string;
  provider_id: string;
  model_id: string;
  name: string;
  context_window: number;
  supports_vision: boolean;
  supports_tools: boolean;
}

export interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  provider_id: string;
  model_id: string;
  skills: string[];
  fallback_provider_id?: string;
  fallback_model_id?: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
  /** Set client-side after flattening the AgentsResponse. */
  source?: "runtime" | "federated";
  /** UAR agent kind (e.g. "default", "orchestrator"). */
  kind?: string;
  /** UAR metadata block. */
  metadata?: UarAgentMetadata;
  /** Raw UAR skill references (before normalization). */
  rawSkills?: UarSkillRef[];
}

export interface Thread {
  id: string;
  title: string;
  agent_id: string;
  agent_name?: string;
  created_at: string;
  updated_at: string;
}

/**
 * A thread tracked locally in the persistent thread registry.
 *
 * `sessionId` is the stable UUID sent to the UAR as `X-UAR-Session-ID` on
 * every request. It equals `id` by convention (both are generated together via
 * `crypto.randomUUID()` at thread-creation time) and is stored explicitly in
 * PGLite so it survives page refreshes without relying on the URL or memory.
 *
 * `isEphemeral` is true until the first message reply arrives; ephemeral
 * threads are hidden from the sidebar.
 */
export interface LocalThread {
  id: string;
  /** UAR session UUID — always equals `id`. Stored explicitly for clarity. */
  sessionId: string;
  title: string;
  isEphemeral: boolean;
  createdAt: string;
  updatedAt: string;
  agentId?: string;
  agentName?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  tool_calls?: ToolCallEvent[];
}

export interface ThreadDetail extends Thread {
  messages: Message[];
}

export type RunStatus = "pending" | "streaming" | "complete" | "failed";

export interface Run {
  id: string;
  session_id: string;
  agent_id: string;
  status: RunStatus;
  created_at: string;
}

export type RunEventType =
  | "message.delta"
  | "tool_call.delta"
  | "tool_call.complete"
  | "tool_result"
  | "error"
  | "done";

export interface RunEvent {
  event: RunEventType;
  data: Record<string, unknown>;
}

export interface ToolCallEvent {
  id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  result?: string;
  status: "calling" | "complete" | "failed";
}

/** Normalized skill shape used by UI components. Mapped from UarSkill. */
export interface Skill {
  id: string;       // maps to UarSkill.skill_id
  name: string;     // maps to UarSkill.title
  description: string;
  version?: string;
  enabled: boolean;
  provider_id?: string;
  triggers?: {
    keywords?: string[];
    semantic?: string;
  };
  preferred_tools?: string[];
  prompt_overlay?: string;
  created_at?: string;
  updated_at?: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description: string;
  document_count: number;
}

export interface MemoryEntry {
  id: string;
  agent_id: string;
  content: string;
  created_at: string;
}

export interface HealthStatus {
  status: "ok" | "error";
}

export interface CreateProviderPayload {
  id: string;
  display_name: string;
  protocol: string;
  base_url?: string;
  api_key?: string;
  enabled?: boolean;
}

export interface UpdateProviderPayload {
  display_name?: string;
  protocol?: string;
  base_url?: string;
  api_key?: string;
  enabled?: boolean;
}

export interface CreateAgentPayload {
  name: string;
  system_prompt: string;
  provider_id: string;
  model_id: string;
  skills: string[];
  fallback_provider_id?: string;
  fallback_model_id?: string;
}

/** Input to the UAR compiler API (POST /api/compiler/compile). */
export interface CompileAgentPayload {
  /** Full UAR-AGENT-MD markdown document. */
  content: string;
}

/** Successful response from POST /api/compiler/compile. */
export interface CompileAgentResponse {
  descriptor: {
    agent_id: string;
    version: string;
    content_hash: string;
  };
  signature: string;
  report: {
    success: boolean;
    errors?: string[];
    warnings?: string[];
  };
}

export interface CreateThreadPayload {
  agent_id: string;
  title: string;
}

/** Payload for POST /api/chat on the Universal Agent Runtime. */
export interface StartRunPayload {
  session_id?: string;
  message: string;
}

export interface CreateSkillPayload {
  name: string;
  description: string;
  enabled: boolean;
}

// ── Prompt caching / user settings ───────────────────────────────────────────

export type CachingScope = "session" | "user" | "agent";

export interface UserSettings {
  user_id: string;
  /** null means "inherit the global default" */
  prompt_caching_enabled: boolean | null;
  preferred_scope: CachingScope;
  updated_at: string;
}

export interface UpdateUserSettingsPayload {
  prompt_caching_enabled?: boolean | null;
  preferred_scope?: CachingScope;
}

// ── Namespace-based settings (GET/PUT /api/uar/settings/{namespace}) ──────────

export type SettingSource = "default" | "file" | "env" | "api";

export interface SettingsDriftItem {
  key: string;
  current_value: unknown;
  default_value: unknown;
}

export interface SettingsMeta {
  namespace: string;
  last_updated?: string;
  drift?: SettingsDriftItem[];
}

export interface SettingWithMeta {
  value: unknown;
  source: SettingSource;
  default_value?: unknown;
  description?: string;
  is_sensitive?: boolean;
}

export type SettingsType = Record<string, SettingWithMeta>;

// ── Tools ─────────────────────────────────────────────────────────────────────

export interface UarTool {
  name: string;
  description?: string;
  input_schema?: Record<string, unknown>;
  /** Namespaced tool name, e.g. "time::now" */
  namespaced_name?: string;
}

export interface DiscoveryResponse {
  tools: UarTool[];
  agents?: UarAgent[];
  skills?: UarSkill[];
}

// ── File uploads / attachments ────────────────────────────────────────────────

export interface UploadedFileResponse {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  url?: string;
  created_at?: string;
}

export interface PendingAttachment {
  id: string;
  filename: string;
  content_type: string;
  size: number;
  /** Temp object URL for preview before upload completes. */
  previewUrl?: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export interface AttachmentPayload {
  id: string;
  filename: string;
  content_type: string;
}
