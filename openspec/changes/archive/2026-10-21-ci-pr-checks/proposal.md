## Why

Part of the phase `site-ci-gates-and-chat-polish` (change 1 of 4). `.github/workflows/site.yml` triggers only on `push` to `main` and `workflow_dispatch`; no workflow runs on a pull request. Every check therefore runs after the merge, on `main`. That is how PR #129 turned `main` red (Deploy site run 39266829322) and why PR #131 showed no checks at all. The `server/` crate has no lint or test job in any workflow. Evidence: `.kbd-orchestrator/phases/site-ci-gates-and-chat-polish/assessment.md` (gaps G-1 and G-2).

## What Changes

- A reusable workflow `.github/workflows/server-verify.yml` (`workflow_call`) that runs `cargo clippy --all-targets --locked -- -D warnings` and `cargo test --locked` for `server/`, on the Rust version read from `versions.toml`, with `KNOWME_WEB_DIST_DIR` set to the tracked fixture dir. One definition, used by this change's PR workflow now and by the deploy workflow in change 2.
- A new workflow `.github/workflows/pr-verify.yml` on `pull_request`: the same web Verify steps as `site.yml` (pins, manifests, Node from `.nvmrc`, `npm ci --ignore-scripts`, lint, `npm test`, build) plus the server job. Read-only token, no secrets, its own concurrency group, no image build and no deploy.
- The deploy workflow is not touched in this change.
- Not changed: branch protection. Making the checks required is a repository setting and the operator's decision; without it these checks are visible but advisory.
- Tasks: see `tasks.md`.

## Impact

- Deploy: none. A pull request workflow does not deploy, and `site.yml` is untouched. Merging this change adds a workflow that starts running on the next pull request.
- Constraints: every `uses:` in a workflow is a full 40-hex commit SHA (`scripts/check-pins.sh`); local `./` reusable workflows are allowed; the PR workflow runs contributor code, so it gets `contents: read` only, `npm ci --ignore-scripts`, and no secrets; never touch the kill switch.
- Evidence: the pull request that carries this change runs the new workflow on itself, which is the live proof; a throwaway stacked pull request with a deliberate clippy error is the negative control, closed unmerged.
- Cost: a PR run takes about as long as the web Verify job and the server job in parallel; the server job has no cache on its first run.
