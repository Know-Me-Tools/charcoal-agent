# Verification notes — visual-verification-harness

## 5.1 Gates (2026-09-23)
- `npm run build` 0 · `npm run typecheck` 0 (app + e2e) · lint 0 errors / 6 pre-existing warnings · `npm test` 15/15 (adds 3 SSE-fixture tests)
- `npm run test:e2e`: 122 passed in 1.9 min (2 mock smoke + 96 screenshots + 24 axe scans); 138 s wall-clock for all gates
- 96 screenshots: 12 routes × 320/768/1024/1440 × dark/light in `test-results/screenshots/`
- Unmocked-request guard: 0 unmocked backend requests across the suite
- `AXE_STRICT=1 npm run test:a11y` exits 1 (16 of 24 scans fail) — strict mode verified

## Accessibility baseline (report-only, 1440px)
- color-contrast [serious]: 14 page/theme scans, 74 nodes
- button-name [critical]: landing (dark + light), 1 node each — unnamed button
- nested-interactive [serious]: settings-skills (dark + light), 9 nodes each

## Findings for later changes (not fixed here — no app code in this change)
1. **Early stream events are dropped (correctness bug).** `chat-message-store` creates the assistant message only on the first text/thinking delta; `skill.activated`, `context.update`, `memory.recall` and `tool_call` events that arrive before it are silently discarded (`if (!streaming?.streamingMessageId) return`). UAR plausibly emits skill activation before generation. The fixture sends a thinking delta first so all blocks render; fix belongs in assistant-ui-latest (runtime/store) with a unit test.
2. **320px overflow:** skills page cards and the Sync button clip horizontally; the context-update block overflows in the thread; tool-call names truncate.
3. **Light theme user bubble** is dark (`bg-zinc-800`) with dark text — unreadable (already in assessment).
4. A2UI `surfaceUpdate` envelopes from `agui.custom` render as raw JSON, and `mermaid` diagram artifacts render as source text rather than diagrams.
5. The A2UI input request shows "Response captured" before any response is submitted.
