# ci-server-gate-on-deploy: local gate evidence

Worktree: /Users/gqadonis/Projects/know-me/charcoal-agent/.claude/worktrees/ci-gate, branch feat/ci-server-gate-on-deploy, base ce8ce94

## 1.3 Local checks (from worktree root)
```
$ actionlint .github/workflows/*.yml
exit: 0
```
```
$ yamllint -d relaxed site.yml pr-verify.yml server-verify.yml
.github/workflows/site.yml
  72:81     warning  line too long (86 > 80 characters)  (line-length)
  82:81     warning  line too long (84 > 80 characters)  (line-length)
  106:81    warning  line too long (82 > 80 characters)  (line-length)
  122:81    warning  line too long (86 > 80 characters)  (line-length)
  129:81    warning  line too long (84 > 80 characters)  (line-length)
  141:81    warning  line too long (118 > 80 characters)  (line-length)
  178:81    warning  line too long (91 > 80 characters)  (line-length)
  195:81    warning  line too long (88 > 80 characters)  (line-length)
  202:81    warning  line too long (84 > 80 characters)  (line-length)
  204:81    warning  line too long (95 > 80 characters)  (line-length)
  205:81    warning  line too long (84 > 80 characters)  (line-length)
  221:81    warning  line too long (94 > 80 characters)  (line-length)
  246:81    warning  line too long (131 > 80 characters)  (line-length)
  259:81    warning  line too long (180 > 80 characters)  (line-length)
  262:81    warning  line too long (111 > 80 characters)  (line-length)
  279:81    warning  line too long (83 > 80 characters)  (line-length)

exit: 0
```
```
$ ./scripts/check-pins.sh
[check-pins] all workflow actions are pinned by commit SHA and all images are pinned by digest (apart from the documented knowme-web exception).
exit: 0
```
```
$ ./scripts/check-manifests.sh
[check-manifests] 27 YAML files parse; 4 kustomizations render; every workload container has an image.
exit: 0
```
```
$ ./scripts/check-ci-gates.sh
[check-ci-gates] image needs server; server calls ./.github/workflows/server-verify.yml; pr-verify triggers on pull_request; server-verify runs clippy -D warnings and cargo test.
exit: 0
```

## Mirror diff of the two verify jobs (comments and blank lines ignored)
```
$ diff <verify job of site.yml> <verify job of pr-verify.yml>   (lines:       20 vs       20)
exit: 0 (0 = identical)
```

## Deploy path needs (site.yml)
```
image:     needs: [verify, server]
websearch-image:     needs: verify
deploy:     needs: image
smoke:     needs: deploy
```

## Mutation check (scratch copies; root passed as argument)
```
$ check-ci-gates.sh <unmodified copy>
[check-ci-gates] image needs server; server calls ./.github/workflows/server-verify.yml; pr-verify triggers on pull_request; server-verify runs clippy -D warnings and cargo test.
exit: 0
```
(a) image.needs: 'verify' only
```
$ check-ci-gates.sh <a>
[check-ci-gates] FAIL: .github/workflows/site.yml: the `image` job's needs does not include `server` (found: verify )
[check-ci-gates] CI gate wiring is broken; see failures above.
exit: 1
```
(a-ok) image.needs multi-line list form must PASS
```
$ check-ci-gates.sh <a2>
[check-ci-gates] image needs server; server calls ./.github/workflows/server-verify.yml; pr-verify triggers on pull_request; server-verify runs clippy -D warnings and cargo test.
exit: 0
```
(b) uses: line removed from server job
```
$ check-ci-gates.sh <b>
[check-ci-gates] FAIL: .github/workflows/site.yml: the `server` job does not have `uses: ./.github/workflows/server-verify.yml`
[check-ci-gates] CI gate wiring is broken; see failures above.
exit: 1
```
(c) pull_request trigger removed
```
$ check-ci-gates.sh <c>
[check-ci-gates] FAIL: .github/workflows/pr-verify.yml: no `pull_request` trigger under `on`
[check-ci-gates] CI gate wiring is broken; see failures above.
exit: 1
```
(d) -D warnings removed
```
$ check-ci-gates.sh <d>
[check-ci-gates] FAIL: .github/workflows/server-verify.yml: no clippy command with `-D warnings`
[check-ci-gates] CI gate wiring is broken; see failures above.
exit: 1
```

Mutated copies live in /private/tmp/claude-501/-Users-gqadonis-Projects-know-me-charcoal-agent/27c66207-2d5b-42ca-ac1f-7218b6ff2759/scratchpad/ci2-mut.8o9iwh (scratch, not committed).
