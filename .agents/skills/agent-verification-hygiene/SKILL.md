---
name: agent-verification-hygiene
description: Working rules for AI coding agents, and the people directing them, that keep claims of "done" honest in multi-agent or long-running coding sessions. Covers gating every commit on the test suite, never recording a fix as verified before the check has run, building cross-model review packets that the reviewer can actually judge (full branch diff, deletions, untracked files), treating an all-green verification as something to challenge, recording falsified hypotheses, and handling agent-harness side effects such as stale .git/index.lock files, hooks keyed on process ids, and parallel test runs sharing a port. Use this skill whenever an agent is about to commit, report completion, write a verification or QA record, run or prepare an independent or cross-model review, or coordinate several agents on one repository.
license: MIT
metadata:
  origin: "KnowMe AI web client, complete-rebranding phase, 2026-09"
---

# Verification hygiene for agent-driven work

Most of the expensive mistakes in this phase were not bad code. They were a check that didn't run, or a check that ran on the wrong thing, reported as if it had passed. Each rule below is a failure that actually happened.

**Evidence tags** on each rule: `[verified]` = a failing-then-passing test, a reproduced error or a mutation proof in the origin project; `[docs]` = upstream documentation; `[review]` = found by independent review, fix designed but not yet proven here; `[practice]` = a working convention, not independently tested. Re-check anything version-sensitive against your own versions.

## 1. Gate every commit on the suite `[verified]`

Run the unit suite, the static checks for **every** project in the repo (in TypeScript: each tsconfig, including the e2e one; in other stacks, the equivalent), and lint before *every* commit, including "tiny" style commits. A class change committed without running tests turned `main` red; the guard test that would have caught it was already in the repo.

## 2. "Verified" means you saw it pass `[verified]`

- Never log a fix as applied or verified until the command has run and you have read its output. A lessons file once said a hook fix was "applied and verified". The edit had actually been blocked, and the bug was still live.
- When a record turns out to be wrong, append a correction rather than rewriting history, and name the wrong entry.
- Paste the command and its actual output. Write "not run" for anything you didn't run, and say which claims therefore stay unverified.

## 3. Build review packets the reviewer can judge `[verified]`

Cross-model review, meaning a different model reviewing the diff with no chat history, caught real races and a missing HTML sanitizer. It also produced false alarms, and almost all of them came from the packet, not the reviewer:

- Diff the **whole branch** against its real base (`git diff "$(git merge-base HEAD <base-branch>)" -- :/`, where `:/` means the repo root even when run from a subdirectory), not just `HEAD` or uncommitted work.
- Include deletions. `git checkout <branch> -- .` into a scratch tree drops them.
- **Untracked files are invisible.** `git add` new tests and records before building the packet, or say plainly that they are missing.
- Leave out bookkeeping directories (orchestrator state, logs) so the signal isn't buried.
- Disprove wrong claims with a regression test, not an argument, and record the outcome next to each finding.

Checklist: `references/review-packet.md`.

## 4. Treat an all-green verification as something to challenge `[verified]`

When every scenario is marked met, list what the evidence *doesn't* cover:
- paths tested only in jsdom or against fakes
- mutation proofs whose scratch copies were not kept
- gates that ran on a partial tree or a partial typecheck
- tests that pass with or without the fix

Then have a reviewer who didn't write the work look at it.

## 5. Record the hypotheses that failed `[practice]`

When a flake or bug is diagnosed, record the theories that were falsified and the numbers that falsified them ("asserting earlier still failed 3/80, so it isn't toast lifetime"). It stops the next person, or agent, from repeating them.

## 6. Harness side effects `[verified]`

| Symptom | Cause seen | Handling |
|---|---|---|
| `fatal: Unable to create '.git/index.lock': File exists`, with no git running | A background git refresh interrupted when a subagent hands back | Remove it only when no git process is running at all (`pgrep -x git` is empty; a process list can't prove which repo a git process is using) and the lock is older than any command you just ran (`stat`). Agents should use `git --no-optional-locks` for reads |
| Every write flagged as a collision by a single-writer hook | The hook keyed "session" on `$PPID`, which differs per hook call; a dead process also left a lock | Key on the session id from the hook's stdin JSON, and expire locks whose pid is dead |
| Nonsense e2e failures while two agents run tests | Two Playwright runs sharing one dev-server port | One run per port at a time. Make `reuseExistingServer` opt-in |
| Unit tests fail only in one shell | A different Node on PATH (for example Node 26 vs 24) | Print `node -v` in the gate output, and pin the version |
| An agent's work is lost | `git stash` by a parallel agent | Forbid `git stash` in agent briefs; each agent commits or leaves its changes |

## 7. Brief sub-agents like contractors `[practice]`

Every brief names the files the agent owns, what it must not touch, the exact commands to run and how to report, and the environment traps (Node version, shared ports, no stash). Then verify what it hands back yourself before committing. Its report is a claim, not evidence.
