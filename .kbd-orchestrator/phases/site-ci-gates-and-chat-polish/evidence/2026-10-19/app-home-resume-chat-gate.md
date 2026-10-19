# app-home-resume-chat: gate evidence (tasks 1.1 to 1.5)

Branch `feat/home-resume-chat`, cut from origin/main `817a8df`. Node 24.21.0. macOS (darwin 25.6, arm64). Task 1.6 (the pull request) is not part of this file; `tasks.md` is not ticked here.

Method: engine runs are `--workers=1 --retries=0` against the BUILT site flavour (`VITE_SITE_AGENT_ID=knowme-site VITE_SITE_WEB_SEARCH= VITE_UAR_API_KEY= VITE_UAR_BASE_URL=`, the Dockerfile env) served by `vite preview` (port 4611), `E2E_BUILT=1 E2E_REUSE_SERVER=1`. A second bundle with `VITE_SITE_WEB_SEARCH=1` (what `.github/workflows/site.yml` deploys) was built on port 4612 for measurement only. Chromium is whichever build `e2e/support/browser-channel.ts` picks on this machine (not recorded per run); WebKit and Firefox are the installed Desktop Safari and Desktop Firefox projects.

Machine state during the run: load average 300 to 377 (other sessions). It caused 5 s unit-test timeouts and `findBy` timeouts in unrelated files (see 1.5).

## 1.1 Reading, interpretation, placement

Read: `src/pages/landing-page.tsx`, `src/hooks/use-has-saved-chats.ts`, `getLatestPersisted()` in `src/stores/thread-registry-store.ts`, `src/components/site/site-header.tsx`, `content/site/history-link.ts`, `src/pages/landing-page.site.test.tsx`, `e2e/site-history-link.spec.ts`, `e2e/db-reset-notice.spec.ts`, `docs/design/brand-pages.md` (section 6.2 and 12), the `knowme-brand-standard` skill.

Interpretation of "the chat view": the visitor's most recent saved conversation (`/threads/<id>`), as the proposal records. The header link to the list (`Your conversations`, `/threads`) stays.

Facts that drove the placement:

- `getLatestPersisted()` picks the non-ephemeral thread with the greatest `updatedAt`. It can return a thread before hydration only if the registry already holds one, so the button also requires `hydrated`.
- The composer action row, measured on the built bundles (bounding boxes, no history):

| Bundle | Width | Row width | Row height | Children |
| --- | --- | --- | --- | --- |
| web search off | 320 | 272 | 40 | Send 91 wide (at x=24: with the toggle absent `justify-between` leaves Send on the LEFT; existing behaviour, not changed) |
| web search off | 1440 | 404 | 40 | Send 91 |
| web search ON (production) | 320 | 272 | 44 | toggle 154 + Send 91 = 245, leaving 27 px |
| web search ON (production) | 1440 | 404 | 40 | toggle 146 + Send 91 |

  Production deploys with web search on, so at 320 px the row has 27 px free. A 44 px target with a 31-character label does not fit there. The action row was the preferred place and was rejected on this measurement. (Not tried: an icon-only button in the row; it would carry no visible label and the label is the reviewed string.)
- Decision: a link button under the AI disclosure lines, in the composer's column (`src/pages/landing-page.tsx`, `ResumeChatLink`). The disclosure stays adjacent to the composer.
- Layout shift: first try, in flow at all widths. Measured CLS 0.013 at 1440 px, and the composer visibly moved up about 60 px: from `lg` up the hero's two columns are bottom-aligned (`items-end`), so a taller right column pushes its own top up. Fix: from `lg` up the link is `absolute top-full left-0` in an `lg:relative` column (the hero's 96 px bottom padding holds it), so the composer does not move at all. Below `lg` it is in flow and only the sections below it move down.
- Weight: secondary to the ember Send. `bg-surface` fill (no border, shadow or gradient), `text-fg`, hover `bg-hover`, arrow like the header link and Send, `min-h-11`, `focus-cue`. A real `<Link>`, prefetches the thread routes on pointer-enter and focus like the composer.

## 1.2 Implementation

- `src/components/site/resume-chat-link.tsx` (new). Selector: `s.hydrated ? (s.getLatestPersisted()?.id ?? null) : null`; renders nothing when null. It does not start the saved-chats read itself: the site header's `useHasSavedChats` does (the landing page always renders the header); a second read in the button would double the database read. This coupling is stated in the component's comment.
- `src/pages/landing-page.tsx`: renders it on the site build only, after the disclosure; `lg:relative` added to the column.
- Not changed: the header link, the app build landing, `useHasSavedChats`, the registry, the thread page.

## 1.3 Strings and records

