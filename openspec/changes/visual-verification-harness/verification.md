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
2. **768px thread layout collapse (HIGH):** at tablet width both the 260px threads sidebar and the right context panel stay open, leaving the conversation column ~150px wide (assistant message content measured at 80px; citation title 0px) — text wraps one word or letter per line. Belongs to app-shell-flat2 (collapse one panel below `lg`).
3. **320px overflow:** skills page cards and the Sync button clip horizontally; the context-update block overflows in the thread; tool-call names truncate.
4. **Light theme user bubble** is dark (`bg-zinc-800`) with dark text — unreadable (already in assessment).
5. The A2UI display artifact (from `agui.custom`) *is* captured — it renders through the app's `A2uiDisplayBlock`, which by current design shows the envelope as preformatted text rather than composing the surface. Composing A2UI surfaces is a product enhancement, not in this phase. Separately, `mermaid` diagram artifacts render as source text rather than diagrams.
6. The A2UI input request shows "Response captured" before any response is submitted.

## Adversarial review (diff mode)
- r1: BLOCK, 2 CRITICAL / 1 WARNING (gpt-5.5, verified-distinct).
  - CRITICAL namespace settings returned inline `{}` → fixed: typed `namespaceSettingsResponse` (`SettingsType`) served by GET/PUT. Typing caught an invalid `source` value while adding it.
  - CRITICAL "A2UI display renders as raw JSON so requirement unmet" → not a harness defect: the screenshot contains the A2UI display artifact rendered by the app's own `A2uiDisplayBlock` (which intentionally shows raw content); finding #4 reworded to make that explicit.
  - WARNING stale axe JSON could leak into the merged report → fixed: `test:a11y` clears `test-results/a11y` first.
- r2: BLOCK, 1 CRITICAL / 1 WARNING.
  - CRITICAL thread capture could precede later blocks → fixed: capture waits for a marker from every block type (skill, context, memory recall/mutation, tool call, citation, both artifacts, A2UI input, A2UI display). Markers assert `attached`, not `visible`: at 768px the app's layout collapse (finding 2) makes blocks 0px wide, which the screenshot records rather than masking with a failure.
  - WARNING `rm -rf` not portable → fixed: `node e2e/support/a11y-report.mjs --clean` (fs.rmSync).
