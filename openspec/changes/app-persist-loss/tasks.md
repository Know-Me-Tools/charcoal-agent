## 1. Hydration must not revert a promoted thread

- [x] 1.1 Failing-first unit test in `src/stores/thread-registry-store.test.ts`, then `initFromDb` skips threads already in memory.
- [ ] 1.2 CI Verify sequence and a 40x4 repeat of `e2e/home-resume-chat.spec.ts` on the built site app with no failures.
