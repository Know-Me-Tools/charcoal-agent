---
type: SessionRecord
id: karpathy-session-36b811141f2665bb
title: Karpathy session 36b811141f26
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-23T22:20:07.912548+00:00
created_at: 2026-09-23T22:20:07.912548+00:00
updated_at: 2026-09-23T22:20:07.912548+00:00
revision: 0
---

## Delta

KBD is set up for Charcoal Agent. The validator passed and dependencies are installed, so nothing blocks running it. I haven't run the build, test or lint commands themselves yet.

**`.kbd-orchestrator/project.json`**
- **Commands:** `npm run build`, `npm test`, `npm run lint` and `npm run dev`. I used npm because the Dockerfile builds with `npm ci` and `package-lock.json` is the main lockfile.
- **Specs:** OpenSpec is on and points at `openspec/specs/*.md`, which is still empty.
- **Workspace** (from `charcoal-agent.code-workspace`):
  - `charcoal-agent` is the focus project and the only one KBD can write to.
  - `universal-agent-runtime` is read-only reference, pointed at `src/uar/api/sse.rs` (the streaming event format) and its API routes.
  - `artifact-refiner` and `openfang` are read-only reference.
  - `cherry-studio` is set to ignore because it's listed in the workspace file but isn't on disk.
- **Agents:** planning defaults to `antigravity` and the execution list is empty. The repo has no `AGENTS.md` naming preferred tools, and the skill's default says to leave it empty. I did add entries for Claude Code, Codex, OpenCode, Kimi, Zed and MiniMax to `agents_config`, so you can list any of them as execution agents.

**`.kbd-orchestrator/constraints.md`**
This project has no "Never Do" list, so these rules are KBD's generic defaults fitted to this codebase.
- **Blocking:**
  - The build and tests must pass.
  - No `console.log`, no hardcoded secrets, and no committed `.env` files.
  - No new `: any`. There's already one, which I noted as a baseline.
  - No writes to the reference folders.
  - Existing database migrations in `pglite.ts` can't be edited; changes go in a new one.
  - `@electric-sql/pglite` must stay excluded from Vite's pre-bundling, or the local database breaks.
- **Warnings:**
  - Lint is clean.
  - Chat stream handling matches UAR's `sse.rs`.
  - Every assistant-ui message carries its required metadata.
  - UI uses the shadcn components.
  - New code has tests, and there are no TODO/FIXME comments.
- **Tool folders:** the constraints mark `.claude/`, `.agents/`, `.opencode/`, `.kimi-code/` and `openspec/` as project-owned, so KBD won't treat them as disposable.

Next, run `/kbd-status` to confirm the setup, then `/kbd-new-phase <name>` to start the first phase.

Completed kbd-init — Charcoal Agent

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-23T22:20:07.366905Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- .agents/
- .claude/
- .kbd-orchestrator/
- .kimi-code/
- .opencode/
- CLAUDE.md
- docs/xhtml-docs/
- openspec/
