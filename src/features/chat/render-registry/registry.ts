/**
 * Client AG-UI render registry (change agui-render-registry).
 *
 * Decides, by lookup, what the client does with each AG-UI event name,
 * artifact type (`agui.artifact` multiplexes many) and AG-UI activity type:
 *
 * - `render`: handled by an existing store action and block component.
 * - `hide`:   dropped; nothing reaches the store or the thread.
 * - `adapt`:  an A2UI carrier, handed to an adapter rather than a block.
 *
 * A key with no entry is hidden, never shown as raw JSON, and logs one
 * development-only warning so a new UAR event is noticed. Design notes and
 * the flint-forge comparison: `.kbd-orchestrator/phases/
 * agui-rendering-functionality/evidence/12-flint-forge-registry-review.md`.
 */

export type RenderKeyKind = "event" | "artifact" | "activity";
export type RenderDisposition = "render" | "hide" | "adapt";

export interface RenderKey {
  readonly kind: RenderKeyKind;
  /** Event name, artifact type or activity type. */
  readonly name: string;
}

export interface RenderEntry {
  readonly disposition: RenderDisposition;
  /** Why this key has this disposition; the default table is the decision record. */
  readonly reason: string;
}

/**
 * One registry entry. A `name` ending in `*` matches every name with that
 * prefix (`runtime.*`, `agui.subagent.*`); an exact name always wins, then
 * the longest matching prefix.
 */
export interface RenderEntryDef extends RenderKey, RenderEntry {}

export interface RenderResolution extends RenderEntry {
  /** False when no entry matched and the unknown-hides default applied. */
  readonly known: boolean;
}

export interface RenderRegistry {
  resolve(key: RenderKey): RenderResolution;
}

export interface RenderRegistryOptions {
  /** Called for every lookup that matches no entry. */
  readonly onUnknown?: (key: RenderKey) => void;
}

const UNKNOWN: RenderResolution = {
  disposition: "hide",
  reason: "No registry entry: unknown keys are hidden.",
  known: false,
};

const warnedUnknownKeys = new Set<string>();

/** Development-only console warning, once per unknown key. */
export function warnUnknownInDevelopment(key: RenderKey): void {
  if (!import.meta.env.DEV) return;
  const id = `${key.kind}:${key.name}`;
  if (warnedUnknownKeys.has(id)) return;
  warnedUnknownKeys.add(id);
  console.warn(`[render-registry] No entry for ${key.kind} "${key.name}"; it is hidden.`);
}

export function createRenderRegistry(
  defs: readonly RenderEntryDef[],
  options: RenderRegistryOptions = {},
): RenderRegistry {
  const exact = new Map<string, RenderResolution>();
  const prefixes: Array<{ kind: RenderKeyKind; prefix: string; entry: RenderResolution }> = [];

  for (const def of defs) {
    const entry: RenderResolution = { disposition: def.disposition, reason: def.reason, known: true };
    if (def.name.endsWith("*")) {
      prefixes.push({ kind: def.kind, prefix: def.name.slice(0, -1), entry });
    } else {
      exact.set(`${def.kind}:${def.name}`, entry);
    }
  }
  // Longest prefix first, so the most specific wildcard wins.
  prefixes.sort((a, b) => b.prefix.length - a.prefix.length);

  const onUnknown = options.onUnknown ?? warnUnknownInDevelopment;

  return {
    resolve(key) {
      const hit = exact.get(`${key.kind}:${key.name}`);
      if (hit) return hit;
      const wildcard = prefixes.find((p) => p.kind === key.kind && key.name.startsWith(p.prefix));
      if (wildcard) return wildcard.entry;
      onUnknown(key);
      return UNKNOWN;
    },
  };
}