- `content/site/resume-chat.ts` (new): `RESUME_CHAT_CONTENT.label` = "Continue your last conversation". Header comment: DRAFT pending operator approval, record path `docs/content/reviews/site-resume-chat.md`.
- `docs/content/reviews/site-resume-chat.md` (new): where it appears, what it must not claim, Voice, claims checked against the system, status "pre-review pending", operator approval NOT given.
- `docs/content/reviews/site-history-link.md` (new) for the existing "Your conversations" link. Provenance from git and `gh`: string introduced in commit `f1285e1` (2026-10-15T04:34:53-05:00), pull request #106 (`feat/site-history-link`), merged by Travis James (GQAdonis) on 2026-10-15T10:05:18Z as merge commit `a9e5f318843fd3d466ea521739b5fc1420122167` (`git log --merges --ancestry-path --first-parent f1285e1..origin/main` lists `a9e5f31` as the first merge). The PR body said the label needed approval and that content-officer pre-review had not run. The record states approval by merge and no more (no separate written approval is in the repository; the live site was not checked). `content/site/history-link.ts`'s DRAFT comment now names the record and the PR.
- Brand guards: `src/test/brand-copy.test.ts` and `src/test/brand-naming.test.ts` pass with the new string (in the full run below). A content-module test in the landing test file checks the string for `!`, banned words and forbidden site claims.

## 1.4 Tests

Unit (`src/pages/landing-page.site.test.tsx`, imports `RESUME_CHAT_CONTENT`, never the wording): none, only a draft, not yet read, one saved (`href /threads/a`), several (latest by `updatedAt`, newer draft ignored), header link still there, `min-h-11` and `focus-cue`, app build absent, content module. Run: `26 tests` in the file pass (together with brand-copy and brand-naming: 3 files, 42 tests passed).

Built-app end-to-end `e2e/home-resume-chat.spec.ts` (new, 7 tests; the conversation is made in the front-page composer through the real app and real PGlite, only the UAR backend is the mock; a reload proves it is stored):
1. no saved conversation: no button (waits for the stored-chats read, then asserts absent; also no header link).
2. saved conversation: button visible, `href` is `/threads/<id>` of the saved conversation, header link still present, click lands on that thread and shows the question and the finished reply.
3. keyboard: focus shows an outline (`focus-cue`), Enter opens the conversation.
4 to 7. at 1440 and 320, light and dark: bounding box at least 44 x 44, nothing covers its centre, no horizontal overflow, summed layout shift under 0.1, screenshots.

Layout shift (PerformanceObserver `layout-shift`, `hadRecentInput` excluded, from first paint to 500 ms after the button is visible and the page is idle; Chromium only, WebKit and Firefox have no layout-shift API and report 0 entries, i.e. unmeasured there):

| Variant | Total | Entries |
| --- | --- | --- |
| desktop 1440 light | 0.0012 | disclosure text 0.00002 + 0.0001, header link group 0.0010 |
| desktop 1440 dark | 0.0012 | same |
| phone 320 light | 0.0152 | disclosure text 0.0015, header group + `section.bg-band` below 0.0137 |
| phone 320 dark | 0.0155 | disclosure text 0.0003 + 0.0015, header group + band 0.0137 |

The 0.0137 at 320 is the sections below the hero moving down by the button (in flow below `lg`) together with the header group (the existing "Your conversations" header link appearing is part of every number). Limit 0.1; the spec asserts it.

Mutation check (component restored afterwards, `diff` against the saved original prints `identical`):
- M1, link points at `/threads`: `Tests 2 failed | 24 passed (26)`: "links straight to the one saved conversation", "links to the saved conversation updated last, ignoring drafts".
- M2, `hydrated` check removed: `Tests 1 failed | 25 passed`: "is absent until the saved chats have been read".
- M3, first non-ephemeral key instead of `getLatestPersisted()`: `Tests 1 failed | 25 passed`: "links to the saved conversation updated last, ignoring drafts".
- M4, visibility condition removed and rebuilt (button always rendered, `/threads` when none): built-app run of tests 1 and 2: `1 failed | 1 passed`: "no saved conversation, no button": `Expected: 0, Received: 1`. Test 2 passes on that mutant because with a saved conversation the mutant's `href` is still `/threads/<id>`; the `/threads` target is proven by M1 (unit), not by the built-app run.
- Restored, rebuilt, e2e passes (below).

Type checks: `tsc --noEmit -p tsconfig.app.json` exit 0; `tsc --noEmit -p e2e/tsconfig.json` exit 0 (clean here; on main the known `chat-export-bundle-load.spec.ts` error is not present in this checkout).

`playwright.config.ts`: `home-resume-chat.spec.ts` added to the `webkit` and `firefox` projects' `testMatch`. Nothing else changed.

## 1.5 Gate (worktree root)

