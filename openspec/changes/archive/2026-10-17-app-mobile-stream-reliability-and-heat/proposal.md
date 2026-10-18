## Why

Part of the phase `chat-export-and-block-copy` (change 1 of 5). Observed problem (operator report): on iOS Safari the phone gets hot and replies stop with 'The reply stopped before it finished'. Code reading found no single cause: every stream delta re-renders the whole thread and re-parses the whole reply, highlighting and diagrams re-run per delta, smooth scrolling restarts per token, and a backgrounded or locked iPhone kills the stream with no resume. First task logs the real failure; later tasks cut per-token work to a bounded rate and add a WebKit test.

The specification is `docs/specs/chat-export-okf-and-block-copy.md` (PR #102); the reasoning, evidence and ordering are in `.kbd-orchestrator/phases/chat-export-and-block-copy/plan.md`.

## What Changes

- Stop the phone running hot and replies stopping on iOS Safari. Depends on: NONE.
- Tasks: see `tasks.md` (the ordinals are the backend task IDs registered with the runtime).
- Plan: `.kbd-orchestrator/phases/chat-export-and-block-copy/plan.md` (round order and the Task model assignments for this change).

## Impact

- Deploy: a merged client change deploys `knowme-web` to production with no approval stop. Review tasks in this change are the only gate.
- Constraints: never touch the kill switch; the repository is public (commit equals publish); export is client-side only and a test proves it; verify any new dependency from the registry; no stronger privacy claim than the product backs.
- Evidence: one integration gate at the end of the change (no per-edit tests); mutation checks for every security or privacy assertion; screenshots looked at, not only captured; real-device runs recorded by the operator where the plan names them.
