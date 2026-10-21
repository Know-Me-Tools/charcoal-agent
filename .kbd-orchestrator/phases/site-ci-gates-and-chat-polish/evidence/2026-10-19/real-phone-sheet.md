# Real-phone sheet: export after the omission-line change (2026-10-19)

Site: https://know-me.tools. About 5 minutes. Reply in chat with one line per check: PASS, FAIL or SKIP, plus what you saw on a FAIL. **This sheet is waivable.** If you do not report, the result is recorded as NOT_EXERCISED, never as PASS.

## What this can and cannot cover

The export serializer changed (PR #128: an omission line is added when a card or an image from another site was dropped). That change is live. On production a visitor cannot make either new string appear:
- The reset notice (PR #129, close control in PR #134) shows only when PGlite fails to open the local database because a cached `pglite.data` file is the wrong size. You cannot trigger that from a phone. It was looked at in desktop Chromium, and the browser-matrix change ran it in desktop WebKit and Firefox.
- The omission line shows only when a chat contains a card (form, confirm, display) or an image from another site. The public agent does not produce those, and no code in `src` creates a remote image block (see `qa-remote-image-producer-search.md`).

So the useful look on a phone is the regression: **the export still works, and a normal chat gets no spurious "Left out" line.**

## Checks (iPhone Safari and Android; either or both)

| # | Check | Steps | PASS looks like |
|---|---|---|---|
| 1 | Save a normal chat | Ask the concierge one question, wait for the reply, open the chat menu, Export, Save | A file or the share sheet appears; the file opens as readable text |
| 2 | No spurious line | Read the end of the saved file | The file ends with the conversation. It does not contain the words "Left out of this file" |
| 3 | Copy as Markdown | Export, Copy as Markdown, paste into Notes | The pasted text starts with the frontmatter and has your question and the reply; no "Left out of this file" line |

## Results

**Waived by the operator, 2026-10-19.** In chat, after the browser-matrix and persistence work was reported: "Waive the real phone sheet for now."

Verdict: **NOT_EXERCISED**, waived at the operator's instruction. It is not a pass and nothing was observed on a phone. "For now" means the sheet stays available (this file) and can be re-requested; the three checks above were not run on iPhone or Android. What was run instead is on record elsewhere: the export specs and the reset notice in desktop Chromium, WebKit and Firefox (`qa-browser-matrix-gate.md`).