| Step | Result |
| --- | --- |
| `./scripts/check-pins.sh` | exit 0 |
| `./scripts/check-manifests.sh` | exit 0 (27 YAML files parse; 4 kustomizations render) |
| `npm ci --ignore-scripts` | skipped: `node_modules` is the clean install made for this worktree from the committed lockfile; no dependency change |
| `npm run lint` | exit 0 (0 errors, 5 warnings, all `react-refresh/only-export-components` in files not touched) |
| `npm test` (full, default settings) | exit 1 on all three runs, with a different failing test each time, all timeouts under the machine load: run 1 `tool-call-block.test.tsx` (1), run 2 `use-chat-runtime.test.tsx` + `tool-call-block.test.tsx` (`Test timed out in 5000ms`, `Unable to find an element with the text: Oslo`), run 3 `tool-call-block.test.tsx`. The two files pass alone: `Tests 12 passed (12)`. None of these files is touched by this change. |
| `npm test -- --maxWorkers=2 --testTimeout=30000` (full) | exit 0: `Test Files 119 passed | 1 skipped (120)`, `Tests 1235 passed | 11 skipped (1246)` |
| `npm run build` | exit 0 (`built in 1m 1s`) |

Built-app run of `e2e/home-resume-chat.spec.ts`, one run each, site flavour:

| Engine | Result |
| --- | --- |
| Chromium | `7 passed (2.8m)` |
| WebKit (project `webkit`, Desktop Safari) | `7 passed (2.3m)` (layout shift unmeasurable) |
| Firefox (project `firefox`) | `7 passed (1.9m)` (layout shift unmeasurable) |

Flake record. During development, Chromium full-spec runs failed in three of five runs (one test each time) at `await expect(button).toBeVisible()` with "element(s) not found" (button absent 15 s after the saved conversation was made), once with `[write-queue] upsertMessage(...) failed ... messages_thread_id_fkey` in the browser console (the product defect recorded as failure A in `app-reset-notice-polish-gate.md`, hit when the conversation is made by opening a thread URL directly), and twice with no console error in the trace (cause not found). Changes made for robustness: the spec now makes the conversation the way a visitor does (front-page composer, which registers the thread first) and reloads once to prove it is stored. After that change: 14 of 14 passes of test 2 in isolation (`--repeat-each=14`), and the full-spec runs listed above pass, but one of the 14 tests in a 2x run still failed once with the same absent button (about 5 % of saved-conversation setups). The cause was not diagnosed (finish over infra rabbit holes). It means a conversation that the page shows can, in a small share of runs, be missing from the database when the visitor returns right after; whether a real visitor can hit it is not known. Follow-up for the owner of persistence; the e2e has no retry or longer wait that would hide it.

## Screenshots (read by the engineer)

Files in this directory, Chromium, built site flavour with a saved conversation:
`app-home-resume-chat-desktop-1440-light.png`, `-desktop-1440-dark.png`, `-phone-320-light.png`, `-phone-320-dark.png` (viewport) and the `-full.png` variants (full page); `app-home-resume-chat-webkit-desktop-1440-dark.png`; `app-home-resume-chat-firefox-phone-320-light.png`; and the "before" captures with no history `app-home-resume-chat-before-web-search-off-1440.png`, `app-home-resume-chat-before-web-search-on-320.png` (the latter shows the production row, toggle plus Send).

What I saw:
- 1440, light and dark: the button sits under the two mono disclosure lines in the composer's column, left-aligned with the composer, about 16 px below the text, 271 x 44. The composer and the headline are exactly where they are with no history (no jump). It reads as secondary: no fill colour, a quiet surface chip with dark text and an arrow, beside the ember Send which stays the only saturated element. In dark the chip is a visible step above the canvas. In light the chip is white on the pale canvas and the edge is faint (the label and arrow carry the affordance); I did not change it, flagged for the creative director.
- 320, light and dark: the button spans the column width (about 271 px) directly below the disclosure, one line of text, bottom edge at about 632 of 640 px, so it is on the first screen on a 640 px tall phone. It does not crowd the composer or the hero text: the disclosure above it is four short lines and there is a 16 px gap. The header's existing "Your conversations" wraps to two lines at this width (as noted in PR #106); not changed.
- WebKit 1440 dark and Firefox 320 light: same layout and weight; no engine-specific difference seen.
- Fit with the page: it uses the page's own surface ladder, type (Inter semibold, 14 px), the arrow of the header link and Send, and the same focus outline; it adds no new colour or shape. It is deliberately plain.

## Unverified

- The live site and the Deploy site workflow (not run; no push).
- Layout shift in WebKit and Firefox (APIs absent).
- A physical phone; Safari on iOS (the `webkit-iphone` project does not run this spec).
- The 5 % absent-button flake cause.
- Content-officer pre-review of the label, and operator approval of both strings: not done.
- A web-search-ON front page with the button at 320 px was not captured (the built-app screenshots are the web-search-off flavour); the button's own layout does not depend on the composer row, but I did not look at it.
