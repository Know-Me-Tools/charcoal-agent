# 22: Cumulative adversarial review of the phase (agui-a2ui-live-verification 1.4)

Reviewer: `artifact-critic` subagent, which received the phase diff and brief only (no generation history).
Verdict: PASS. 0 CRITICAL, 6 WARNING, 3 SUGGESTION.

Provenance caveat: the reviewer's original findings JSON is not in the repository. This record is rebuilt from the
session's working notes, so wording is mine, not the reviewer's.

| # | Severity | Finding | State |
|---|---|---|---|
| 1 | WARNING | Meter reservation (5,000) not raised with the 16,000 turn cap: concurrency overshoot, and a Stop before usage under-charges | Fixed: PR #37 sets the default to 16,000, equal to the cap |
| 2 | WARNING | `tool_approval: auto` never exercised live with a forced non-allowlisted tool | Open. The public filter turns a denial into a fixed public event (tested with UAR's real payload shape); no live forced call has been seen, because the model refuses before calling |
| 3 | WARNING | Public stream forwarding (see #35) | Fixed: PR #35 rebuilds every public frame from a per-event field whitelist and closes the `id:` line leak found live |
| 4 | WARNING | Public A2UI component set (see #35) | Fixed: PR #35 limits public surfaces to Card, Column, Row, Text, Divider with no `action` or function `call` key, in Rust and in the client |
| 5 | WARNING | The registry hides artifact types the non-site app used to show (`ui`, `logo`, `image`, `content`, `meta-prompt`) | Open, not requested |
| 6 | WARNING | Scope creep: PEM bump to 4.2.0, unreachable event handling, formatting churn | Open, not requested |
| S1 | SUGGESTION | Drop `agui.state.patch` (the client does nothing with it) | Open |
| S2 | SUGGESTION | Possible duplicate "Run cancelled" block | Open |
| S3 | SUGGESTION | `variant in HEADING_CLASS` is a prototype-chain check | Open |

Changes made after the review and not seen by the reviewer: PR #36 (UAR image pin, seed JWT `roles`), PR #37
(reservation), the TextField fill fix in `src/features/a2ui/catalog.tsx`, and the two new capture specs. Each was
verified by running it (see 21 and the dated live folder). No second review round was run.

A separate security review of the public A2UI path was requested from `km-security-officer`:
`20-security-review-site-proxy-a2ui.md`.
