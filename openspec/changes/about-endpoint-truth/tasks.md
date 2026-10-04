## 1. About page shows the real endpoint

- [x] 1.1 Show the real same-origin target when `VITE_UAR_BASE_URL` is unset; add a unit test for the label.

  `resolveRuntimeEndpointDisplay(configuredBaseUrl, origin)` added to `src/lib/utils.ts`, used by `src/pages/about-page.tsx` as `resolveRuntimeEndpointDisplay(import.meta.env.VITE_UAR_BASE_URL, window.location.origin)`, replacing the old `?? "http://localhost:6565"` guess. Unit tests in `src/lib/utils.test.ts` (4 cases: configured value wins, unset falls back to `${origin}/api`, blank-configured treated as unset, trailing slash on origin stripped) — `npx vitest run src/lib/utils.test.ts`: 4 passed.
- [ ] 1.2 Visual-first capture of the About page at 320 and 1440 in both themes; view and list the images; goldens pass or are updated with operator sign-off.
