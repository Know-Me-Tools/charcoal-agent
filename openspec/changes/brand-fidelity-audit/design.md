## Context

This is the last change in the complete-rebranding phase. Its job is to verify the whole site and fix only small things. The sources, in order of precedence, are unchanged from the earlier changes:
1. WCAG 2.2 AA
2. S1 (the binding UI/UX standard, via the `knowme-brand-standard` skill)
3. `docs/design/brand-pages.md`
4. the phase decision log (D-001…D-008)

State measured on `39f4aee`, 2026-09-27:
- **Routes.** `APP_ROUTES` has 12 routes: landing, threads, thread, agents, agent-new, agent-detail, settings-providers, settings-skills, settings-appearance, settings-about, settings-account and not-found. `VIEWPORT_WIDTHS` × `THEMES` gives 96 captures.
- **Captures.** `e2e/visual.spec.ts` writes the captures with `page.screenshot` to the git-ignored `test-results/screenshots/`. Nothing compares them.
- **Tooling.** Playwright is 1.63.0. `globalSetup: ./e2e/support/global-setup.ts` warms the dev server with one sequential load before any worker starts.
- **Flat 2.0 source rules** (`RULES` plus the gradient rule in `flat-shell.test.ts`) over all non-test `src/**/*.{ts,tsx}`: 44 hits in 15 files. The in-scope app pages have 2 of them (`agent-detail-page.tsx:22` and `providers-page.tsx:19`), and both are the word "border" in a comment. `src/components/ui/` has 35 hits. `ChatErrorBoundary.tsx` has 7, including `text-[10px]` and `text-[11px]`.
- **Lighthouse** is not installed, either in `node_modules/.bin` or as a dependency.
- **Decision log.** The last entry is D-008.

## Goals / Non-Goals

**Goals:** meet every requirement in the three spec deltas. Close or explicitly re-route every follow-up that was routed here. Archive the phase's last change with committed goldens and operator sign-off.

**Non-Goals:** everything under Non-goals in proposal.md.

## Decisions

### 1. Follow-up triage

"Fix now" means the fix is small (one or two files, no new token, no copy change) and has evidence (a file and line, or a failing condition someone observed). "Later" means it is recorded in `verification.md` under "Follow-ups carried out of the phase", with an owner.

