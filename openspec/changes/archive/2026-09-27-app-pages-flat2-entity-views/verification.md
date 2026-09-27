# Verification: app-pages-flat2-entity-views

Task 4.1, km-product-owner, 2026-09-27. Evidence sources:
- `e2e/app-pages.spec.ts` (69 tests; untracked in the working tree at the time of writing, so it must be added before commit)
- `src/test/flat-shell.test.ts`, `describe("Flat 2.0 app pages")`
- the QA record `docs/qa/app-pages-flat2-entity-views.md` (task 3.1 and 3.2)
- greps run by km-product-owner on 2026-09-27 against the working tree, output shown below

The spec has **19** scenarios across 8 requirements (`grep -c "#### Scenario" specs/app-pages/spec.md` → 19). The task brief said 20; the file has 19.

## Greps run for this record

```
$ grep -rnE '(bg|text|ring|border)-(zinc|slate|gray|green|amber|blue|purple|red|orange)-[0-9]' src/pages ; echo rc=$?
rc=1                       # no matches
$ grep -rnE 'text-\[(9|10|11)(\.[0-9]+)?px\]' src/pages ; echo rc=$?
rc=1                       # no matches
$ grep -rnE 'EntityListView|EntityTable|EntityDetailSheet|EntityFormSheet' src ; echo rc=$?
rc=1                       # no matches
$ git --no-optional-locks diff main --stat -- src/hooks src/lib
                           # empty: no data-layer change
$ grep -rni charcoal src/pages | grep -v import
                           # empty
$ grep -n "D-008" .kbd-orchestrator/phases/complete-rebranding/decision-log.md
90:## D-008 · keep the page components; do not adopt the package entity views          [spec · 2026-09-27]
```

## Scenario map

Status key: MET = evidence observed on the final tree; UNMET = the evidence does not show the scenario holds; PARTIAL = evidence exists but does not cover the whole scenario, or was last observed before a later code change.

