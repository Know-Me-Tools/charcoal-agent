## 1. Register PEM as a writable workspace folder

- [x] 1.1 Add a `prometheus-entity-management` entry to `workspace.folders` in `.kbd-orchestrator/project.json` with `write_access: true`.
- [x] 1.2 Amend `.kbd-orchestrator/constraints.md`: scope `reference-folders-read-only` to UAR, artifact-refiner and openfang, and note that UAR changes are separate-worktree PRs and PEM is writable by operator direction (D-30).
- [x] 1.3 Integration check: `git diff` shows only those two files changed by this change, and `prometheus kbd status --json` still reports lifecycle `ready` with no conflicts.

Model assignments for these tasks are in `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` under Task model assignments, keyed by phase path `agui-rendering-functionality`, change `register-pem-workspace` and backend task ID (the ordinal of each task above).