| Source | Item | Call | Owner | Reason |
|---|---|---|---|---|
| landing W2 | Site-chrome strings hard-coded ("Skip to content", theme toggle labels, footer legal line) | **Later** | km-chief-content-officer, then km-frontend-engineer | Moving them into `content/site/` puts them under the copy approval gate: sheet entry, review record, operator approval. That is a content piece, not a fix-up. It does not change what renders. |
| landing W3 | The 503 About test can pass before the mock is served | **Fix now** | km-qa-engineer | Test-only. Wait for the `/healthz` response before asserting, and fix the test title at `e2e/brand-pages.spec.ts:390`. |
| landing W4 | The empty-send test does not check that no thread was created | **Fix now** | km-qa-engineer | Test-only. Assert that the sidebar thread list count is unchanged. |
| landing W6 | `splitHeadline` repeats the last word for two-word taglines ("Intelligence, intimate.") | **Fix now** | km-frontend-engineer | A one-line change (`landing-page.tsx:22`), plus a unit test that loops over `APPROVED_TAGLINES`. It is latent today, but an approved tagline must render correctly if it is ever chosen. |
| landing W7 | The FAQ test does not check answer order | **Fix now** | km-qa-engineer | Test-only. Assert that `headings[i].nextElementSibling` holds answer i. |
| landing S1 | The About Flat 2.0 sweep covers `#main` only | **Fix now** | km-qa-engineer | Add the app-shell nav and footer selectors to the sweep. |
| landing S2 | The sub-12px source rule misses `rem` sizes | **Fix now** | km-qa-engineer | It widens a regex, and the repo-wide rule in the brand-fidelity spec needs it anyway. |
| landing S3 | Composer textarea auto-grow was lost; `max-h-[7.5rem]` has no effect | **Fix now** | km-frontend-engineer | Add `field-sizing-content`, one class. Chromium supports it. In other engines the field keeps its fixed height, which is today's behaviour. |
| landing S4 | "Every conversation, kept." may overclaim: interrupted replies and ephemeral threads are not kept | **Operator decision** (task 1.3) | operator; km-product-owner records it | Copy and product-truth claims are the operator's to decide. See Open question 1 for the default. |
| landing S5 | About shows a guessed `http://localhost:6565` when `VITE_UAR_BASE_URL` is unset, although requests actually go same-origin through the proxy | **Later** | km-chief-content-officer and km-frontend-engineer | Accurate text needs new on-page copy ("same origin, proxied") and so the copy gate. It is also a runtime-truth question for the UAR smoke, which the operator deferred. |
| landing | Dev-server cold-start `goto` timeouts | **Confirm and close** | km-qa-engineer | The warm-up `globalSetup` is in place. The final gate runs `test:a11y` and `test:e2e` from a freshly started server. If both pass, the item closes. If either fails, it is recorded with the log and stays open. It is not debugged in this change (operator memory: "finish over infra rabbit holes"). |
| landing | `tooltip-icon-button` focus cue | **Confirm and close** | km-qa-engineer | app-pages decision 3 fixed focus in the `Button` primitive. The audit's Tab-through on the thread route confirms it. |
| app-pages W1 | Flat 2.0 and Tab-through scans skip opened panels (expanded provider card, models table, New Provider form, agent memory panel, skill dialog) | **Fix now** | km-qa-engineer | Test-only. Open each panel, then run the existing scan helpers. |
| app-pages W2 | Late-error checks use `toHaveCount(0)`, which passes at the first zero | **Fix now** | km-qa-engineer | Test-only. Await the mutation response (`waitForResponse`), then assert that no error is shown. |
| app-pages W3 | The agent-create test accepts either button label | **Fix now** | km-frontend-engineer (route), km-qa-engineer (test) | The cause is the `/agents/new` bug below. Once it is fixed, the test asserts "Create agent" only. |
| app-pages | `/agents/new` shows "Edit Agent" because the literal route has no `:id` | **Fix now** | km-frontend-engineer | `agent-detail-page.tsx:124` `isNew = id === "new"` becomes `id === undefined \|\| id === "new"`. One line. Spec: app-pages "The create-agent route reads as create". |
| app-pages W4 | The providers models table has no hover/focus fill and doesn't use `bg-band` | **Fix now** | km-frontend-engineer | Two class changes at `providers-page.tsx:356` and `:376`. This brings the table in line with app-pages decision 2. |
| app-pages W5 | The skill modal has no dialog semantics, and every "View configuration" button has the same name | **Fix now** | km-frontend-engineer | Move the hand-made `fixed inset-0` panel (`skills-page.tsx:24`) onto the existing Base UI `Dialog` primitive, which provides the role, focus trap, Escape and focus return. Name the control "View configuration for {title}". Spec: app-pages "Skill details open in an accessible dialog". |
| app-pages S1 | The in-scope coverage test compares a constant to itself | **Fix now** | km-qa-engineer | Derive the list from `src/pages/*.tsx` minus the documented exclusions, so an added page must be classified. |
| app-pages S2 | The agent memory panel is `bg-band` inside a `bg-band` card, so it doesn't stand apart | **Fix now** | km-frontend-engineer | Use `bg-surface` on band, the alternation app-pages decision 2 already allows. No new token. km-creative-director confirms it in the audit comparison. |
| app-pages S3 | The skill toggle's name gives the action, not the state or the skill; it has no `aria-pressed` or `role="switch"` | **Fix now** | km-frontend-engineer | A name and ARIA state on one control. Spec: app-pages "Skill toggles expose their state". |
| chat-persistence | `test:a11y` and `tsc -p e2e/tsconfig.json` never ran on its final tree | **Closed by this gate** | km-qa-engineer | The final gate here runs both on the tree that now contains that change. |
| chat-persistence | bfcache and Web Lock, Tauri quit, kept mutation copies, multi-tab replay order, and the PGlite durability source | **Not routed** | n/a | Not brand fidelity. They stay in that change's record. |

Also carried from landing and not in the caller's list: U-3 (the hero CTA click path) and U-4 (per-capture notes). U-4 is superseded by the per-route reference comparison (brand-fidelity spec). U-3 stays a later follow-up for km-qa-engineer.

### 2. Fix-up budget for audit findings

The audit will find defects nobody has listed yet. An audit finding is fixed in this change only if all of these are true:
- it touches at most 2 files and needs no new token, no copy change and no data-layer change
- the fix does not change a committed golden on a route other than the one it fixes
- it can be proven by an existing or one-line test

