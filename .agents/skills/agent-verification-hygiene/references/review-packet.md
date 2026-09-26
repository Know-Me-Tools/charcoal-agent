# Review packet checklist

Before sending work to an independent or cross-model reviewer:

- [ ] Every new file is tracked (`git add`), or listed in the packet as missing.
- [ ] The diff is `git diff "$(git merge-base HEAD <base-branch>)" -- :/` (repo root) over the whole branch, committed and uncommitted.
- [ ] Deletions are present in the diff.
- [ ] Bookkeeping directories are excluded (for example `.kbd-orchestrator/`, `.prometheus/`, `.refiner/`, prior review output).
- [ ] The acceptance criteria are included: spec, tasks, the verification record with honest gaps.
- [ ] The gate evidence is included as command plus output, and it states the Node or runtime version.
- [ ] The producing model is named, so the reviewer can be a different one.
- [ ] Any size cap is recorded, with what was truncated.

After the review:

- [ ] Each finding is checked against the code before anything is fixed. Record "confirmed", "false: <evidence>" or "fixed in <commit>".
- [ ] Design-level findings go to the decision owner. Don't fix them silently.
- [ ] Re-review after fixes, in a new round with a new packet.
