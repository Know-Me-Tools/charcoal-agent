# Verification: brand-fidelity-audit

Evidence: `docs/qa/brand-fidelity-audit.md` (gate, allowlist, breakage proofs, Lighthouse), `docs/design/brand-fidelity-comparison.md` (reference comparison), and the final gate below. Node v24.16.0.

## Scenario map

| # | Scenario | Status | Evidence |
|---|---|---|---|
| 1 | Create mode on /agents/new | MET | app-pages e2e create-mode test; breakage proof (restoring `id === "new"` fails it) |
| 2 | Details controls are distinguishable | MET | app-pages e2e: dialog-opener names include the skill title |
| 3 | Dialog keyboard behaviour | MET | app-pages e2e: role=dialog, focus moves in, Escape closes, focus returns; breakage proof (removing the role fails it) |
| 4 | Toggle state and name | MET | app-pages e2e: `role="switch"`, `aria-checked`, skill-named. Switch rendering was fixed (D4), and the captures were viewed |
| 5 | Repo-wide guard passes | MET | `flat-shell.test.ts` "Flat 2.0 repo-wide" (31 categorized allowlist entries, 0 unlisted hits) |
| 6 | Repo-wide guard can fail | MET | breakage proof: `shadow-md` fails, naming the file |
| 7 | rem sizes under 12px are caught | MET | breakage proof: `text-[0.7rem]` fails |
| 8 | Strict axe run | MET | `AXE_STRICT=1 npm run test:a11y`: 24 passed, 0 violations on every route |
| 9 | Every route and theme has a verdict | MET | `brand-fidelity-comparison.md`: 12 routes at 1440 and 320, both themes. The 768 and 1024 captures were not reviewed (partial) |
| 10 | Constraint table | MET | QA doc: all 9 blocking constraints pass |
| 11 | Lighthouse record | MET | QA doc: landing and thread, mobile and desktop, medians. Recorded, not gated |
| 12 | Sign-off present | MET | operator sign-off line below |
| 13 | Goldens exist for the full matrix | MET | `e2e/__goldens__/`: 96 PNGs (D-010) |
| 14 | Unchanged tree matches | MET | the full e2e run, without `--update-snapshots`, passed every golden comparison |
| 15 | A visual change fails | MET | the D1–D5 fixes produced exactly the expected golden mismatches on the affected routes before regeneration |

## Operator decision: fix D1–D5 (design.md)

- **The fixes:**
  - D1 providers row wraps below `sm`
  - D2 skills header stacks
  - D3 font-size options stack below 400px; this also fixes the "Comforta/ble" mid-word break the orchestrator found on review
  - D4 `Switch` primitive rebuilt; the old thumb used invalid `calc(100%-2px)`, and the hand-rolled toggle is replaced
  - D5 nested chips and the memory panel moved to `bg-raised`
- **Why `bg-raised` for D5:** `bg-surface` equals `bg-band` in dark, so the first D5 fix only worked in light.
- **Visual verification:** the frontend engineer viewed 20 captures (5 routes × 320 and 1440 × light and dark). The orchestrator re-viewed skills at 320 dark, providers at 320 light, appearance at 320 in both themes, and agents at 1440 dark.
- **Goldens:** regenerated only for settings-providers, settings-skills, settings-appearance, agents and settings-account.

## Independent review

- The reference comparison by km-creative-director is the independent visual review of the site.
- No separate diff review ran on the D1–D5 batch. The operator directed a time-boxed finish, and this batch implements fixes the comparison had already specified.

## Follow-ups (next phase)

- BFA-CD-06 to BFA-CD-15 (minor deviations, the capture note, the fixture image, copy points).
- F-1 to F-3: component borders.
- The 11.35 MB JS bundle and mobile LCP (Lighthouse).
- Implement the `visual-first-ui-delivery` checks in this repo: the look-manifest check, the appearance checks, and the nested-fill token test.
- The live UAR smoke, deferred by the operator.

## Final gate (2026-09-27, Node v24.16.0, after the D1–D5 fixes)

- Goldens regenerated for the 5 affected routes: 40 passed, 10 PNGs updated.
- `npm test`: 411/411. `npm run typecheck`: ok. `npm run lint`: 0 errors. `npm run build`: ok.
- `npm run test:e2e`, including the visual golden comparison without update: 313 passed, 2 failed.
  - Both failures were the Flat 2.0 check on settings-skills, in each theme.
  - Cause: the rebuilt switch thumb carried `ring-0`, which in Tailwind 4 sets a zero-width box-shadow value rather than `none`.
  - Fix: `ring-0` removed. No visual change.
  - Targeted re-run `e2e/app-pages.spec.ts` + `e2e/visual.spec.ts -g settings-skills`: 17 passed. `flat-shell.test.ts`: 95/95.
- `AXE_STRICT=1 npm run test:a11y`: 24 passed, 0 violations.
- **Counts:** 15 MET, and scenario 9 partial (768 and 1024 not reviewed).

## Operator sign-off
Signed off: Travis James, 2026-09-27, commit 238d20d. The operator reviewed the 96 goldens in `e2e/__goldens__/`, including the 5 routes regenerated after the D1–D5 fixes, and confirmed the sign-off in session.
