# 16 - site agent local probe (UAR pinned digest 688a97e4, local compose)

Local `knowme-uar` runs the same digest as the cluster `uar` deployment (checked 2026-10-10 with `kubectl --context know-me -n knowme get deploy`).

## Seed (task 1.6)
`UAR_URL=http://127.0.0.1:6565 ./scripts/seed-site-agent.sh`, twice. Run 1 created presentation "Answer card"; run 2 logged "up to date". FR-8 KB health check passed both times.
Gotcha: the script's default `UAR_URL=http://localhost:6565` fails with `Connection reset by peer` on this machine (OrbStack's IPv6 listener). Use `127.0.0.1`.

## Probe: agent `knowme-site`, sub=knowme-site, question "What is The Boss?"
| | presentation_mode text | presentation_mode a2ui + uar.a2ui/1 |
|---|---|---|
| effective_mode | text | a2ui (tool offered) |
| tool calls | none | `presentation_render` once, template "Answer card" rev 1 |
| `a2ui` artifact | **0** | 1 (`sourceTool presentation_render`), card from the template, data title/answer/source |
| input / output tokens | 1,529 / 298 | 4,502 / 510 |
| message.delta events | 23 | 43 (answer text is still written after the card) |

- Internal artifact types still emitted by UAR in both modes: effective_run_policy, turn_manifest, attempt_manifest, provider_event (the site server drops them; not a UAR change).
- Run finished normally with 5,012 tokens against `max_tokens_per_turn: 2500`; whether that cap is enforced on this path is not established.

## Not yet done
Deceptive-UI red team through the site proxy :8080 with the switch ON; forced `activate_skill` fixture; FR-11 test; the `<`+`>` data rejection check.
