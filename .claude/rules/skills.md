---
paths: ['src/lib/skills/**', 'src/hooks/use-skills-sync.ts', 'src/test/skills-sync.integration.test.ts']
---

# Built-in skills

Loaded when a matching file is read. Moved from CLAUDE.md to keep resident context small.

`lib/skills/knowme-skills.ts` defines the built-in `KNOWME_SKILLS` manifest. On app mount, `useSkillsSyncOnMount` (`hooks/use-skills-sync.ts`) diffs it against `GET /api/skills`, creates missing skills, enables disabled ones, then calls `/api/skills/refresh`. Skills are pushed with full definitions (prompt overlay, triggers, version) — no server-side files needed. `external-skill-loader.ts` handles non-built-in skills.
