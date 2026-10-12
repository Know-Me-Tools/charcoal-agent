# 23: Operator-only boundary actions (agui-a2ui-live-verification 1.5)

Actions only the operator took or approved. I did none of these.

| When | Action |
|---|---|
| 2026-10-09 | Answered the six assessment questions (D-25 to D-30): UAR integration scope, A2UI everywhere, UAR validator may change, PEM is the operator's to publish, fix the live leak first, register PEM as a writable folder |
| 2026-10-10 to 2026-10-11 | Merged phase PRs #25 to #35 in this repo (merge times 2026-10-10T13:48Z for #27 through 2026-10-11T20:48Z for #35) |
| 2026-10-10 | PEM 4.2.0 published to npm (registry time 2026-10-10T00:18Z; dist-tags `latest` and `next` = 4.2.0), after the operator merged the release PR. PEM has no git tag for it |
| 2026-10-11 | UAR: merged #378 (Docker build fix) in the UAR repo; CI published `:main` = `sha256:e955789a…` at 17:07 UTC |
| 2026-10-12 | Merged PRs #37 (meter reservation 16,000, 03:48Z) and #36 (UAR image pin, 03:56Z), both `[skip ci]` |
| 2026-10-12 | Started the "Deploy site" run (38201976018) with `gh workflow run` typed at the prompt, after the permission classifier denied me running it, and approved the `production` environment. This was the single approved production deploy (Train B), shipping #27 through #37 |
| standing | Set the 16,000 token cap; kept the chat kill switch ConfigMap at `{"state":"off"}` (chat on) and told me never to touch it; declined email alerting; Linode support issues handled outside this work |

Not yet done by the operator: rotate the Resend key pasted earlier in the session (advised, unconfirmed); decide whether
to tag and release PEM 4.2.0; fix PEM `main` CI (Node 24 leg of the DevTools packed-UI gate fails on `580997b5` and
`34a21156`).