| # | Requirement › Scenario | Evidence | Status |
|---|---|---|---|
| 1 | In-scope pages › Every in-scope route renders against the mock | e2e `every in-scope route renders against the mock › <route>: ready text visible, no uncaught error (<theme>)`, 8 routes × 2 themes, `pageerror` listener. Passed in the targeted run (`npx playwright test e2e/app-pages.spec.ts`: 69 passed). | MET |
| 2 | Token status › No raw palette classes in pages | grep above, rc=1. Also `flat-shell` "Flat 2.0 app pages" block (`npm test` 399/399). | MET |
| 3 | Token status › Skill state is readable without colour | e2e `skill rows expose enabled/disabled state as differing text, not colour alone` (Web Search enabled vs Code Runner disabled; `aria-label` "Disable skill" / "Enable skill"). 69 passed. | MET |
| 4 | Token status › Agent save confirmation is readable without colour | e2e `agent memory save confirmation shows text styled with a status token, not colour alone`. 69 passed. | MET |
| 5 | Type floor › No sub-12px arbitrary sizes | grep above, rc=1; flat-shell sub-12px rule. | MET |
| 6 | Type floor › No rendered text under 12px | e2e `Flat 2.0 surfaces render with no borders, shadows, blur, gradients or sub-12px text › <route> (<theme>)`. 69 passed. | MET |
| 7 | Flat 2.0 › Source guard covers the pages | flat-shell `describe("Flat 2.0 app pages")` incl. `covers every in-scope app page`; `npm test` 399/399. Break proof (QA 3.1): `border border-border` added to `providers-page.tsx` in a scratch copy made the guard fail. | MET |
| 8 | Flat 2.0 › Nothing renders a border, shadow or blur | e2e `Flat 2.0 surfaces …` (border, unfocused `box-shadow`, `backdrop-filter`, gradient). In the full gate this block had 1 failure, agent-new (dark), `no <main> found`; it passed on the targeted re-run (69 passed). | MET (see note 1) |
| 9 | Flat 2.0 › Grouped sections are distinct from the canvas in light theme | e2e `settings groups render on --km-band, distinct from the canvas (light theme)` over settings-providers and settings-account; asserts every `bg-band` group equals `--km-band` and differs from `--km-canvas`. 69 passed. | MET |
| 10 | Flat 2.0 › No horizontal scroll at 320 | e2e `no horizontal scroll at 320px › <route> (<theme>)`. Found defect 1 (`/agents` scrollWidth 358), fixed. 69 passed. | MET |
| 11 | Focus › Tab-through shows an outline on every stop | e2e `Tab-through shows a visible outline on every stop inside main › <route>`: asserts `outline-style` ≠ none and `outline-width` ≥ 2 per stop, logs and attaches stop counts. Counts in QA note: threads 2, agents 7, agent-new 8, agent-detail 10, settings-providers 10, settings-skills 37, settings-appearance 10, settings-account 8. The independent review found that the loop exits early at `e2e/app-pages.spec.ts:144` (review C1), so most stops on the settings routes, agent-new and providers are never checked. | **UNMET** (review C1; note 2) |
| 12 | Focus › Button primitive paints its outline | e2e `Button primitive paints a solid --ring outline on keyboard focus`. Break proof (QA 3.1): restoring `outline-none` on `Button` failed with `Expected "solid", Received "none"`. | MET |
| 13 | Copy › No Charcoal in rendered settings | e2e `no 'charcoal' text in settings › <route>`; source grep above empty. | MET |
| 14 | CRUD › Provider create, update, default and delete | e2e `provider create, update, default and delete hit the mock in order`. Mock only. | MET against mock (note 3) |
| 15 | CRUD › Agent create against the mock | e2e `agent create from /agents/new hits the compiler mock` (`POST /api/compiler/compile`). | MET against mock (note 3) |
| 16 | CRUD › Agent update against the mock | e2e `agent update from /agents saves memory settings via PATCH`. | MET against mock (note 3) |
| 17 | CRUD › Skill toggle and refresh | e2e `skill toggle and refresh hit the mock` passed in the targeted run. The "AND `e2e/skills-toggle.spec.ts` still passes" clause was last observed in the full gate (308/309, failure was elsewhere), which ran **before** the defect 4 change to `skills-page.tsx`; the targeted re-run covered only `e2e/app-pages.spec.ts`. | PARTIAL (note 4) |
| 18 | Adoption › Components are not imported | grep above, rc=1. | MET |
| 19 | Adoption › Decision is recorded | decision-log D-008 (line 90). | MET |

Notes:
1. **agent-new (dark) single failure.** Full gate: `npm run test:e2e` 308 passed, 1 failed (app-pages › Flat 2.0 surfaces › agent-new (dark), `no <main> found`, scan ran mid-transition). It passed on the targeted re-run of `e2e/app-pages.spec.ts` (69 passed). Recorded as a one-off, not a product defect; it has not been re-run a third time.
2. **Tab-through stop counts are stale for settings-skills.** The QA note says the counts were taken before the defect 4 fix, which removed 9 card stops. The assertions passed on the final tree, but the recorded count for settings-skills (37) is not the current count (expected about 28, not measured).
3. **Live UAR smoke deferred by the operator** until after this phase, because UAR work is planned. It was not run. The CRUD scenarios prove request method, path and UI response against the mock only; persistence in a real UAR is unverified.
4. **Post-defect-4 re-run was targeted.** After the `skills-page.tsx` fix only `npm test`, typecheck, lint, `npm run test:a11y` and `npx playwright test e2e/app-pages.spec.ts` were re-run. The full `npm run test:e2e` and `npm run test:visual` were not re-run on the final tree.

## Unmet or partial criteria

Count: **1 unmet scenario (11), 1 partial scenario (17), plus 4 partial task-level criteria** — 6 items in all. 18 of 19 scenarios have evidence; 17 of 19 are fully MET.

