## 4. app-chat-export-okf-single

- [x] 4.1 Pure serializer with an allowlist of block types, footnote sources, frontmatter writer and filename rules
- [x] 4.2 Golden files per block type, completeness test over ContentBlock types, leak test with mutation check, round trip through scripts/kb/lib/frontmatter.mjs
- [x] 4.3 Export entry points: top-bar Export menu, sidebar footer, per-message item; a bottom sheet below 768 px; the privacy line
- [x] 4.4 Mobile save flow: build the file when the menu opens so the tap is synchronous; share sheet when canShare accepts the file; anchor download otherwise; a Copy as Markdown action and an on-screen fallback last; revoke the blob URL after a delay
- [x] 4.5 Content officer pre-review and operator approval of the export strings and the privacy wording
- [x] 4.6 Privacy proof: zero network requests from the export click to the download
- [x] 4.7 Amend docs/specs/chat-export-okf-and-block-copy.md with the mobile section and the stream reliability findings
- [x] 4.8 Integration gate: download in Chromium, Firefox and WebKit; real-iPhone and Android checks of share, download and copy recorded by the operator

Model assignments for these tasks are in `.kbd-orchestrator/phases/chat-export-and-block-copy/plan.md` under Task model assignments, keyed by phase path `chat-export-and-block-copy`, change ID `app-chat-export-okf-single` and the task IDs above.
