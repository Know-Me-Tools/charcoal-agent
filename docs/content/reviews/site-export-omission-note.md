# Review record: export omission line

- **Piece:** one visitor-facing line in the exported conversation file, `OKF_STRINGS.omittedCards`, `OKF_STRINGS.omittedImages` and `omissionLine()` in `src/features/export/okf-strings.ts`. Task 1.2 of change `app-export-omission-note`, phase `site-chat-follow-ups`.
- **Draft string (as built):**
  - Line: "_Left out of this file: interactive cards and images hosted on other sites._" (italic, like the other note lines in the file).
  - The kinds are named only when they were dropped. Cards only: "Left out of this file: interactive cards." Images only: "Left out of this file: images hosted on other sites." Both: the full line above.
  - Kind names: "interactive cards" (`OKF_STRINGS.omittedCards`) and "images hosted on other sites" (`OKF_STRINGS.omittedImages`).
- **Where it appears:** as the last paragraph of the body of an exported conversation, in the single-chat file (Save as Markdown file, Copy as Markdown) and in each conversation file of the zip. Never in `index.md` or `log.md`. Never more than once per conversation.
- **When it appears:** at least one block the visitor could see was dropped. That means a form, confirm, select, text-input, display or A2UI card (a type the chat renders but the export has no text for), or an image that is not on the site's own host or the same origin. It does not appear for text, citations, exported source artifacts (code, html, svg, mermaid, markdown), own-host images, or for block types the chat hides (reasoning, tool calls, skill activation, context updates, memory events, steps, and run diagnostics such as `provider_event`).
- **What it must not claim:**
  - Not that the file is "complete" or "incomplete" in any other sense; it names two kinds of content only and does not count them.
  - Not that anything was removed for safety, privacy or policy reasons; the cards are interactive and have no text form, and the images live on other sites.
  - Not that the visitor can get the content some other way.
  - It never quotes a card title, card text, image address or image description (asserted by `src/features/export/okf-omission.test.ts` and `e2e/chat-export-omission.spec.ts` with planted canary strings).
  - It adds no claim about privacy beyond the existing provenance line ("This file was not uploaded anywhere."); export still makes no network request (`e2e/chat-export.spec.ts`).
- **Open wording questions for the content officer:** "interactive cards" may be unclear to a visitor who saw a form or a confirm prompt (alternatives: "forms and prompts"); "images hosted on other sites" names where the image lived, not what it showed; the sentence-start "Left out of this file:" is a label form, not a full sentence.
- **Voice:** short, concrete, calm; sentence case; no exclamation mark, no hype word.
- **Status: pre-review pending.** No editorial pre-review (km-chief-content-officer) has been run on this string. Operator approval: not given. Nothing here is approved. The operator approves by name, date and the approved file's git hash, or by merging a pull request that lists the string.
