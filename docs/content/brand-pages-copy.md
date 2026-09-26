# Brand pages copy sheet

Change: `openspec/changes/landing-and-about-brand`, task 1.2.
Files: `content/brand/taglines.ts`, `content/site/landing.ts`, `content/site/about.ts`, `content/site/not-found.ts`.

Every item below is the final text as written in the content modules. "Voice rule" cites the Brand Guide v1.0 §02 rule or the openspec `brand-pages` spec requirement the item satisfies.

**Operator approval: Travis James, 2026-09-26.** Approved all items, with one change: the Threads body no longer says "keeps the full history", because a reply interrupted mid-stream is not saved locally.

Items that need an operator decision (openspec design.md Q1):
- Landing: eyebrow, value line, nav "Open app" label, composer placeholder, composer send label, composer hint, composer "Browse threads" label, and each section's label / heading / body (3 sections).
- About: heading, explanation paragraph, the four row labels.
- 404: heading, body, CTA label.

No item below has been approved yet. Nothing in this sheet may be treated as final until the operator signs off with a name and date.

---

## Taglines (`content/brand/taglines.ts`)

| Field | Text | Voice rule |
|---|---|---|
| `APPROVED_TAGLINES[0]` | "AI that understands you." | Verbatim from Brand Guide §11, "Primary — all contexts". Used as the landing `h1` (Requirement: Approved taglines only). |
| `APPROVED_TAGLINES[1]` | "Your personal intelligence." | Verbatim from Brand Guide §11, "Product marketing". Not used on these pages; carried for future use. |
| `APPROVED_TAGLINES[2]` | "Deeply personal AI." | Verbatim from Brand Guide §11, "Hero blocks, tagline-only". Not used on these pages. |
| `APPROVED_TAGLINES[3]` | "Know yourself. Grow yourself." | Verbatim from Brand Guide §11, "Campaigns, long-form". Not used on these pages. |
| `APPROVED_TAGLINES[4]` | "Intelligence, intimate." | Verbatim from Brand Guide §11, "Premium, presentations". Not used on these pages. |

Source: `know-me/branding/knowme-brand-guide.html`, lines 1553-1557.

## Landing (`content/site/landing.ts`)

| Field | Text | Voice rule |
|---|---|---|
| `eyebrow` | "// The KnowMe agent" | Not tagline-role text (§11 applies only to the `h1` and other tagline-styled text). Names the product plainly; replaces the retired "// An OS that learns you" (banned, see spec "Retired slogans are gone"). No hype word, no exclamation. |
| `headline` | "AI that understands you." | The approved primary tagline (Brand Guide §11), also the page `<title>` and OG description in `index.html`. Satisfies "Hero headline is the primary tagline". |
| `valueLine` | "The KnowMe agent runs on the Universal Agent Runtime. Type below and start talking." | §02 "We do": specificity over generality — names the actual runtime instead of a vague claim. True to the product as it exists (this repo is a chat client for the KnowMe agent on UAR; CLAUDE.md). No invented feature or number. |
| `nav.openAppLabel` | "Open app" | Plain verb phrase, no hype. Unchanged from current copy (design.md decision 1: nav link becomes non-ember, label unchanged). |
| `composer.placeholder` | "What's on your mind?" | §02 "We do": personal, direct, short. Calm invitation to type, no feature claim. |
| `composer.sendLabel` | "Send" | Plain, matches spec scenario `getByRole("button", { name: /send\|start/i })`. |
| `composer.hint` | "↵ to send" (renders as "↵ to send") | Functional micro-copy, unchanged from current UI; carried forward at ≥12px per design.md decision 5 (frontend/design concern, not a wording change). |
| `composer.browseThreadsLabel` | "Browse threads" | Plain verb phrase, unchanged from current copy. |
| `sections[0].label` | "Threads" | Short mono kicker, one word, matches the eyebrow's restraint. |
| `sections[0].heading` | "Every conversation, kept." | §02 "We do": short sentence that lands. Concrete claim (thread history persists locally — `CharcoalDb`/PGlite, per CLAUDE.md), not a slogan. |
| `sections[0].body[0]` | "Each chat becomes a thread, saved on your device, so you can pick up right where you left off." | Describes the app's actual local-thread persistence, no invented sync or feature. §02 "specificity over generality". |
| `sections[1].label` | "Skills" | Short mono kicker. |
| `sections[1].heading` | "Skills you can attach." | Concrete, present-tense claim matching the repo's actual skill-sync behavior (CLAUDE.md "pushes built-in skills to UAR"). |
| `sections[1].body[0]` | "The KnowMe agent runs on the Universal Agent Runtime. Skills attach to it, extending what it can do." | True to the current architecture; no invented marketplace, count, or customer claim. |
| `sections[2].label` | "Everywhere" | Short mono kicker. |
| `sections[2].heading` | "In your browser, or on your desktop." | Concrete, matches the repo's actual Tauri desktop shell (CLAUDE.md "can also be wrapped as a Tauri 2 desktop app"). |
| `sections[2].body[0]` | "KnowMe runs as a web app, and the same interface runs as a desktop app built with Tauri. Either way, you're talking to the KnowMe agent on the Universal Agent Runtime." | Names the mechanism (Tauri, UAR) instead of a vague "everywhere" claim; avoids asserting cross-device thread continuity, which is not verified. |

