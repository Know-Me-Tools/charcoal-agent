## 1. app-export-omission-note

- [x] 1.1 Serializer: record when a visible block is dropped (artifact outside the source allowlist, non-own-host image) and append one omission line to the conversation body
- [x] 1.2 Visitor string for the omission line in `okf-strings.ts`, content-officer pre-review, review record in `docs/content/reviews/`
- [x] 1.3 Tests: dropped form artifact and remote image add the line, plain text chat does not, hidden block types do not, the line carries none of the dropped content; leak and zero-request privacy tests stay green; mutation check on the detection
- [x] 1.4 Integration gate: built app in Chromium, export a chat that contains a form artifact and a remote image, read the file; export a plain chat, read the file
- [ ] 1.5 Open the PR ready (not draft) with the review record; the operator merges

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-chat-follow-ups/plan.md` under Task model assignments, keyed by phase path `site-chat-follow-ups`, change ID `app-export-omission-note` and the task IDs above.
