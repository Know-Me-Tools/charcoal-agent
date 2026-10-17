# Review record: "All conversations (.zip)" export strings

- **Piece:** nine strings added to `content/site/chat-export.ts` (`ChatExportContent`), change `app-chat-export-okf-bundle`, phase `chat-export-and-block-copy`; and the text written into the zip's `log.md` and `index.md` (`src/features/export/okf-strings.ts`).
- **Strings (as drafted by the builder, before this review):**
  - `prepareAll`: "Prepare all conversations (.zip)"
  - `preparingAll`: "Preparing: {done} of {total}"
  - `readyNote`: "Conversations ready: {count}, {size}."
  - `saveAll`: "Save zip file"
  - `bundleEmpty`: "No saved conversations to export."
  - `bundleLarge`: "This is a large export. Saving may take a while."
  - `prepareFailed`: "Could not prepare the zip file."
  - `savedAll`: "Zip file saved."
  - `saveFailedAll`: "Could not save the zip file."
  - In the file: `log.md` "**Creation** - Exported {n} conversation(s) from KnowMe in the browser. This file was not uploaded anywhere."; `index.md` title "KnowMe conversations"; "Undated" for a conversation with no valid message time.
- **Why:** the export is two steps (Prepare, then Save) because a zip of many conversations cannot be built inside the tap that saves it on iOS Safari (spec section 15.1). The two-step wording has to say what each button does.
- **Claims checked against the code:**
  - "Conversations ready: {count}" counts conversations that have exportable content; saved conversations with nothing to export are left out and not counted (`Bundle.skipped`).
  - "Made in this browser. The export makes no network request." (existing privacy line, unchanged) still holds: the zip library loads as app code on first use, and a Playwright test records zero fetch, XHR or beacon requests from the Export click to the finished download. It exempts only script loads of the app's own code, and a mutation check (a temporary `fetch` in the prepare path) turned it red.
  - "Save zip file" names the file, not the route (share sheet or download), as "Save as Markdown file (.md)" does.
  - The log line says "This file was not uploaded anywhere", which is what the export does; it says nothing about what happens to the file afterwards.
  - Only conversations saved in this browser are exported (not temporary ones), so "No saved conversations" is accurate.
- **Voice:** short, concrete, no hype, no exclamation marks, sentence case, no "private", "secure" or compliance word (spec 9.1). `readyNote` reads correctly for one conversation ("Conversations ready: 1, 2 KB.").
- **Points for the operator:**
  1. `menuTitle` still reads "Export this conversation" while the menu now also holds the all-conversations action. Changing it is a wording change and was not made here.
  2. Desktop also gets two steps (Prepare, then Save). One path is easier to prove and avoids a download that a browser may block after an `await`; the cost is one extra click on desktop.
  3. The size warning appears from 50 MB of text. The largest size tested is 300 conversations (183 KB zip), so the threshold is a guess.
- **Independent code review (fresh-context `typescript-reviewer`, 2026-10-17, static reading only):** no critical or high finding. Fixed in this PR: an abandoned zip run kept compressing after the menu closed (it now stops, and a leaving page abandons the run); the index description and title were not escaped, so a first question containing a link, image or HTML could put one in `index.md` (every Markdown and HTML metacharacter is now backslash-escaped in both, with a test); the description was cut to 160 characters before the id scrub instead of after. Not changed: one synchronous block while the markdown is built (the 300-conversation gate showed no long task), a swallowed error cause on failure (no observed failure), skipped conversations not reported (as designed above).
- **Editorial pre-review (km-chief-content-officer):** not run for this record. These strings were drafted and checked by the lead only; a human has not signed off.
- **Operator approval:** by merge of the PR that adds this file, as for PR #104 and PR #110. A merge records approval of the strings as written.
