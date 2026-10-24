# Review record: kb-currency-fixes

Phase `usefulness-update`, change 2 of 12. Pages changed (source and generated): Universal Agent Runtime overview, status and licence, protocols; agent-runtimes-compared; landscape FAQ; how-to-choose; The Boss; KnowMe FAQ; skill packages status; Surreal Memory Server status.

## What changed
Stale version claims became `{{v:<id>}}` placeholders resolved from `docs/knowledge-source/product-facts.json` at build time. UAR: "version 1.0.0" became the latest stable release (v1.2.3) with v1.3.0 named as a pre-release whose verification is pending. The Boss: the v2.2.36 and v2.2.30 installer lists became the v2.2.41 release records (macOS Apple Silicon and Intel, Windows x64; no Windows ARM64 in that release). Skill packages, Mini and the Surreal Memory Server take their versions from the facts file.

## Editorial pre-review (km-chief-content-officer, 2026-10-24, AI pre-review)
Verdict PASS WITH FIXES. Four required fixes and four notes, all applied:
- Dropped the sentence that the KnowMe AI, LLC site runs v1.3.0. It is an operational detail that is true only until the next pin change, it is not in a repository, and a visitor could read it as an endorsement of a version that is marked verification pending.
- The protocols page no longer presents 1.2.1 and 1.2.2 as features without context: it says 1.2.1 is acceptance pending and the published 1.2.2 image failed one acceptance case, and that acceptance of the published v1.2.3 Linux amd64 image passed within a defined scope (arm64 outside it).
- The v1.2.3 date is the changelog's (2026-10-22); the facts file carries the GitHub release date (2026-10-23, UTC), so the text no longer uses the release-date token for it.
- The skill-pack page says its skill counts were taken from 1.12.2 and have not been recounted for v1.13.0.
- Notes: "is recent" replaced by the 1.x start date (2026-07-12); the Boss page says an older release (v2.2.30) has a Windows ARM64 installer; the Surreal Memory Server line gives the tag's last-changed date.

## Earlier ruling superseded
The 2026-09-30 corpus review recorded "The Boss has no version numbers". The operator's instruction of 2026-10-24 ("Provide version numbers") supersedes it for this phase.

## Not checked
The pre-review did not open `PRODUCT.md` or `content/brand/`, and did not read the generated copies or footnote blocks. Operator approval is by merge. Nothing here reaches the concierge until the KB is seeded (`Site content sync`, `sync=kb`, `dry_run=false`), which the operator dispatches.
