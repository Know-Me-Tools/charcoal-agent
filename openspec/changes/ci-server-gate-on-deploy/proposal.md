## Why

Part of the phase `site-ci-gates-and-chat-polish` (change 2 of 4, depends on `ci-pr-checks`). In `.github/workflows/site.yml` the `image` job needs only `verify`, and `verify` has no Rust step. A red server lint or test cannot stop an image build or a deploy. Evidence: assessment gap G-1.

## What Changes

- `site.yml` gets a `server` job that calls the reusable `./.github/workflows/server-verify.yml` (added by `ci-pr-checks`), and the `image` job's `needs` becomes `[verify, server]`. `server` runs in parallel with `verify`, so the added wall time is the difference between the two, not their sum.
- A small structural guard `scripts/check-ci-gates.sh`, run in the web Verify steps of both workflows: it fails if the `image` job in `site.yml` no longer needs `server`, if `server` no longer calls the reusable workflow, or if `pr-verify.yml` loses its `pull_request` trigger. A workflow edit cannot be tested by the pins and manifests checks, and the gate was invisible the first time; this keeps it from disappearing silently.
- Not changed: the `image`, `deploy` and `smoke` jobs apart from the one `needs` line; branch protection.
- Tasks: see `tasks.md`.

## Impact

- Deploy: this change edits the deploy workflow. It takes effect when it merges, and the first push to `main` afterwards is its real test (the job wiring cannot be exercised on a pull request, because `site.yml` runs only on push). It should merge when the operator can watch the run. A failure of the new `server` job after the merge would block a deploy of code that did not cause it (for example a runner toolchain install failure); that is the cost of the gate.
- Constraints: the guard is a shell script with no new dependency; `check-pins.sh` stays green; never touch the kill switch or the deploy secrets.
- Evidence: the guard passes on the new `site.yml` and fails when `server` is removed from `image.needs` (mutation check); `actionlint` and `yamllint` clean; the pull request's own `pr-verify` run; and, after the merge, the Deploy site run with `server` finishing before `image` starts.