`faq` is omitted on all three sections. No FAQ content ships in this change (proposal.md Non-goals: "writing FAQ content"; design.md decision 4).

## About (`content/site/about.ts`)

| Field | Text | Voice rule |
|---|---|---|
| `heading` | "About KnowMe" | Plain, matches design.md decision 8. |
| `explanation` | "KnowMe is the product you're using. It talks with you through the KnowMe agent, which runs on a Universal Agent Runtime instance." | D-004: names both "KnowMe agent" and "Universal Agent Runtime", states KnowMe is the product. No "Charcoal Agent" anywhere (D-004, banned word list). |
| `rows.version` | "Version" | Plain label, unchanged. |
| `rows.runtimeStatus` | "Runtime status" | Plain label, unchanged. |
| `rows.runtimeEndpoint` | "Runtime endpoint" | Plain label, unchanged. |
| `rows.agent` | "Agent" | Plain label, unchanged. |
| `agentValue` | "KnowMe on the Universal Agent Runtime" | Retained verbatim: `e2e/brand.spec.ts` asserts this exact string (proposal.md "Existing tests that must keep passing"). |
| `legalLine` | "© 2026 KnowMe AI, LLC" | Fixed legal line per operator decision Q4 (design.md "Operator decisions (2026-09-26)"). |

## Not found (`content/site/not-found.ts`)

| Field | Text | Voice rule |
|---|---|---|
| `heading` | "Page not found" | Contains "not found" (spec scenario "Unknown route"), no exclamation mark (§02 "We don't": exclamation points for energy; also proposal.md "Off-voice 404 copy"). |
| `body` | "The page you're looking for doesn't exist, or it moved." | §02 voice reference "Error message: Clear, calm, direct" (example: "Something went wrong. Let's try that again."). One calm sentence, no blame, no hype. |
| `ctaLabel` | "Back to KnowMe" | Plain verb phrase; names the destination instead of a generic "Return to Home". |

---

## Verification run for this task

```
grep -rnE '!|revolutionary|game-changing|cutting-edge|unlock|unleash|supercharge|[Cc]harcoal' content/
```
Output: (empty)

```
grep -rnE "AI that knows|OS that learns" content/
```
Output: (empty)

Both greps returned nothing, confirmed at the time this sheet was written. The copy sheet's approval line above reads `PENDING` — this task does not close item Q1. The change cannot archive until the operator replaces `PENDING` with a name and date (openspec task 1.2, spec requirement "Copy approval is recorded").
