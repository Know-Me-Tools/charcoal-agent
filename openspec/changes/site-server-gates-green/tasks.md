## 1. site-server-gates-green

- [x] 1.1 Reproduce the clippy errors and the CSP test failure on a clean worktree of `origin/main`; record the exact output
- [x] 1.2 Decide the CSP cause (stale test or real header drift) by reading the test, the header code and the live response header; if the live header is weaker than intended, stop and report to the operator
- [x] 1.3 Fix the clippy errors, reading each fix for behaviour change
- [x] 1.4 Fix the CSP test, or the header if 1.2 found real drift and the operator agreed
- [x] 1.5 Integration gate: server clippy with warnings denied and the server test suite, run once, serialized
- [x] 1.6 Commit or discard the uncommitted probe edits, list the stale worktrees, and hand the operator the removal command
- [ ] 1.7 Open the PR ready (not draft); the operator merges

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-chat-follow-ups/plan.md` under Task model assignments, keyed by phase path `site-chat-follow-ups`, change ID `site-server-gates-green` and the task IDs above.
