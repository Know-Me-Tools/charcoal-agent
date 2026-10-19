## Why

Part of the phase `site-chat-follow-ups` (change 3 of 3). Three clippy errors and a failing CSP test (`server/tests/meter_and_headers.rs`) were found on a clean `origin/main` on 2026-10-17 and left alone. Neither was re-run in the assess stage. A failing header test on main is either a stale test or a real difference between the header the server sends and the header the test expects; the second case is a security finding and must be reported, not patched around.

## What Changes

- Reproduce both on a clean worktree and record the output.
- Decide whether the CSP failure is test drift or real header drift. If the server sends a header weaker than intended, stop and report to the operator before changing it.
- Fix the clippy errors. Fix the test or the header according to that decision.
- Housekeeping outside the code: commit or discard the uncommitted probe edits in `e2e/real-stream-probe.spec.ts` (`stall` worktree) and list the stale worktrees; removal is an operator command (`git worktree remove`, `rm -rf`), not run by the agent.
- Tasks: see `tasks.md`.

## Impact

- Deploy: a merged server change rebuilds and deploys `knowme-web` to production with no approval stop. The Rust gate runs once, serialized, at the end of the change.
- Constraints: single-writer cargo discipline in one target directory; never touch the kill switch or the ConfigMap `site-chat-kill-switch`.
- Risk: fixing a lint can change behaviour; each fix is read for that before it is made.
