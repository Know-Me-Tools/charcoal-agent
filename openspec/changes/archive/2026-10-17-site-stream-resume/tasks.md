## 2. site-stream-resume

- [x] 2.1 Decision gate: read 1.1 logs and 1.8 evidence; proceed only if streams die when the page is hidden, otherwise cancel this change
- [x] 2.2 Confirm the UAR resume contract (route, `x-uar-run-id`, `Last-Event-ID`) against the pinned UAR source, not memory
- [ ] 2.3 Forward resume through the site proxy under the same filter, derived session header and budget accounting (no double reservation); a run id is bound to its session
- [ ] 2.4 Client: on becoming visible with a dead reader, resume from the last event id, else offer Try again; no duplicated text
- [ ] 2.5 Security review of the resume route (replay of another session's run id, header injection, budget bypass)
- [ ] 2.6 Integration gate: kill the stream mid-reply in WebKit and prove the reply completes without duplicated text

Model assignments for these tasks are in `.kbd-orchestrator/phases/chat-export-and-block-copy/plan.md` under Task model assignments, keyed by phase path `chat-export-and-block-copy`, change ID `site-stream-resume` and the task IDs above.
