# Plan: chat-export-and-block-copy

Date: 2026-10-14. Phase goals: `goals.md`. Assessment: `assessment.md` (assess stage complete). Specification: `docs/specs/chat-export-okf-and-block-copy.md` (PR #102).

OpenSpec available: YES (managed CLI 1.14.1). Changes to implement: 5 (one conditional). Plan revision: 3 (2026-10-14, execute time). Revision 2 moved implementation to Kimi K3 over ACP at the operator's direction. Revision 3 adds tasks 1.9 to 1.11 to change 1 after its independent review and integration gate (decision D-I).

## Operator additions at plan time (2026-10-14)

1. Handle the issues observed on iOS Safari: the phone getting hot and prompts not finishing.
2. Decide how the conversation download should work best on mobile.

Both are in scope. The first is a production problem, so it becomes **change 1 and ships before the export work**. The second is designed into change 4 and 5 and recorded as a spec amendment (task 4.7).

## Adversarial review

Skipped on the operator's standing instruction. No independent critic has read this plan; the plan's ordering and risks are one author's reading.

## Recalled lessons that change ordering, scope or risk

- A visual or security assertion is not evidence until a mutation check shows it fails on the bug: applied to tasks 1.7, 3.7, 4.2, 4.6.
- Look at screenshots, not only assertions: applied to 3.8.
- Real-model and real-device runs come before a change closes: applied to 1.8, 4.8, 5.6 (the operator holds the iPhone; I cannot run iOS here).
- A worktree needs a real cloned node_modules for Playwright; a symlink breaks PGlite under Vite.
- Merging a client change deploys `knowme-web` with no approval stop, so every change here ships only after its review tasks pass.
- From the `plan:before` recall (pk, 14 lessons; four apply): **front-load environment and authorization gates** (so Round 1 also runs the read-only prerequisite checks 2.2 and 5.1 and books the operator's iPhone time before any code lands); **boundary gates must launch the packaged artifact** (the integration gates 1.7, 3.8, 4.8, 5.6 run against the built app, not the dev server alone); **preserve production evidence in dated folders with a README** (the real-device results of 1.8, 4.8, 5.6 go under `evidence/<date>/`); **put the pinned runtime first on PATH before gates** (Node 24.21.0 from `versions.toml`; Node 26 breaks vitest). The other ten recalled lessons do not bear on this phase.
- The operator owns all PR merges and expects the full KBD status at the end of every turn.

## Evidence base for the iOS findings

From a read-only code survey of `origin/main` plus targeted research (2026-10-14). Nothing here was profiled or run on an iPhone. Findings are candidate causes, ranked, each with the measurement that confirms it.

| # | Candidate cause | Evidence | Confirms with |
|---|---|---|---|
| 1 | iOS kills the connection when the page is backgrounded or the screen locks; there is no resume | `use-message-stream.ts` has no `visibilitychange` or `pagehide` handling and no retry; every non-abort read failure shows the one fixed error text; `site_proxy.rs` states resume is not forwarded yet [checked]; a maintainer of a web library reports iOS silently killing SSE connections on iOS 18.7.2 and 26.2 (htmx issue 3634, Jan 2026, one source) | task 1.1 logs, task 1.8 lock-screen test |
| 2 | Per-token cost: whole-thread conversion and a full remark/rehype parse of the whole reply per delta; Shiki and Mermaid re-run per delta | no rAF, transition or deferred value anywhere in the stream path [checked by grep]; `richMessageToThreadMessageLike` maps the whole thread per delta (survey) | task 1.7 profile and counters |
| 3 | `scroll-smooth` on the thread viewport with auto-scroll per token | class present on the viewport [checked] | A/B in 1.8 |
| 4 | The route has a hard 300 s request cap; no server keepalive | `httproutes.yaml` `request: 300s` [checked]; only long turns are affected, web turns measured about 20 s | failure timestamps in 1.1 |
| 5 | PGlite start-up cost and a possibly no-op corruption purge | survey; not verified against the library | task 1.6 |
| 6 | Persistence during streaming | one write per message at the end, not per delta (survey): low likelihood | none planned |

What looks fine and is not touched: the reader loop and decoder, opacity-only animations with a reduced-motion rule, no `backdrop-filter` or `blur` anywhere, no timers or observers loops, SSE not compressed. WebKit's own power guidance (webkit.org, 'How Web Content Can Affect Power Usage') says to animate only transform, opacity and filter and to drive idle power toward zero; the existing animations already follow it.

**Not planned, because no observed failure supports it:** a server keepalive, `h-screen` to `dvh`, Cloudflare or ingress changes. Each gets a one-line revisit trigger in the decision log: failures at about 300 s; layout under the toolbar reported; failure signature of an idle proxy.

**Cannot be proven here:** heat. Playwright WebKit on a Mac is not iOS Safari and has no thermal signal. The measurable proxies (store commits per second, long tasks, parses per second) bound the work, and only the operator's real-iPhone run (1.8) tells whether the phone stays cool. Until that run exists the heat claim stays unverified.

## Mobile download design (input to changes 4 and 5)

Facts, with sources and confidence:
- `navigator.share` has file support from iOS 14 and needs transient user activation; `canShare({files})` must be called first and the share object should contain only `files` (MDN; web.dev; one GitHub report on iOS). MDN's list of shareable file types has `text/plain` and `text/csv` but not `text/markdown` or `application/zip`; whether iOS accepts either is **unverified** and needs a real device.
- `<a download>` is supported on iOS since 13 (WebKit bug 167341); reports on blob URLs are mixed and old; **unverified** on current iOS.
- Async work before the call can lose the user activation. So the file is built when the menu opens (single conversation) or in a visible Prepare step followed by a Save tap (zip).

Design:
1. On touch devices the Export control is a bottom sheet with 44 px targets, not a menu.
2. **Copy as Markdown** is always offered: one tap, no file system, and the most reliable path on a phone.
3. Save order: share sheet when `canShare` accepts the file; else anchor download; else show the text on screen with Copy. Each step is feature-detected, never user-agent sniffed.
4. Single conversation: prebuilt at menu open, so the tap that shares or downloads is synchronous.
5. Zip: visible Prepare with progress, then a Save button. Built in slices that yield, so the page does not heat or freeze; a size warning above a threshold set after measurement.
6. Blob URLs are revoked after a delay, not immediately.
7. The device matrix is recorded, not assumed: iOS Safari current and one older, iOS Chrome (also WebKit), Android Chrome. The operator runs the iPhone checks (4.8, 5.6).

## Change list (ordered)

1. `app-mobile-stream-reliability-and-heat`: Stop the phone running hot and replies stopping on iOS Safari
   - Scope: ui | stream | server | tests
   - Depends on: NONE
   - Recommended agent: Claude Code with the `km-*` roles named in the assignments table
   - Est. complexity: S-M; complexity score: Medium; model class: frontier (project policy)
   - Customer value: HIGH
   - Details: Observed problem (operator report): on iOS Safari the phone gets hot and replies stop with 'The reply stopped before it finished'. Code reading found no single cause: every stream delta re-renders the whole thread and re-parses the whole reply, highlighting and diagrams re-run per delta, smooth scrolling restarts per token, and a backgrounded or locked iPhone kills the stream with no resume. First task logs the real failure; later tasks cut per-token work to a bounded rate and add a WebKit test.

2. `site-stream-resume`: Resume a reply interrupted by backgrounding (gated on measurement)
   - Scope: server | stream | tests
   - Depends on: app-mobile-stream-reliability-and-heat
   - Recommended agent: Claude Code with the `km-*` roles named in the assignments table
   - Est. complexity: M; complexity score: High; model class: frontier (project policy)
   - Customer value: HIGH
   - Details: The proxy documents that stream resume is not forwarded yet. This change exists only if the logs and the real-iPhone run show streams dying when the page is hidden. Task 2.1 is the gate; if it says no, the change is cancelled with its reason recorded.

3. `app-block-copy-and-media-blocks`: Per-block Copy buttons, SVG block, own-host media rules
   - Scope: ui | stream | server | tests
   - Depends on: app-mobile-stream-reliability-and-heat
   - Recommended agent: Claude Code with the `km-*` roles named in the assignments table
   - Est. complexity: L; complexity score: High; model class: frontier (project policy)
   - Customer value: HIGH
   - Details: One shared copy control for every block, a single blockText per block type, an image-based SVG preview, and the allowlist decisions for video and image blocks, behind a security review. Starts after the stream change because both edit the markdown and code-block renderers.

4. `app-chat-export-okf-single`: Export the current conversation as an OKF markdown file, mobile-first save
   - Scope: ui | stream | server | tests
   - Depends on: app-block-copy-and-media-blocks
   - Recommended agent: Claude Code with the `km-*` roles named in the assignments table
   - Est. complexity: L; complexity score: High; model class: frontier (project policy)
   - Customer value: HIGH
   - Details: Pure serializer from an allowlist of block types, a top-bar menu (bottom sheet on phones), a privacy line backed by a zero-request test, and a save flow designed around iOS: prebuild on menu open, share sheet first, anchor download second, copy and on-screen text last.

5. `app-chat-export-okf-bundle`: Export all conversations as an OKF zip bundle
   - Scope: ui | stream | server | tests
   - Depends on: app-chat-export-okf-single
   - Recommended agent: Claude Code with the `km-*` roles named in the assignments table
   - Est. complexity: M-L; complexity score: High; model class: frontier (project policy)
   - Customer value: MEDIUM
   - Details: Zip bundle with index.md and log.md, built in slices that yield to the main thread, with a two-step Prepare then Save flow on touch devices.

## Execution round order

- Round 1: `app-mobile-stream-reliability-and-heat`, plus the read-only prerequisite checks 2.2 (UAR resume contract) and 5.1 (zip library comparison from the registry) so their answers exist before the changes that depend on them, and the operator books iPhone time for 1.8.
- Round 2 (parallel, different files): `site-stream-resume` (gated by its task 2.1), `app-block-copy-and-media-blocks`.
- Round 3: `app-chat-export-okf-single` (needs blockText from change 3).
- Round 4: `app-chat-export-okf-bundle`.

Final phase gates (once, after all implementation): one production-path integration run and one cumulative review; no per-change QA loops.

## Tasks

### app-mobile-stream-reliability-and-heat

- 1.1 Log stream failures with name, message, visibility state and elapsed time (console only, no content, no telemetry)
- 1.2 Coalesce stream deltas: buffer in the reader, flush at most once per animation frame (50 ms timer when hidden), flush on done, error and abort
- 1.3 Memoize the thread-message conversion per message so only the streaming message is rebuilt per flush
- 1.4 Throttle the streaming markdown parse (deferred value, at most 10 per second) and render code and Mermaid fences only once closed
- 1.5 Use `scroll-behavior: auto` while a reply streams; keep smooth scrolling for the visitor's own scroll-to-bottom
- 1.6 Verify the IndexedDB name the corruption purge deletes against the PGlite source and fix it only if it deletes nothing
- 1.7 Add a WebKit iPhone project and a long-stream fixture (400 deltas, 3 code fences, 1 Mermaid fence); record baseline then post-change commits per second, long tasks and parses per second; mutation-check the coalescing
- 1.8 Write the real-iPhone protocol (60 s reply, lock-screen test, Safari Web Inspector timeline) and record the operator's results as evidence
- 1.9 Make the corruption purge fail visibly when the delete is blocked by another tab, instead of waiting forever behind it
- 1.10 Turn the assistant-ui text smoothing off for good (smooth={false}) so there is no off-to-on flip at stream end and no per-character animation work
- 1.11 Make the stream-load spec find the composer by its accessible name so it runs on both the site and the app build

### site-stream-resume

- 2.1 Decision gate: read 1.1 logs and 1.8 evidence; proceed only if streams die when the page is hidden, otherwise cancel this change
- 2.2 Confirm the UAR resume contract (route, `x-uar-run-id`, `Last-Event-ID`) against the pinned UAR source, not memory
- 2.3 Forward resume through the site proxy under the same filter, derived session header and budget accounting (no double reservation); a run id is bound to its session
- 2.4 Client: on becoming visible with a dead reader, resume from the last event id, else offer Try again; no duplicated text
- 2.5 Security review of the resume route (replay of another session's run id, header injection, budget bypass)
- 2.6 Integration gate: kill the stream mid-reply in WebKit and prove the reply completes without duplicated text

### app-block-copy-and-media-blocks

- 3.1 Add the shared CopyButton and useCopyToClipboard (success, failure state with selection fallback, live region, 44 px target) and move the existing copy buttons onto it
- 3.2 Define blockText per block type, the single text used by Copy and by export
- 3.3 Copy on tables, math, images, video links and A2UI card text
- 3.4 Add SvgBlock: image-based preview, Source toggle, Copy source, Download, 256 KB cap
- 3.5 Own-host-only video and the image-block decision across sanitizer, reply policy and CSP
- 3.6 Content officer pre-review and operator approval of the block copy strings
- 3.7 Security review of the widened allowlist with mutation checks (SVG script, remote video, remote image, data URL)
- 3.8 Integration gate: copy each block type in Chromium and WebKit (clipboard read), a11y scan, screenshots at 320 and 1440 in both themes
- 3.9 Fix the independent security review's findings: hidden text in Copy table, button labels in table cells, lone-surrogate SVG crash, a direct policy test for video attributes; apply the two content-officer label edits
- 3.10 Fix the defects the gate's screenshots and clipboard readback found: SVG header clips Download at 320 px, Mermaid copy keeps a trailing newline, suspect image copy button placement; add a realistic image fixture and 768 and 1024 captures

### app-chat-export-okf-single

- 4.1 Pure serializer with an allowlist of block types, footnote sources, frontmatter writer and filename rules
- 4.2 Golden files per block type, completeness test over ContentBlock types, leak test with mutation check, round trip through scripts/kb/lib/frontmatter.mjs
- 4.3 Export entry points: top-bar Export menu, sidebar footer, per-message item; a bottom sheet below 768 px; the privacy line
- 4.4 Mobile save flow: build the file when the menu opens so the tap is synchronous; share sheet when canShare accepts the file; anchor download otherwise; a Copy as Markdown action and an on-screen fallback last; revoke the blob URL after a delay
- 4.5 Content officer pre-review and operator approval of the export strings and the privacy wording
- 4.6 Privacy proof: zero network requests from the export click to the download
- 4.7 Amend docs/specs/chat-export-okf-and-block-copy.md with the mobile section and the stream reliability findings
- 4.8 Integration gate: download in Chromium, Firefox and WebKit; real-iPhone and Android checks of share, download and copy recorded by the operator

### app-chat-export-okf-bundle

- 5.1 Compare a hand-written stored zip with a library using versions, size and licence read from the registry; record the decision
- 5.2 Bundle builder: index.md with okf_version, log.md, conversations folder, filename collision handling
- 5.3 Zip writer in a lazy chunk, built in slices that yield to the main thread (worker if the comparison says so), with progress and a size warning
- 5.4 Two-step Export all on touch devices: Prepare, then a Save button whose tap calls share or download synchronously
- 5.5 Tests: unzip and compare, collisions, reserved names, OKF validity of every file, privacy proof for the zip
- 5.6 Integration gate: export 1, 50 and 300 threads in Chromium and WebKit with long-task measurement; real-iPhone check recorded by the operator

## Task model assignments

**Revision 2 (2026-10-14, at execute time).** The operator directed: use Kimi K3 for the implementation, through the Kimi Code CLI over ACP, the same way the Kubo work does it (`/Users/gqadonis/Projects/references/kubo/.kbd-orchestrator/phases/agent-backend-settings/driver/`). Revision 1 had assigned Claude Opus 5.5 and Sonnet 5.5; this is a deliberate alternative selection, recorded here before any run. Rule applied, as Kubo applies it: **builders run on Kimi K3; decisions, reviews and approvals do not.** A model does not review its own work, so the security reviews (2.5, 3.7), the QA integration-gate review and the content approvals (3.6, 4.5) stay on Claude or with the operator, and the operator's own tasks (1.8 and the real-device checks) stay with the operator.

Harness for builder rows: Kimi Code CLI 2.1.1 (`~/.kimi-code/bin/kimi`), model `kimi-code/k3` (`default_model` in `~/.kimi-code/config.toml`, read 2026-10-14), launched through `driver/kimi-acp.mjs` (ACP v1 over stdio): one session per task, role profile from `.kimi-code/agents/<role>.md` prepended to the prompt, a hardened environment (no GitHub, cluster, Docker or SSH credentials), every permission request checked against a forbidden-command list before it runs, a post-session check that no protected path changed, and `kbd-apply begin-task` and `end-task` driven by the driver. Builders work in a git worktree, commit locally and never push; the lead pushes and opens the PR. Reasoning effort: the Kimi config's own setting (not changed here). Evidence: `.prometheus/model-fleet.md` lists every model as 'Measured: no', so Kimi K3's suitability for this repo is unmeasured; the Kubo project ran it on 2026-10-13 and its sessions are the only local evidence. Native alternative for a failed builder task: Claude Opus 5.5 via the native `km-*` subagent. No liter-llm route is used.

| Phase path | Change ID | Backend task ID | Requirements | Provider/model | Reasoning effort | Rationale and dated evidence | Harness and route | Worker launch and handoff | Native alternative | Availability and verification |
|---|---|---|---|---|---|---|---|---|---|---|
| chat-export-and-block-copy | app-mobile-stream-reliability-and-heat | 1.1 | small edit, one file, high uncertainty value | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-mobile-stream-reliability-and-heat | 1.2 | stream path, ordering and abort edge cases | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-mobile-stream-reliability-and-heat | 1.3 | store and runtime adapter, identity stability | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-mobile-stream-reliability-and-heat | 1.4 | renderer, Shiki and Mermaid effects, streaming states | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-mobile-stream-reliability-and-heat | 1.5 | small CSS and viewport change | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-mobile-stream-reliability-and-heat | 1.6 | read library source, small fix at most | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-mobile-stream-reliability-and-heat | 1.7 | Playwright, measurement design, mutation check | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-qa-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-qa-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-mobile-stream-reliability-and-heat | 1.8 | operator on a real device; agent prepares the protocol | operator | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Operator on a real iPhone; the agent prepares the protocol | Report or decision recorded in the phase evidence | none (judgement or approval task) | Exposed in this session; verified at dispatch |
| chat-export-and-block-copy | app-mobile-stream-reliability-and-heat | 1.9 | onblocked handling, error surface, one test | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-mobile-stream-reliability-and-heat | 1.10 | one prop, one test | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-mobile-stream-reliability-and-heat | 1.11 | spec selector, run on both builds | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-qa-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-qa-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | site-stream-resume | 2.1 | judgement on evidence; no code | Anthropic / Claude Opus 5.5 | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Claude Code, native `km-product-owner` subagent (independent of the builder) | Report or decision recorded in the phase evidence | none (judgement or approval task) | Exposed in this session; verified at dispatch |
| chat-export-and-block-copy | site-stream-resume | 2.2 | read pinned UAR source | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-rust-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-rust-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | site-stream-resume | 2.3 | Rust proxy, security-sensitive, metering | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-rust-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-rust-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | site-stream-resume | 2.4 | stream state machine, dedupe | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | site-stream-resume | 2.5 | independent reviewer | Anthropic / Claude Opus 5.5 | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Claude Code, native `km-security-officer` subagent (independent of the builder) | Report or decision recorded in the phase evidence | Claude Sonnet 5.5 if Opus is unavailable | Exposed in this session; verified at dispatch |
| chat-export-and-block-copy | site-stream-resume | 2.6 | Playwright WebKit, real stack | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-qa-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-qa-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-block-copy-and-media-blocks | 3.1 | component, a11y, failure path | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-block-copy-and-media-blocks | 3.2 | pure functions, shared contract | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-block-copy-and-media-blocks | 3.3 | several renderers | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-block-copy-and-media-blocks | 3.4 | renderer, injection safety | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-block-copy-and-media-blocks | 3.5 | allowlist widening, trust boundary | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-security-officer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-security-officer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-block-copy-and-media-blocks | 3.6 | content review | Anthropic / Claude Sonnet 5.5 | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Claude Code, native `km-chief-content-officer` subagent (independent of the builder) | Report or decision recorded in the phase evidence | none (judgement or approval task) | Exposed in this session; verified at dispatch |
| chat-export-and-block-copy | app-block-copy-and-media-blocks | 3.7 | independent reviewer | Anthropic / Claude Opus 5.5 | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Claude Code, native `km-security-officer` subagent (independent of the builder) | Report or decision recorded in the phase evidence | Claude Sonnet 5.5 if Opus is unavailable | Exposed in this session; verified at dispatch |
| chat-export-and-block-copy | app-block-copy-and-media-blocks | 3.8 | Playwright, a11y, visual | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-qa-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-qa-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-block-copy-and-media-blocks | 3.9 | bug fixes found by the independent review, with regression tests and mutation checks | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-block-copy-and-media-blocks | 3.10 | layout fix, copy text rule, image placement, fixtures, captures | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-single | 4.1 | pure code, OKF validity, leak safety | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-single | 4.2 | tests as the evidence | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-qa-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-qa-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-single | 4.3 | UI, dropdown or sheet primitive | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-single | 4.4 | iOS gesture rules, feature detection | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-single | 4.5 | content review | Anthropic / Claude Sonnet 5.5 | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Claude Code, native `km-chief-content-officer` subagent (independent of the builder) | Report or decision recorded in the phase evidence | none (judgement or approval task) | Exposed in this session; verified at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-single | 4.6 | Playwright request interception, mutation check | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-qa-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-qa-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-single | 4.7 | docs | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-product-owner` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-product-owner` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-single | 4.8 | Playwright, real devices | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-qa-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-qa-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-bundle | 5.1 | registry research, dated evidence | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-rust-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-rust-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-bundle | 5.2 | pure code | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-bundle | 5.3 | performance on phones, memory | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-bundle | 5.4 | iOS gesture rules | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-frontend-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-frontend-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-bundle | 5.5 | tests as the evidence | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-qa-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-qa-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |
| chat-export-and-block-copy | app-chat-export-okf-bundle | 5.6 | Playwright, real devices | Moonshot / Kimi K3 (`kimi-code/k3`) | per Kimi config | Operator direction 2026-10-14 (builders); task fit for the rest judged 2026-10-14; unmeasured in this repo | Kimi Code CLI over ACP (`driver/kimi-acp.mjs`), role profile `km-qa-engineer` | Worktree, hardened env, forbidden-command gate, local commits, report; driver runs kbd-apply begin and end | Anthropic / Claude Opus 5.5 via the native `km-qa-engineer` subagent | CLI 2.1.1 and model config present (read 2026-10-14); ACP self-test run at dispatch |

Unresolved prerequisites: a real iPhone and the operator's time (1.8, 4.8, 5.6); UAR resume support in the pinned image (2.2); the registry check for any zip library (5.1); operator approval of visitor strings (3.6, 4.5).

## Risks and the uncomfortable parts

- **I cannot reproduce the heat.** The plan bounds the work and measures proxies; it cannot certify a cool phone. A change that passes every proxy can still run hot, and only the operator's device run finds out.
- **Cause 1 may be unfixable on the client alone.** If iOS kills the connection on lock, the only cure is resume, which needs server and UAR support. Until then 'prompts not finishing' on a locked phone is a known limit, and the UI should say what happened instead of a generic error (a new string; needs approval, task 4.5 or a follow-up).
- **Coalescing changes timing.** Batching deltas to one per frame alters how text appears; a test must prove order, completeness and abort behaviour, or a dropped final flush truncates replies.
- **Deferring code and diagram rendering until a fence closes** changes what a visitor sees mid-stream; an unclosed fence at the end of a reply must still render.
- **Share sheet and download behaviour on iOS is unverified.** The design is feature-detected so a wrong guess degrades to the next option, not to a dead button.
- **Merge equals deploy.** Review tasks are the only safety net for changes 2 and 3.

## Constraints carried into every change

Never touch the kill switch; operator merges PRs; no secrets or internal ids in any export; client-side-only export with a test; verify any dependency from the registry; no stronger privacy claim than the product backs.
