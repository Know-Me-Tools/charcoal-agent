/**
 * Entity types held in the app's graph. Each UAR resource is stored once by
 * `(type, id)`; list query keys start with the type name so
 * `invalidateType(type)` refreshes every list of that type.
 */
export const ENTITY = {
  Agent: "Agent",
  Provider: "Provider",
  /** id: `${providerId}::${modelId}` — one record per model, scoped to its provider. */
  ProviderModel: "ProviderModel",
  /** id: provider id — the ordered model ids a provider offers. */
  ProviderModelSet: "ProviderModelSet",
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

/**
 * Prefix matching every serialized list key that starts with `type`
 * (`["Skill"]`, `["Skill",{...}]`). Needed because the core's
 * `invalidateType` compares the bare type name against JSON-serialized keys
 * (which start with `[`), so its list half never matches.
 */
export function listKeyPrefix(type: EntityTypeName): string {
  return JSON.stringify([type]).slice(0, -1);
}
