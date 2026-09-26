# Flake triage worksheet

1. **Capture:** the test title, the failing assertion line, the repeat count and the worker count at which it fails (for example "3/40 at --workers=5").
2. **Reproduce in isolation:** `--repeat-each 20 --workers=1`. If it passes there, the trigger is load or an interaction with other tests.
3. **Reproduce under load:** `--repeat-each 40 --workers=5 --retries=0`. If it still won't fail, raise the repeat count before concluding anything.
4. **Check the previous commit** under the same load. A failure there too points to a load or environment problem, not your change.
5. **Read one failing trace:** what the page looked like at the failing assertion, and whether the expected element ever existed. The `error-context.md` snapshot often shows it.
6. **Form one hypothesis that predicts a fix.** Apply only that change. Re-run at the same load with at least 2× the repeat count. A tied result, such as 3/80 after 3/40, falsifies the hypothesis, so revert that change.
7. **Classify and fix at the source:**
   - Setup race: move state planting to `addInitScript`, or wait on a real signal.
   - App race: fix the app, and add a test that holds the racing write pending.
   - Load only: reduce workers for that project and record why.
8. **Record** the cause, the falsified hypotheses, and before/after numbers in the QA notes.

Common setup races seen:
- `page.evaluate` right after navigation fails with "Execution context was destroyed". Wait for the app's ready signal, or `networkidle`, first.
- State planted from the live page is overwritten by the app's own background sync.
- A fixed delay on a mocked route races the navigation that should follow it.
