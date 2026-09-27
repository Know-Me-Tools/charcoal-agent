EXECUTION: complete-rebranding
Project: Charcoal Agent (product: KnowMe)
Date: 2026-09-23
Selected backend: openspec (driven by /kbd-apply)
Dispatched to: SELF (Claude Code) — sequential, one change per session; Codex optional for round-1 parallel work in a worktree
Backend rationale: openspec/ exists and all 12 changes are already registered as OpenSpec changes and canonical KBD changes; spec-backed traceability is needed because brand fidelity is judged against external source documents (S1–S3 in plan.md). Other configured tools (Codex, OpenCode, Kimi, Zed, MiniMax) have the same openspec skills installed and may take a change, but must still drive it through /kbd-apply.
Backend entrypoint: `/kbd-apply <change-id>` (which runs `/opsx:continue` to produce proposal/design/specs/tasks, then the per-task begin/end loop). Never bare `/opsx:apply`.
OpenSpec available: YES
Source plan: .kbd-orchestrator/phases/complete-rebranding/plan.md

EXECUTION SCOPE

- tailwind-v4-foundation: Upgrade to Tailwind 4 and clear the pre-existing lint/type baseline
- visual-verification-harness: Add Playwright screenshots and axe checks
- entity-graph-data-layer: Replace TanStack Query with the Prometheus entity graph
- shadcn-base-ui-migration: Reinstall shadcn primitives on Base UI at the latest shadcn
- assistant-ui-latest: Upgrade assistant-ui to 0.15.x on the Base UI registry
- knowme-brand-tokens: Port the KnowMe token system (Flat 2.0) into Tailwind 4
- knowme-brand-identity: Logo, icons, metadata, naming and copy
- app-shell-flat2: Restyle the application shell
- chat-surfaces-flat2: Restyle thread, composer and every content block
- landing-and-about-brand: Brand-template landing page and About
- app-pages-flat2-entity-views: Restyle app pages and adopt entity list/detail components
- brand-fidelity-audit: Whole-site verification and golden snapshots

DISPATCH CONTRACTS

Model resolution: `model_policy.active_environment = local`. Registry: small → Qwen3.5-9B-Q8_0, medium → null (no local medium model), frontier → claude-sonnet-4-6. Medium-class changes therefore resolve to the frontier model locally; this session runs claude-opus-5-5, which satisfies frontier.

| # | Change | Tool | Model class | Concrete model | Rationale |
|---|---|---|---|---|---|
| 1 | tailwind-v4-foundation | Claude Code | medium | claude-sonnet-4-6 (medium→frontier fallback) | codemod-driven, one build-config boundary, plus lint/tsc fixes |
| 2 | visual-verification-harness | Codex (worktree) or Claude Code | medium | claude-sonnet-4-6 | isolated tooling, no app code dependency |
| 3 | entity-graph-data-layer | Claude Code | frontier | claude-sonnet-4-6 | 50 call sites, new abstraction, invalidation semantics |
| 4 | shadcn-base-ui-migration | Claude Code | frontier | claude-sonnet-4-6 | API migration across every overlay consumer |
| 5 | assistant-ui-latest | Claude Code | frontier | claude-sonnet-4-6 | breaking runtime upgrade on the core chat surface |
| 6 | knowme-brand-tokens | Claude Code | medium | claude-sonnet-4-6 | token port + contrast test |
| 7 | knowme-brand-identity | Claude Code | medium | claude-sonnet-4-6 | assets, config, copy |
| 8 | app-shell-flat2 | Claude Code | medium | claude-sonnet-4-6 | bounded to layout/common |
| 9 | chat-surfaces-flat2 | Claude Code | frontier | claude-sonnet-4-6 | many block types, visual judgement |
| 10 | landing-and-about-brand | Claude Code | medium | claude-sonnet-4-6 | two pages against brand template |
| 11 | app-pages-flat2-entity-views | Claude Code | frontier | claude-sonnet-4-6 | many pages + third-party component theming |
| 12 | brand-fidelity-audit | Claude Code + Manual | medium | claude-sonnet-4-6 | verification; operator sign-off |

