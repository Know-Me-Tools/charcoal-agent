## 1. site-stream-step-visibility

- [ ] 4.1 Capture a real stream with a tool-using prompt and record actual UAR event names and fields for tool steps and reasoning.
- [ ] 4.2 `agui_filter.rs`: whitelist tool-step events with a fixed label set per call class (no arguments, no results, no tool ids; a server-minted opaque index for start/finish pairing) and a reasoning-in-progress signal without text; update the tests that pin these events as dropped and keep a mutation check on everything still dropped.
- [ ] 4.3 Client renderers and registry entries; `aria-live` politeness, keyboard, reduced motion, 320 px.
- [ ] 4.4 Real-model run on a **local UAR stack** with the agent seeded locally (the operator supplies model credentials in their own environment; I do not read them); repeated on production in change 15.
- [ ] 4.5 Decision record D-P3 and a regression test pinning `memory_enabled:false` and that no `agui.memory.*` event passes.

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` under Task model assignments, keyed by phase path `site-chat-hardening-and-polish`, change `site-stream-step-visibility` and the task ID above.
