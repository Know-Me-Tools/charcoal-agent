## 1. Site proxy opts into A2UI itself and keeps A2UI action routes closed

- [ ] 1.1 Write failing tests first: the built upstream body always carries `presentation_mode`: `"text"` while the out-of-band switch is OFF, absent, unreadable or unrecognised, and `"a2ui"` plus `client_rendering` only while it is ON; the field is never omitted; visitor-supplied values are always ignored.
- [ ] 1.2 Implement it in `server/src/domain/chat_request.rs`, controlled by the out-of-band switch file read the way the chat kill switch is read (re-read within seconds, no restart); the file variable is optional and absent means OFF.
- [ ] 1.3 Wire the switch everywhere it must exist: the `site-a2ui-optin` ConfigMap as an **optional** volume in `k8s/base/knowme-web-deployment.yaml` (absent means OFF, so the rollout cannot fail on it), the compose volume and optional file variable, and an `a2ui on|off` command in `scripts/ops/bootstrap-site.sh` that creates the ConfigMap OFF and flips it, never overwritten on deploy.
- [ ] 1.4 Route test that the A2UI message, action and surface-replay endpoints are unreachable through the public listener.
- [ ] 1.5 Check that the allowlist keeps well-formed `a2ui` artifacts and still drops malformed or oversized ones; add a size cap.
- [ ] 1.6 km-security-officer review of the opt-in and route changes, recorded in this change.
- [ ] 1.7 Done-when (local): `cargo test` in `server/` passes except the known CSP baseline failure, and on the compose stack the upstream body observed by the harness carries `presentation_mode: "a2ui"` with the switch ON and `"text"` with it OFF or absent, a visitor-supplied value is ignored, and a text-only chat turn streams the same answer text as before the change.

Model assignments for these tasks are in `.kbd-orchestrator/phases/agui-rendering-functionality/plan.md` under Task model assignments, keyed by phase path `agui-rendering-functionality`, change `site-proxy-a2ui-optin` and backend task ID (the ordinal of each task above).
