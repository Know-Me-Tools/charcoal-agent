## 1. app-reset-notice-polish

- [x] 1.1 Reproduce the flake: run `e2e/db-reset-notice.spec.ts` repeatedly on the built app under parallel load, with the trace output kept in a separate directory; read any failing trace; record the cause or that it did not reproduce in N runs
- [x] 1.2 Close control: size and place the Toaster's `closeButton` so the target is at least 44 px square at every width, in tokens, flat
- [x] 1.3 Fix the flake in the spec or the app if 1.1 found a cause; if it did not, make no change and record that
- [x] 1.4 Tests: the e2e spec measures the close control's bounding box at 320 px and 1440 px and asserts at least 44 px each way; mutation check that the assertion fails on the old class string; `tsc --noEmit` on the touched files
- [x] 1.5 Integration gate: the CI Verify sequence (pins, manifests, `npm ci --ignore-scripts`, lint, full `npm test`, build), then the built-app Chromium run of the spec repeated N times; read the screenshots at 320 px light and 1440 px dark
- [ ] 1.6 Open the pull request ready (not draft)

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-ci-gates-and-chat-polish/plan.md` under Task model assignments, keyed by phase path `site-ci-gates-and-chat-polish`, change ID `app-reset-notice-polish` and the task IDs above.
