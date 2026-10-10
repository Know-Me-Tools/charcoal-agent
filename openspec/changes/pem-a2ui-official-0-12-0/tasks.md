## 1. PEM a2ui-react on official A2UI 0.12.0, pinned, released as a new version

- [x] 1.1 Create a PEM worktree from `origin/main` and pin `@a2ui/react` 0.12.0, `@a2ui/web_core` 0.12.0 and `@a2ui/markdown-it` 0.2.0 exactly in `packages/a2ui-react/package.json`; refresh the lockfile.
- [ ] 1.2 Root-cause `Official A2UI function is unavailable: add` with a failing test first, then fix `official/catalog.ts` (the `Catalog` constructor signature) accordingly.
- [ ] 1.3 Fix `official/runtime.ts`: capabilities (`versions`), surface/version types and `MessageProcessor` generics.
- [ ] 1.4 Decision gate: if the 0.12.0 Basic Catalog (custom elements from `web_core`) cannot back PEM's allowlisted catalog without shadowing or breaking styling, stop and record options for the operator before continuing.
- [ ] 1.5 Verify the v1.0-RC compatibility bridge (`official/v1-compat.ts`) still decomposes into v0.9.1 messages under 0.12.0; add tests for it.
- [ ] 1.6 Carrier spike (moved here so any PEM-side API need ships in this one release): capture a real UAR A2UI stream on the local compose stack by hand-seeding a scratch template and a scratch agent that allows `presentation_render` and calling UAR directly on :6565 with `presentation_mode` and `client_rendering` set (nothing from `site-agent-a2ui-policy` is needed; that change later formalises it), decide the primary carrier, record that the adapter lives in this repo and feeds PEM's public processor API, and add any PEM export that needs before release prep.
- [ ] 1.7 Gates: `typecheck`, `vitest` (30 baseline tests plus new), `pnpm build`, and the exports ledger (`refresh:exports`, `verify:skills`).
- [ ] 1.8 Release prep per `RELEASING.md` and the `npm-release-and-cleanup` skill: lockstep bump of all thirteen packages to the next minor (proposed 4.2.0, confirm), changelog, version-bearing docs and registry status; open the PR for the operator to merge. Do not push to it after review starts.
- [ ] 1.9 Dry run, after the operator merges the PR: `pnpm publish --dry-run` for every package, inspect the packed manifests for `workspace:`, and report the result to the operator. Do not publish.
- [ ] 1.10 Publish only after the operator explicitly approves the dry-run report at CP2 (the operator may publish themselves instead; D-34): publish under the documented procedure and move `latest` and `next`. If npm auth fails, stop and ask; do not work around it.
- [ ] 1.11 Done-when: `npm view @prometheus-ags/a2ui-react version` shows the new version, its manifest pins the three official packages exactly, and a clean install in a scratch app typechecks.

Model assignments for these tasks are in `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` under Task model assignments, keyed by phase path `agui-rendering-functionality`, change `pem-a2ui-official-0-12-0` and backend task ID (the ordinal of each task above).
