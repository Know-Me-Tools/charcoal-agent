## 1. kb-publish-and-retrieval-eval

- [ ] 14.1 Build and validate the full KB; zero validator failures.
- [ ] 14.2 Question set of at least 60 visitor questions with expected source; pass rule: recall@5 of at least 90% overall and 100% on the flagship, the two FR-8 and the corrected-facts questions; misses are fixed in content, not by changing thresholds.
- [ ] 14.3 FR-8 protection confirmed on the final corpus; the build leaves hand-authored files untouched (2.2 acceptance).
- [ ] 14.4 **Gate:** the content PR is merged first; operator confirms D-P1 and D-P6 (whether counsel reviews comparative or regulated-domain wording); dispatches the content workflow (`dry_run` first).
- [ ] 14.5 Post-publish: indexed status, the committed live validator (`scripts/ops/`), and 15 sample questions read by a person.

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` under Task model assignments, keyed by phase path `site-chat-hardening-and-polish`, change `kb-publish-and-retrieval-eval` and the task ID above.
