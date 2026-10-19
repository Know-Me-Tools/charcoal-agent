# Device check sheet: export and copy on a real phone (2026-10-18)

Site: https://know-me.tools. About 10 minutes per phone. Reply in chat with one line per check: PASS, FAIL or SKIP, plus what you saw on a FAIL.

Setup: open the site in the phone's browser (Safari on iPhone, Chrome on Android), send two short messages so the chat has content, then open the chat's menu.

| # | Check | Steps | PASS looks like |
|---|---|---|---|
| 1 | Single chat, Save | Export this chat, tap Save | A file or the share sheet appears; the file is a readable `.md` |
| 2 | Single chat, Copy as Markdown | Tap Copy as Markdown, paste into Notes | The pasted text starts with the OKF frontmatter and has both messages |
| 3 | All chats, zip | Export all, wait for Prepare to finish, then tap Save | Prepare finishes (note roughly how many seconds); Save gives a `.zip` you can open |
| 4 | Image Copy | In a reply that has an image, tap Copy on the image, paste into Notes | The image pastes |
| 5 | User message Copy | Tap the Copy icon on one of your own messages, paste | Your message text pastes |

Check 4 only applies if a reply contains an image. Mark SKIP if you cannot get one.

Phones to cover: the iPhone you used before, and one Android phone if you have one. WebKit and Firefox desktop runs stay waived unless a check fails.

## Results

### Android, 2026-10-18 (operator report in chat)

| # | Result | Notes |
|---|---|---|
| 1 | PASS | Operator: downloaded a conversation on an Android phone and saved it to Google Drive, "it worked". Browser and model not stated. File read back by the agent from `~/Downloads/knowme-how-can-the-know-me-app-with-openai-dot-function-20261018.md`. |
| 2 | not reported | |
| 3 | not reported | |
| 4 | not reported | |
| 5 | not reported | |

### iPhone and Android, all checks (operator report in chat, same day)

Operator: "I validated all these operations on mobile iOS and android". Recorded as PASS for checks 1 to 5 on both platforms. This is a single summary statement: no per-check detail, device models, browsers, or Prepare time for the zip were given, so those stay unrecorded. Only the Android check 1 file was seen by the agent.

| # | iPhone | Android |
|---|---|---|
| 1 Single chat Save | PASS (operator) | PASS (operator, file read) |
| 2 Copy as Markdown | PASS (operator) | PASS (operator) |
| 3 Zip Prepare then Save | PASS (operator) | PASS (operator) |
| 4 Image Copy | PASS (operator) | PASS (operator) |
| 5 User message Copy | PASS (operator) | PASS (operator) |

Still unverified: WebKit and Firefox desktop runs, and zip Prepare time on a phone.

What the file shows (read by the agent, not a phone observation):
- OKF frontmatter present: `type`, `title`, `description`, `status`, `generated`, `tags`, and `sources[]` with K1 to K5.
- Four messages in order, with UTC timestamps; the concierge replies carry footnote citations that resolve to the five sources.
- The privacy line "This file was not uploaded anywhere" is present.
- No internal ids, thread ids, URLs with tokens, or tool output in the file.
- Cosmetic: `description` is "How can know", the visitor's first, abandoned message. The title comes from the second message. Not a defect in the export contract; noted for the follow-up list.
