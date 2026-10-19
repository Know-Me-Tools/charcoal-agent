# ci-pr-checks local gate (tasks 1.1 to 1.3)

Base: origin/main 38285ac. Worktree branch feat/ci-pr-checks. Run 2026-10-19.

## Lint and repo checks (from worktree root)

| Command | Exit | Key output |
|---|---|---|
| `actionlint .github/workflows/server-verify.yml .github/workflows/pr-verify.yml` | 0 | no output |
| `yamllint -d relaxed` on both files (no .yamllint config in the repo, so the built-in relaxed preset) | 0 | no output |
| `./scripts/check-pins.sh` | 0 | all workflow actions are pinned by commit SHA and all images are pinned by digest |
| `./scripts/check-manifests.sh` | 0 | 27 YAML files parse; 4 kustomizations render; every workload container has an image |
| `sed -n 's/^"rust" = "\(.*\)"$/\1/p' versions.toml \| wc -l` | 0 | 1 (matches only line 39, `"rust" = "1.98.1"`; line 42 `"image/rust"` does not match) |

## Server gate by hand (from server/, KNOWME_WEB_DIST_DIR=<worktree>/server/tests/fixtures/web, toolchain 1.98.1)

| Command | Exit | Key output |
|---|---|---|
| `cargo +1.98.1 clippy --all-targets --locked -- -D warnings` | 0 | `Finished dev profile ... in 40.33s`, no warnings |
| `cargo +1.98.1 test --locked` | 0 | lib 140 passed; gate_credentials 4 passed; meter_and_headers 12 passed; site_server 32 passed; 0 failed |

Not verified locally: the workflows have not run on GitHub (task 1.4). The `$GITHUB_ENV` export and `rustup ... --component clippy` on the hosted runner are untested until that run.
