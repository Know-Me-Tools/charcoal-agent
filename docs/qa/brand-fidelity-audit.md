# QA: brand-fidelity-audit

Task 1.2 (test fix-ups) and task 2.1 (whole-site audit, single gate), run by
km-qa-engineer. Node `v24.16.0`. Base commit `34d415a` (task 1.1 and task 1.3
already committed there); this record covers that tree plus the uncommitted
task 1.2 test-only changes in `e2e/**`, `src/test/**` and
`playwright.config.ts` (goldens settings). Nothing was committed as part of
this task — see "What remains" at the end.

## 1. Scenario → test mapping

### brand-fidelity spec (this change's own spec)

| Requirement / scenario | Evidence |
|---|---|
| Flat 2.0 source rules cover the whole repo — repo-wide guard passes | `src/test/flat-shell.test.ts` → `describe("Flat 2.0 repo-wide (brand-fidelity-audit)")` → `it("passes: every repo-wide hit is fixed or on the allowlist")`. Passing, see §3. |
| Repo-wide guard can fail, names the file | same describe → `it("fails: shadow-md in a non-allowlisted src/components/ui file names that file")`, plus the live scratch-copy breakage in §5 (item 1). |
| rem sizes under 12px are caught | `textUnder12pxViolations()` in `flat-shell.test.ts`, exercised by the `it.each` fixtures `"text-[0.7rem]"`/`"text-[0.5em]"` (flag) and `"text-[0.75rem]"`/`"text-[0.8rem]"`/`"text-[1em]"` (allow), plus the live breakage in §5 (item 2). |
| Strict accessibility on every route | `AXE_STRICT=1 npm run test:a11y` — see §4. |
| Reference comparison is recorded | **Not done by km-qa-engineer** — owned by km-creative-director per design.md decision 7. See "What remains". |
| Blocking constraints re-run on the final tree | §6. |
| Performance is recorded, not gated | §7. |
| Operator sign-off | Not present yet — this is QA evidence for task 3.1 (km-product-owner) to cite in `verification.md`; the sign-off line itself is out of scope for km-qa-engineer. |

### app-pages spec deltas (new requirements this change adds)

| Requirement / scenario | Evidence |
|---|---|
| Create mode on /agents/new | `e2e/app-pages.spec.ts:557` `"/agents/new renders create mode: heading and action read Create, not Edit or Save"`. Passing. Live breakage in §5 (item 3). |
| Skill details controls are distinguishable | `e2e/app-pages.spec.ts:427` `"each skill's details control has a distinguishable accessible name containing its title"`. Passing. |
| Dialog keyboard behaviour (role, focus in, Escape closes, focus returns) | `e2e/app-pages.spec.ts:435` `"a skill's details dialog is a modal: role, focus moves in, Escape closes it, focus returns"`. Passing. Live breakage in §5 (item 4). |
| Toggle state and name | `e2e/app-pages.spec.ts:413` `"skill toggles report checked state as a switch, not colour alone, with the skill's title in the name"`. Passing. |

### ui-verification-harness spec delta (committed goldens)

| Requirement / scenario | Evidence |
|---|---|
| Goldens exist for the full matrix | `e2e/__goldens__/` holds **96 PNGs**, 7.2 MB total. See §2. |
| Unchanged tree matches (two runs) | §2 — update run then plain run, both 96/96 passed. |
| A visual change fails | Not re-demonstrated separately; the exact same mechanism is what caught the real thread-route nondeterminism in §2, which is a stronger proof than a synthetic token-colour edit. |

### design.md decision 1 triage rows owned by km-qa-engineer

