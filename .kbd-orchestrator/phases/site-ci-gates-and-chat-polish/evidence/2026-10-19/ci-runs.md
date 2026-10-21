# CI runs for the phase's workflow changes (2026-10-19)

Read with `gh run view <id> --json jobs`. Note on `gh run list`: its run-level `status` lagged for tens of minutes behind the jobs (a run showed `queued` while its jobs had already finished). The job timestamps below are the reliable record; an earlier statement in this session that GitHub's runners were slow was wrong.

## ci-pr-checks (PR #132): the workflow on its own pull request (task 1.4, scenario CI-1)

Run 39279043632, workflow `Verify pull request`, head `cbcec51`, conclusion success.

| Job | Result | Start to end (UTC) |
|---|---|---|
| Verify | success | 15:34:32 to 15:41:32 (7 min) |
| Server / Server | success | 15:34:31 to 15:37:50 (3 min 19 s, cold, no cache) |

The two jobs run in parallel, so the server gate adds no wall time to a pull request. No image or deploy job exists in the run.

## ci-pr-checks: negative control (PR #133, closed unmerged; task 1.5, scenario CI-2)

Throwaway branch `ci-proof/red-clippy` stacked on `feat/ci-pr-checks`, one deliberate `clippy::len_zero` error in `server/src/lib.rs` (head `1f10a24`). Run 39283001412, workflow `Verify pull request`, conclusion **failure**.

| Job | Result | Start to end (UTC) |
|---|---|---|
| Server / Server | **failure** | 16:07:41 to 16:08:10 |
| Verify | success | 16:07:41 to 16:09:38 |

Log lines from the failing job: `error: length comparison to zero`; `= note: -D clippy::len-zero implied by -D warnings`; `error: could not compile knowme-site-server (lib) due to 1 previous error`. The gate goes red on a server lint error and the web job is unaffected. PR #133 was closed unmerged (`mergedAt` null) and the remote branch was deleted afterwards (`git push origin --delete ci-proof/red-clippy`; `ls-remote` shows 0).

## ci-server-gate-on-deploy (PR #135): the pull-request run (task 1.4, scenario CI-3 pull-request side)

Run 39285715946, workflow `Verify pull request`, conclusion success.

| Job | Result | Start to end (UTC) |
|---|---|---|
| Verify | success | 16:28:39 to 16:30:43 (2 min 4 s) |
| Server / Server | success | 16:28:39 to 16:29:52 (1 min 13 s) |

The Verify job's steps include `Check CI gates` (success), `npm test` and `npm run build` (success). The deploy workflow's wiring (`image` waiting for `server`) is not exercised by this run; it is first exercised by the push to `main` after #135 merges.

## ci-server-gate-on-deploy: the first push to main with the new wiring (boundary packet, scenario CI-3)

PR #135 merged 2026-10-19T17:05:09Z as `98ecb78` by GQAdonis. Deploy site run 39291104769 for that commit, conclusion **success**:

| Job | Result | Start to end (UTC) |
|---|---|---|
| Verify | success | 17:05:16 to 17:06:58 |
| Server / Server | success | 17:05:17 to 17:06:26 (1 min 9 s) |
| Build and push image | success | 17:07:02 to 17:07:37 |
| Build and push websearch image | success | 17:07:01 to 17:08:25 |
| Deploy to knowme | success | 17:07:43 to 17:08:26 |
| Smoke test | success | 17:08:29 to 17:08:55 |

Ordering check (read from the job timestamps): `image` started at 17:07:02, after Verify ended (17:06:58) and after Server ended (17:06:26). The `server` job runs in parallel with `verify`, as designed, and `image` waited for both. Live image after this deploy: `sha256:91661a3c2eefdf32e7fd1875a28e88c6bded6f0e90355c18c0b8c4127114d8d4`, 2 of 2 replicas ready; the live Content-Security-Policy is unchanged (same directives and the same script hash as last phase).

Not exercised: the failure direction of the deploy wiring (a red server job blocking `image`) cannot be tested on `main` without pushing a red commit or dispatching the deploy from a branch; the structural guard's mutation checks (`ci-server-gate-on-deploy-local-gate.md`) stand in for it, and the pull-request negative control above shows the shared server job fails on a lint error.

PR #136 (`qa-browser-matrix`) merged 17:05:25Z as `817a8df`. Its Deploy site run 39291142780 also concluded **success**, a second observation of the ordering:

| Job | Result | Start to end (UTC) |
|---|---|---|
| Verify | success | 17:09:02 to 17:11:05 |
| Server / Server | success | 17:09:02 to 17:10:12 (1 min 10 s) |
| Build and push image | success | 17:11:08 to 17:11:35 (started after both) |
| Build and push websearch image | success | 17:11:08 to 17:12:22 |
| Deploy to knowme | success | 17:12:07 to 17:12:49 |
| Smoke test | success | 17:12:53 to 17:13:22 |

Live image after the last deploy: `sha256:dc325263bca05c60418cf7372a94fe2390e6b25cfd2f5d571349aca588f85b58`, 2 of 2 replicas ready; HTTP 200; the Content-Security-Policy is unchanged. Two pushes through the new wiring, two green deploys, `image` starting after both `verify` and `server` each time.

## Deploys of the merged changes (task 1.6 of app-reset-notice-polish)

- `cc35905` (PR #134, the 44 px close control): Deploy site run 39283941356, all five jobs success; Deploy to knowme completed 16:29:47Z, Smoke test 16:30:30Z.
- `ce8ce94` (PR #132): run 39284177050, all five jobs success; Deploy 16:38:02Z, Smoke 16:38:45Z.
- Live image after both: `ghcr.io/know-me-tools/knowme-web@sha256:88dc8649c6a1e1be4104a48aee24996d12f22bf83d3f2013c55592bcb7e1d40c`, 2 of 2 replicas ready.
- The served bundle contains the new close-control classes (`order-last`, `-my-3 -mr-3` each in one JS file of 57) and no longer contains the old class string.
