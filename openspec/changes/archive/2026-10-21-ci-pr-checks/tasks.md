## 1. ci-pr-checks

- [x] 1.1 Reusable workflow `server-verify.yml`: Rust version read from `versions.toml`, clippy `--all-targets --locked -D warnings`, `cargo test --locked`, `KNOWME_WEB_DIST_DIR` set to the fixture dir, `contents: read`
- [x] 1.2 Workflow `pr-verify.yml` on `pull_request`: the web Verify steps of `site.yml` plus a job that calls `server-verify.yml`; read-only token, no secrets, own concurrency group, no image build, no deploy
- [x] 1.3 Local lint of both workflows (`actionlint`, `yamllint`), `scripts/check-pins.sh` and `scripts/check-manifests.sh`, and the server gate run by hand with the same commands and env the workflow uses
- [x] 1.4 Integration gate: open the pull request ready (not draft); its own `pr-verify` run is the live proof; record the run id, both jobs' results and timings
- [x] 1.5 Negative control: a throwaway pull request stacked on this branch with one deliberate clippy error in `server/`; record that `pr-verify` fails on the server job; close it unmerged and delete the branch

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-ci-gates-and-chat-polish/plan.md` under Task model assignments, keyed by phase path `site-ci-gates-and-chat-polish`, change ID `ci-pr-checks` and the task IDs above.
