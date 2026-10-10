/**
 * Carrier adapter: UAR `agui.artifact` (type `a2ui`) -> A2UI v0.9.1 messages.
 *
 * Shape and rationale: `.kbd-orchestrator/phases/agui-rendering-functionality/
 * evidence/13-uar-a2ui-carrier-spike.md`. The artifact `content` is NDJSON, one
 * canonical server-to-client message per line. UAR validates it before it is
 * published, but the client still treats it as untrusted input at this boundary.
 */

/** Hard ceilings on one artifact. UAR's own output ceiling is smaller. */
export const A2UI_MAX_CONTENT_BYTES = 256 * 1024;
export const A2UI_MAX_MESSAGES = 200;

/** Protocol version the pinned official packages speak. */
export const A2UI_WIRE_VERSION = "v0.9.1";

/** Catalog ids UAR may put in `createSurface` (spike evidence 13). */
export const UAR_A2UI_CATALOG_ID = "urn:uar:a2ui:catalog:1";
export const A2UI_BASIC_CATALOG_ID =
  "https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json";
export const ACCEPTED_CATALOG_IDS: readonly string[] = [
  UAR_A2UI_CATALOG_ID,
  A2UI_BASIC_CATALOG_ID,
];

export type A2uiCarrierResult =
  | { ok: true; messages: Record<string, unknown>[] }
  | { ok: false; reason: "empty" | "too_large" | "too_many_messages" | "malformed" | "catalog" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parse NDJSON `content` into messages the PEM runtime accepts.
 *
 * - `profile` is dropped (PEM's v0.9.1 schema does not carry it).
 * - `version: "v0.9"` is normalised to `v0.9.1`; any other version is rejected.
 * - A `createSurface.catalogId` outside UAR's two ids is rejected, so a surface
 *   can never name a catalog this client did not register.
 */
export function parseA2uiArtifactContent(content: string): A2uiCarrierResult {
  if (content.trim() === "") return { ok: false, reason: "empty" };
  if (new TextEncoder().encode(content).length > A2UI_MAX_CONTENT_BYTES) {
    return { ok: false, reason: "too_large" };
  }

  const lines = content.split("\n").filter((line) => line.trim() !== "");
  if (lines.length > A2UI_MAX_MESSAGES) return { ok: false, reason: "too_many_messages" };

  const messages: Record<string, unknown>[] = [];
  for (const line of lines) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      return { ok: false, reason: "malformed" };
    }
    if (!isRecord(parsed)) return { ok: false, reason: "malformed" };

    const { profile: _profile, ...message } = parsed;
    if (message.version !== A2UI_WIRE_VERSION && message.version !== "v0.9") {
      return { ok: false, reason: "malformed" };
    }
    message.version = A2UI_WIRE_VERSION;

    const create = message.createSurface;
    if (isRecord(create)) {
      const catalogId = create.catalogId;
      if (typeof catalogId !== "string" || !ACCEPTED_CATALOG_IDS.includes(catalogId)) {
        return { ok: false, reason: "catalog" };
      }
    }
    messages.push(message);
  }

  return messages.length === 0 ? { ok: false, reason: "empty" } : { ok: true, messages };
}
