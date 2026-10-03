# 2. Experience concept

Owner: km-creative-director. Status: proposal, 2026-10-01, for km-product-owner, km-conversational-designer and km-chief-content-officer. All visible copy is placeholder until km-chief-content-officer approves it.

**[built]** means it exists in `src/` today. **[not built]** means it does not. Everything else is a design rule.

## 2.1 The idea in one line

The site is a short statement, a few doors and a conversation. At public launch (the end of Phase 1, when DNS cuts over), the conversation is a grounded, text-only chat beside a complete set of crawlable pages: every answer is cited and ends with a link to the page that says the same thing. The widget board, where the agent rebuilds the page as it answers, ships later as an opt-in sandbox labelled "Try the runtime". It stays opt-in until enforcement of the agent's tool and output policy is proven.

One screenshot of the public agent misbehaving would discredit UAR itself, so the default is the experience we can defend today.

## 2.2 The first 10 seconds (Phase 1 default)

A first-time visitor sees four things, in this order, all from static HTML with no network call:

1. The hero lockup and the tagline "AI that understands you." **[built]**
2. One line saying this is an AI agent running on the Universal Agent Runtime, with a link to what is stored and for how long. **[partly built: the value line exists; the disclosure line, the storage link and the privacy page do not]**
3. Four entry chips. **[not built]**
4. The composer, with the page's only ember fill on Send. **[built]**

Below the fold sit the crawlable topic sections. **[partly built: three sections exist on `/`; the product, status and privacy topics do not]** The full Phase 1 page set is in §2.5.

### Entry chips

| Chip (placeholder copy) | Answer, then link to |
|---|---|
| What is KnowMe? | Products |
| What ships today? | Status (shipped vs planned, per product) |
| I build with agents | The Boss releases on GitHub (macOS and Windows today) |
| Where does my data go? | Privacy |

IPFS Sync for Obsidian gets no chip: the corpus says not to use the pre-release on real notes.

Chip answers are cached server-side **[not built]**. If the agent is unavailable, each chip opens its static page (§2.8).

## 2.3 How a conversation works in Phase 1

A conversation produces text only: answers, cyan citation chips and next-step links. **[partly built: streaming text and `citation-block.tsx` exist; next-step links and the citation link allowlist do not]** The agent does not change the page around the thread.

What exists for A2UI today:
- `a2ui-artifact-block.tsx` **[built]** renders only UAR's older legacy artifact forms (`confirm`, `select`, `text_input`, `form`).
- A2UI v0.9.1 surfaces **[not built]**. The client drops `agui.state.patch`, its extractor matches only v0.8 keys, and the site proxy strips the fields that negotiate surfaces (§4.3).
- No tool is on the agent's allowlist. The launch run policy in `uar/agents/knowme-site.json` (CURRENT, verified locally by seeding) sets tools `selected` with no ids, skills and MCP servers `none`, and `tool_approval: deny`. UAR still offers the model `activate_skill`, and `deny` is the only lock on it (§1.4, §4.7, FR-11).

## 2.4 Try the runtime (later, opt-in) **[not built]**

The sandbox is a labelled mode the visitor opens on purpose; it never opens by itself. It adds a **board** of widgets the agent pins for this visitor: beside the thread on wide screens, a row of tabs above the composer below 1024px. The agent never sends markup. It publishes an A2UI surface naming a component from a closed catalog, and our own components render it through the §4.3 registry.

The opt-in keeps casual visitors out, not developers, who are the people most likely to open it. A misbehaving sandbox widget is a brand incident like any other (kill criterion 2, §9).

This mode needs four things that do not exist:
- the §4.3 registry;
- a UAR catalog change for links, citations and images;
- a pin store;
- `presentation_render` on the agent's tool allowlist with a km-security-officer review entry, presentations `selected` with named template ids, and approval moved off `deny` only once `activate_skill` is dropped or proven rejected under `auto` (§1.4, FR-11).

| Widget | Trigger example | Content source | Surface |
|---|---|---|---|
| `product-summary-card` | "What is The Boss?" | One corpus file: name, one line, status, link | `bg-surface`, ember link |
| `status-list` | "What ships today?" | Status sections of each product file | `bg-surface`; icon plus text label, never colour alone |
| `download-link-card` | "Can I try it?" | The Boss releases link and platform list | `bg-surface`, one ember action |

Every widget cites its source with a cyan chip; ember stays for the visitor's action.

**Motion.** A pinned widget enters with 180ms opacity and an 8px translate, ease-out; the thread shows a "Pinned" notice naming the widget, with Undo. Under reduced motion it appears without movement. Full specs go in DESIGN.md. A scripted demo plugin needs its own proposal.

