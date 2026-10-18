# Assessment: chat-export-and-block-copy

Date: 2026-10-14. Phase goals: `goals.md`. Specification: `docs/specs/chat-export-okf-and-block-copy.md` (merged in PR #102). Predecessor in time: `site-chat-hardening-and-polish`, still active in the ledger and not a parent of this phase.

## How to read this

Facts come from reading code at `origin/main` (merge of PR #101, `5ca45cd`) through a read-only survey on 2026-10-14, plus two re-reads I did for this assessment (the three copy implementations, `package.json`, `versions.toml`, the pin check). Claims marked **[checked]** I re-read myself; the rest rest on the survey. Nothing here was run: this assessment makes no claim about runtime behaviour.

## Adversarial review

Skipped on the operator's standing instruction (decision recorded in project memory: judge runs are declined in assess and plan). No independent critic has read this document. Treat the findings as one author's reading.

## Recalled lessons

No `prior-context.md` exists for this new phase, so nothing was recalled by the hook. The project-level lessons that apply, carried from `site-chat-hardening-and-polish`:

- A visual or security assertion is not evidence until a mutation check shows it fails on the bug. This governs the leak test (G5) and the allowlist completeness test.
- Look at screenshots even when every assertion passes; judge design by captures at 320 and 1440 in both themes.
- Record a decision when a PR reverses one. Two decisions are reversed or extended here (section "Decisions", D-A and D-B).
- `tier-guard.sh` blocks long inline commands that contain test-runner or release text; run gates through a script path.
- A worktree needs a real (cloned) `node_modules`; a symlink breaks PGlite under Vite's file allow list ("Invalid FS bundle size").

Knowledge gaps: none recorded. No `/learn-goal` offers.

## Findings by goal

### G1. Per-block Copy buttons with one shared `CopyButton`

Current state **[checked]**:
- Three separate implementations of copy exist: `ShikiCodeBlock` (inline `navigator.clipboard.writeText(code).then(...)` plus a live "Copied" label), `MermaidBlock`, `HtmlArtifactCard`, and a fourth in `features/chat/components/artifact-block.tsx` ("Copy content").
- **Observed defect:** the Shiki copy handler has a `.then` and no `.catch`. A refused clipboard write (permission denied, insecure context, document not focused) is an unhandled promise rejection and the button says nothing. This is the one observed problem in G1; the "Couldn't copy" state in the spec traces to it.
- Tables, images, math, A2UI cards and citation rows have no copy action. The message-level Copy copies text parts only.

Gap: one `CopyButton` and `useCopyToClipboard`, a `blockText` function per block, and copy on tables, images, video links, cards and SVG. Size: small to medium, frontend only.

### G2. Rendering support for SVG, image and video, with a security review

Current state (survey):
- Sanitizer is the GitHub default schema with two changes; it strips inline `svg`, `video`, `audio`, `iframe`.
- A fenced svg of 100 characters or fewer falls to a plain code block; longer goes to `HtmlArtifactCard` (a sandboxed iframe), which is heavier than an SVG needs.
- Reply content policy allows images only from `know-me.tools` or same-origin; there is no video policy because video is already stripped.
- CSP has no `media-src` (falls back to `default-src 'self'`); `img-src 'self' data: blob:` already permits an `<img>` of a data or blob SVG.
- The `image` content block is skipped when rendering.

Gap: an `SvgBlock` rendering through `<img>` (no script execution, no external loads), an own-host-only `<video>` rule across sanitizer, reply policy and CSP, and a decision on the `image` block. **This widens the reply allowlist, which is the site's main injection boundary; the operator removed the production approval gate, so a bad merge ships at once.** The km-security-officer review is a hard gate, not a courtesy.

### G3 and G4. OKF export, single and bundle

Current state (survey): nothing exists. The only export is assistant-ui's `ExportMarkdown` (text of one message). No zip library is in `package.json` **[checked]**. Messages are readable straight from PGlite (`getThreads`, `getMessages`); the sidebar already filters ephemeral threads.

Gap: a pure serializer with an allowlist of block types, the frontmatter writer, the bundle builder, the download helper, a top-bar and sidebar entry, and a dropdown primitive (none exists in `src/components/ui/`). Medium to large.

**Dependency facts [checked]:** JS dependencies are caret-ranged in `package.json` (`mermaid ^11.12.3`, `shiki ^3.22.0`); `versions.toml` pins fonts, Rust crates, Node and images, not npm libraries. `scripts/check-pins.sh` enforces action SHAs and image digests only, so it will neither require nor reject a zip library. The AGENTS rule still applies: verify the chosen library's current version and licence from the registry before adding it, and prefer a hand-written stored-entry zip if the comparison is close. Not yet done.

### G5. Privacy: no network request during export, proven, and stated

Current state: no test of this kind exists, and no export exists to test. The existing site copy says conversations are "stored in this browser" and messages "are sent to a cloud language model" (`content/site/about-panel.ts`); the export wording must stay inside those two claims.

Gap: a Playwright test that intercepts requests from the export click to the download and asserts none; a leak test with a mutation check; operator-approved strings. The privacy line is not shippable without the first of those.

**Uncomfortable finding:** "built client-side" does not make the conversation private; it was already sent to a model. If the wording drifts toward "private" or "stays on your device", it contradicts the product's own About text. The content officer's pre-review and the operator's approval exist for this.

### G6. Constraints

- Merging a client PR deploys `knowme-web` to production with no approval stop (the `production` reviewer rule was removed 2026-10-14). Unreviewed security changes must not merge. This phase therefore cannot use the earlier habit of "operator approves the deploy" as its safety net; review is the net.
- Never touch the kill switch; operator merges PRs; no secrets or internal ids in any export; repo is public.

## What the ledger and position record say

- The canonical status is consistent: ledger reconcile on the previously active phase returned clean (2026-10-14). `site-chat-hardening-and-polish` remains in execute at task 3.6, un-parked and un-closed; this phase became the active path when it was created. That phase's ledger lags the code (web search, clickable citations and the landing toggle shipped outside it). I did not edit it. Its reconciliation is separate housekeeping.
- Generated projection files (`current-waypoint.md`) are stale; they are regenerated from canonical state and were not hand-edited.
- OpenSpec refresh ran at 1.14.1 (latest verified) after clearing a stale lock left by a dead process from another project (pid 36968, not running).

## Decisions

- **D-A (extends 2026-10-12 decision 3 and the S-tier SVG rule):** an SVG fence renders in `SvgBlock` via `<img>` instead of `HtmlArtifactCard`. Needs the operator's yes through the plan.
- **D-B:** video is own-host only. Default pending the operator's answer; the operator was given the three options and the default on 2026-10-14 and said "start the phase" without overriding, so the defaults stand: own-host video, reasoning excluded, library verified before adoption. Record these in the decision log at plan time.

## Open questions for plan

1. Hand-written stored zip or `fflate`: compare size and licence from the registry (not yet done).
2. Does the `image` content block render at all, or stay skipped? The export follows the renderer.
3. Dropdown: add the shadcn Base UI dropdown through the project's shadcn config, or use a Popover plus buttons (smaller)?
4. Where does the export code live so the landing chunk stays under the 150 kB budget (lazy module plus the button only)?
5. App build parity: export on the app build stores richer blocks; the allowlist handles it, but needs its own fixture.
6. Rendered Mermaid and SVG images in the zip: specified as a later release; confirm.

## Proposed change breakdown (input to plan)

1. `app-block-copy-and-media-blocks`: shared copy, all block copy buttons, `SvgBlock`, table copy, image and video decisions, allowlist and CSP changes, security review. Ships alone.
2. `app-chat-export-okf-single`: serializer and allowlist, single download, menu, privacy line, tests 1 to 7 of the spec.
3. `app-chat-export-okf-bundle`: zip writer, `index.md` and `log.md`, Export all, progress for large counts, remaining tests.

## What was not assessed

Runtime behaviour of any block in a browser; the size of the landing and thread chunks after the work; how any third-party knowledge base ingests `type: Conversation`; Safari and iOS download behaviour; the actual weight of candidate zip libraries.

## Unresolved review findings

None, because no review ran (see "Adversarial review").
