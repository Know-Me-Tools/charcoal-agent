## 1. Hydration must not revert a promoted thread

- [x] 1.1 Failing-first unit test in `src/stores/thread-registry-store.test.ts`, then `initFromDb` skips threads already in memory.
- [x] 1.2 CI Verify sequence and a 40x4 repeat of `e2e/home-resume-chat.spec.ts` on the built site app with no failures. Chromium 280/280 (7 tests x 40), webkit 7/7, firefox 7/7. Evidence: `.kbd-orchestrator/phases/site-ci-gates-and-chat-polish/evidence/2026-10-19/app-persist-loss-gate.md`.
- [ ] 1.3 Open the pull request ready (not draft)
