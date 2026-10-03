## 1. Retention policy and log hygiene

- [ ] 1.1 Confirm D-5 (retention period), D-6 (Alibaba Cloud DPA and SCCs, EU geo-policy) and D-8 (data-request contact) are recorded in `.kbd-orchestrator/phases/uar-integration/decision-log.md`; this change does not proceed past 1.2 without them.
- [ ] 1.2 km-security-officer writes the retention policy in `docs/legal/site-retention.md`: the D-5 period for every store in §6.3 (`sessions`, `checkpoints`, `cost_ledger`, `tool_admission_evidence`, `memory` if ever enabled), container logs at 30 days or less, and the in-memory limiter.
- [ ] 1.3 Audit what the site server logs: `TraceLayer` in `server/src/interface/routes/mod.rs:62`, upstream error logging, and the 429 path. Remove `X-UAR-Session-ID`, the derived upstream session id, cookies and query strings from every log line; keep method, route template, status and latency.
- [ ] 1.4 Add a server test that sends a request carrying `X-UAR-Session-ID` and asserts the captured log output contains neither the header value nor the derived id.
- [ ] 1.5 km-devops-engineer sets cluster log retention for the `knowme` namespace at 30 days or less (log backend or node log rotation config), and records the setting and where it lives.

## 2. Privacy notice

- [ ] 2.1 Draft `docs/legal/site-privacy-notice.md` (km-security-officer source, km-chief-content-officer voice): processor Alibaba Cloud, transfer destination Singapore and the transfer basis per D-6, the lawful basis, every store in §6.3, the D-5 retention period, the request-based erasure process from `site-session-erasure`, the D-8 data-request contact, and that memory capture is off (FR-41).
- [ ] 2.2 Cross-check every claim against evidence: purge and erasure only as `site-session-erasure`'s direct SurrealDB tests showed (FR-33), memory off only as `site-agent-tool-allowlist`'s FR-41 test showed; no delete control is mentioned unless FR-20 has shipped. Record the claim-to-evidence table in this change.
- [ ] 2.3 Copy-approval gate: file `docs/content/reviews/site-privacy-notice.md` with the operator's recorded approval before the notice lands in `content/**`, `src/pages/**` or `public/**`.
- [ ] 2.4 Publish the notice at a route that exists in the site build, and link it from the composer and the footer.
- [ ] 2.5 Visual-first capture of the notice and both links at 320 and 1440 in both themes, viewed and listed.
- [ ] 2.6 Integration check: on the local compose stack, `curl -s localhost:8080/<notice-route>` returns 200 with the processor, Singapore, the retention period and the data-request contact; a chat turn followed by `docker compose logs knowme-web | grep -c <thread-uuid>` prints 0; the retention setting is shown in the rendered manifests. Evidence filed for §6.4 items 8 and 15.
