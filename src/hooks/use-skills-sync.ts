/**
 * Skills Sync Hook
 *
 * Compares the KnowMe built-in skill manifest against skills currently
 * registered in the UAR and synchronises them:
 *
 *  1. Fetch UAR skill list (GET /api/skills)
 *  2. For skills present but disabled → POST /api/skills/{id}/toggle to enable
 *  3. For skills missing entirely → POST /api/skills to create them dynamically
 *  4. After any changes → POST /api/skills/refresh to rescan the registry
 *
 * Skills are pushed with their full definitions (prompt_overlay, triggers, version)
 * so no server-side filesystem preloading or ConfigMap deployment is required.
 *
 * Exposes { syncing, synced, syncedCount, missingCount, error, triggerSync }
 * so the skills page can show status and let users trigger a manual re-sync.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { useGraphStoreApi } from "@prometheus-ags/prometheus-entity-management";
import { api } from "@/lib/api-client";
import { ENTITY } from "@/lib/entity-graph/entities";
import { invalidateEntityType } from "@/lib/entity-graph/invalidate";
import { KNOWME_SKILLS } from "@/lib/skills/knowme-skills";
import type { UarSkill } from "@/types";

export interface SkillSyncResult {
  /** True while a sync is in progress. */
  syncing: boolean;
  /** True once the first successful sync has completed in this session. */
  synced: boolean;
  /** Number of KnowMe skills found and enabled in the UAR after sync. */
  syncedCount: number;
  /** Number of KnowMe skills that failed to sync (push errors). */
  missingCount: number;
  /** Last sync error, if any. */
  error: string | null;
  /** Manually trigger a sync (also called automatically on first mount). */
  triggerSync: () => Promise<void>;
}

export function useSkillsSync(): SkillSyncResult {
  const graph = useGraphStoreApi();
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [syncedCount, setSyncedCount] = useState(0);
  const [missingCount, setMissingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const triggerSync = useCallback(async () => {
    setSyncing(true);
    setError(null);

    try {
      // 1. Fetch current UAR skills (normalise in case UAR wraps the array)
      const raw = await api.get<unknown>("/api/skills");
      const uarSkills: UarSkill[] = Array.isArray(raw)
        ? (raw as UarSkill[])
        : Array.isArray((raw as Record<string, unknown>)?.skills)
          ? ((raw as Record<string, unknown>).skills as UarSkill[])
          : [];
      const uarById = new Map(uarSkills.map((s) => [s.skill_id, s]));

      let enabledAny = false;
      let foundCount = 0;
      let lostCount = 0;

      // 2. Process each KnowMe built-in skill
      await Promise.allSettled(
        KNOWME_SKILLS.map(async (local) => {
          const remote = uarById.get(local.skill_id);

          if (!remote) {
            // Skill not in the UAR registry — push it dynamically via the API.
            try {
              await api.post("/api/skills", {
                name: local.title,
                version: local.version ?? "1.0.0",
                description: local.description,
                triggers: local.triggers ?? {},
                prompt_overlay: local.prompt_overlay ?? "",
                preferred_tools: local.preferred_tools ?? [],
                enabled: local.enabled,
              });
              enabledAny = true;
              foundCount++;
            } catch {
              // Push failed — count as missing so the UI shows it needs attention.
              lostCount++;
            }
          } else if (local.enabled && !remote.enabled) {
            // Skill exists but is disabled — re-enable it.
            try {
              await api.post(`/api/skills/${local.skill_id}/toggle`, {
                enabled: true,
              });
              enabledAny = true;
              foundCount++;
            } catch {
              foundCount++;
            }
          } else {
            foundCount++;
          }
        }),
      );

      // 3. Trigger a UAR skill-registry rescan so newly pushed skills are
      //    indexed and immediately available for matching.
      try {
        await api.post("/api/skills/refresh");
      } catch {
        // Non-fatal — refresh is best-effort
      }

      // 3. Re-fetch to get accurate final counts if anything changed.
      if (enabledAny) {
        try {
          const rawRefreshed = await api.get<unknown>("/api/skills");
          const refreshed: UarSkill[] = Array.isArray(rawRefreshed)
            ? (rawRefreshed as UarSkill[])
            : Array.isArray((rawRefreshed as Record<string, unknown>)?.skills)
              ? ((rawRefreshed as Record<string, unknown>).skills as UarSkill[])
              : [];
          const refreshedById = new Map(refreshed.map((s) => [s.skill_id, s]));
          foundCount = 0;
          lostCount = 0;
          for (const local of KNOWME_SKILLS) {
            if (refreshedById.has(local.skill_id)) {
              foundCount++;
            } else {
              lostCount++;
            }
          }
        } catch {
          // Use previous counts if re-fetch fails
        }
      }

      setSyncedCount(foundCount);
      setMissingCount(lostCount);
      setSynced(true);

      // Mark skills stale so every mounted skills view refetches the new state
      invalidateEntityType(graph, ENTITY.Skill);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown sync error");
    } finally {
      setSyncing(false);
    }
  }, [graph]);

  return { syncing, synced, syncedCount, missingCount, error, triggerSync };
}

/**
 * Runs the skills sync once on mount (after the UAR connection is available).
 * Designed to be called from a top-level component so it runs app-wide.
 */
export function useSkillsSyncOnMount(): SkillSyncResult {
  const result = useSkillsSync();
  const { triggerSync } = result;
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    void triggerSync();
  }, [triggerSync]); // triggerSync is useCallback-stable (only changes when the graph changes)

  return result;
}
