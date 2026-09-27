## Why

This is plan item 12 and the last change in the complete-rebranding phase. The eleven changes before it each verified their own routes. No run has checked the whole site at once, no golden snapshots are committed, and the constraints file has not been re-run against the final tree. Measured on `rebrand/brand-fidelity-audit` at `39f4aee` on 2026-09-27:

- **Captures are not goldens.** `e2e/visual.spec.ts` writes 12 routes × 4 widths × 2 themes = 96 PNGs to the git-ignored `test-results/screenshots/` ("artifacts for review, not goldens"). A visual regression fails nothing.
- **The Flat 2.0 source guard does not cover the whole repo.** Running the `flat-shell.test.ts` rules over every non-test `.ts`/`.tsx` file under `src/` gives 44 hits in 15 files. 35 are in `src/components/ui/` (button, input, textarea, switch, card, sonner, sheet, scroll-area, avatar, alert, tabs) and 7 are in `src/components/error-boundary/ChatErrorBoundary.tsx` (`border`, `border-t`, `text-[10px]`, `text-[11px]`). Some are unreachable variants or comment text; the rest render. Nobody has sorted them.
- **Follow-ups are open.** landing-and-about-brand routed W2–W4, W6, W7 and S1–S5 here, plus the dev-server cold-start timeouts. app-pages-flat2-entity-views routed W1–W5, S1–S3 and the `/agents/new` "Edit Agent" heading here. S4 ("Every conversation, kept.") needs an operator copy decision.
- **The last two changes left gate gaps.** app-pages did not re-run the full `test:e2e` or `test:visual` on its final tree. chat-persistence-durability did not run `test:a11y` or the e2e typecheck on its final tree.

## What Changes

- **Small fix-ups only**, from the triage table in design.md decision 1. A fix goes in only if it is one of the listed items or an audit finding that fits the fix-up budget (design.md decision 2). Anything larger becomes a recorded follow-up.
  - Product: `/agents/new` renders create mode; the skill details panel becomes a real dialog with a per-skill control name; the skill toggle exposes its state; the providers models table gets `bg-band` and a row hover/focus fill; the nested agent memory panel stands apart from its card; the landing headline split no longer repeats a word for two-word taglines; the landing composer grows with its content again.
  - Tests: the 503, empty-send, FAQ-order, late-error and agent-create tests are tightened; the About and app-page scans cover the shell and opened panels; the sub-12px source rule also catches `rem` sizes; the in-scope coverage test is derived from the file system.
- **One operator copy decision (S4).** The operator keeps or replaces "Every conversation, kept." The decision is recorded in the phase decision log. A replacement goes through the content route before it lands in `content/site/`.
- **A whole-site audit**, run once, at the end:
  - captures of every route × 320/768/1024/1440 × dark/light
  - strict axe on every route in both themes
  - the Flat 2.0 source rules over all of `src/`, including `src/components/ui`
  - a side-by-side comparison against brand references S2 and S3
  - Lighthouse on the landing and thread routes, recorded but not gated
  - every blocking check in `.kbd-orchestrator/constraints.md`, re-run with its output recorded
- **Golden snapshots are committed.** `test:visual` compares against committed goldens instead of only writing captures.
- **Operator sign-off** is recorded in `verification.md`.

## Non-goals

- The live UAR smoke. The operator deferred it until after this phase.
- The chat-led marketing site, which is its own later phase.
- Site-chrome copy (landing W2) and the About endpoint label (landing S5). Both change on-page copy, so they need the content route and operator approval. They are recorded as follow-ups.
- New colour tokens, new routes, data-layer changes (`src/hooks`, `src/lib`), and PGlite migrations.
- chat-persistence-durability's non-visual follow-ups: bfcache and Web Lock, Tauri quit, kept mutation copies, and multi-tab replay order.

## Capabilities

### New Capabilities
- `brand-fidelity`: the whole-site audit record. It covers repo-wide Flat 2.0 source rules, strict axe on every route, the reference comparison, the constraints re-run, the Lighthouse record and operator sign-off.

### Modified Capabilities
- `ui-verification-harness`: adds committed golden snapshots that `test:visual` compares against.
- `app-pages`: adds create mode on `/agents/new`, an accessible skill details dialog, and a skill toggle that exposes its state.

## Impact

- **Code (small):** `src/pages/{agent-detail,skills,providers,agents,landing}-page.tsx`, `src/components/error-boundary/ChatErrorBoundary.tsx`, and those `src/components/ui/*` primitives whose Flat 2.0 hits turn out to render (design.md decision 3).
- **Tests:** `e2e/{visual,brand-pages,app-pages}.spec.ts`, `src/test/{flat-shell,brand-copy}.test.ts`, plus a new committed golden directory `e2e/__goldens__/`.
- **Docs:** `docs/qa/brand-fidelity-audit.md` (QA record), `openspec/changes/brand-fidelity-audit/verification.md`, and decision-log entries D-009 (S4) and D-010 (the golden baseline).
- **Repo size:** 96 full-page PNGs. The expanded thread capture is about 2,700px tall.
