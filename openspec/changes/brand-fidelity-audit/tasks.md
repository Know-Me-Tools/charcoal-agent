## 1. Fix-ups and the copy decision

- [ ] 1.1 (owner: km-frontend-engineer) Make the product fix-ups marked "Fix now" in design.md decision 1 that have km-frontend-engineer as owner. No new tokens, no copy changes, no changes to `src/hooks` or `src/lib`.
  - `agent-detail-page.tsx:124`: `/agents/new` renders create mode.
  - `skills-page.tsx`: the details panel moves onto the `Dialog` primitive; the control is named "View configuration for {title}"; the toggle becomes a switch with `aria-checked`, or a button with `aria-pressed`, and its name includes the skill title.
  - `providers-page.tsx:356`, `:376`: the models table is on `bg-band`, with `hover:bg-hover focus-within:bg-hover` rows.
  - `agents-page.tsx`: the memory panel is `bg-surface` on its band card.
  - `landing-page.tsx:22`: `splitHeadline` no longer repeats a word for two-word taglines. The composer textarea gets `field-sizing-content`.

  Verify, statically only:
  - `grep -n 'isNew' src/pages/agent-detail-page.tsx` shows the `undefined` case.
  - `grep -n 'fixed inset-0' src/pages/skills-page.tsx` returns nothing.
  - `git --no-optional-locks diff --stat -- src/hooks src/lib content` is empty.
- [ ] 1.2 (owner: km-qa-engineer) Make the test fix-ups marked "Fix now" in design.md decision 1 that have km-qa-engineer as owner, and add the new spec tests:
  - landing W3, W4, W7 and S1
  - the sub-12px `rem` rule (S2)
  - app-pages W1, W2 and S1
  - W3: assert "Create agent" only
  - a unit test that renders every `APPROVED_TAGLINES` entry through `splitHeadline` with no repeated word
  - the repo-wide Flat 2.0 `describe` with its allowlist (design.md decision 3); each allowlist entry needs a reason
  - e2e scenarios for the three app-pages delta requirements

  Fix or allowlist each of the 44 baseline hits, within the fix-up budget (design.md decision 2). Hits in product files are fixed by km-frontend-engineer, and this task records which one it was.

  Make these scratch mutations, record each result in the task note, then revert them:
  - `shadow-md` in a non-allowlisted `src/components/ui` file must fail the repo-wide block
  - `text-[0.7rem]` must fail the sub-12px rule
  - restoring `isNew = id === "new"` must fail the create-mode test
  - removing the dialog role must fail the dialog test

  Verify: all four failures are observed and recorded. No full suite runs yet.
- [ ] 1.3 (owner: operator; recorded by km-product-owner) Decide landing S4, "Every conversation, kept." (design.md Open question 1).
  - km-product-owner records the decision as D-009 in `.kbd-orchestrator/phases/complete-rebranding/decision-log.md`, with the operator's name and date.
  - If the operator picks new wording: km-cmo checks the claim against chat-persistence-durability's limits, km-chief-content-officer pre-reviews it and places it in `content/site/landing.ts`, and the operator's approval (name, date, file hash) goes into `docs/content/reviews/landing-s4.md`.
  - If there is no answer before task 2.1 starts, the approved copy stays and S4 is carried as a follow-up.

  Verify:
  - D-009 exists.
  - Either the review record holds the operator approval and `grep -n 'heading:' content/site/landing.ts` shows the approved text, or D-009 says "kept; carried as follow-up".

## 2. Whole-site audit and the single gate

- [ ] 2.1 (owners: km-qa-engineer; km-creative-director for the reference comparison) After 1.1–1.3, run the gate in design.md decision 7 once, from a freshly started dev server, and record everything in `docs/qa/brand-fidelity-audit.md`:
  - **Goldens (decision 4).** Switch `e2e/visual.spec.ts` to `toHaveScreenshot` with the pinned clock and masks. Set `snapshotPathTemplate` to `e2e/__goldens__/`. Generate with `--update-snapshots`, re-run without it, and record the total size. km-product-owner records D-010, the baseline commit.
  - **Strict axe.** Run `AXE_STRICT=1 npm run test:a11y` on every route in both themes.
  - **Flat 2.0.** Record the repo-wide rules' output and allowlist.
  - **Reference comparison (decision 5).** km-creative-director writes one row per route × theme at 1440 and at 320, each with a verdict.
  - **Constraints.** One row per blocking constraint, with the command, output and pass or fail. Also list the warning constraints (lint, TODO grep).
  - **Lighthouse (decision 6).** Landing and thread routes, with the version and conditions.
  - **Cold start.** Confirm or reopen the cold-start follow-up, and the tooltip-icon-button focus follow-up.

  An audit finding goes through the fix-up budget (decision 2). A fix-up regression goes back to 1.1 or 1.2, and the gate re-runs once.

  Verify:
  - build, typecheck, lint (0 errors), `npm test`, `test:e2e`, both `test:visual` runs and strict `test:a11y` all exit 0.
  - The golden directory holds 96 images.
  - Every constraint row passes.
  - Every comparison row has a verdict.

## 3. Verification, review and sign-off

- [ ] 3.1 (owner: km-product-owner) Write `openspec/changes/brand-fidelity-audit/verification.md` from the QA record:
  - Map each scenario in the three spec deltas to a test name, grep output, capture path or decision id.
  - Give the final disposition of every row in design.md decision 1: fixed, closed, or carried with an owner.
  - List "Follow-ups carried out of the phase".
  - State that the live UAR smoke did not run (operator deferral).

  Then run one independent review: `adversarial-review --mode diff` over the full branch diff against `main`, or `artifact-critic` if no gateway is reachable. Record its findings and outcomes. A CRITICAL finding is fixed and re-reviewed, or the operator waives it in writing. Finally, add the operator sign-off line: name, date and the signed commit hash.

  Verify:
  - Every scenario has evidence or is marked unmet.
  - The review shows no open CRITICAL.
  - The sign-off line names an existing commit.
