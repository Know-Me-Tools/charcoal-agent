## Why

Part of the phase `site-ci-gates-and-chat-polish` (change 3 of 4). The reset notice now stays until the visitor closes it, but its close control is about 14 px: `src/components/ui/sonner.tsx` builds the Toaster in sonner's `unstyled` mode, so sonner never sizes or places the close button and its `closeButton` class string carries no size. One of five full e2e runs of `e2e/db-reset-notice.spec.ts` also failed once with the cause unknown; the failure trace was deleted by a later run before anyone read it. Evidence: assessment gaps G-3 and G-4.

## What Changes

- The Toaster's `closeButton` class string gives the control a 44 px square target, placed at the end of the toast, in KnowMe tokens (flat: no border, shadow or gradient). Only the reset notice uses `closeButton`, so no other toast changes.
- The flake is reproduced with repeated runs under parallel load, with the trace kept in a separate output directory so a later run cannot delete it. If a cause is found in the spec or the app it is fixed; if it is not reproducible in the run count, that is recorded as the result, not as a pass.
- No new visitor-facing string: the control keeps sonner's own accessible name ("Close toast").
- Tasks: see `tasks.md`.

## Impact

- Deploy: a merged client change deploys `knowme-web` to production with no approval stop.
- Constraints: Flat 2.0 (no borders, shadows or gradients); tokens only; the product-naming guard (`src/test/brand-naming.test.ts`) scans `src` and `e2e`; the full unit suite and the CI Verify sequence are run before the pull request is opened (previous phase, corrective action 1).
- Evidence: the measured close-control size at 320 px and 1440 px in the built app, with a mutation check that the measurement fails on the old class string; screenshots read by the builder; the repeat-run results.
