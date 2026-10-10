## Why

UAR emits diagnostic artifacts (`provider_event`, `attempt_manifest`) that expose model names, manifest hashes and budgeting state. The public filter is a denylist of two types, so every new internal type leaks until someone adds it (D-29).

## What Changes

- `server/src/domain/agui_filter.rs`: replace `INTERNAL_ARTIFACT_TYPES` with an allowlist of artifact types and event names; anything not listed, or unreadable, is dropped and logged.
- Regression tests that the meter still reads usage from `agui.done` after filtering.
- Supersedes the denylist semantics of `site-proxy-artifact-filter`; completes its open task 1.4 with the new capture.
- Lands in: this repo (`server/`). Owner: km-rust-engineer; km-security-officer reviews.
- Depends on: NONE.
- Plan: `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` (round order and the Task model assignments for this change).

## Impact

- Capability: `public-stream-allowlist`.
- Closes the live leak (F2 of the assessment).
- Production deploy needed (Train A).
- Decisions: see `.kbd-orchestrator/phases/agui-rendering-functionality/decision-log.md` (D-25 to D-31).
