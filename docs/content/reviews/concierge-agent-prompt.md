# Review record: concierge-agent-prompt

Phase `usefulness-update`, child `concierge-usefulness`, change C1 `concierge-agent-prompt-and-tools`. Files: `uar/agents/knowme-site.json`, `uar/agents/knowme-site-web.json`. No page copy changed. Nothing reaches visitors until the operator runs `SEED_MODE=agent`.

## What the prompt now does
Two agents, same terse prompt. Scope widened from "KnowMe only" to general technology and business questions. Eight modes: teach, ideate (one clarifying question when the task is unclear), combine products, action plan (six steps or fewer, about 250 words, ends with a next step), business or technology case, ROI (formula plus the visitor's inputs), competitor comparison, sample code. Kept: citations for claims about our products, AI disclosure, "planned" wording, no site paths, refusals for prompt injection, prompt disclosure, harm, and legal, medical or financial advice. The web agent may take competitor facts only from web results with `[W#]` markers.

## Fixed phrases the prompt makes the agent say (operator approval needed)
These are the only visitor-facing strings the prompt fixes. Everything else is free-form model text.

| Phrase | Where used |
|---|---|
| "AI concierge" (said once, briefly, at first reply) | opening, unchanged |
| "planned" (never present tense for planned or in-progress items) | status rule, unchanged |
| "(shipped)" and "(planned)" tags on each product mapping, combined flow and plan step | ideate, combine, plan |
| "Next step:" at the head of the last line of a plan | action plan, new |
| "your estimate" on any number the visitor did not give | ROI, new |
| "not published yet" for pricing | status rule, wording kept from before |
| "illustrative, not a documented API" above code that uses names not in the knowledge base | sample code, new |
| "[W1]" to "[W5]" after each web-sourced claim | web agent, unchanged |
| "there is no separate contact page and this chat is the way to ask" | contact rule, unchanged |
| "I do not know" style fallback, offering the in-chat company topic or another question | unknown rule, unchanged |

## Uncomfortable points
- Widening scope makes the agent explain general topics without a citation. A confident wrong general answer is now possible; the prompt tells it to say the answer is general and not to tie it to our products unless the knowledge base does.
- ROI and plans are the places a model is most likely to invent a number. The rule is in the prompt; only the eval (change C3) shows whether it holds.
- The default agent cannot check competitor facts, so a comparison there is our side plus criteria. Full comparison needs the web agent, which is not deployed (change C4).

## Not checked
No chat was run against either prompt. Content officer pre-review and security officer read are pending.
