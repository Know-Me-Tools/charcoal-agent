# Review record: per-block Copy controls and SVG block labels

- **Piece:** `content/site/block-copy.ts` -> `BLOCK_COPY_CONTENT` (21 strings), task 3.6 of change `app-block-copy-and-media-blocks`, phase `chat-export-and-block-copy`.
- **Strings (as drafted by the builders, before this review):** visible "Copy"; state text "Copied" and "Couldn't copy"; accessible names "Copy code", "Copy diagram source", "Copy content", "Copy table", "Copy math", "Copy image", "Copy video link", "Copy card", "Copy SVG source"; image state text "Copied image" and "Copied image link"; SVG block title "SVG", toggles "Preview" and "Source", download "Download" (accessible name "Download SVG"), image alt "SVG diagram", too-large note "This SVG is too large to preview, so only its source is shown."
- **Why:** each block in a chat reply (code, Mermaid diagram, SVG, table, display math, image, video, answer card) gets a Copy control, and the SVG block gets Preview, Source and Download. Spec `docs/specs/chat-export-okf-and-block-copy.md` section 9 requires content-officer pre-review and operator approval of the wording.
- **Claims checked against the system:** no marketing claim and no entry in `marketing/strategy/claims-register.md` is involved. Checked against the code:
  - "Copy code", "Copy diagram source", "Copy SVG source": copy the raw code or source (`src/features/blocks/block-text.ts`).
  - "Copy table": copies the table as GitHub markdown, not as spreadsheet cells; pasted into a spreadsheet it is pipe text.
  - "Copy math": copies the TeX source, without delimiters.
  - "Copy image": copies the image as PNG when the browser allows it, otherwise the image link; "Copied image" and "Copied image link" tell the visitor which happened.
  - "Copy video link": copies the link.
  - "Copy card": copies title, summary and source lines plus the fixed AI caption.
  - "Download SVG": saves the SVG source as `diagram.svg`.
  - Too-large note: backed by `SVG_SIZE_CAP_BYTES` (256 KB); over it the block shows the source only, hides the toggles, and keeps Copy and Download.
  - No claim of privacy, security or compliance.
- **Voice:** short, concrete, calm, no hype, no exclamation marks. Sentence case, consistent with the existing "Copy code" and "Copied". `src/test/brand-copy.test.ts` bans "revolutionary", "game-changing", "cutting-edge", "unlock", "unleash", "supercharge", "charcoal" and "!"; none found by reading (the test was not run for this record, and it was not confirmed that it covers this file).
- **Accessibility:** the visible label "Copy" is contained in every accessible name; "Download" is contained in "Download SVG". Success and failure are announced through a polite live region and shown with an icon and text, not colour alone. Reduced motion: the control has no animation beyond the shared hover transition (checked in the QA gate, not in this pre-review). No screen reader run was done for this pre-review.
- **Not covered:** the Mermaid header and region labels ("Diagram", "Source", "Table") are hard-coded outside the content file; the legacy wording kept ("Copy", "Copied", "Copy code", "Copy content") was already visible to visitors; no download feedback or failure text exists (a browser saves the file itself).
- **Editorial pre-review (km-chief-content-officer, AI pre-review, 2026-10-14):** APPROVE WITH EDITS. These are suggestions, not approval. A human has not signed off on them.
  1. "Copy card" to "Copy card text" (the spec says so; what is copied is text with the AI caption, not the card). **Applied in the draft by the lead before the operator's review (task 3.9).**
  2. "Copy math" to "Copy math source" (it copies TeX source; matches "diagram source" and "SVG source"). **Applied in the draft by the lead (task 3.9).**
  3. Optional: "Copy content" to "Copy artifact source" (legacy wording, vague for screen-reader users). **Not applied; the operator's call.**
  4. Optional: the SVG image alt "SVG diagram" to "Drawing from the reply" (the block may hold any drawing). **Not applied; the operator's call.**
  5. Optional: the too-large note to "Too large to preview. Showing the source only." The current text is accurate. **Not applied; the operator's call.**
  6. Every other string is kept as written.
  7. Message-changing edits (none proposed) would go to `km-cmo`; these are label wording only.
- **Open points for the operator:**
  - The strings file header says every visitor-facing string of the Copy control lives in it, which holds for Copy but not for the Mermaid "Diagram"/"Source" labels and the table region label. Decide whether to move them.
  - The Mermaid artifact card gives no next step after "Couldn't copy" (the source cannot be selected from the card); a short line such as "Couldn't copy. Open Source to select it." is possible. A design question, not a blocker.
- **Operator approval: PENDING (not yet given).** The strings are not approved and must not reach production until the operator records name, date and git hash here.
