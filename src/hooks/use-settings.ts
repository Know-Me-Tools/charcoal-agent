import { useCallback, useEffect, useRef, useState } from "react";
import { buildUrl, buildHeaders } from "@/lib/api-client";
import type { SettingWithMeta } from "@/types";

export interface UseSettingsReturn {
  /** Map of leaf key → current value (e.g. "resilience.rate_limit_enabled" → true) */
  values: Record<string, unknown>;
  /** Full setting objects keyed by leaf key */
  settings: Record<string, SettingWithMeta>;
  loading: boolean;
  saving: boolean;
  error: string | null;
  /** Update a value in local state immediately (does not persist until saveAll) */
  setSetting: (key: string, value: unknown) => void;
  /** Persist all pending dirty values to the API */
  saveAll: () => Promise<void>;
  /** Reload settings from the API */
  reload: () => Promise<void>;
}

/** Convert a namespace key to its URL slug (matches UAR's slug table). */
function namespaceToSlug(ns: string): string {
  const overrides: Record<string, string> = {
    provider: "providers",
    file_processing: "file-processing",
    knowledge_bases: "knowledge-bases",
    intent_classifier: "intent-classifier",
    context_management: "context-management",
    agent_config: "agent-config",
    skill_config: "skill-config",
    mistral_ocr: "mistral-ocr",
  };
  return overrides[ns] ?? ns.replace(/_/g, "-");
}

/** Raw entry shape returned by GET /api/uar/settings/{namespace} */
interface SettingEntry extends SettingWithMeta {
  key: string;
  /** Alias for `value` used by some API responses */
  data?: unknown;
}

const BASE = "/api/uar/settings";

/**
 * Read and write namespace-scoped UAR settings.
 *
 * Usage:
 * ```ts
 * const { values, setSetting, saveAll } = useSettings("context_management");
 * ```
 */
export function useSettings(namespace: string): UseSettingsReturn {
  const [settings, setSettings] = useState<Record<string, SettingWithMeta>>({});
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [dirty, setDirty] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const slug = namespaceToSlug(namespace);
      const res = await fetch(buildUrl(`${BASE}/${slug}`), {
        headers: buildHeaders(),
      });
      if (!res.ok) throw new Error(`Settings fetch failed: ${res.status}`);

      const raw = (await res.json()) as unknown;

      const byKey: Record<string, SettingWithMeta> = {};
      const vals: Record<string, unknown> = {};

      if (Array.isArray(raw)) {
        // Array response: [{ key, value/data, source, ... }]
        for (const s of raw as SettingEntry[]) {
          if (!s.key) continue;
          byKey[s.key] = s;
          vals[s.key] = s.value ?? s.data;
        }
      } else if (raw && typeof raw === "object") {
        // Object response: { "key": { value, source, ... } }
        for (const [k, v] of Object.entries(raw as Record<string, SettingWithMeta>)) {
          byKey[k] = v;
          vals[k] = v.value;
        }
      }

      setSettings(byKey);
      setValues(vals);
      setDirty({});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [namespace]);

  useEffect(() => {
    void load();
  }, [load]);

  const setSetting = useCallback((key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => ({ ...prev, [key]: value }));
  }, []);

  const saveAll = useCallback(async () => {
    if (savingRef.current || Object.keys(dirty).length === 0) return;
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      await Promise.all(
        Object.entries(dirty).map(([key, value]) =>
          fetch(buildUrl(`${BASE}/${encodeURIComponent(key)}`), {
            method: "PUT",
            headers: buildHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify({ value }),
          }).then((r) => {
            if (!r.ok) throw new Error(`Save "${key}" failed: ${r.status}`);
          }),
        ),
      );
      setDirty({});
    } catch (e) {
      setError((e as Error).message);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [dirty]);

  return { values, settings, loading, saving, error, setSetting, saveAll, reload: load };
}
