## 1. ci-server-gate-on-deploy

- [x] 1.1 `site.yml`: add a `server` job that calls `./.github/workflows/server-verify.yml`, and make the `image` job need `[verify, server]`; change nothing else in the deploy path
- [x] 1.2 `scripts/check-ci-gates.sh` structural guard (the `image` job needs `server`, `server` calls the reusable workflow, `pr-verify.yml` has a `pull_request` trigger), run as a step in the web Verify steps of `site.yml` and `pr-verify.yml`; mutation check that it fails when `server` is removed from `image.needs`
- [x] 1.3 Local lint (`actionlint`, `yamllint`), `scripts/check-pins.sh`, `scripts/check-manifests.sh` and the guard, run against the changed workflows
- [x] 1.4 Integration gate: open the pull request ready (not draft); the `pr-verify` run on it (from `ci-pr-checks`) is green; record the run id and results; state in the pull request that the deploy wiring is first exercised by the push after the merge

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-ci-gates-and-chat-polish/plan.md` under Task model assignments, keyed by phase path `site-ci-gates-and-chat-polish`, change ID `ci-server-gate-on-deploy` and the task IDs above.
