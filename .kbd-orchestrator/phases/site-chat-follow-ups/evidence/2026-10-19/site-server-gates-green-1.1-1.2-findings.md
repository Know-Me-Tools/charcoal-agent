# site-server-gates-green, tasks 1.1 and 1.2: reproduction and CSP cause (2026-10-19)

Worktree `.claude/worktrees/c3-gates`, clean `origin/main` at `7eb995d`. Toolchain `cargo +1.98.1` (versions.toml "rust"); the Dockerfile uses the same version. The default local toolchain was cargo 1.99.1.

## 1.1 Reproduction

**Clippy** (`cargo +1.98.1 clippy --all-targets --locked -- -D warnings`, web bundle from `server/tests/fixtures/web` through `KNOWME_WEB_DIST_DIR`): exit 101, three errors, all reproduced exactly:

| File | Lint | Fix |
|---|---|---|
| `server/src/domain/agui_filter.rs:366` | `clippy::collapsible_if` | `if let Some(from) = … && !from…` (edition 2024 let-chain) |
| `server/src/domain/session_binding.rs:192` | `clippy::manual_is_multiple_of` | `!hex.len().is_multiple_of(2)` |
| `server/src/infrastructure/gate_token.rs:122` | `clippy::op_ref` | `t.authorization == rejected` |

**Header test** (`cargo test --locked --test meter_and_headers`):
- Fixture web dir, Rust 1.98.1: 12 passed, 0 failed.
- Real web build (default `build.rs` path, `npm ci` then the Vite build, 53.6 s), Rust 1.98.1: 11 passed, 1 failed.
- Real web build, default toolchain (cargo 1.99.1): 11 passed, 1 failed.
- The failing test is `responses_should_carry_enforcing_csp_with_the_theme_hash_and_permissions_policy` (`tests/meter_and_headers.rs:211` before the fix).

**First attempt, not a result:** with no `node_modules` and no `KNOWME_WEB_DIST_DIR`, `build.rs` stops with "has no node_modules"; this is a build-environment error, not a lint or test result.

## 1.2 Cause of the CSP failure: test drift, not a weak header

**Correction, same day, after the first task 1.5 gate run.** The paragraph below first read this as one stale constant in one test and fixed that test to take the hash from the served page. The gate showed it is wider: the harness is documented (`server/tests/common/mod.rs`, header comment) to run against `KNOWME_WEB_DIST_DIR=tests/fixtures/web`, and run against the real bundle three tests fail for that one reason: the CSP test and two in `tests/site_server.rs` (`hashed_assets_should_be_immutable_with_correct_types`, `spa_should_fall_back_to_index_with_isolation_headers`, which assert the fixture's asset names and "fixture-index"). So the 2026-10-17 "failure on a clean main" was a run without the variable. The edit to the CSP test was reverted. The shipped fix is a guard in `start_with` that fails every test with one message naming the variable, plus the fourth clippy error found by `--all-targets` (`tests/common/mod.rs:560`, `redundant_closure`), which the first three errors had hidden because clippy stops at the library.

- The test compared the CSP `script-src` to a hard-coded constant `FIXTURE_THEME_HASH` (`'sha256-2m0LKtL9…'`), the hash of the inline theme script in the fixture page (`server/tests/fixtures/web/index.html`).
- `start()` serves whichever web build the crate embedded at compile time. With the fixture dist the hash matches; with the real bundle the server correctly pins the real inline script, so the constant is wrong.
- The header printed in the failure is identical, hash included, to the live header from `curl -sI https://know-me.tools` read at 2026-10-19:

```
content-security-policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-G4PYLKhJEo2KWmN299upbhMOxraLGkp1cuF7f3/duOw='; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; report-uri /api/csp-report; report-to csp-endpoint
```

- The live policy is enforcing (not report-only) and strict: `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'`, a single pinned script hash. Nothing weaker than intended was found, so the stop condition did not trigger and no security-officer read was needed.
- Superseded fix (reverted): the CSP test took the expected hash from the page it fetched. Not shipped; see the correction above.

## Task 1.5 gate results (repair attempt 1 of 3)

Run from `server/` with `KNOWME_WEB_DIST_DIR=$PWD/tests/fixtures/web`, `cargo +1.98.1`, `--locked`, one cargo invocation at a time:

- `cargo fmt --check`: exit 0.
- `cargo clippy --all-targets -- -D warnings`: exit 0 (first attempt: exit 101 on the fourth error, fixed).
- `cargo test`: exit 0. lib 140 passed; `gate_credentials` 4; `meter_and_headers` 12; `site_server` 32; 0 failed.
- Negative control (first gate run, then restored): `object-src 'none'` changed to `object-src 'self'` in `src/domain/csp.rs`; `enforcing_csp_should_pin_each_directive` FAILED (11 passed, 1 failed). After the restore the file diff was empty and `meter_and_headers` passed 12 of 12.
- Guard control: the same `meter_and_headers` run without the variable (real bundle) fails 12 of 12, each with "the server tests need the fixture web dir: run them with KNOWME_WEB_DIST_DIR=…".
- First attempt before the repair (for the record): clippy exit 101 on `tests/common/mod.rs:560`; suite exit 101 with the two `site_server` failures above.

## Why this stayed red

CI never runs clippy or the tests for `server/`. `.github/workflows/site.yml` runs `cargo test` only for `websearch/`, and the Dockerfile server stage runs `cargo build --release`. Nothing gates the server crate's lints or tests. Making them green does not keep them green. Adding a CI step is outside the three goals of this phase and is left for the operator to decide.
