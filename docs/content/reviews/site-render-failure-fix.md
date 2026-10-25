# Review record: render-failure repair actions

- **Piece:** 12 strings added to `content/site/block-copy.ts` (`BlockCopyContent`), change `render-error-recovery` R2, phase `usefulness-update`. Two are visible buttons; the rest form the user message the fix action sends and the labels of the copied error report.
- **Strings (as drafted by the builder, before review):**
  - Buttons: "Ask the assistant to fix this" (visible text and accessible name); "Copy error report" (accessible name and tooltip of an icon button next to it).
  - Fix turn sent as a visible user message: first line "The {kind} below failed to render. Error: <one-line error>", where {kind} is "diagram" (Mermaid, SVG) or "block" (anything else); second line "Send back a corrected version only."; then the broken source in a fenced block, cut at 4096 characters with the marker "[source truncated]".
  - Error report labels (copied text, for the operator): "KnowMe render failure report", "Kind", "Language", "Error:", "Build", "Time", "Source".
- **Why:** when a model reply contains a diagram or block that cannot render, the visitor sees the fallback and nothing else to do. This gives one next step (ask for a fix) and a way to hand the operator the facts (copy a report).
- **Claims checked against the system:** no marketing claim and no entry in `marketing/strategy/claims-register.md` is involved. Checked against the code:
  - The fix button sends one ordinary chat turn through the same path as typing a message (`aui.thread().append`, then `onNew`). It spends tokens against the site's daily meter, so it is offered once per block, hidden when the failed block is itself a reply to a fix turn, hidden when the thread already holds a fix turn for the same source, and disabled while a reply streams.
  - "Copy error report" copies text on the visitor's device only. The error line has stack frames, URLs and token-like strings removed and is cut at 200 characters. Nothing is sent anywhere; the failure record is held in memory and lost on reload.
  - The broken source is model output. It is placed after the fixed wording, in a fence, as data. The fence is labelled "text", so the message does not render the broken diagram a second time.
  - No claim that the fix will work: the button says "Ask", and a second failure shows the plain fallback with no further offer.
- **Voice:** short, concrete, calm, no hype, no exclamation marks, sentence case, consistent with the existing block labels. Banned words from `src/test/brand-copy.test.ts` checked by reading; that test was not confirmed to cover this file.
- **Accessibility:** both controls are real buttons with a visible focus cue; below 768 px each has a 44 px minimum height or width. The copy button announces "Copied" or "Couldn't copy" through the shared polite live region. The fix button is disabled, not hidden, while a reply streams, so a keyboard user can find it. No screen reader run was done.
- **Not covered:** the wording of the fix turn is read by the model, not only the visitor, so a tone review does not replace an eval; change R3 adds the agent prompt rule and an eval scenario for a fix turn. "Diagram could not be rendered" and the "Diagram" header are existing strings outside this file.
- **Editorial pre-review:** not run by the content officer for this record. The drafting builder checked the list above. A human has not signed off.
- **Operator approval: by merge.** The PR body asks the operator to approve the 12 strings as drafted; merging is recorded as approval.
