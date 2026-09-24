/**
 * Skills Sync Integration Tests
 *
 * These tests validate that the KnowMe client's built-in KnowMe skills are correctly
 * pushed to the UAR through the Skills management API and confirmed active.
 *
 * Requirements:
 *   - A running UAR instance reachable at INTEGRATION_UAR_URL (default: http://127.0.0.1:6565)
 *   - Tests are skipped automatically when no UAR is reachable
 *
 * Run with:
 *   INTEGRATION_UAR_URL=http://127.0.0.1:6565 pnpm vitest run src/test/skills-sync.integration.test.ts
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { KNOWME_SKILLS, type KnowMeSkillDefinition } from "@/lib/skills/knowme-skills";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const UAR_URL =
  process.env.INTEGRATION_UAR_URL ??
  process.env.VITE_UAR_BASE_URL ??
  "http://127.0.0.1:6565";

const API_KEY = process.env.VITE_UAR_API_KEY ?? process.env.INTEGRATION_UAR_API_KEY ?? "";

// ---------------------------------------------------------------------------
// HTTP helpers (mirror the api-client pattern without React/Vite deps)
// ---------------------------------------------------------------------------

interface UarSkill {
  skill_id: string;
  title: string;
  description: string;
  version: string;
  enabled: boolean;
  provider_id: string;
  triggers?: { keywords?: string[]; semantic?: string | null };
  preferred_tools?: string[];
  prompt_overlay?: string;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (API_KEY) h["Authorization"] = `Bearer ${API_KEY}`;
  return h;
}

async function listSkills(): Promise<UarSkill[]> {
  const res = await fetch(`${UAR_URL}/api/skills`, { headers: headers() });
  if (!res.ok) throw new Error(`GET /api/skills → ${res.status}`);
  return res.json() as Promise<UarSkill[]>;
}

async function createSkill(skill: KnowMeSkillDefinition): Promise<UarSkill> {
  const res = await fetch(`${UAR_URL}/api/skills`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      name: skill.title,
      version: skill.version ?? "1.0.0",
      description: skill.description,
      triggers: skill.triggers ?? {},
      prompt_overlay: skill.prompt_overlay ?? "",
      preferred_tools: skill.preferred_tools ?? [],
      enabled: skill.enabled,
    }),
  });
  if (!res.ok) throw new Error(`POST /api/skills → ${res.status}: ${await res.text()}`);
  return res.json() as Promise<UarSkill>;
}

async function deleteSkill(skillId: string): Promise<void> {
  await fetch(`${UAR_URL}/api/skills/${skillId}`, {
    method: "DELETE",
    headers: headers(),
  });
  // 404 is acceptable — skill might already be gone
}

async function toggleSkill(skillId: string, enabled: boolean): Promise<void> {
  const res = await fetch(`${UAR_URL}/api/skills/${skillId}/toggle`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error(`POST /api/skills/${skillId}/toggle → ${res.status}`);
}

async function refreshSkills(): Promise<void> {
  await fetch(`${UAR_URL}/api/skills/refresh`, {
    method: "POST",
    headers: headers(),
  });
}

// ---------------------------------------------------------------------------
// Core sync algorithm (mirrors useSkillsSync hook logic, without React)
// ---------------------------------------------------------------------------

interface SyncResult {
  pushed: string[];
  reenabled: string[];
  alreadyPresent: string[];
  failed: string[];
}

async function runSync(): Promise<SyncResult> {
  const uarSkills = await listSkills();
  const uarById = new Map(uarSkills.map((s) => [s.skill_id, s]));

  const results: SyncResult = { pushed: [], reenabled: [], alreadyPresent: [], failed: [] };

  await Promise.allSettled(
    KNOWME_SKILLS.map(async (local) => {
      const remote = uarById.get(local.skill_id);

      if (!remote) {
        try {
          await createSkill(local);
          results.pushed.push(local.skill_id);
        } catch {
          results.failed.push(local.skill_id);
        }
      } else if (local.enabled && !remote.enabled) {
        try {
          await toggleSkill(local.skill_id, true);
          results.reenabled.push(local.skill_id);
        } catch {
          results.alreadyPresent.push(local.skill_id);
        }
      } else {
        results.alreadyPresent.push(local.skill_id);
      }
    }),
  );

  try {
    await refreshSkills();
  } catch {
    // Non-fatal
  }

  return results;
}

// ---------------------------------------------------------------------------
// UAR availability check
// ---------------------------------------------------------------------------

let uarAvailable = false;

async function checkUarAvailability(): Promise<boolean> {
  try {
    const res = await fetch(`${UAR_URL}/healthz`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Test setup / teardown
// ---------------------------------------------------------------------------

beforeAll(async () => {
  uarAvailable = await checkUarAvailability();
  if (!uarAvailable) {
    console.warn(
      `[skills-sync] UAR not reachable at ${UAR_URL}. ` +
        "Set INTEGRATION_UAR_URL to run integration tests. Skipping all tests.",
    );
  }
});

/** Remove all KNOWME_SKILLS from UAR before each test for a clean slate. */
async function cleanupKnowMeSkills(): Promise<void> {
  await Promise.allSettled(KNOWME_SKILLS.map((s) => deleteSkill(s.skill_id)));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Skills Sync Integration", () => {
  describe("1. Push missing built-ins", () => {
    beforeEach(async () => {
      if (!uarAvailable) return;
      await cleanupKnowMeSkills();
    });

    afterAll(async () => {
      if (!uarAvailable) return;
      await cleanupKnowMeSkills();
    });

    it("pushes all 7 KnowMe built-in skills to UAR when none are registered", async () => {
      if (!uarAvailable) return;

      const result = await runSync();

      expect(result.pushed).toHaveLength(KNOWME_SKILLS.length);
      expect(result.failed).toHaveLength(0);

      // All pushed IDs match the KNOWME_SKILLS manifest
      const expectedIds = KNOWME_SKILLS.map((s) => s.skill_id).sort();
      expect(result.pushed.sort()).toEqual(expectedIds);
    });

    it("confirms each pushed skill is active (enabled: true) in the UAR", async () => {
      if (!uarAvailable) return;

      await runSync();

      const uarSkills = await listSkills();
      const uarById = new Map(uarSkills.map((s) => [s.skill_id, s]));

      for (const local of KNOWME_SKILLS) {
        const remote = uarById.get(local.skill_id);
        expect(remote, `skill ${local.skill_id} should exist in UAR`).toBeDefined();
        expect(remote!.enabled, `skill ${local.skill_id} should be enabled`).toBe(true);
      }
    });

    it("skill titles and descriptions are correctly uploaded", async () => {
      if (!uarAvailable) return;

      await runSync();

      const uarSkills = await listSkills();
      const uarById = new Map(uarSkills.map((s) => [s.skill_id, s]));

      for (const local of KNOWME_SKILLS) {
        const remote = uarById.get(local.skill_id);
        expect(remote).toBeDefined();
        expect(remote!.title).toBe(local.title);
        expect(remote!.description).toBe(local.description);
      }
    });
  });

  describe("2. Idempotent re-sync", () => {
    beforeEach(async () => {
      if (!uarAvailable) return;
      await cleanupKnowMeSkills();
    });

    afterAll(async () => {
      if (!uarAvailable) return;
      await cleanupKnowMeSkills();
    });

    it("second sync does not create duplicates", async () => {
      if (!uarAvailable) return;

      // First sync
      await runSync();

      // Second sync — all skills should already be present
      const secondResult = await runSync();

      expect(secondResult.pushed).toHaveLength(0);
      expect(secondResult.failed).toHaveLength(0);
      expect(secondResult.alreadyPresent).toHaveLength(KNOWME_SKILLS.length);

      // UAR should still have exactly KNOWME_SKILLS count (no duplicates)
      const uarSkills = await listSkills();
      const knowMeSkillsInUar = uarSkills.filter((s) =>
        KNOWME_SKILLS.some((k) => k.skill_id === s.skill_id),
      );
      expect(knowMeSkillsInUar).toHaveLength(KNOWME_SKILLS.length);
    });

    it("does not error on repeated syncs", async () => {
      if (!uarAvailable) return;

      const r1 = await runSync();
      const r2 = await runSync();
      const r3 = await runSync();

      expect(r1.failed).toHaveLength(0);
      expect(r2.failed).toHaveLength(0);
      expect(r3.failed).toHaveLength(0);
    });
  });

  describe("3. Re-enable disabled built-ins", () => {
    beforeEach(async () => {
      if (!uarAvailable) return;
      await cleanupKnowMeSkills();
      // Pre-populate UAR with all built-ins
      await runSync();
    });

    afterAll(async () => {
      if (!uarAvailable) return;
      await cleanupKnowMeSkills();
    });

    it("re-enables a built-in skill that was manually disabled", async () => {
      if (!uarAvailable) return;

      const targetSkill = KNOWME_SKILLS[0]; // knowme-profile

      // Disable via UAR API
      await toggleSkill(targetSkill.skill_id, false);

      // Verify disabled
      const before = await listSkills();
      const beforeById = new Map(before.map((s) => [s.skill_id, s]));
      expect(beforeById.get(targetSkill.skill_id)!.enabled).toBe(false);

      // Run sync — should re-enable it
      const result = await runSync();
      expect(result.reenabled).toContain(targetSkill.skill_id);

      // Confirm re-enabled in UAR
      const after = await listSkills();
      const afterById = new Map(after.map((s) => [s.skill_id, s]));
      expect(afterById.get(targetSkill.skill_id)!.enabled).toBe(true);
    });

    it("re-enables multiple disabled built-ins in a single sync", async () => {
      if (!uarAvailable) return;

      // Disable first 3 skills
      const toDisable = KNOWME_SKILLS.slice(0, 3);
      await Promise.all(toDisable.map((s) => toggleSkill(s.skill_id, false)));

      const result = await runSync();

      expect(result.reenabled.length).toBeGreaterThanOrEqual(3);

      // All should be enabled again
      const after = await listSkills();
      const afterById = new Map(after.map((s) => [s.skill_id, s]));
      for (const skill of toDisable) {
        expect(afterById.get(skill.skill_id)!.enabled).toBe(true);
      }
    });
  });

  describe("4. Confirm skills active after sync", () => {
    beforeEach(async () => {
      if (!uarAvailable) return;
      await cleanupKnowMeSkills();
    });

    afterAll(async () => {
      if (!uarAvailable) return;
      await cleanupKnowMeSkills();
    });

    it("every KNOWME_SKILLS entry is found in UAR with enabled: true after sync", async () => {
      if (!uarAvailable) return;

      await runSync();

      const uarSkills = await listSkills();
      const uarById = new Map(uarSkills.map((s) => [s.skill_id, s]));

      for (const local of KNOWME_SKILLS) {
        const remote = uarById.get(local.skill_id);
        expect(
          remote,
          `Built-in skill "${local.skill_id}" must be present in UAR after sync`,
        ).toBeDefined();
        expect(
          remote!.enabled,
          `Built-in skill "${local.skill_id}" must be enabled: true after sync`,
        ).toBe(true);
      }
    });

    it("skills have correct provider_id after being pushed via API", async () => {
      if (!uarAvailable) return;

      await runSync();

      const uarSkills = await listSkills();
      const uarById = new Map(uarSkills.map((s) => [s.skill_id, s]));

      for (const local of KNOWME_SKILLS) {
        const remote = uarById.get(local.skill_id);
        expect(remote).toBeDefined();
        // Skills pushed via the API always receive provider_id "api"
        expect(remote!.provider_id).toBe("api");
      }
    });
  });

  describe("5. UAR refresh triggered after sync", () => {
    beforeEach(async () => {
      if (!uarAvailable) return;
      await cleanupKnowMeSkills();
    });

    afterAll(async () => {
      if (!uarAvailable) return;
      await cleanupKnowMeSkills();
    });

    it("skills are immediately available for matching after sync completes", async () => {
      if (!uarAvailable) return;

      await runSync();

      // The match endpoint should surface knowme-memory when queried with "memory"
      const res = await fetch(`${UAR_URL}/api/skills/match?q=memory`, { headers: headers() });
      expect(res.ok).toBe(true);

      const matched: UarSkill[] = await res.json();
      const ids = matched.map((s) => s.skill_id);
      expect(ids).toContain("knowme-memory");
    });

    it("knowme-profile is matchable by keyword 'profile' after sync", async () => {
      if (!uarAvailable) return;

      await runSync();

      const res = await fetch(`${UAR_URL}/api/skills/match?q=profile`, { headers: headers() });
      expect(res.ok).toBe(true);

      const matched: UarSkill[] = await res.json();
      const ids = matched.map((s) => s.skill_id);
      expect(ids).toContain("knowme-profile");
    });
  });
});
