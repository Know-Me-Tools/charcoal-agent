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
