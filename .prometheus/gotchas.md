# gotchas

Append-only. Dated entries. Mark superseded entries; do not delete them.

## 2026-09-25
- Initialized by prometheus-context-bootstrap.

## 2026-09-25 · single-writer hook flagged every write as a collision
- Root cause: `.claude/hooks/single-writer.sh` identified the session as `${CLAUDE_SESSION_ID:-pid-$PPID}`. `CLAUDE_SESSION_ID` is unset in hook processes and `$PPID` differs per hook invocation, so each write (and each subagent write) looked like a new session. A lock left by a dead process then raised false collisions for 4 hours.
- Fix: read `session_id` from the hook's stdin JSON (shared by the main agent and its subagents). Verified: same session id → exit 0; a different session id → exit 2.
- `bootstrap.sh --force` re-copies the upstream hook and would reintroduce this; re-apply the fix or fix it upstream.

## 2026-09-25 · CORRECTION to the entry above (single-writer hook)
- The "Fix" and "Verified" lines above are wrong: the hook edit was denied by the permission classifier (self-modification of `.claude/hooks/`) and was NOT applied. The quoted test ran against the unfixed hook, and a different session id was not rejected (exit 0).
- What was done: the stale lock from the dead process `pid-24343` was removed. Within one Claude process, hook `$PPID` is the same process, so false collisions should not recur until the next new process finds an old lock.
- Still open, for the operator: change the identity line to read `.session_id` from the hook stdin JSON, then verify same id → exit 0 and different id → exit 2.

## 2026-09-25 · stale .git/index.lock keeps reappearing (source not pinned down)
- Seen four times during chat-surfaces-flat2, each an empty lock with no live git process. `GIT_OPTIONAL_LOCKS=0` on the naming test's `git ls-files` did not stop it (the 06:05 occurrence came after that fix), so the test was likely not the only source. Candidates: an agent's `git status` cut off when it hands back, or a harness hook running git in the background.
- Safe handling: confirm no git process (`pgrep -fl git`), check the lock's age, then remove it. Never remove it while a git process is running.
- 2026-09-25 07:00 occurrence: the lock appeared exactly as a subagent handed back after running `git status`, with no git process alive afterwards and no unit tests running. That points at agent hand-back cutting off git's optional index refresh. Mitigation to try: have agents run `git -c core.untrackedCache=false --no-optional-locks status` (or `GIT_OPTIONAL_LOCKS=0`) for read-only checks.
- Later occurrence (after an agent that used only `git --no-optional-locks`): the lock still appeared on hand-back, so agent status calls are not the source. Most likely the harness's own background git refresh on subagent completion. Handling stays the same: check `pgrep -x git`, then remove.

## 2026-09-26: Node 26 breaks jsdom localStorage in vitest
- Symptom: `npm test` fails 19 tests in `persistence-journal.test.ts` and `ui-store.test.ts` with "Cannot read properties of undefined (reading 'clear')" on `localStorage`.
- Cause: the shell's `node` resolved to v26.5.0 through an fnm multishell that comes before nvm on PATH. Node 25+ defines its own global `localStorage`, which shadows jsdom's and is undefined without `--localstorage-file`.
- Proof: with `PATH=~/.nvm/versions/node/v24.16.0/bin:$PATH`, the same tree gives 317/317 passing (39 files).
- Handling: run gates under Node 24. The repo pins no Node version (no .nvmrc, no engines field); pinning is an open operator decision.
- Update, 2026-09-26: Node is now pinned to 24 by the operator's decision: `.nvmrc` (24), `package.json` `engines.node` ">=24 <25", and the Dockerfile builder `node:24-alpine`. `docker build --target builder` passes on node:24-alpine. `engines` makes npm warn (EBADENGINE) on other versions, not fail, so run `nvm use` in a fresh shell.

## 2026-09-26: e2e page loads depended on Google Fonts
- **Symptom:** intermittent `page.goto: Test timeout of 60000ms exceeded` failures on random routes. Most were in a11y.spec, the first spec to run. 2 of 4 full runs failed, with 4–5 failures each. No failure in isolated runs, and nothing in the Vite log.
- **Cause:** `index.html` loaded a render-blocking stylesheet from fonts.googleapis.com, and nothing in e2e stubbed it. A stalled request delays the `load` event. A diagnostic spec that hung the request reproduced the exact `goto` timeout.
- **Fix (operator decision, self-host):** `@fontsource-variable/{inter,space-grotesk,roboto,jetbrains-mono}`@5.3.0, exact-pinned and OFL-1.1, imported in `src/index.css`. The Google link is removed. `e2e/brand.spec.ts` asserts that all four families load and that no request goes to another origin for fonts. That test is mutation-checked against a restored Google link and a missing import.
- **Lesson:** `document.fonts.check()` returns true for a family that was never declared. Assert a declared FontFace with `status === "loaded"` instead.
- **After the fix:** 4 full runs at the default workers gave 3 fully green and 0 `goto` timeouts. One run had 1 failure in chat-surfaces › "retry replaces the failed turn…". Its error was not captured, because my output filter kept only titles. That test then passed 30/30 in isolation at 5 workers. The cause is unknown. If it recurs, capture the full error before retrying.
- **Correction (same day):** self-hosting the fonts did not remove every `goto` timeout. On a fresh dev server after lockfile or branch changes, a11y.spec still failed 10/24, some with `ERR_ABORTED (frame detached)`, while a warm server passed 24/24. The likely cause is Vite dependency re-optimisation reloading pages under concurrent first loads, which is unconfirmed. The fonts were one contributor, not the whole cause. Follow-up: brand-fidelity-audit, for example a warm-up globalSetup or `optimizeDeps.include`/`server.warmup`.
