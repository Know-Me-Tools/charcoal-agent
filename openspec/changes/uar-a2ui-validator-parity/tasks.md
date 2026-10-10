## 1. UAR A2UI validator: add components only where a recorded need exists (conditional)

- [ ] 1.1 Spike: write the gap table (components that agent-authored surfaces need, from change 8's template findings and any other recorded need, against UAR's nine and the v0.9.1 basic catalog) and record whether any gap exists.
- [ ] 1.2 If a gap exists: write failing tests first in the UAR repo (separate worktree) for the needed non-URL components.
- [ ] 1.3 If a gap exists: add the components to the validator enum in the UAR repo; open a PR for the operator to merge.
- [ ] 1.4 Done-when: either the PR is merged and a surface using the new component validates in a local run, or the gap table shows no need and this change closes with that evidence. Reaching production needs a UAR image bump, which is a separate operator-approved deploy item (the pattern in `site-agent-a2ui-policy`), not part of this change.

Model assignments for these tasks are in `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` under Task model assignments, keyed by phase path `agui-rendering-functionality`, change `uar-a2ui-validator-parity` and backend task ID (the ordinal of each task above).
