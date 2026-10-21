# Boundary packet — site-ci-gates-and-chat-polish
Run at: 2026-10-21T09:21:44Z. Read-only. Commands are the ones in adopted-contract.json.

## 1. gh run list --workflow "Deploy site" --limit 8
```
completed	success	Merge pull request #139 from Know-Me-Tools/fix/persist-loss	Deploy site	main	push	39423484347	5m27s	2026-10-20T12:35:47Z
completed	success	Merge pull request #138 from Know-Me-Tools/feat/home-resume-chat	Deploy site	main	push	39332344393	5m21s	2026-10-19T22:04:41Z
completed	success	Merge pull request #137 from Know-Me-Tools/feat/first-send-thread-order	Deploy site	main	push	39324981989	4m29s	2026-10-19T21:07:27Z
completed	success	Merge pull request #136 from Know-Me-Tools/feat/qa-browser-matrix	Deploy site	main	push	39291142780	7m55s	2026-10-19T17:05:28Z
completed	success	Merge pull request #135 from Know-Me-Tools/feat/ci-server-gate-on-deploy	Deploy site	main	push	39291104769	3m44s	2026-10-19T17:05:12Z
completed	success	Merge pull request #132 from Know-Me-Tools/feat/ci-pr-checks	Deploy site	main	push	39284177050	23m44s	2026-10-19T16:16:37Z
completed	success	Merge pull request #134 from Know-Me-Tools/feat/reset-notice-polish	Deploy site	main	push	39283941356	25m33s	2026-10-19T16:14:51Z
completed	success	Merge pull request #130 from Know-Me-Tools/fix/db-reset-test-naming	Deploy site	main	push	39268527593	5m37s	2026-10-19T14:23:35Z
```

## 2. Jobs of the deploy run for #139 (39423484347)
```
{"conclusion":"success","headSha":"6232785f75c09dfab8a41fd7f7999a1e060e7964","jobs":[{"completedAt":"2026-10-20T12:37:51Z","conclusion":"success","name":"Verify","startedAt":"2026-10-20T12:35:51Z"},{"completedAt":"2026-10-20T12:36:52Z","conclusion":"success","name":"Server / Server","startedAt":"2026-10-20T12:35:51Z"},{"completedAt":"2026-10-20T12:39:50Z","conclusion":"success","name":"Build and push image","startedAt":"2026-10-20T12:37:53Z"},{"completedAt":"2026-10-20T12:39:09Z","conclusion":"success","name":"Build and push websearch image","startedAt":"2026-10-20T12:37:54Z"},{"completedAt":"2026-10-20T12:40:37Z","conclusion":"success","name":"Deploy to knowme","startedAt":"2026-10-20T12:39:54Z"},{"completedAt":"2026-10-20T12:41:13Z","conclusion":"success","name":"Smoke test","startedAt":"2026-10-20T12:40:40Z"}]}
```

## 3. gh run list --workflow "Verify pull request" --limit 12
```
completed	success	fix(chat): reading stored threads no longer reverts a saved conversation to a draft	Verify pull request	fix/persist-loss	pull_request	39343249564	1m43s	2026-10-19T23:42:46Z
completed	success	feat(site): front-page button to the latest saved conversation	Verify pull request	feat/home-resume-chat	pull_request	39332097454	2m1s	2026-10-19T22:02:40Z
completed	success	fix(chat): a send never writes a message before its thread row	Verify pull request	feat/first-send-thread-order	pull_request	39324896394	2m2s	2026-10-19T21:06:51Z
completed	success	test(e2e): run the reset notice and export omission specs in WebKit and Firefox	Verify pull request	feat/qa-browser-matrix	pull_request	39290770859	2m3s	2026-10-19T17:02:55Z
completed	success	ci: make the image build wait for the server lint and tests, and guard that wiring	Verify pull request	feat/ci-server-gate-on-deploy	pull_request	39285715946	12m19s	2026-10-19T16:28:34Z
completed	failure	[proof, do not merge] one deliberate clippy error to check the PR gate fails	Verify pull request	ci-proof/red-clippy	pull_request	39283001412	23m28s	2026-10-19T16:07:38Z
completed	success	ci: run the web and server checks on pull requests, and add a server lint and test workflow	Verify pull request	feat/ci-pr-checks	pull_request	39279043632	31m57s	2026-10-19T15:34:28Z
```

## 4. Live image
```
ghcr.io/know-me-tools/knowme-web@sha256:05af7e81b26eb92f6ad6d1bf995fac723f40f2c26abc2c4a04ae106e3a4af676
NAME         READY   UP-TO-DATE   AVAILABLE   AGE
knowme-web   2/2     2            2           16d
```

## 5. Live headers
```
HTTP/1.1 200 OK
content-security-policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-G4PYLKhJEo2KWmN299upbhMOxraLGkp1cuF7f3/duOw='; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; media-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; report-uri /api/csp-report; report-to csp-endpoint
```

## 6. kbd-apply reconcile site-ci-gates-and-chat-polish
```
reconcile: clean — site-ci-gates-and-chat-polish
exit: 0
```