Scenarios:
1. Scenario 11 (UNMET): the Tab-through helper stops at the first pair of adjacent focus stops with identical `tagName#id.classList` strings (`e2e/app-pages.spec.ts:144`) and the test only asserts `stops > 0`. Page-body controls on `/settings/*`, the second skill chip onward on `/agents/new`, and later provider headers are not checked. The QA note's stop counts (settings-providers 10, settings-appearance 10, settings-skills 37) cannot come from the current code, and the settings-skills count predates defect 4 (note 2).
2. Scenario 17 (PARTIAL): `e2e/skills-toggle.spec.ts` not re-run after the defect 4 change to `skills-page.tsx` (note 4).

Task-level criteria (tasks 3.2 and design decision 4):
3. **Live UAR smoke not run**: deferred by the operator until after this phase (note 3). Entity CRUD continuity is verified against the mock only.
4. **Full e2e and visual suites not re-run on the final tree** (note 4). The full gate's e2e run was 308/309; the single failure passed on the targeted re-run.
5. **Visual review capture paths are not recorded** in the QA note. `npm run test:visual` reported 96 passed, but task 3.2 asked for the capture paths of the in-scope routes at 320 and 1440 in both themes.
6. **Plan item 11 (adopt the package entity views) is not delivered.** D-008 records the decision not to adopt `EntityListView`, `EntityTable`, `EntityDetailSheet` and `EntityFormSheet` from `@prometheus-ags/prometheus-entity-management` 4.0.2, with the revisit condition. The spec requirement is met; the operator's original wish is not.

## Other facts recorded

- **Four defects were found by the new tests and fixed** (QA note): (1) `/agents` overflowed at 320px, `agents-page.tsx`; (2) `SelectTrigger` had an unconditional `outline-none`, `select.tsx`; (3) the settings nav nested a `Button` in a `NavLink`, two focus stops, `settings-page.tsx`; (4) axe `nested-interactive` on settings-skills, 9 nodes per theme, `skills-page.tsx`.
- **Axe:** 0 violations across 0 rules, site-wide, after the defect 4 fix (`npm run test:a11y`, 24 passed).
- **Out of scope, logged:** `/agents/new` shows the heading "Edit Agent", because the literal route has no `:id`. This predates the change and is not fixed here.
- **Data layer unchanged:** `git diff main --stat -- src/hooks src/lib` is empty.

## Independent review

- Reviewer: `artifact-critic` subagent, fresh context, given the artifact only (the diff of `src/pages src/components/ui e2e/app-pages.spec.ts src/test/flat-shell.test.ts` against `main`, plus the untracked `e2e/app-pages.spec.ts` read directly), judged against `specs/app-pages/spec.md` and `design.md`. Same model family as the producer (harness-native isolation), not cross-model.
- The reviewer ran no tests; its findings come from reading code.
- Verdict: **defects found, 1 CRITICAL, 5 WARNING, 3 SUGGESTION.**
- Scope of outcomes: this task does not fix code. The CRITICAL goes back to the orchestrator; WARNINGs and SUGGESTIONs become follow-ups for `brand-fidelity-audit`.

