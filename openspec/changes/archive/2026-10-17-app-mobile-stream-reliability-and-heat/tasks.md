## 1. app-mobile-stream-reliability-and-heat

- [x] 1.1 Log stream failures with name, message, visibility state and elapsed time (console only, no content, no telemetry)
- [x] 1.2 Coalesce stream deltas: buffer in the reader, flush at most once per animation frame (50 ms timer when hidden), flush on done, error and abort
- [x] 1.3 Memoize the thread-message conversion per message so only the streaming message is rebuilt per flush
- [x] 1.4 Throttle the streaming markdown parse (deferred value, at most 10 per second) and render code and Mermaid fences only once closed
- [x] 1.5 Use `scroll-behavior: auto` while a reply streams; keep smooth scrolling for the visitor's own scroll-to-bottom
- [x] 1.6 Verify the IndexedDB name the corruption purge deletes against the PGlite source and fix it only if it deletes nothing
- [x] 1.7 Add a WebKit iPhone project and a long-stream fixture (400 deltas, 3 code fences, 1 Mermaid fence); record baseline then post-change commits per second, long tasks and parses per second; mutation-check the coalescing
- [x] 1.8 Write the real-iPhone protocol (60 s reply, lock-screen test, Safari Web Inspector timeline) and record the operator's results as evidence
- [x] 1.9 Make the corruption purge fail visibly when the delete is blocked by another tab, instead of waiting forever behind it
- [x] 1.10 Turn the assistant-ui text smoothing off for good (smooth={false}) so there is no off-to-on flip at stream end and no per-character animation work
- [x] 1.11 Make the stream-load spec find the composer by its accessible name so it runs on both the site and the app build

Model assignments for these tasks are in `.kbd-orchestrator/phases/chat-export-and-block-copy/plan.md` under Task model assignments, keyed by phase path `chat-export-and-block-copy`, change ID `app-mobile-stream-reliability-and-heat` and the task IDs above.
