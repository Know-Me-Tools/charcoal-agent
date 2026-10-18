## 5. app-chat-export-okf-bundle

- [x] 5.1 Compare a hand-written stored zip with a library using versions, size and licence read from the registry; record the decision
- [x] 5.2 Bundle builder: index.md with okf_version, log.md, conversations folder, filename collision handling
- [x] 5.3 Zip writer in a lazy chunk, built in slices that yield to the main thread (worker if the comparison says so), with progress and a size warning
- [x] 5.4 Two-step Export all on touch devices: Prepare, then a Save button whose tap calls share or download synchronously
- [x] 5.5 Tests: unzip and compare, collisions, reserved names, OKF validity of every file, privacy proof for the zip
- [x] 5.6 Integration gate: export 1, 50 and 300 threads in Chromium and WebKit with long-task measurement; real-iPhone check recorded by the operator

Model assignments for these tasks are in `.kbd-orchestrator/phases/chat-export-and-block-copy/plan.md` under Task model assignments, keyed by phase path `chat-export-and-block-copy`, change ID `app-chat-export-okf-bundle` and the task IDs above.