Everything else goes to "Follow-ups carried out of the phase" with a file, a line and an owner. This rule exists so that "small fix-ups only" survives first contact with a repo-wide grep.

### 3. Repo-wide Flat 2.0: fix what renders, allowlist what doesn't

A new repo-wide `describe` in `flat-shell.test.ts` runs `RULES` plus the gradient rule over non-test `src/**/*.{ts,tsx}`. The `px` sub-12px rule is extended to `rem`/`em`, where a value below 0.75 counts as a hit. Each of the 44 baseline hits gets one of three outcomes:
- **Comment or non-class text**, such as the "border" comments in two pages. Allowlisted with the reason "comment".
- **Unreachable variant**, such as a shadcn `outline` or `destructive` variant that nothing in the app uses. The fix is to delete the variant if it fits the budget. Otherwise it is allowlisted as "no call site", with the grep that proves it.
- **Renders**, such as `ChatErrorBoundary`'s bordered `<pre>` and 10/11px text, or `sonner`'s `shadow`. It is fixed within the budget. If it cannot be, it is allowlisted as "renders, follow-up F-n" and listed as a known defect. An unlisted rendered violation is not acceptable.

`enhanced-markdown-text.tsx` `border-separate`/`border-spacing-0` are table layout properties, not borders. They are allowlisted, and the rule's regex is left alone.

The computed-style sweeps (brand-pages and app-pages) stay the rendered truth. The source rule is the cheap guard.

### 4. Goldens

- `e2e/visual.spec.ts` switches from `page.screenshot({ path })` to `expect(page).toHaveScreenshot(name, { fullPage: true, animations: "disabled" })`. Goldens live in `e2e/__goldens__/`, set with `snapshotPathTemplate` in `playwright.config.ts`. They are committed.
- **Determinism:** `page.clock.setFixedTime` pins the clock before navigation. The sidebar's `left-sidebar.tsx` renders clock-derived dates. Anything still dynamic is masked with `mask`, and each mask is listed in the QA record. Tolerance is `maxDiffPixelRatio: 0.002`. A higher value needs a written reason.
- **Platform:** goldens are made on the operator's macOS (Chromium, darwin), and Playwright's default platform suffix is kept, so a Linux CI run cannot silently compare against mac images. A Linux baseline is a later follow-up (km-devops-engineer).
- **Update discipline:** goldens are generated only by task 2.1 with `npx playwright test e2e/visual.spec.ts --update-snapshots`. They are generated after every fix-up and after the S4 copy decision, so they record the final tree. D-010 records the baseline commit.
- The review captures under `test-results/screenshots/` are still written, because the reference comparison reads them.

### 5. Reference comparison

km-creative-director compares the 1440 and 320 captures of each route in both themes against S2 and S3. Each row is one of:
- **match**
- **accepted deviation**, with a decision id. For example, D-007: AA wins over verbatim brand values.
- **defect**, routed through decision 2

The comparison checks:
- logo lockup and clear space
- type roles and scale
- the surface ladder and `band` use
- a single ember primary per section
- tagline use
- dark and light parity

The table goes in `docs/qa/brand-fidelity-audit.md`. S2 and S3 are read-only (constraint `reference-folders-read-only`).

### 6. Lighthouse

The Lighthouse run is recorded, not gated, and no dependency is added to `package.json`.

- **Command:** `npx lighthouse@<version>`. Check the latest version on npm at apply time and record it.
- **Target:** run against `npm run build && npx vite preview` on the landing route (`/`) and the thread route (`/threads/<FIXTURE_THREAD_ID>`).
- **Runs:** use the mobile and desktop presets, three runs each, and record the median.

Preview has no UAR mock, so the thread route is measured in its no-backend state, and the record says so. If `npx` cannot fetch Lighthouse, the section reads "not run: <error>". That does not block archive.

### 7. The single gate

This follows the phase rule "batch code, test once". Nothing is run during tasks 1.1 and 1.2 beyond static checks. Task 2.1 runs, once, on the final tree, from a freshly started dev server:

```
npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e
npm run test:visual            # first with --update-snapshots, then once more without it to prove it's deterministic
AXE_STRICT=1 npm run test:a11y
<each blocking check in .kbd-orchestrator/constraints.md>
<Lighthouse per decision 6>
```

