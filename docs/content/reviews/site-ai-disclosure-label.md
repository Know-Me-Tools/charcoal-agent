# Review record: AI disclosure label and sensitive-data hint

- **Piece:** `content/site/ai-disclosure.ts` → `AI_DISCLOSURE_CONTENT.label`, `AI_DISCLOSURE_CONTENT.sensitiveDataHint`.
- **Draft label:** "KnowMe Concierge — an AI assistant. Answers may be wrong."
- **Draft sensitive-data hint:** "Please don't share sensitive personal details in this chat."
- **Why:** EU AI Act Art. 50(1) and (5) require a disclosure that is static (not model-generated) and present at the latest at the time of the first interaction; FR-31 and FR-35 ask for this label and a sensitive-data hint. Today disclosure depends on the model choosing to say it is an AI (`uar/agents/knowme-site.json`), which is probabilistic and does not satisfy "designed and developed" ahead of time. This closes §6.4 item 7.
- **Source used:** the agent's own title, "KnowMe Concierge" (`uar/agents/knowme-site.json` → `metadata.title`), and the example wording in `.kbd-orchestrator/phases/uar-integration/plan.md` §6.3: "KnowMe Concierge, an AI assistant. Answers may be wrong."
- **Claims checked:** no product or capability claim; the copy only identifies the agent as AI and warns that answers may be wrong. No banned words (Brand Guide v1.0 §02).
- **Voice:** short, concrete, calm; no hype language; matches the existing brand voice guard in `src/test/brand-copy.test.ts`.
- **Operator approval: PENDING.** No operator has reviewed or approved this copy. It is wired into the UI as a single source (`content/site/ai-disclosure.ts`) so approval is a one-file edit, but it SHALL NOT be treated as final or shipped to an external channel until this record carries the operator's name, date and the approved file's git hash (see `openspec/changes/site-ai-disclosure-label/specs/site-ai-disclosure-label/spec.md`, "Approved copy only").
