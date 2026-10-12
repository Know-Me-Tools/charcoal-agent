## 1. site-answer-card-and-sources

- [ ] 5.1 Change `uar/agents/knowme-site.json` and `uar/presentations/answer-card.json` (title, summary, source). Verified locally first. It is published with `sync: agent` **in the same window as Train C, after the new client is live**, never at Round 2: the new card shape against the old client would give visitors a thin card plus three citation cards and no caption.
- [ ] 5.2 Client: one Sources block (revive `CitationList`), snippet markdown stripped and trimmed at word boundaries, citation display name derived from the uploaded filename by rule (strip the 12-hex hash and `.md`, de-slug), `marker` rendered when present.
- [ ] 5.3 W3: app-rendered caption wrapper around every A2UI surface, distinct from model `caption` text; mutation-checked test that a model-written caption cannot occupy the slot.
- [ ] 5.4 Caption wording approved by the operator (content-officer pre-review); string comes from `content/site/ai-disclosure.ts`.
- [ ] 5.5 Real-model measurement on the local stack: 20 prompts, how often the card is emitted and whether prose repeats it, plus the 10-prompt security validator; repeated on production in change 15.

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` under Task model assignments, keyed by phase path `site-chat-hardening-and-polish`, change `site-answer-card-and-sources` and the task ID above.
