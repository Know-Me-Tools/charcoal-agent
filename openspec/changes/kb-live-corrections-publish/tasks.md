## 1. kb-live-corrections-publish

- [ ] 13.1 Build and validate the corrected KB files from 9.2 (including `the-boss.md`); zero validator failures; the two FR-8 files are present.
- [ ] 13.2 Eval: the corrected facts (platforms, availability, mobile status, The Boss platforms and sizes) are retrieved correctly; the two FR-8 questions still pass.
- [ ] 13.3 **Gate:** the content PR is merged first (the seed uses the dispatched ref's checkout); operator approves publication and company name (D-P1); operator dispatches the content workflow with `dry_run: true`, then `sync: kb`.
- [ ] 13.4 Post-publish: seed log shows documents indexed; ask the corrected questions on the live site and look at the answers.

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` under Task model assignments, keyed by phase path `site-chat-hardening-and-polish`, change `kb-live-corrections-publish` and the task ID above.
