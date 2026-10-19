## 1. app-db-reset-notice

- [x] 1.1 Find the smallest honest way to reach the purge-and-reopen path in a real browser run (a corrupt `/charcoal-db` that throws "bundle size"); record the method, or record that none exists and why
- [x] 1.2 Show one reset notice after the retry succeeds, using the existing toast mechanism; once per reset, not on later loads
- [x] 1.3 Visitor string for the notice, content-officer pre-review, review record in `docs/content/reviews/`
- [x] 1.4 Tests: notice after a reset, none on a normal start, none on a second load; mutation check that the test fails without the notice
- [x] 1.5 Integration gate: built app in Chromium reaches the reset path through the method from 1.1, the notice shows once, the app opens with an empty chat list
- [ ] 1.6 Open the PR ready (not draft) with the review record; the operator merges

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-chat-follow-ups/plan.md` under Task model assignments, keyed by phase path `site-chat-follow-ups`, change ID `app-db-reset-notice` and the task IDs above.