## 2.5 The fixed frame

The agent never changes the frame, in either mode.

| Fixed | Agent may change | Visitor controls |
|---|---|---|
| Header, lockup, theme toggle, footer, legal line | Its reply and the next-step links after it | Whether to chat at all |
| Navigation: Home, Products, Status, Privacy, Company | In the sandbox only: which widgets are pinned, and their order | In the sandbox: unpin, reorder, clear |
| AI disclosure and storage link | Which page a reply links to | Theme, text size, reduced motion |
| Crawlable pages and their content | Nothing on those pages | Reading them without the agent |
| Brand tokens, type, Flat 2.0 surface ladder | | |

Every page in the navigation is **[not built]**. The site build exposes `/`, `/threads` and `/threads/:id` today.
- **Company.** Phase 1 publishes `/about`. No route exists today: the app's About page is `/settings/about`, which the site build excludes. Until `/about` ships, nothing sends visitors there. The agent's fallback is its in-chat company topic.
- **Contact.** Contact stays out of the navigation until the operator approves a contact method (D-8). The privacy notice still needs a data-request contact by Phase 0 exit.
- **Pricing.** Pricing appears on Products as "not published yet" until the operator decides.

## 2.6 What persists, and for whom

| Item | Scope | Where | Status |
|---|---|---|---|
| Threads | Per visitor, this browser | Local database (PGlite) | **[built]** |
| Sandbox board | Per visitor, this browser | Local storage beside the threads | **[not built]** |
| Conversation state on the server | Per session | UAR, keyed on the session ID | **[built in UAR]**; UAR has no session delete or TTL, and visitor text also lands in checkpoint, cost and tool-admission records; Phase 0 relies on an operator-scheduled purge of every store and a request-based erasure process (§4.5, §6.3) |
| Long-term memory of a visitor | None by default | Not used for anonymous visitors | Decision; UAR memory is not enabled (default false, unset in config), and the §4.5 capture fix applies if it is ever enabled |
| Corpus, topic pages, chip answers | Shared | Repo and UAR knowledge base | Corpus **[built]**; rest **[not built]** |

"Start fresh" clears the thread and any board. No accounts; nothing one visitor says changes what another sees.

## 2.7 Three paths (Phase 1)

**A developer evaluating The Boss.** Taps "I build with agents" and gets three cited sentences: what The Boss is, macOS and Windows with UAR as a sidecar, no Linux. Asks about local models, gets a cited answer, leaves through the releases link. Opening "Try the runtime" is their choice.

**A privacy-conscious professional.** Taps "Where does my data go?". The answer separates what works today (on-device inference in the desktop app) from design intent (sync and Hands are early) and links Privacy. "Is there a phone app?" gets "planned, no published date". No sales push.

**Someone who does not want to chat.** Scrolls the topic sections or uses the navigation. Every fact the agent can state is on one of those pages. No pop-up, no nudge.

## 2.8 Failure and fallback

| Condition | What the visitor sees |
|---|---|
| Agent down or budget kill switch on | "The agent is offline. The pages below have the same answers." Chips open their static pages. |
| Rate limited (429) | "You've sent a lot of messages. Try again in a minute." Shows the wait time when the proxy provides one. |
| Stream fails mid-answer | The partial answer stays, marked incomplete, with Retry. Raw runtime errors never appear as assistant text. |
| No JavaScript | The prerendered page: tagline, disclosure, chips as links, FAQ, navigation. **[not built: no prerender yet]** |
| Sandbox unavailable | The entry is hidden, and the Phase 1 experience is unchanged. |

The offline and 429 states belong in Phase 0 alongside the proxy (`site-chat-proxy`).

## 2.9 What we must not do

- Force chat. No modal, no focus stealing, no page gated behind a conversation.
- Make the sandbox the default, or open it on the visitor's behalf.
- Link a route that does not exist, including `/about` before it is published and any contact page.
- Claim a planned feature as present, or call a tool reviewed before its km-security-officer review entry exists.
- Fake urgency, scarcity or a typing delay; let the agent pose as a person or drop the disclosure.
- Collect an email inside the chat, or pin a widget the visitor did not ask for.
- Break Flat 2.0. No borders, shadows, gradients or blur. Ember is for action, cyan for AI.

## 2.10 The uncomfortable part

The concept's pull is the board, and we are not shipping it at launch. Phase 1 is a good chat beside good static pages, close to what a careful competitor would build. The sandbox ships only when tool-policy enforcement is proven and the §4.3 registry works, and even then the developers who open it can screenshot it. If that slips, it does not ship, and we do not fake the morph with canned animation.
