# 11 Live captures after PR #70 (https://know-me.tools)

Captured 2026-10-13 with Playwright (Python, system Chrome, headless). Widths 320x700, 768x900, 1024x800, 1440x900; dark (site default) and light (theme toggle clicked). Read-only browsing of the public site. No cluster or kill-switch contact.

Before-captures: `evidence/09-live-captures/` (README there lists the original defects). Critique: `evidence/10-design-critique.md`.

## Method and limits

- Chat messages sent: 3 of 3, all "Is the Surreal Memory Server MIT licensed?".
  1. 1440 dark, persistent profile A (thread `c150ef39-...`). Used for every answered-thread image at all widths and both themes (the same thread is reopened by URL per width/theme).
  2. 320 dark, profile B (thread `60f06cdf-...`). Files named `chat-320light-*` are DARK (the tag is a typo of mine; the first run used the default dark theme).
  3. 320 light, profile B (new thread). Files `chat-320-light-*`.
- Landing (`a-`) and empty thread (`b-`): one fresh browser context per width and theme.
- Machine-readable numbers: `measure-landing-empty.json`, `measure-answered-about.json`, `measure-320-typing-streaming.json`.
- `-tall` images use a 2000 px high viewport so the whole thread shows at once. `-bottom` is the thread scrolled to the very bottom. `-top` is scrolled to the top.
- Not a site defect: in light images the theme button shows a hover tile because I clicked it.
- Opened and looked at: all 4 landing `full` images I list under check 6 (320 dark, 768 light, 1024 light, 1440 dark) plus landing 320 light viewport; empty thread 320 dark and 1440 light; chat 1440 dark streaming-reading and done; chat 320 dark streaming-reading; chat 320 light streaming and after; 1440 dark tall, excerpt-open, steps-open, 1440 light bottom; 320 dark tall, 320 light bottom; 768 dark tall; 1024 light bottom; after-reload 1440 dark and 768 light; About at 320 dark, 320 light, 768 light, 1440 dark, 1440 light. NOT opened one by one: the remaining roughly 55 files (other width/theme combinations of the same states, `-top`, other `-viewport`, `-typing`, `chat-*-streaming-stop`). Numeric measurements cover those combinations (no overflow, order, gaps, targets) but I did not look at them.

## Verdicts

