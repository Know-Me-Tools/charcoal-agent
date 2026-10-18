## 3. app-block-copy-and-media-blocks

- [x] 3.1 Add the shared CopyButton and useCopyToClipboard (success, failure state with selection fallback, live region, 44 px target) and move the existing copy buttons onto it
- [x] 3.2 Define blockText per block type, the single text used by Copy and by export
- [x] 3.3 Copy on tables, math, images, video links and A2UI card text
- [x] 3.4 Add SvgBlock: image-based preview, Source toggle, Copy source, Download, 256 KB cap
- [x] 3.5 Own-host-only video and the image-block decision across sanitizer, reply policy and CSP
- [x] 3.6 Content officer pre-review and operator approval of the block copy strings
- [x] 3.7 Security review of the widened allowlist with mutation checks (SVG script, remote video, remote image, data URL)
- [x] 3.8 Integration gate: copy each block type in Chromium and WebKit (clipboard read), a11y scan, screenshots at 320 and 1440 in both themes
- [x] 3.9 Fix the independent security review's findings: hidden text in Copy table, button labels in table cells, lone-surrogate SVG crash, a direct policy test for video attributes; apply the two content-officer label edits
- [x] 3.10 Fix the defects the gate's screenshots and clipboard readback found: SVG header clips Download at 320 px, Mermaid copy keeps a trailing newline, suspect image copy button placement; add a realistic image fixture and 768 and 1024 captures

Model assignments for these tasks are in `.kbd-orchestrator/phases/chat-export-and-block-copy/plan.md` under Task model assignments, keyed by phase path `chat-export-and-block-copy`, change ID `app-block-copy-and-media-blocks` and the task IDs above.
