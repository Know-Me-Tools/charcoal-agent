## 1. site-starter-prompts

- [ ] 7.1 **Privacy design gate (first):** nothing about a visitor reaches the server or model; decide shared-device behaviour before anything is built. Default: an unranked pool, or ranking from the current session only; history-based ranking only as an explicit opt-in with a visible "Clear suggestions" control, because the order and choice of chips reveal a previous user's topics on a shared browser. `km-security-officer` signs this off and the operator approves.
- [ ] 7.2 Pool schema and generator (runs through UAR, operator-run); every pool prompt is checked by the eval harness to be answerable from the KB (expected document retrieved); the content officer reviews; competitor, pricing and compliance questions the KB cannot support are removed.
- [ ] 7.3 Ranker per the 7.1 decision (on-device only); chips always show pool text, never history text.
- [ ] 7.4 Empty-state chips: keyboard, focus, 320 px, one-tap send.
- [ ] 7.5 Delivery: the pool is a reviewed static file under `content/site/` that ships with the image on the next deploy. This is **not** independent of a deploy; a no-deploy path (server route reading a file) is deferred and named as such.

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` under Task model assignments, keyed by phase path `site-chat-hardening-and-polish`, change `site-starter-prompts` and the task ID above.
