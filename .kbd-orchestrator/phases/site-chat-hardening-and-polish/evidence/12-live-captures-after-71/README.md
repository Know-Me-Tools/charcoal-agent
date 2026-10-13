# 12 Recheck after PR #71 (https://know-me.tools), 2026-10-13

Playwright (Python, system Chrome, headless), same method as evidence/11. Chat messages sent: 2 of 3 allowed (1440 dark, then 320 dark). Numbers: `measure-sidebar-gap-arrow.json`, `measure-tabbar-heading.json`.

Limit: the script for the first message (thread f145b8b6...) crashed after sending, before it saved its pre-reload sidebar reading. So the sidebar was first read on a fresh page load of that thread in a new browser launch (reload 0), then reloaded 3 times at each width, without an in-session reading from that exact thread. The second message (320) shows the in-session path only for the tab bar.

| # | Check | Verdict | Numbers and files |
|---|-------|---------|-------------------|
| 1 | Thread in sidebar after reload x3 at 768, 1024, 1440; title from question; opens from sidebar | PASS | Every reading (fresh load, then reload 1, 2, 3 at each of 768, 1024, 1440: 10 readings) lists "Is the Surreal Memory Server MIT licensed? 10:03 AM"; the answer is present each time. Title is derived from the question, not "New conversation". Opening it from the sidebar (from a new empty thread, at 768, 1024, 1440) returns to the original URL with the answer, `is_original: true` x3. Files `p0-reload3-768.png`, `p0-open-from-sidebar-1440.png` (also -768, -1024, reload1/2 at each width). |
| 2 | Gap between last block and composer; last paragraph hidden? | PASS | Action-row bottom to composer top: 36 px at 768, 1024, 1440; 32 px at 320 (was 226/243). Assistant box bottom to composer: 12 px (8 at 320). End spacer element is gone (null). Last answer paragraph never under the composer (`lastParaHidden` false at all 4; sources bottom 650 vs composer top 722 at 1440). No overflow (scrollW == vw). `gap-bottom-1440.png`, `gap-bottom-320.png` (+768, 1024) opened for 1440 and 320. |
| 3 | Scroll-to-bottom arrow | PASS | Empty thread: no arrow element at 320, 768, 1024, 1440 (`empty-320-dark.png`). Answered thread scrolled to bottom: arrow is `display:none`, disabled, at all 4 widths. At 1440 with an excerpt open (grows content so not at bottom): arrow is shown, 36 px wide at x=832, y=674..710, centred above the composer (top 722), 12 px clear of it (`arrow-1440-excerpt-open-bottom.png`). Source card [5] is clipped by a content cut at y~662 just above the arrow; it does not overlay text. |
| 4 | Tab bar at 320 | PASS | Idle empty: visible (top 644, h 56). Composer focused and empty: visible. Typing: hidden. Streaming: hidden in all 75 samples (`tab-320-streaming.png`). After reply finished (focus on body): visible (`tab-320-after-finish.png`). Composer focused and empty after the reply: visible; typing "x": hidden; tap away: visible. Last-time defect (hidden after reply) is fixed. |
| 5 | Empty-thread heading at 320 | PASS | Lines at 320: "AI that" / "understands you." ("you." not alone, `empty-320-dark.png`). 768/1024/1440: one line. scrollWidth equals innerWidth at 320, 768, 1024, 1440. |

## New defects or regressions

- P3: after a reload the thread opens mid-scroll, not at the bottom: the Sources list is cut at the composer and the arrow is enabled (`p0-reload3-768.png`, `p0-open-from-sidebar-1440.png`). Last time the thread opened at the bottom. May be intentional (top of answer in view); not verified.
- P3: the A2UI answer card source line now shows a file name, "surreal-memory-server-status-and-licence.d372c7887a3d.md", instead of the document title (`p0-reload3-768.png`). Earlier it showed the title.
- P3 (unchanged): first answer line "I'm an AI concierge for KnowMe AI, LLC." repeats the disclosure.
- Nothing else worse than before found.

## Not checked

- Reload while the thread is open in the same session right after sending (pre-reload reading lost to the script crash).
- 320 sidebar (drawer) listing; only 768 and wider were asked.
- Keyboard-only and screen-reader behaviour; real-device on-screen keyboard at 320.
- Light theme for this recheck (dark only).
- Images opened: p0-reload3-768, p0-open-from-sidebar-1440, gap-bottom-1440, gap-bottom-320, arrow-1440-excerpt-open-bottom, empty-320-dark, tab-320-after-finish, tab-320-streaming. Not opened: the other reload/open/gap/empty/tab images; numbers cover them.
