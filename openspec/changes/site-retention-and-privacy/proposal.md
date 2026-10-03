## Why

No privacy notice for the site exists (`content/knowledge/knowme-privacy.md` describes the product, not the site). Visitor text is processed by Alibaba Cloud in Singapore and stored in SurrealDB `sessions`, `checkpoints`, `cost_ledger` and `tool_admission_evidence`; logs have no retention bound, and the site server's `TraceLayer` access log (`server/src/interface/routes/mod.rs:62`) may record session ids. FR-32 requires a notice, and §6.4 items 8 and 15 require it plus log retention of 30 days or less with no session ids in access logs.

## What Changes

- Log retention at 30 days or less, with no session ids in access logs.
- A privacy notice that names every store, the processor and transfer destination, the retention period (D-5), the request-based erasure process and the data-request contact (D-8), and states only what FR-33 and FR-41 have been shown to do. It mentions a delete control only if FR-20 has shipped.
- Lands in: this repo. Owner: km-security-officer (policy), km-devops-engineer (config), km-chief-content-officer (notice).
- Depends on: `site-session-erasure`, D-5, D-6, D-8.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3); `docs/agent-led-site/sections/09-implementation-plan.md` (Phase 0, new changes).

## Impact

- Capability: `site-retention-and-privacy`.
- Files: `server/src/interface/routes/mod.rs` (access log fields), `k8s/base/*` (log retention), `docs/legal/site-privacy-notice.md`, the notice page and composer/footer links, `docs/content/reviews/site-privacy-notice.md`.
