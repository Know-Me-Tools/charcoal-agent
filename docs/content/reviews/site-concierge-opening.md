# Review record: portfolio-wide concierge opening

- **Piece:** `content/site/empty-state.ts` -> `EMPTY_STATE_CONTENT` (description, composer placeholder, six starter prompts), change `site-concierge-opening` (phase `usefulness-update`), branch `feat/site-concierge-opening`. The heading is unchanged (approved tagline, `site-empty-state.md`). The AI disclosure is untouched. The agent prompt (`uar/agents/knowme-site.json`) is not changed.
- **Status:** awaiting operator approval; the file header says DRAFT and points here. Merge of the PR is read as approval, as for earlier copy PRs.
- **Where it appears:** the empty conversation of the site build, `/threads/:id` with no messages (reached by the header "Ask the concierge" entry with no prompt, or "New thread"). The composer placeholder shows in the same composer. Not on the landing page (it has its own copy). Site build only; the app build is unchanged.

## Strings

| # | Key | String | Chars | Answered by (`content/knowledge/`) |
|---|---|---|---|---|
| 1 | `description` | Ask about the KnowMe and Prometheus portfolio: apps, agents and memory, platform, developer tools, integrations, services and research. Answers come from the site's knowledge base; proposed products are called proposed. | n/a | Says what it can talk about (the six families) and what it cannot claim. |
| 2 | `composerPlaceholder` | Ask about any KnowMe or Prometheus product | n/a | n/a |
| 3 | `starterPrompts[0]` | What products does KnowMe AI make? | 34 | `portfolio-overview.md` (same question as its heading and an eval question) |
| 4 | `starterPrompts[1]` | What can I use today? | 21 | `portfolio-available-today.md` (same as its heading and an eval question) |
| 5 | `starterPrompts[2]` | How do your products relate to each other? | 42 | `portfolio-stated-relationships.md` (eval question) |
| 6 | `starterPrompts[3]` | Which apps and agents exist, and how far along are they? | 56 | `portfolio-overview.md`: the four Applications and four Agents and memory sections, each with its status |
| 7 | `starterPrompts[4]` | What platform and developer tools are there? | 44 | `portfolio-overview.md`: Platform and infrastructure (two sections) and Developer tools and skills (two sections) |
| 8 | `starterPrompts[5]` | What integrations, services and research are there? | 51 | `portfolio-overview.md`: Integrations and Services and research sections |

Coverage: chips 6 to 8 take two families each (Applications and Agents and memory; Platform and Developer tools; Integrations and Services and research); chips 3 to 5 cover the whole portfolio. Every chip is a question, under 70 characters, makes no claim, and carries no price, date, compliance or superlative (`docs/design/product-directory.md` section 5.2). Pressing a chip sends its text as the first user message of the open thread (`src/components/assistant-ui/starter-prompt-chip.tsx`), so the visitor sees what is sent.

## Evidence

- Screenshots in `docs/content/reviews/site-concierge-opening-shots/`: `empty-state-{320,1440}-{light,dark}.png`. No horizontal overflow at either width. Chips are 44 px tall at 1440; at 320 they are 44 to 54 px (long questions wrap, they do not truncate). At 320 by 900 the last chip or two sit under the sticky composer and are reached by scrolling the thread (the thread scrolls 900 of 796 px); on shorter phones more will.
- Unit: `src/components/assistant-ui/enhanced-thread.site.test.tsx`. e2e: `e2e/concierge-opening.spec.ts` (site flags).
- Eval: four questions appended to `docs/knowledge-source/eval/questions.json` (Locus, Numen, Synaxis, Know Decision), none critical. Not run live: needs a seeded knowledge base.

## Notes for the content officer

- "Proposed products are called proposed" is the line that states the limit. Alternative: "Anything still a design is described as a design." Decide the wording.
- The description is two sentences, one longer than the brief's "one short line". The second half is the limit statement and I judged it worth the length; remove it if the content officer wants one line.
- Chip 3 says "your products", matching the eval question and the landing's "we" voice; the description says "the KnowMe and Prometheus portfolio". Confirm one way of naming the portfolio.
- "Prometheus" is not defined on this screen; the portfolio overview defines it when asked.
- Voice check: no "seamless", "cutting-edge", "leverage", "utilize", "synergy", no exclamation mark, no prices, no compliance claim, no product promised.
- The old product list (The Boss, UAR, BossFang and others) is gone from the opening; those products are reached through chips 4 and 6.

## Operator approval

Not yet given.
- Name:
- Date:
- Approved file git hash (`git hash-object content/site/empty-state.ts`):
