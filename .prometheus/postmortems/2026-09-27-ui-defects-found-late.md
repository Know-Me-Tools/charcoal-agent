# Postmortem: visible UI defects reached the final audit (2026-09-27)

## What happened
The brand-fidelity-audit reference comparison found five major defects. All of them were in pages built earlier in the phase, and all were obvious in a screenshot:
- **D1–D3:** overlap and clipping at 320px on providers, skills and appearance.
- **D4:** skill switches with the thumb outside the track, or no thumb at all.
- **D5:** chips and panels invisible on band cards.

The pages had passed typecheck, lint, 399–411 unit tests, 300+ e2e tests, strict axe and 96 committed goldens. The goldens locked the defects in. Fixing them took an extra round the operator had to push for ("this was ridiculous").

## Root causes
1. **No one looked.** UI build briefs said "no Playwright, QA runs the gate", to save time. The engineer never saw the pages it built. The QA gate captured screenshots only as pass/fail diffs. The first human-style look was the phase-end audit.
2. **The tests checked rules, not appearance.** They covered borders, font size, document scroll and focus outlines. Nothing checked sibling overlap, clipping inside containers, whether a fill was visible against its container, or a control's rendered state.
3. **Token coverage had a gap.** In light, `--km-muted` equals `--km-band` (`#eef0f3`). In dark, `--km-surface` equals `--km-band` (`#161d29`). The token tests checked text contrast and a few named fill pairs, not fills nested inside other fills.
   - The first fix for D5 (`bg-surface`) worked only in light. The engineer caught this when it finally looked at the dark captures. The final fix is `bg-raised`, which differs from band in both themes.
4. **A real CSS bug hid in a primitive.** The `Switch` primitive used `translate-x-[calc(100%-2px)]`, which is invalid because `calc()` needs spaces around `-`. The thumb transform silently did nothing.
5. **Brand comparison and goldens were ordered wrong.** The comparison ran once, at the phase end, after the goldens were made.
6. **Process overhead.** Spec, handoffs, a QA agent, reviews and archive for small UI fixes, plus my own errors: an infrastructure rabbit hole, a bad review packet, an untracked guard file. Each cost the operator a round trip.

## What changed
- **The fix:** D1–D5 fixed, plus a mid-word break on the appearance page ("Comforta/ble") that the engineer's own look had accepted and mine caught. Verified by viewing captures at 320 and 1440 in both themes, then regenerating the goldens for the five affected routes, then one gate.
- **New project skill `visual-first-ui-delivery`**, agentskills.io format and cross-model reviewed (PASS). It requires:
  - capture at 320 and 1440 in both themes, and a look manifest with a failing check before any UI handoff
  - an AI-agent protocol for viewing images
  - appearance checks (overlap, clipping, visible fills, control state)
  - a nested-fill token test
  - brand comparison per page
  - goldens made last
  - one owner for small fixes
  - no infrastructure rabbit holes
- **Memory:** `ui-visual-verification-loop`. Every UI brief includes capture-and-look and asks for the list of images viewed.

## Still open (follow-ups)
- **Implement the skill's checks in this repo:** the look-manifest check, the appearance checks, and the nested-fill token test. The skill documents them; the repo doesn't have them yet.
- BFA-CD-06 to BFA-CD-15 (minor deviations) and the 11.35 MB bundle / mobile LCP finding.
