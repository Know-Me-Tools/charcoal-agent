/**
 * Entity types held in the app's graph. Each UAR resource is stored once by
 * `(type, id)`; list query keys start with the type name so
 * `invalidateType(type)` refreshes every list of that type.
 */
export const ENTITY = {
  Agent: "Agent",
  Provider: "Provider",
  /** id: `${providerId}::${modelId}` — models are scoped to their provider. */
  ProviderModel: "ProviderModel",
  /** Singleton (`REGISTRY_ID`) holding the runtime's default provider id. */
  ProviderRegistry: "ProviderRegistry",
  Skill: "Skill",
  Session: "Session",
  /** id: thread id — server-side transcript used as a fallback when PGlite is empty. */
  SessionTranscript: "SessionTranscript",
  /** Singleton (`USER_SETTINGS_ID`). */
  UserSettings: "UserSettings",
  /** ids: `healthz`, `readyz`. */
  RuntimeHealth: "RuntimeHealth",
} as const;

export type EntityTypeName = (typeof ENTITY)[keyof typeof ENTITY];

export const REGISTRY_ID = "default";
export const USER_SETTINGS_ID = "me";

export function providerModelId(providerId: string, modelId: string): string {
  return `${providerId}::${modelId}`;
}