| ID | Severity | Location | Finding | Outcome |
|---|---|---|---|---|
| C1 | CRITICAL | `e2e/app-pages.spec.ts:144` (`if (info.tag === lastTag) break;`, tag built at `:135`) | The Tab-through loop treats two adjacent controls with the same class string as a stalled focus and exits. Inactive settings `NavLink`s (`src/pages/settings-page.tsx:36-50` mobile, `:60-72` desktop) have no id and identical classes, so the loop stops in the nav on every settings route; agent-new skill chips and collapsed provider headers do the same. The test asserts only `stops > 0`, so it passes. Scenario 11 is therefore not verified. | **Confirmed real** by km-product-owner reading `:118-152` and `settings-page.tsx`. Returned to the orchestrator for a fix (e.g. compare element identity rather than a class string, and stop on return to the first stop) and a re-run with fresh stop counts. Blocks archive. |
| W1 | WARNING | `e2e/app-pages.spec.ts:174-188`, `:233-248` | Flat 2.0 and Tab-through scans cover first render only; the expanded provider card (actions, models table, New Provider form), agent memory panel (TriButtons, `SelectTrigger`) and skill detail modal are never scanned. | Follow-up: brand-fidelity-audit. |
| W2 | WARNING | `e2e/app-pages.spec.ts:396`, `:426` | `expect(getByText(/error/i)).toHaveCount(0)` passes at the first zero count, so a late-rendered error is missed. | Follow-up: brand-fidelity-audit. |
| W3 | WARNING | `e2e/app-pages.spec.ts:416-422`; `agent-detail-page.tsx:124`; `App.tsx:31` | `/agents/new` renders edit mode ("Edit Agent", "Save agent") because the literal route has no `:id`; the test accepts either button name and the ready text `/agent/i` matches both. | Already logged as out of scope (predates the change). Follow-up: brand-fidelity-audit, plus tightening the test once fixed. |
| W4 | WARNING | `providers-page.tsx:356`, `:376` | Model table rows have no `hover:bg-hover`/`focus-within:bg-hover`, and the container is `bg-muted-surface`, not `bg-band` as design decision 2 states. Spec is met (spacing is an accepted separator); design is not followed. | Follow-up: brand-fidelity-audit. |
| W5 | WARNING | `skills-page.tsx:298-308`, `:325-336`, `:24` | After defect 4, keyboard access to skill details is only an icon button named "View configuration" (same name for every skill), opening a modal with no `role="dialog"`, no focus move, no Escape. Modal gaps predate the change; the change makes it the only path. | Follow-up: brand-fidelity-audit (accessible name with skill title; dialog semantics). |
| S1 | SUGGESTION | `src/test/flat-shell.test.ts` `covers every in-scope app page` | Compares a constant to the same literal list, so it cannot fail. Scenario 7 is still met via `RULES`. | Follow-up: brand-fidelity-audit. |
| S2 | SUGGESTION | `agents-page.tsx:219`, `:294` | `AgentMemoryPanel` is `bg-band` inside a `bg-band` card and the separator was removed, so the panel does not stand apart. | Follow-up: brand-fidelity-audit. |
| S3 | SUGGESTION | skills toggle; `e2e/app-pages.spec.ts:296-302` | Toggle name gives the action ("Disable skill"), not the state or the skill; no `aria-pressed`/`role="switch"`. | Follow-up: brand-fidelity-audit. |

Reviewer's "no findings" points: the three grep scenarios return nothing; the `Button` fix follows design decision 3's fallback; entity-graph hooks and mutations are unchanged.

Task 4.1's verify line ("no CRITICAL findings, or they are fixed and re-reviewed before archive") is **not yet satisfied**: C1 is open. Archive is blocked until C1 is fixed, scenario 11 is re-run, and a re-review reports no CRITICAL.


## Resolution (orchestrator, 2026-09-27)
- **C1 is fixed** in `e2e/app-pages.spec.ts`. The Tab-through loop now tracks element identity with a `data-e2e-tab-visited` marker, so it no longer stops at sibling controls that share a class string. It records and attaches the full stop sequence.
- **The re-run passed:** `npx playwright test e2e/app-pages.spec.ts -g "Tab-through"` gave 8/8, with no outline violations. Corrected stop counts: threads 2, agents 7, agent-new 16, agent-detail 18, settings-providers 8, settings-skills 24, settings-appearance 9, settings-account 4 (nav only, because the body controls render only after user settings load, which the mock doesn't supply).
- **Scenario 11 (Tab-through) is now MET.**
- **The re-review was not run.** The operator asked to finish, and the evidence is the fixed loop plus the run above.
- **Remaining partials, carried forward:**
  - the live UAR smoke (deferred by the operator)
  - `skills-toggle.spec.ts` last ran before the skills-card change
  - the full `test:e2e` and `test:visual` weren't re-run on the final tree
  - no capture paths in the QA note
  - plan item 11 (D-008)
- **W1–W5 and S1–S3** are routed to `brand-fidelity-audit`.
