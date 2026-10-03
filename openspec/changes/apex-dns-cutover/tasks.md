## 1. Move know-me.tools off Lovable to the cluster gateway

**Revision 3 (2026-10-02, D-21):** cancelled in `uar-integration` (Phase 0) and moved to Phase 1, where it runs last, after every other Phase 1 exit criterion and a re-run of §6.4 items 5, 6, 10 and 16 against the build that goes public (`docs/agent-led-site/sections/09-implementation-plan.md`).

- [ ] 1.1 Build a page-parity checklist of the current `https://know-me.tools` against the new site (via `--resolve`) and fix gaps before the cutover.
- [ ] 1.2 Operator changes the Cloudflare A records for `know-me.tools` and `www` to `23.239.29.33` and retires Lovable hosting. Rollback: restore the previous records.
- [ ] 1.3 Verify: public `dig` shows the gateway IP; `curl -I https://know-me.tools` serves the new site with the Let's Encrypt certificate; the chat works in production.
