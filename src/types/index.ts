// Domain model types for the KnowMe agent runtime

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
}

export interface Thread {
  id: string;
  title: string;
  agent_id: string;
  agent_name?: string;
  created_at: string;
  updated_at: string;
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

export interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
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
  name: string;
  base_url: string;
  api_key: string;
  enabled: boolean;
}

export interface UpdateProviderPayload {
  name?: string;
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

export interface CreateThreadPayload {
  agent_id: string;
  title: string;
}

export interface StartRunPayload {
  session_id: string;
  agent_id: string;
  message: string;
}

export interface CreateSkillPayload {
  name: string;
  description: string;
  enabled: boolean;
}