| Row | Status | Evidence |
|---|---|---|
| landing W3 (503 test races the mock) | Fixed | `e2e/brand-pages.spec.ts` — waits for the actual `/healthz` 503 response before asserting; test renamed. |
| landing W4 (empty-send doesn't check thread count) | Fixed | `e2e/brand-pages.spec.ts` — asserts the sidebar's own "Threads" region still reads "No threads yet" after the empty send. |
| landing W7 (FAQ order unchecked) | Fixed | `src/test/brand-copy.test.ts` — asserts `heading.nextElementSibling` holds the matching answer. |
| landing S1 (About sweep covers #main only) | Fixed | `e2e/brand-pages.spec.ts` `FLAT2_ROUTES` — About now sweeps `header`, `aside`, `#main`. |
| landing S2 (sub-12px misses rem) | Fixed | `src/test/flat-shell.test.ts` `textUnder12pxViolations()`. |
| app-pages W1 (opened panels skipped) | Fixed | `e2e/app-pages.spec.ts` → new `describe("Flat 2.0 and Tab-through cover opened panels")`, 3 tests (provider card + models table + New Provider form; agent memory panel; skill dialog via its own `[role="dialog"]` root, since it portals outside `<main>`). |
| app-pages W2 (`toHaveCount(0)` races) | Fixed | `e2e/app-pages.spec.ts` — `page.waitForLoadState("networkidle")` added before both late-error checks. |
| app-pages W3 (accepts either button label) | Fixed | `e2e/app-pages.spec.ts` — asserts `"Create agent"` only, plus the new dedicated create-mode test. |
| app-pages S1 (constant compared to itself) | Fixed | `e2e/app-pages.spec.ts` — derived from `readdirSync("src/pages")` minus `PAGE_FILES_EXCLUDED`, mapped via `PAGE_FILE_ROUTE_NAMES`. |
| repo-wide Flat 2.0 + allowlist | Fixed | §3. |

## 2. Goldens (D-010)

`e2e/visual.spec.ts` now calls `expect(page).toHaveScreenshot(screenshotName(route, width, theme), { fullPage: true, animations: "disabled", maxDiffPixelRatio: 0.002 })` in addition to the existing `page.screenshot()` review capture. `playwright.config.ts` sets:

```
snapshotPathTemplate: "e2e/__goldens__/{arg}-{platform}{ext}"
```

`{platform}` is `process.platform` (`darwin`), kept per design.md decision 4 so a Linux CI run reports every image missing instead of silently diffing against mac renders.

**Generation, in order:**
1. `npx playwright test e2e/visual.spec.ts --update-snapshots` → first attempt failed all 96 with `Screenshot name "...darwin" must have a '.png' extension` — my first `goldenName()` helper stripped the extension before handing it to `toHaveScreenshot`, which requires the extension in the argument itself (`{ext}` in the path template is derived from that argument, not supplied independently). Fixed by passing `screenshotName(...)` (which already ends in `.png`) directly. Re-ran: **96 passed**.
2. Verification run, no flag: **2 failed** — `thread › 320 › dark` and `thread › 1024 › light`, both `Expected an image WxH, received Wx(H-63)` (a real height mismatch, not a pixel-colour diff). Root cause, confirmed by reading `src/features/artifacts/mermaid-block.tsx`: `mermaid.render()` is async; the "Week flow" artifact title (the marker `streamFixtureConversation` waited on) mounts before the render promise resolves, so `expandToScrollableContent()` sometimes measured overflow while the "Rendering diagram" placeholder was still showing and sometimes after the real SVG had swapped in — this is exactly the "streaming timing on the thread route" risk design.md's own risk section named.
   - **Fix:** `e2e/support/routes.ts`, `streamFixtureConversation()` — added `await expect(page.getByText("Rendering diagram")).toHaveCount(0);` right before `expandToScrollableContent(page)`, so the diagram has finished laying out before the viewport is resized for capture. Test-only, one file.
   - Regenerated just the 8 `thread-*` goldens (deleted them, re-ran default mode which writes-and-passes for missing snapshots): **96 passed** (88 already-correct + 8 regenerated).
3. Final verification run, no flag: **96 passed**, 0 diffs.

**No masks were needed.** `openRoute()`'s `page.clock.setFixedTime()` (already in place before this change) fully pinned clock-derived text; the only nondeterminism found was the mermaid-render race above, which is a real completion-signal bug in the test harness, not something a mask can paper over (it produced a different image *height*, not a same-size pixel diff).

**Golden count and size:** `e2e/__goldens__/` holds **96 PNG files, 7.2 MB total** (route × width × theme = 12 × 4 × 2). Appended to the phase decision log as D-010 (see below).

## 3. Flat 2.0, repo-wide

`src/test/flat-shell.test.ts` → `describe("Flat 2.0 repo-wide (brand-fidelity-audit)")` walks every non-test `src/**/*.{ts,tsx}` (including `src/components/ui/`) with `RULES` plus `GRADIENT_RULE` plus the new rem/em-aware `textUnder12pxViolations()`.

**Result at this tree: 31 hits in 10 files** (down from the 44-hits/15-files baseline recorded in design.md — the two `agent-detail-page.tsx`/`providers-page.tsx` comment hits and `ChatErrorBoundary.tsx`'s 7 hits are gone; task 1.1 or an earlier fix already cleared them). All 31 are allowlisted; **0 unlisted hits** (`npx vitest run src/test/flat-shell.test.ts` → 95/95 passing).

### Allowlist

| File | Match | Category | Reason |
|---|---|---|---|
| `assistant-ui/enhanced-markdown-text.tsx` | `border: border-separate` | comment/exception | Table layout property, not a border (design.md decision 3, explicit). |
| `assistant-ui/enhanced-markdown-text.tsx` | `border: border-spacing-0` | comment/exception | Same. |
| `ui/button.tsx` | `border: border` | no call site (false positive) | Paired with the base `border-transparent` on the same element; every variant but `outline` keeps it transparent. |
| `ui/switch.tsx` | `border: border` | no call site (false positive) | Paired with base `border-transparent`; no variant overrides the colour. |
| `ui/tabs.tsx` | `border: border` | no call site (false positive) | Same pattern. |
| `ui/scroll-area.tsx` | `border: border-t`, `border-t-transparent`, `border-l`, `border-l-transparent` | no call site (false positive) | Each orientation's border is paired with its own `-transparent` variant on the same element. |
| `ui/button.tsx` | `border: border-destructive`, `border-destructive/50` | no call site | `grep -rn "aria-invalid" src/ --include=*.tsx --include=*.ts` finds none outside `src/components/ui/` — no app code ever sets `aria-invalid` on a Button. |
| `ui/input.tsx`, `ui/textarea.tsx`, `ui/switch.tsx` | same `aria-invalid:border-destructive[/50]` pattern | no call site | Same grep, same conclusion, for Input/Textarea/Switch. |
| `ui/card.tsx` | `border: border-b]:pb-`, `border: border-t`, `ring outline: ring-1` | no call site | `grep -rln "<Card\b" src --include=*.tsx` returns nothing — Card/CardFooter is unused anywhere in the app. |
| `ui/alert.tsx` | `border: border` | no call site | Alert's only caller, `assistant-ui/enhanced-thread.tsx:572`, passes `className="...border-0..."`, which wins. |
| `ui/input.tsx`, `ui/textarea.tsx` | `border: border`, `border: border-input`, `border: border-ring` | no call site (follow-up F-3) | Only caller is `features/chat/components/a2ui-artifact-block.tsx`, which overrides with `FIELD_CLASSES = "border-0 ..."` — its own comment already says this is "deferred to brand-fidelity-audit." Not fixed here: fixing the primitive's own default is `src/components/ui/{input,textarea}.tsx`, km-frontend-engineer's file, out of km-qa-engineer's owned paths. |
| `ui/avatar.tsx` | `border: border`, `border: border-border` | **renders — follow-up F-1** | The `after:border after:border-border` ring is not overridden by `enhanced-thread.tsx:281`'s chat-message `<Avatar>` (only `attachment.tsx:95` hides it, via `after:hidden`). This is a genuine, currently-rendering Flat 2.0 violation. Owner: km-frontend-engineer. |
| `ui/button.tsx` | `border: border-border`, `border: border-input` | **renders — follow-up F-2** | The `outline` variant's border shows on `src/components/error-boundary/ChatErrorBoundary.tsx:69`'s "Back to home" button (`variant="outline"`). Genuine, reachable on any uncaught render error. Owner: km-frontend-engineer. |

**Known defects carried as follow-ups** (design.md decision 3/4 fallback — allowlisted here, not fixed, because fixing them means editing `src/components/ui/` or `src/components/error-boundary/`, which are km-frontend-engineer's files, not km-qa-engineer's):
- **F-1**: `src/components/ui/avatar.tsx` — the `::after` ring always carries `border-border`; remove or make it opt-in so `enhanced-thread.tsx`'s chat avatar doesn't need a per-call override.
- **F-2**: `src/components/ui/button.tsx` — the `outline` variant renders a real border; `ChatErrorBoundary.tsx`'s "Back to home" button is the one reachable caller today.
- **F-3**: `src/components/ui/input.tsx` and `textarea.tsx` — the primitives' own default border (`border-input`) contradicts the app's "filled, borderless" convention; currently unreachable only because the one caller overrides it, per that file's own comment pointing at this change.

## 4. Strict accessibility

`AXE_STRICT=1 npm run test:a11y` (from a freshly started dev server, port 4174):

```
Running 24 tests using 5 workers
  ✓ ×24  (all 12 routes × dark/light)
24 passed (20.1s)
axe: 24 scans, 0 violations across 0 rules
```

Zero violations, every route, both themes. Exit 0.

## 5. Breakage results (scratch copy, outside the repo)

Per the operator's instruction, all four were run in a filesystem copy at `/private/tmp/.../scratchpad/breakage-repo/` — `rsync`'d from the repo (excluding `node_modules`, `.git`, `test-results`, `dist`), with `node_modules` symlinked back to the real repo and `vite.config.ts`'s `server.fs.allow` (scratch-copy-only) extended to include the real repo's path so the symlink resolves. The real repo was never touched; each mutation was reverted and diffed clean against both its own backup and the real repo's file before moving on.

| # | Mutation | Command | Result |
|---|---|---|---|
| 1 | Added `shadow-md` to `src/components/ui/tabs.tsx` (non-allowlisted) | `npx vitest run src/test/flat-shell.test.ts -t "repo-wide"` | **Failed**, naming `src/components/ui/tabs.tsx — shadow: shadow-md` |
| 2 | Added `text-[0.7rem]` to the same file, same edit | (same run) | **Failed**, naming `src/components/ui/tabs.tsx — text under 12px: text-[0.7rem]` |
| 3 | Restored `isNew = id === "new"` in `agent-detail-page.tsx` | `npx playwright test e2e/app-pages.spec.ts -g "renders create mode"` | **Failed** — `getByRole('heading', { name: 'Create Agent' })` not found (element(s) not found) |
| 4 | Replaced `skills-page.tsx`'s `SkillDetailDialog`'s `<Dialog><DialogContent>` (and `<DialogTitle>`) with plain `<div>`/`<h2>` — removes `role="dialog"` | `npx playwright test e2e/app-pages.spec.ts -g "modal: role, focus moves in"` | **Failed** — `getByRole('dialog', { name: 'Web Search' })` not found |

All four failures observed and recorded above; all four mutations reverted (`diff` against both the pre-mutation backup and the real repo's file confirmed clean in each case). No full suite was run during this step.

## 6. Constraints (final tree)

| Constraint | Command | Result |
|---|---|---|
| `build-passes` | `npm run build` | Pass — built in 1m8s (pre-existing chunk-size warning only, not an error) |
| `tests-pass` | `npm test` | Pass — 411/411 (43 files); `skills-sync.integration.test.ts` self-skips, no `INTEGRATION_UAR_URL` |
| `no-console-log-in-commits` | `grep -rn 'console\.log' src/ --include='*.ts' --include='*.tsx'` | Pass — 0 matches |
| `no-any-type` | `grep -rn ': any' src/ --include='*.ts' --include='*.tsx'` | Pass — 1 match (`src/features/chat/use-chat-runtime.ts:67`, the documented pre-existing occurrence; no more than the baseline) |
| `no-hardcoded-secrets` | `grep -rn 'sk-[A-Za-z0-9]\{8,\}\|Bearer [A-Za-z0-9]\{16,\}' src/` | Pass — 0 matches |
| `no-env-files-committed` | `git ls-files \| grep -E '^\.env($\|\.)' \| grep -v '^\.env\.example$'` | Pass — 0 matches |
| `reference-folders-read-only` | manual — no writes attempted outside this repo except the discarded scratch copy (not a reference folder) | Pass |
| `pglite-migrations-append-only` | `git diff main -- src/lib/db/pglite.ts` | Pass — empty diff (no changes to this file on this branch) |
| `pglite-not-prebundled` | `grep -q 'exclude: \["@electric-sql/pglite"\]' vite.config.ts` | Pass — found |

Warning constraints acknowledged: `npm run lint` → 0 errors, 2 pre-existing warnings (`react-refresh/only-export-components` in `button.tsx:57` and `tabs.tsx:82`, unrelated to this change, not fixed — out of km-qa-engineer's scope and inside the fix-up budget's "no product-file edits" boundary for this session).

## 7. Lighthouse (recorded, not gated)

`npx lighthouse@13.5.0` (latest on npm at time of running; checked via `npm view lighthouse version`) against `npm run build && npx vite preview --port 4173`. Three runs each, mobile (Lighthouse's default emulation, no `--preset`) and desktop (`--preset=desktop`), medians below. **No dependency was added to `package.json`.**

**No UAR was reachable** (`vite preview` doesn't apply the dev-only `/api` proxy): `network-requests` audit shows `GET https://uar.know-me.tools/api/agents` and `/api/skills` both returning status `-1` (network failure). The thread route's numbers reflect that no-backend state, as design.md anticipated.

| Route | Preset | Perf | A11y | Best Practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| landing | mobile | 0.35 | 1.00 | 1.00 | 1.00 | 58.2 s | 0.001 | 2971 ms |
| landing | desktop | 0.49 | 1.00 | 1.00 | 1.00 | 9.5 s | 0.001 | 663 ms |
| thread | mobile | 0.34 | 1.00 | 1.00 | 1.00 | 58.2 s | 0.002 | 2988 ms |
| thread | desktop | 0.47 | 1.00 | 1.00 | 1.00 | 9.5 s | <0.001 | 691 ms |

**Observed, not a gate failure, but worth surfacing:** `total-byte-weight` is **11.35 MB on every route and preset**, identical because this is a single-page app — the landing marketing page ships the same JS entry as the full chat app. Under Lighthouse's default mobile throttling (~1.6 Mbps simulated), 11.35 MB alone accounts for almost all of the 58 s mobile LCP (11.35 MB × 8 / 1.6 Mbps ≈ 57 s) — this is a real, reproducible number, not a Lighthouse error (`runtimeError: null`, no `runWarnings`). The `npm run build` output earlier in this gate already showed dozens of >30 kB Shiki language/theme chunks and a 2.4 MB main entry chunk. This is a genuine performance concern for a marketing landing page but is **not this change's to fix** (it's a code-splitting/bundling question, `km-frontend-engineer`'s territory, and the landing page's own bundle budget is `< 150kb` gzipped per the web performance rules — nowhere close today). Recorded here as a finding for the next phase's assessment, per design.md decision 6 ("record, don't gate").

## 8. Cold start and tooltip-icon-button focus cue

- **Dev-server cold start:** every Playwright invocation in this gate (`test:e2e`, `test:visual` ×3, `test:a11y`) started its own dev server (`reuseExistingServer` defaults to off; `E2E_REUSE_SERVER` was never set) and none hit a `goto` timeout across 315 + 96 + 96 + 24 test runs. **Closed.**
- **`tooltip-icon-button` focus cue:** no test names it directly, but every Tab-through / focus-outline check across `app-pages.spec.ts`, `brand-pages.spec.ts`, `chat-surfaces.spec.ts` and `shell.spec.ts` passed with zero outline violations in the full `test:e2e` run, and `tooltip-icon-button.tsx` is one of the `SHELL_PRIMITIVES` covered by `flat-shell.test.ts`'s per-file guard. **Closed** on this evidence.

## 9. Full gate output (commands run, in order)

```
npm run build                                    → pass (1m8s, pre-existing chunk-size warning)
npm run typecheck                                → pass (tsc -p tsconfig.app.json && tsc -p e2e/tsconfig.json)
npm run lint                                      → pass, 0 errors, 2 pre-existing warnings
npm test                                          → pass, 411/411 (43 files)
npx playwright test e2e/visual.spec.ts --update-snapshots   → 96 passed (after the extension-argument fix, §2)
npx playwright test e2e/visual.spec.ts                        → 2 failed (thread route height nondeterminism, §2) → fixed → regenerated → 96 passed
npm run test:e2e                                  → pass, 315/315 (includes all 96 visual + 24 a11y non-strict + app-pages/brand-pages/brand/chat-persistence/chat-surfaces/primitives/mock-smoke/shell/theme/skills-toggle)
AXE_STRICT=1 npm run test:a11y                    → pass, 24/24, 0 violations across 0 rules
```

Two real, pre-existing defects were found and fixed as part of this task (both test-only, both within the fix-up budget):

1. **`e2e/brand-pages.spec.ts`** (my own new test, written this session): `getByText("No threads yet")` was a strict-mode violation — the same copy renders both in the sidebar's empty state and in `assistant-ui/enhanced-thread.tsx`'s main-content welcome screen. Fixed by scoping to `getByRole("complementary", { name: "Threads" })`.
2. **`e2e/skills-toggle.spec.ts`**: pre-existing (not written this session) — its `skillToggle()` helper and every assertion in it still matched the pre-task-1.1 `aria-label="Enable skill"/"Disable skill"` markup, which task 1.1's already-committed skill-toggle fix (role="switch", aria-checked, name includes title) removed. Both of its tests failed with locator timeouts on the very first `test:e2e` run. Fixed to match the current markup (`role="switch"`, `aria-checked`).

Per design.md decision 7 ("A failure caused by this change's fix-ups goes back to task 1.1 or 1.2 and the gate re-runs once"): both fixes above are test-only and land in task 1.2. The gate was re-run once after each fix was made (not in a loop): the visual-goldens fix required one regeneration + one re-verification (§2); the two test-selector fixes were each covered by the subsequent full `npm run test:e2e` pass, which was itself the single post-fix re-run.

## 10. Real defects found, with owner and file/line

| Defect | File / line | Owner | Disposition |
|---|---|---|---|
| Avatar's `::after` ring renders a real border on the chat thread avatar | `src/components/ui/avatar.tsx` (`after:border after:border-border`); reachable via `src/components/assistant-ui/enhanced-thread.tsx:281` | km-frontend-engineer | Follow-up F-1, allowlisted (§3) |
| Button `outline` variant renders a real border | `src/components/ui/button.tsx` (variant `outline`); reachable via `src/components/error-boundary/ChatErrorBoundary.tsx:69` | km-frontend-engineer | Follow-up F-2, allowlisted (§3) |
| Input/Textarea primitives default to a bordered style, contradicting the app's filled/borderless convention (currently unreachable only because the one caller overrides it) | `src/components/ui/input.tsx`, `src/components/ui/textarea.tsx` | km-frontend-engineer | Follow-up F-3, allowlisted (§3) |
| `e2e/skills-toggle.spec.ts` used stale toggle markup from before task 1.1's a11y fix | `e2e/skills-toggle.spec.ts` | km-qa-engineer | **Fixed in this task** (§9) |
| Mermaid diagram render race made 2/96 visual goldens nondeterministic | `e2e/support/routes.ts`, `streamFixtureConversation()` | km-qa-engineer | **Fixed in this task** (§2) |
| Landing page ships an 11.35 MB JS payload (same bundle as the full chat app); mobile LCP ≈58s under Lighthouse's default throttling | build output / `vite.config.ts` bundling | km-frontend-engineer (or km-devops-engineer, code-splitting) | **Recorded, not fixed** (§7) — out of budget (would require route-based code-splitting, more than 2 files) |
| `npm run lint` warnings: `react-refresh/only-export-components` | `src/components/ui/button.tsx:57`, `src/components/ui/tabs.tsx:82` | km-frontend-engineer | Pre-existing, not fixed (warning constraint, acknowledged §6) |

## What remains

- **The reference comparison** (design.md decision 5: 1440/320 captures of every route × theme against S2/S3, one row per route/theme with match/accepted-deviation/defect) is **not done**. It is explicitly km-creative-director's part of task 2.1, not km-qa-engineer's, and this session ran only in the km-qa-engineer role. The review captures it needs are in place at `test-results/screenshots/` (98 files — 96 route/width/theme + 2 extras from earlier runs) and the goldens at `e2e/__goldens__/` are the same captures, committed.
- **Operator sign-off** and **task 3.1's `verification.md`** (mapping every spec scenario to evidence, final disposition of every design.md decision-1 row, the independent adversarial review) are km-product-owner's task, not started here.
- **The live UAR smoke** did not run — operator deferral, unchanged from earlier phases.
- **Nothing was committed.** All test-file changes (`e2e/app-pages.spec.ts`, `e2e/brand-pages.spec.ts`, `e2e/skills-toggle.spec.ts`, `e2e/support/routes.ts`, `e2e/visual.spec.ts`, `playwright.config.ts`, `src/test/brand-copy.test.ts`, `src/test/flat-shell.test.ts`) and the new `e2e/__goldens__/` directory (96 PNGs, untracked) are sitting in the working tree, per the "don't commit" instruction for this task.
- **D-010** (goldens baseline commit) is appended to `.kbd-orchestrator/phases/complete-rebranding/decision-log.md` below, but since nothing is committed yet, it necessarily records the count/path/size rather than a commit hash — the commit hash should be filled in by whoever makes the commit.
