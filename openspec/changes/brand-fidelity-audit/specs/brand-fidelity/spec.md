## Purpose

Defines the whole-site brand-fidelity check that closes the complete-rebranding phase. It covers Flat 2.0 source rules across the whole repo, strict accessibility on every route, a recorded comparison with the brand references, a re-run of the project's blocking constraints, a performance record, and operator sign-off. "Every route" means every entry in `APP_ROUTES` in `e2e/support/routes.ts`.

## ADDED Requirements

### Requirement: Flat 2.0 source rules cover the whole repo
The Flat 2.0 source rules (border, divider, shadow, backdrop blur, `ring-1`, line texture, text under 12px in `px` or `rem`, and gradient) SHALL run over every non-test `.ts` and `.tsx` file under `src/`, including `src/components/ui/`. Any remaining hit SHALL be on a documented allowlist that names the file, the matched class and why it does not render, or why rendering it is allowed. Hits that render and are not allowed SHALL be fixed.

#### Scenario: Repo-wide guard passes
- **WHEN** `npx vitest run src/test/flat-shell.test.ts` is run
- **THEN** a repo-wide block over `src/**/*.{ts,tsx}` (excluding tests) passes
- **AND** every allowlist entry has a reason

#### Scenario: Repo-wide guard can fail
- **WHEN** `shadow-md` is added to a class string in a `src/components/ui/` file that is not on the allowlist
- **THEN** the repo-wide block fails and names that file

#### Scenario: rem sizes under 12px are caught
- **WHEN** `text-[0.7rem]` is added to any scanned file
- **THEN** the repo-wide block fails with the text-under-12px rule

### Requirement: Strict accessibility on every route
Every route SHALL have zero axe WCAG 2.x A/AA violations, including colour contrast, in both themes.

#### Scenario: Strict axe run
- **WHEN** `AXE_STRICT=1 npm run test:a11y` is run from a freshly started dev server
- **THEN** it exits 0
- **AND** the report lists every route in both themes with zero violations

### Requirement: Reference comparison is recorded
Captures of every route SHALL be compared with brand references S2 (`branding/knowme-brand-guide.html`, `branding/knowme-brand-template.html`, `branding/logos/*.svg`) and S3 (`know-me-system/desktop/src/index.css`, `KnowMeLogo.tsx`). The comparison SHALL be recorded as one line per route and theme, each giving a verdict of match, accepted deviation (with its reason or decision id) or defect.

#### Scenario: Every route and theme has a verdict
- **WHEN** the QA record's reference comparison table is read
- **THEN** it has a row for each route in each theme, at 1440 and at 320
- **AND** every row with a "defect" verdict links to a fix in this change or a recorded follow-up

### Requirement: Blocking constraints are re-run on the final tree
Every blocking constraint in `.kbd-orchestrator/constraints.md` SHALL be run against the final tree of this change, and its command and output SHALL be recorded.

#### Scenario: Constraint table
- **WHEN** the QA record's constraints table is read
- **THEN** it has one row for each blocking constraint id (`build-passes`, `tests-pass`, `no-console-log-in-commits`, `no-any-type`, `no-hardcoded-secrets`, `no-env-files-committed`, `reference-folders-read-only`, `pglite-migrations-append-only`, `pglite-not-prebundled`)
- **AND** each row shows the exact command run, its output or exit code, and pass or fail
- **AND** `no-any-type` reports no more occurrences than the one recorded at init

### Requirement: Performance is recorded, not gated
Lighthouse SHALL be run on the landing route and the thread route, and the performance, accessibility, best-practices and SEO scores, plus LCP, CLS and TBT, SHALL be recorded with the tool version and the conditions of the run. The scores SHALL NOT block archive.

#### Scenario: Lighthouse record
- **WHEN** the QA record's Lighthouse section is read
- **THEN** it lists both routes with the four category scores, LCP, CLS and TBT, the Lighthouse version, the server used (dev or preview) and whether a UAR was reachable

### Requirement: Operator sign-off
The change SHALL NOT be archived until `verification.md` carries an operator sign-off line with the operator's name, the date and the git commit it signs off.

#### Scenario: Sign-off present
- **WHEN** `verification.md` is read before archive
- **THEN** it contains a line naming the operator, a date and a commit hash that exists on the branch