A failure caused by this change's fix-ups goes back to task 1.1 or 1.2 and the gate re-runs once. A failure that predates this change goes through decision 2.

## Risks / Trade-offs

**The risk most likely to hurt this change: goldens bake in whatever is wrong today, then get re-baselined into noise.** The goldens are made by the same team that built the pages, on the same day as the audit that judges them. If the reference comparison misses a defect, the golden makes it the approved truth, and every later change that "fixes" it shows up as a regression. If captures are also nondeterministic (fonts, clock text, streaming timing on the thread route, platform rendering), people learn to run `--update-snapshots` by reflex, and the gate stops catching anything. Mitigations:
- goldens are made last, after the fix-ups and S4
- the run is repeated without `--update-snapshots` to prove determinism before commit
- tolerance is tight and must be justified to raise
- every regeneration is recorded with a reason
- the platform suffix is kept so Linux CI cannot compare against mac images

What remains is that the operator's sign-off is the only independent check that the baseline is right, and a sign-off made from 96 thumbnails is easy to give without looking.

**Scope creep.** A repo-wide grep already shows 44 hits, and a first strict axe run on routes nobody has scanned while opened may show more. Decision 2's budget is the defence. The cost is that the phase may close with known, listed defects instead of zero.

**Repo weight.** 96 full-page PNGs add megabytes to every clone. Git LFS would need a devops change, which is out of scope. See Open question 3.

**The self-grading problem.** The audit, the fixes and `verification.md` all come from the same agent team. The independent review in task 3.1 (artifact-critic, or `adversarial-review --mode diff` with a different model) is the countermeasure. As in app-pages, the operator can waive the re-review, and a waiver is recorded as a waiver, not as a pass.

**No live backend.** Every check runs against the UAR mock. Brand fidelity is visual, so this matters less here, but the thread-route Lighthouse numbers and the About status reflect a no-backend state.

## Open Questions (defaults applied if the operator does not answer)

1. **S4: keep "Every conversation, kept."?**
   - The claim is not true for interrupted replies, ephemeral threads, and a killed browser (chat-persistence-durability limits).
   - Default: replace it with a heading that claims only what the product does. The recommended wording is "Your conversations, saved on this device." The alternative is "Pick up where you left off."
   - The wording goes through the content route (km-cmo claim check, then km-chief-content-officer pre-review) and needs the operator's recorded approval before it lands in `content/site/landing.ts`.
   - If the operator gives no answer before the gate, the current approved copy stays. S4 is then carried as a follow-up, so the gate is never blocked on copy.
2. **Should goldens gate `test:visual` locally from now on?** Default: yes, on darwin only. CI Linux goldens are a later follow-up.
3. **Commit the PNGs directly, or use Git LFS?** Default: commit directly, full matrix, and record the total size. Move to LFS later if clone size becomes a complaint.
4. **Where do repo-wide hits that render but don't fit the budget go?** Default: they are allowlisted with a follow-up id and listed as known defects in `verification.md`. The phase can close with them, and they seed the next phase's assessment.
5. **Is Lighthouse on the mocked thread route worth running at all?** Default: yes, with the no-backend caveat recorded. The landing number is the one that matters for the later marketing-site phase.
6. **Is the independent re-review required if the first review finds a CRITICAL that gets fixed?** Default: yes. It can be waived only by the operator, and the waiver is recorded.

## Operator decision (2026-09-27): fix the five major deviations now

The reference comparison (`docs/design/brand-fidelity-comparison.md`) found five major deviations that the first goldens had captured:
- **D1:** provider row overlap at 320
- **D2:** skills header overflow at 320
- **D3:** font-size row overflow at 320
- **D4:** skill switch thumb and track
- **D5:** chips invisible on band cards in light, because `bg-muted-surface` and `bg-band` are both `#eef0f3`

The operator chose to fix all five in this change, above the two-file fix-up budget. The fixes stay page-level: no new token, and no token value change. D5 moves chips on `bg-band` cards to `bg-surface`. Only the affected routes' goldens are regenerated, and each regeneration is recorded. Minor deviations D6–D13, the capture note D9, the fixture A4, the copy points and the Lighthouse bundle-size finding become follow-ups BFA-CD-06 to BFA-CD-15 for the next phase.
