## Why

The operator requires the latest official A2UI (0.12.0) pinned in everything we build. The PEM package that the app will consume is two minor versions behind and breaks on the bump.

## What Changes

- Pin `@a2ui/react` 0.12.0, `@a2ui/web_core` 0.12.0 and `@a2ui/markdown-it` 0.2.0 exactly in `packages/a2ui-react/package.json`.
- Fix the `Catalog` constructor, capability and message-processor changes in `official/catalog.ts` and `official/runtime.ts`; root-cause `Official A2UI function is unavailable: add`.
- Lockstep version bump of the thirteen packages, changelog, and a publish following `RELEASING.md` and the `npm-release-and-cleanup` skill.
- Lands in: PEM repo (`/Users/gqadonis/Projects/prometheus/prometheus-entity-management`). Owner: km-frontend-engineer; operator merges and authorises publication.
- Depends on: register-pem-workspace.
- Plan: `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` (round order and the Task model assignments for this change).

## Impact

- Capability: `pem-a2ui-official-renderer`.
- Unblocks `app-a2ui-surface-renderer`.
- Publishes to npm (operator-authorised, D-28); a bad release is deprecation, not rollback.
- Decisions: see `.kbd-orchestrator/phases/agui-rendering-functionality/decision-log.md` (D-25 to D-31).
