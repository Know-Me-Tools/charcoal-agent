# Stream load on WebKit (iPhone 14 profile): baseline vs post-change

Date: 2026-10-14. Phase `chat-export-and-block-copy`, change
`app-mobile-stream-reliability-and-heat`, task 1.7. Author: km-qa-engineer.

## What was added

- `playwright.config.ts`: a `webkit-iphone` project (`devices["iPhone 14"]`),
  restricted by `testMatch: "stream-load.spec.ts"` — the rest of the suite
  stays on Chromium.
- `e2e/fixtures/long-stream.ts`: one assistant reply of exactly 400
  `agui.message.delta` events — 396 text lines, 3 fenced `ts` code blocks
  (deltas 100/200/300), 1 Mermaid fence (delta 350), each fence a single
  delta. Built with the existing `toSseBody`/`SseEvent` helpers from
  `e2e/fixtures/sse.ts`. Every delta carries a unique marker that survives
  rendering, so order and completeness are provable from the final DOM.
- `e2e/stream-load.spec.ts`: streams the fixture through the real chat path
  (composer → `POST /api/chat/completion`, paced one SSE event per 5 ms via a
  `window.fetch` init-script override, since `route.fulfill` delivers bodies
  atomically). Measures in the page, with no app instrumentation:
  1. DOM mutation batches per second on `.aui-thread-viewport`
     (MutationObserver; each callback delivery is one batch),
  2. `requestAnimationFrame` gaps over 50 ms (WebKit has no Long Tasks API),
     clipped at final render because the idle page throttles rAF,
  3. wall time from send to final render (final render = last delta marker in
     the text, 3 Shiki code regions, Mermaid SVG present).

Assertions are design properties, not performance claims: mutation batches
never exceed 20 per second (one per 50 ms) during the stream; all 400 delta
markers appear in the final DOM in order; the 3 code blocks and the diagram
render after the stream ends; no text is lost.

## Environment

Node v24.21.0 (pinned first on PATH), Playwright 1.63.0, macOS. WebKit was
not installed on this machine (no `~/Library/Caches/ms-playwright` at all —
Chromium runs fall back to the installed Chrome channel); this task ran
`npx playwright install webkit`, which downloaded the WebKit browser
(`webkit-2359`, plus ffmpeg) into that cache. Each measurement below is a
single run; no loops.

## Results

| Run | Wall time to final render | Mutation batches | Avg batches/s | Peak batches/s (1 s sliding window) | rAF gaps > 50 ms | Assertion (≤ 20/s) |
|---|---|---|---|---|---|---|
| Baseline (`origin/main` = ae5c849, no coalescer, no parse throttle) | 7676 ms | 402 | 52.4 | **97** | 20 | **FAILED (97 > 20)** — expected |
| Post-change (this branch, tasks 1.1–1.6) | 4758 ms | 49 | 10.3 | 14 | 31 | passed |
| Mutation check (coalescer flushes every delta) | 4193 ms | 46 | 11.0 | 14 | 22 | passed — see finding below |
| Restored (coalescer back to per-frame flush) | 4418 ms | 50 | 11.3 | 14 | 20 | passed |

Post-change vs baseline: DOM mutation batches 402 → 49 (−88%), peak rate
97/s → 14/s, wall time 7676 ms → 4758 ms (−38%).

rAF gaps are recorded, not asserted: post-change 31 vs baseline 20. Single
runs, and the rAF counter includes main-thread stalls from the (bounded)
markdown parses; no claim is made from this proxy beyond recording it.

## Mutation check — verbatim outputs and a finding

Mutation applied to `src/features/chat/delta-coalescer.ts`: `push()` called
`flush()` instead of `schedule()`, so every delta committed to the store
immediately.

Run with the mutation (expected to fail the batch assertion — it did NOT):

```
Running 1 test using 1 worker

STREAM_LOAD_METRICS {"deltas":400,"wallMs":4193,"mutationBatches":46,"avgBatchesPerSecond":11,"maxBatchesPerSecond":14,"rafGapsOver50ms":22}
  ✓  1 [webkit-iphone] › e2e/stream-load.spec.ts:179:1 › a 400-delta stream keeps mutation batches bounded and renders completely, in order (7.9s)

  1 passed (13.5s)
```

Run after restoring (`git diff --stat` before it showed only
`playwright.config.ts` modified):

```
 playwright.config.ts | 12 +++++++++++-
 1 file changed, 11 insertions(+), 1 deletion(-)

Running 1 test using 1 worker

STREAM_LOAD_METRICS {"deltas":400,"wallMs":4418,"mutationBatches":50,"avgBatchesPerSecond":11.3,"maxBatchesPerSecond":14,"rafGapsOver50ms":20}
  ✓  1 [webkit-iphone] › e2e/stream-load.spec.ts:179:1 › a 400-delta stream keeps mutation batches bounded and renders completely, in order (9.2s)

  1 passed (15.4s)
```

**Finding: the DOM-level mutation-batch assertion cannot detect a
coalescer-only regression.** The streamed text reaches the DOM through the
task-1.4 parse throttle (`useThrottledValue`, 100 ms, in
`src/components/assistant-ui/enhanced-markdown-text.tsx:321-333`), which caps
viewport DOM mutations at ~10/s no matter how often the store commits — so
with the coalescer broken the measured rate stayed at 14/s and the test
passed. What the assertion does detect is the fully unbounded path: at
`origin/main`, where neither the coalescer nor the throttle exists, the same
spec fails at 97 batches/s. The coalescer's correctness properties (order,
completeness, no lost text on flush-at-done) are guarded separately by the
spec's ordered-markers assertion over all 400 deltas, which would fail on a
dropped or reordered flush. A store-commit-rate check would need app
instrumentation, which this task's constraints forbid; the limitation is
recorded here rather than worked around.

## Fixture/spec bugs found while building (fixed before any measurement)

- The first final-render detector counted `pre` elements: the markdown `pre`
  override (`enhanced-markdown-text.tsx`, `pre:` component) wraps every fenced
  block — code or Mermaid — in an outer `<pre>`, so the count is 7, not 3.
  The detector and assertion now count Shiki code regions
  (`[role=region][aria-label="ts code"]`). This was diagnosed with a temporary
  instrumented run at the baseline; no measurement was taken from that run.
- The rAF gap counter ran for the life of the page and inflated while the
  page idled after the stream; it is now clipped at final render.

## Commands

All runs: `npx playwright test --project=webkit-iphone` with Node 24.21.0
first on PATH. Baseline ran in the read-only worktree
`…/c1-baseline` (origin/main, ae5c849) with only the two new files added plus
a temporary `webkit-iphone` project entry in its `playwright.config.ts`,
restored afterwards; the baseline tree now carries only the untracked
`e2e/stream-load.spec.ts` and `e2e/fixtures/long-stream.ts`.

## What remains unverified

- Real iPhone heat and behaviour: Playwright WebKit on a Mac is not iOS
  Safari and has no thermal signal (plan, "Evidence base"). Task 1.8 is the
  operator's device run.
- The mutation-batch assertion's blindness to a coalescer-only regression
  (above) stands until a store-level probe is allowed.
- Numbers are single runs on one machine; variance across runs is unmeasured.
