# Review record: ask-the-concierge strings

- **Piece:** `content/site/ask-concierge.ts` -> `ASK_CONCIERGE_CONTENT`, introduced by change `site-ask-concierge` (phase `usefulness-update`), branch `feat/site-ask-concierge`. The file carries a "DRAFT, pending operator approval" comment that points here.
- **Status:** awaiting operator approval. Approval is recorded below by the operator (name, date, git hash of the approved file); merge of the PR is read as approval, as for PRs #104, #106 and #110.

## Strings

| # | Key | String | Where it appears | Purpose |
|---|---|---|---|---|
| 1 | `headerLabel` | Ask the concierge | The site header, on every non-thread page (`src/components/site/ask-concierge-entry.tsx`, mounted in `site-header.tsx` and in the top bar on `/threads`). Visible text from 640 px; icon-only below, where it is still the control's accessible name (`aria-label`) at every width. Site build only; never on `/threads/:id`. | Names the control that starts a chat from any page. Exact wording from `docs/design/product-directory.md` section 5.6 row 1. |
| 2 | `chipLabel` | Ask | Compact prompt chip (`AskChip` with `label`), for index rows. **No page mounts a chip yet**; the directory change (`site-home-directory`) does. | The visible word on a compact chip, where the question itself is not shown. |
| 3 | `chipNameTemplate` | Ask the concierge: {prompt} | Accessible name of the compact chip. `{prompt}` is replaced by the chip's question. Not shown on screen. | Lets a screen-reader user hear the whole question; starts with the visible word "Ask" (WCAG 2.5.3). |
| 4 | `composerSubmitLabel` | Ask | The send button of the inline composer (`AskComposer`), for product pages. **No page mounts it yet**; the product-pages change does. | Text and accessible name of the send button. |

Not strings of this change: chip questions and the composer's placeholder. Each caller passes its own (written in later changes under the prompt rules, `product-directory.md` section 5.2); the components add no text of their own.

## Evidence

- Screenshots of the front page (site build) with the header entry, in `docs/content/reviews/site-ask-concierge-shots/`: `ask-entry-320-light.png`, `ask-entry-320-dark.png`, `ask-entry-1440-light.png`, `ask-entry-1440-dark.png`. Measured: the entry is 44 x 44 px at 320 (icon only) and 172 x 44 px at 1440 (icon and label); no horizontal overflow at either width.
- Unit tests: `src/hooks/use-start-chat.test.tsx`, `src/components/site/ask-chip.test.tsx`, `ask-composer.test.tsx`, `ask-concierge-entry.test.tsx`, `src/pages/landing-page.start-chat.test.tsx`.
- e2e: `e2e/ask-chip.spec.ts` (a chip press opens a thread with its prompt as the first user message; the chip sits on `e2e/harness/ask-chip.tsx` because no page mounts one yet).

## Note for the content officer

- All four strings are reused from the approved design brief (section 5.6, rows 1, 14 and the composer send word); nothing new is invented here. Please confirm that "Ask" as the composer's send word (row 4) is wanted over the landing composer's own send label.
- The header label says "concierge" while the landing hero and AI disclosure say "agent". The brief chose "concierge" for the entry; decide whether the site should use one word.
- Voice check: plain verbs, sentence case, no exclamation mark, none of "seamless", "cutting-edge", "leverage", "utilize", "synergy". No claim about any product, about privacy, or about the concierge's abilities.
- The AI disclosure is untouched: starting a chat from any entry lands on the thread page, which shows it as today.

## Operator approval

Not yet given.
- Name:
- Date:
- Approved file git hash (`git hash-object content/site/ask-concierge.ts`):