| # | Claim | Verdict | Evidence |
|---|-------|---------|----------|
| 1 | Answer before Sources; one "Reading N sources" line while streaming; cards = title + [n], excerpt behind "Show excerpt" | PASS | `chat-1440dark-streaming-reading.png` ("Reading 5 sources", no cards, caught at 1.8 s; cards appear at 12.7 s), `chat-320light-streaming-reading.png` (same at 320), `c-answered-thread-1440-dark-tall.png`, `...-excerpt-open.png`. DOM: answer text top is above `citation-sources` top in all 8 width/theme runs; 5 cards, 5 "Show excerpt" buttons each. |
| 2 | About/Sources numbering equals the answer's [n]; 320 sheet opens at the top | PASS | `d-about-sources-{w}-{theme}-viewport.png`. Panel lists [1], [2] [3] (merged), [4], [5]; the chat cards are [1]..[5], so numbers match. 320: dialog scrollTop 0, "About and sources" heading at y=12, "Sources" at y=56, item [1] at y=88. Panel/dialog shows no page overflow. |
| 3 | Finished steps not heavy boxes; 2+ steps fold to "N steps" | PASS | `c-answered-thread-1440-dark-tall.png`: a single "check 2 steps v" line, trigger background rgba(0,0,0,0), 28 px high. Expanded (`...-steps-open.png`) shows "Thinking" and "Preparing an answer card" as plain check rows. Minor: row spacing uneven (34 px vs 28 px, see defects). |
| 4 | 1440: last paragraph not under composer, and no large blank gap after last message | PARTIAL | Not hidden: PASS. At bottom the answer paragraph ends at y=184 and the last block (Sources cards, action row) ends at y=496, composer top y=722; nothing overlaps (`c-answered-thread-1440-dark-bottom.png`, `...-light-bottom.png`, `lastAnswerPara.hiddenUnderComposer=false`). Gap: FAIL. Between the action row (bottom 496) and composer top (722) there is a 226 px empty band at 1440 (also 226 at 768 and 1024, 243 at 320). The end spacer element is 190 px (211 px at 320) and cannot be scrolled past, so the gap is permanent. |
| 5 | 320 chrome much smaller than 278 of 700; tab bar hides while typing and streaming; 44 px targets | PARTIAL | Tab bar hides while typing and while streaming: PASS (tabbar absent in `chat-320light-typing/streaming` measurements). Targets: PASS, Open threads, About and sources, theme toggle, Send and Stop are all 44x44. Chrome height: idle 259 px (form top y=441 to bottom of 700; composer 121 + disclosure 32 + tab bar 56 + gaps), typing/streaming 203 px. Measured the same way the before number is not known, but idle is only about 19 px under 278 (7 percent), not "much less". Only the 203 px state (27 percent less) is a real saving. |
| 6 | Landing: AI disclosure under composer; one logo; no band labels; composer full width at 768; domain link unbroken; heading no overflow and "you." not alone | PASS | `a-landing-*-full.png`. Disclosure two lines under the composer at every width. Logos: top bar and footer only (hero logo gone). No mono band eyebrows (only the hero's "// KNOWME AI, LLC" remains). Composer at 768: x=32 width=704 of a 704 content width. Link `white-space: nowrap`, one client rect at 320, 768, 1440; never breaks at the hyphen. `scrollWidth == innerWidth` at 320, 768, 1024, 1440 in both themes on landing, empty thread, answered thread and About open (32+ readings). Landing heading lines at every width: "AI that" / "understands you." so "you." is not alone. |
| 7 | After the reply finishes and a reload, is the thread in the sidebar (768+)? | FAIL (P0-3 still open) | Before reload the sidebar shows "New conversation 8:59 AM" (`chat-1440dark-done.png`). After reload at 768, 1024, 1440 the list is empty (`c-after-reload-1440-dark.png`, `c-after-reload-768-light.png`); still empty after waiting 2, 6 and 12 s; visiting `/threads` makes a new empty thread and the list is still empty (`c-threads-index-1024-after-reload.png`). The conversation itself reloads from its URL (answer and sources present), so the thread is stored but not listed. Also the in-session title is "New conversation", not the question text. |

## New defects, ranked

1. P0 (open since before): thread not listed in the sidebar after reload (check 7). A visitor cannot find their previous conversation except by URL.
2. P1: permanent 190 to 243 px blank band between the last message and the composer (check 4). Looks like the page ends early; on 320 it is 243 of 596 px of scroller.
3. P2: "Scroll to bottom" arrow shows in the empty thread at 320 (`b-empty-thread-320-dark-viewport.png`) and floats over content at 1440 when excerpt/steps are open; in the empty thread there is nothing to scroll.
4. P2: empty-thread heading at 320 breaks "AI that understands / you." leaving "you." alone on line two (`b-empty-thread-320-*.png`; the landing heading is fine).
5. P2: at 320 the tab bar stays hidden after a reply finishes until the user taps outside the composer (`measure-320-typing-streaming.json` "after": tabbar null; `chat-320-light-after.png`). Programmatic blur did not bring it back; tapping on the thread did (`probe` result: fresh load visible, composer focus hides it, tap on thread shows it). Tab-key moving focus to "Add Attachment" inside the composer keeps it hidden.
6. P3: first line of every answer repeats the disclosure ("I'm an AI concierge for KnowMe AI, LLC - happy to help.") right under the AI-GENERATED bar and the caption "KnowMe Concierge - an AI assistant" above it (`c-answered-thread-1440-dark-tall.png`).
7. P3: landing copy repeats itself: the band "Your conversations are stored in this browser." has the same sentence as its body (`a-landing-1440-dark-full.png`).
8. P3: landing hero disclosure at 1440 and 1024 wraps leaving "chat." / "this chat." alone on a line.
9. P3: steps-open rows have uneven vertical rhythm ("Thinking" 28 px, "Preparing an answer card" 34 px apart).
10. P3: 768/1024 landing bands: the body copy is left-aligned in a narrower column, leaving the right quarter empty (same as before, not worse).

Nothing looked worse than the before captures. No horizontal overflow anywhere.

## What I could not check

- Whether "278" in the claim used the same measuring rule as mine (I measured from the composer form top to the viewport bottom, incl. tab bar). The before images exist but I did not re-measure them.
- Touch-target sizes at 768 and wider are 32 px (not required, reported only).
- Real-device keyboard behaviour (on-screen keyboard resize) at 320: headless Chrome has none. The tab-bar hide was tested by desktop focus only.
- Screen-reader behaviour of "Reading N sources" (live region or not) and of the About dialog focus return.
- Dark-theme streaming frame at 768 and 1024; the streaming line was caught only at 1440 dark, 320 dark and (stop button only) 320 light.
- The ~55 unopened images noted above.
