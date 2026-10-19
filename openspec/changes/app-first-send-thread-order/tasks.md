## 1. app-first-send-thread-order

- [x] 1.1 Failing-first tests: a send before the thread registry is hydrated reproduces the foreign-key failure deterministically (store or hook level, and an end-to-end case with delayed hydration); record that they fail on the current code
- [x] 1.2 Fix in `use-chat-runtime.ts`: a send waits for hydration and registers the thread if still unknown before the stream starts; keep the hydration gate; do not touch the write queue or the recovery paths
- [x] 1.3 Tests for the hazards: a stored thread opened by URL and sent to at once keeps its stored title and messages (not overwritten as ephemeral); a fresh unknown id saves both messages, appears in the sidebar and gets its title on the first exchange; a failed hydration read does not make a send fail; mutation checks that the tests fail without the wait and without the registration
- [x] 1.4 Integration gate: the CI Verify sequence (pins, manifests, `npm ci --ignore-scripts`, lint, full `npm test`, build), then on the built app the persistence end-to-end specs and `db-reset-notice.spec.ts` repeated 30 times with 4 workers in Chromium plus a repeat run in WebKit, with no foreign-key failure
- [ ] 1.5 Open the pull request ready (not draft)

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-ci-gates-and-chat-polish/plan.md` under Task model assignments, keyed by phase path `site-ci-gates-and-chat-polish`, change ID `app-first-send-thread-order` and the task IDs above.
