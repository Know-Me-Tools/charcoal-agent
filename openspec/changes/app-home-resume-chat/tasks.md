## 1. app-home-resume-chat

- [x] 1.1 Read the front page, `useHasSavedChats` and `getLatestPersisted`; decide the button's place in the hero and its visual weight (secondary to the composer's ember send button); record the decision and the interpretation of "the chat view"
- [x] 1.2 The button on the site-build front page: shown only when a saved conversation exists and the saved chats have been read; links straight to the most recent conversation; no layout shift; 44 px target; tokens and flat; keyboard focus; prefetches the thread routes like the composer does
- [x] 1.3 Visitor string in `content/site/`, content-officer pre-review applied, review record in `docs/content/reviews/`; also the missing review record for the existing "Your conversations" header link
- [x] 1.4 Tests: unit tests for the visibility rules (none, only ephemeral, one saved, several saved picks the latest); a built-app end-to-end (save a chat, return to the front page, the button appears, a click opens that conversation with its messages; no history means no button); a layout-shift check; mutation check; `tsc --noEmit` on app and e2e
- [x] 1.5 Integration gate: the CI Verify sequence (pins, manifests, `npm ci --ignore-scripts`, lint, full `npm test`, build), the built-app Chromium run of the new end-to-end, WebKit and Firefox runs of it, and screenshots at 320 px and 1440 px in both themes read
- [ ] 1.6 Open the pull request ready (not draft)

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-ci-gates-and-chat-polish/plan.md` under Task model assignments, keyed by phase path `site-ci-gates-and-chat-polish`, change ID `app-home-resume-chat` and the task IDs above.
