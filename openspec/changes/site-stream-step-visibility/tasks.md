## 1. site-stream-step-visibility

- [x] 4.1 Capture a real stream with a tool-using prompt and record actual UAR event names and fields for tool steps and reasoning.
  - Partial: event names and fields come from reading the UAR source and this repo's filter (`evidence/05-uar-event-names.md`), not from a live capture; no recorded real capture exists. The live capture is repeated in 4.4 on a local UAR stack and settles the unknowns listed there (knowledge-search tool name, reasoning events, ordering).
- [x] 4.2 `agui_filter.rs`: whitelist tool-step events with a fixed label set per call class (no arguments, no results, no tool ids; a server-minted opaque index for start/finish pairing) and a reasoning-in-progress signal without text; update the tests that pin these events as dropped and keep a mutation check on everything still dropped.
  - Partial: the knowledge base is retrieved before the turn and injected into the prompt (citations arrive as `agui.rag_citations`), so there is no knowledge-search tool call; the label 'Searching the knowledge base' can never fire (`KNOWLEDGE_SEARCH_TOOLS` is empty). Not tested against a live UAR stream (4.4). The client still expects the removed `agui.tool_call.denied` frame until 4.3.
- [x] 4.3 Client renderers and registry entries; `aria-live` politeness, keyboard, reduced motion, 320 px.
  - Partial: unit and component tests only (156 pass, three mutation checks). No 320 px capture, no keyboard/reduced-motion run in a browser and no real stream: those belong to the integration gate and 4.4.
- [ ] 4.4 Real-model run on a **local UAR stack** with the agent seeded locally (the operator supplies model credentials in their own environment; I do not read them); repeated on production in change 15.
- [ ] 4.5 Decision record D-P3 and a regression test pinning `memory_enabled:false` and that no `agui.memory.*` event passes.

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` under Task model assignments, keyed by phase path `site-chat-hardening-and-polish`, change `site-stream-step-visibility` and the task ID above.
