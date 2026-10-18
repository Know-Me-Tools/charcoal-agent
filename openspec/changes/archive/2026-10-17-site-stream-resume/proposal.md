## Why

Part of the phase `chat-export-and-block-copy` (change 2 of 5). The proxy documents that stream resume is not forwarded yet. This change exists only if the logs and the real-iPhone run show streams dying when the page is hidden. Task 2.1 is the gate; if it says no, the change is cancelled with its reason recorded.

The specification is `docs/specs/chat-export-okf-and-block-copy.md` (PR #102); the reasoning, evidence and ordering are in `.kbd-orchestrator/phases/chat-export-and-block-copy/plan.md`.

## What Changes

- Resume a reply interrupted by backgrounding (gated on measurement). Depends on: app-mobile-stream-reliability-and-heat.
- Tasks: see `tasks.md` (the ordinals are the backend task IDs registered with the runtime).
- Plan: `.kbd-orchestrator/phases/chat-export-and-block-copy/plan.md` (round order and the Task model assignments for this change).

## Impact

- Deploy: a merged client change deploys `knowme-web` to production with no approval stop. Review tasks in this change are the only gate.
- Constraints: never touch the kill switch; the repository is public (commit equals publish); export is client-side only and a test proves it; verify any new dependency from the registry; no stronger privacy claim than the product backs.
- Evidence: one integration gate at the end of the change (no per-edit tests); mutation checks for every security or privacy assertion; screenshots looked at, not only captured; real-device runs recorded by the operator where the plan names them.
