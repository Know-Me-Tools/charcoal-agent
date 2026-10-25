# Review record: concierge-agent-prompt

Phase `usefulness-update`, child `concierge-usefulness`, change C1 `concierge-agent-prompt-and-tools`. Files: `uar/agents/knowme-site.json`, `uar/agents/knowme-site-web.json`. No page copy changed.

## Correction of the first record
The first version said nothing reaches visitors until the operator runs `SEED_MODE=agent`. That was wrong. `.github/workflows/site.yml` (the "Seed the site agent" step) runs `scripts/seed-site-agent.sh` on every push to `main` with `SEED_MODE=all` and `SEED_WEB_AGENT=1`, so **both prompts go live on merge**. The web route is already live: `VITE_SITE_WEB_SEARCH=1` shows the toggle, and `SITE_WEB_AGENT_ID`, when unset, defaults to `knowme-site-web`. Rollback: revert on `main`, or re-seed with `SEED_MODE=agent`. `SITE_WEB_AGENT_ID=""` only disables the web route. The kill switch stops all chat and is not part of this change.

## What the prompt does
Two agents, one body; the web prompt is the default plus a short web paragraph and its own comparison mode. Scope: technology, business use of AI, KnowMe and Prometheus. Eight modes: teach, ideate (ONE clarifying question when unclear; "none of our products fits" is a valid answer), combine, action plan, case, ROI, comparison, sample code.
- Facts about KnowMe and Prometheus products come only from the knowledge base; plans, formulas and general explanation are general and said so. A web claim always carries its `[W#]` marker; "general" never excuses a missing one.
- Out of scope is refused: homework, essays, role-play, personal advice, anything unrelated to technology, business use of AI, or KnowMe/Prometheus. Also kept: injection, prompt disclosure, harm, legal/medical/financial advice.
- ROI asks for hours, rate, tool cost and headcount first and never guesses; payback is one-off cost divided by monthly net value.
- Sample code uses only KB-documented names; with none, a generic HTTP or streaming skeleton with placeholders and a statement that the real API is not documented. It refuses code that harvests credentials, evades access controls or rate limits, scrapes personal data, sends bulk messages, phishes, exploits a vulnerability, or is malware.
- Output limits stated in the prompt for every mode: 250 words, 40 lines of prose, 60 lines of code, then "ask for the next part". These are instructions to the model, not an enforced provider cap.
- Toolsets unchanged from main. The web agent's `max_tool_calls_per_turn` stays 2 (search plus card); KB retrieval is `memory.kb`, not a tool.

## Fixed phrases (operator approval needed)
| Phrase | Note |
|---|---|
| "AI concierge", said briefly in the first reply of every conversation, and again when the visitor asks whether they are talking to a person | the old fixed disclosure phrase, unchanged; "concierge" appears nowhere else in the prompts |
| "planned" | unchanged |
| "(shipped)" / "(planned)" on mappings, flows and plan steps | new |
| "Next step:" | new |
| "your estimate" on figures the visitor gave | new |
| "not published yet" (pricing) | unchanged |
| "ask for the next part" | new |
| "[W1]" to "[W5]" | unchanged |
| contact rule and the "I do not know" fallback (in-scope questions only) | unchanged |

The visitor-facing name is "KnowMe agent", as the brand standard requires; "AI" is stated in the disclosure.

## Uncomfortable points
- General answers carry no citation, so a confident wrong general answer is possible.
- ROI and plans are where a model most readily invents a number; only the C3 eval shows whether the rules hold.
- The word and line limits are a prompt instruction, not a guarantee. The spend controls are the per-IP limits, the meter and the kill switch. A per-IP or per-session daily quota and a cost alert are the missing control: follow-up for the operator and km-rust-engineer, before any ceiling change.

## Not checked
No chat was run. Content officer and security officer re-reads are pending.