Common contract for every change:
  Entry: `/kbd-apply <change-id>`
  Progress file: .kbd-orchestrator/phases/complete-rebranding/progress.json (runtime projection — change via `prometheus kbd change|task transition`, never hand-edit)
  Handoff: commit on the change branch; mark implementation complete with `scripts/kbd-validate-progress.sh --mark-implementation-complete .kbd-orchestrator/phases/complete-rebranding/progress.json <change-id>` (or the equivalent typed runtime transition); then QA gate → adversarial diff review → `/opsx:verify` → `/opsx:archive`.

HANDOFF NOTE for any non-self tool (Codex, OpenCode, Kimi, Zed, MiniMax):
1. Read .kbd-orchestrator/current-waypoint.json and .kbd-orchestrator/position-reminder.txt
2. Read the change: openspec/changes/<change-id>/ and its entry in plan.md (Details + Acceptance)
3. On start: `prometheus kbd change transition --phase complete-rebranding --id <change-id> --status in-progress --command-id <unique>`; do not edit progress.json
4. Work in a git worktree on branch `rebrand/<change-id>`; commit per task
5. On implementation completion: mark implementation complete (see common contract); evidence/certification do not delay this
6. On blocker: `prometheus kbd blocker record …`, status → blocked, commit

APPROVAL GATES

- Branching: APPROVED 2026-09-23 — branch per change. Setup committed to `main` as 8462164; each change runs on `rebrand/<change-id>` branched from `main` and merges back in plan order. `docs/xhtml-docs/` (pre-existing untracked brand pages) left uncommitted pending operator decision.
- brand-fidelity-audit: operator sign-off on visual fidelity (Manual).
- Any deviation from S1/S2 values beyond D-007 contrast variants requires a new decision-log entry.

FALLBACK CONDITIONS

- A dispatched tool cannot report progress through the typed runtime commands → return the change to Claude Code via /kbd-apply.
- `npx @tailwindcss/upgrade`, shadcn `migrate`, or `assistant-ui upgrade` codemods produce unreviewable diffs → re-scaffold the affected files from the registry and port custom behavior by hand (plan.md risk note).
- Entity components cannot be themed without forking → keep existing components, record reason (plan change 11).

VERIFICATION REQUIREMENTS

- Every change: `npm run build`, `npm test`, `npm run lint` (0 errors once change 1 lands), `npm run typecheck` (added by change 1)
- From change 2 onward: `npm run test:e2e` (screenshots 320/768/1024/1440 × dark/light, axe)
- Blocking constraints in `.kbd-orchestrator/constraints.md` (re-run in full by change 12)
- Per-change acceptance criteria in plan.md

PROGRESS LEDGER

- [PENDING] tailwind-v4-foundation — Claude Code
- [PENDING] visual-verification-harness — Codex or Claude Code
- [PENDING] entity-graph-data-layer — Claude Code
- [PENDING] shadcn-base-ui-migration — Claude Code
- [PENDING] assistant-ui-latest — Claude Code
- [PENDING] knowme-brand-tokens — Claude Code
- [PENDING] knowme-brand-identity — Claude Code
- [PENDING] app-shell-flat2 — Claude Code
- [PENDING] chat-surfaces-flat2 — Claude Code
- [PENDING] landing-and-about-brand — Claude Code
- [PENDING] app-pages-flat2-entity-views — Claude Code
- [PENDING] brand-fidelity-audit — Claude Code + Manual

OUTPUTS

- NONE yet. Canonical tasks are registered per change by /kbd-apply once each change's tasks.md exists (the OpenSpec change directories currently hold only README metadata).

BLOCKERS

- NONE

REFLECTION HANDOFF

- kbd-reflect should consume: per-change review findings under review/<change-id>/, the D-007 contrast deviations and measured ratios, entity-component themeability outcome (change 11), golden snapshot set and axe report (change 12), and whether the entity-graph work should have been a separate phase.

EXECUTION READY
