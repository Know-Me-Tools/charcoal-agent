---
name: visual-first-ui-delivery
description: A working method for building, fixing and reviewing web UI (with AI agents or a human team) so visible defects are caught while the page is being built, not at a final audit. The core rule is to look at real screenshots of every touched route, at small and large widths in light and dark themes, before any handoff. Covers the build-look-fix loop, briefing UI agents so they must view captures, tests that check appearance rather than just rules (overlap, clipping, invisible fills, broken controls), a token check that nested fills differ from their container, comparing against the brand when each page is built, when golden snapshots are safe to create, and keeping small UI fixes with one owner. Use this skill whenever anyone builds, restyles, reviews or verifies UI, or writes a brief or task for UI work, or plans a design-system or rebrand change, or creates visual baselines, even if the request says only "restyle", "fix the layout" or "make it match the brand".
license: MIT
compatibility: "Any web UI stack. Examples use Playwright and vitest; adapt the commands to your tools."
metadata:
  origin: "KnowMe AI web client, complete-rebranding phase, 2026-09"
  evidence: "every rule records the failure that produced it"
---

# Visual-first UI delivery

Code can pass typecheck, lint, unit tests, and a few hundred end-to-end checks while a badge sits on top of a label, a button is clipped at 320px, a switch's thumb floats outside its track, and chips vanish in light mode. Rule-based tests measure what you thought to measure. Only looking finds what you didn't.

**Evidence tags:**
- `[verified]`: the failure happened in the origin project, and the rule would have caught it.
- `[practice]`: a working convention.

## Before you start

- **Brand references:** find the brand guide, templates and token source. With none, compare against the product's own design tokens and the most recently approved screens, and say so in the manifest.
- **Reviewer:** a design owner reviews captures against the references. Without one, the person who asked for the change does, and the reviewer is named in the manifest.
- **Tooling:** the recipes use Playwright. With another stack, keep the same checks (capture, overlap, clipping, visible fills, control state) and adapt the code.
- **Goldens:** §6 applies only if the project keeps visual baselines.

## 1. Nobody hands off UI they haven't looked at `[verified]`

**Origin:** a whole phase of app pages was built by an agent told to skip browser runs. They passed every gate. The final brand audit then found five major defects, and each was obvious in the first screenshot.

The rule for everyone who changes UI:
1. Make the change.
2. Capture every touched route at **320 and 1440**, in **light and dark**. Add 768 when the layout switches there.
3. **Open each image and look at it.** Check for overlap, clipping, anything cut off at the right edge, fills that vanish into their container, controls in the wrong state, text under 12px, and anything off-brand.
4. Fix what you see and capture again. Repeat until every image is clean.
5. Write the **look manifest**, `docs/qa/look/<change>.md`: one line per image, giving its path, route, width, theme and what you saw. `references/look-manifest.md` has the template and a check that fails when a touched route is missing, or when a line has no observation. Run that check before any handoff or commit. "Looks fine" without a manifest doesn't count.

Build the capture step into the tooling so it costs one command. See `references/capture-loop.md`.

**AI agents:** "looking" means loading each image file into a vision-capable step and writing one observation per image. An agent that can't view images must stop and hand the captures to a person or a vision-capable reviewer. It never claims the UI looks right.

## 2. Briefs for UI work require the look `[verified]`

**Origin:** "no Playwright, QA runs the gate" was meant to save time. It removed the only step that would have caught the defects.

- A UI brief always includes the capture-and-look step and asks for the list of images viewed.
- Save time by batching instead: all code changes, then one capture pass, then one gate. Don't save it by skipping the look.
- Speed rules such as "don't re-run the suite after every edit" apply to test gates, never to looking at the UI you just changed.

## 3. Tests must check appearance, not only rules `[verified]`

**Origin:** the checks confirmed there were no borders, no shadows, nothing under 12px, no sideways scroll, and a visible focus ring. All passed while elements overlapped and were clipped inside containers that don't scroll.

Add checks for what users actually see (recipes in `references/appearance-checks.md`):
- **Overlap:** sibling boxes in a row don't intersect.
- **Clipping:** each element's `scrollWidth` is within its `clientWidth`, and no text is cut at the right edge. Checking only the document isn't enough.
- **Visible fills:** a chip, badge or code fill differs from its container's fill in both themes.
- **Control state:** a switch's thumb sits inside its track, in both states and both themes.

## 4. Token tests cover nested fills `[verified]`

**Origin:** chips used a "muted" fill on cards that used a "band" fill. In light theme both were `#eef0f3`, so every chip disappeared. The token tests checked text contrast and a few named pairs, not this one.

For every fill that can sit inside another, such as chip on card or panel on band, assert a minimum visible step in both themes. A lightness step (ΔL*) of at least 1.8 is a reasonable floor. Generate the pairs from real usage (grep the class combinations) rather than listing a few by hand.

## 5. Brand comparison happens when each page is built `[verified]`

**Origin:** the comparison against the brand references ran once, at the end of the phase. By then fixing a defect meant regenerating snapshots, and the fixes went over the change's budget.

- The design owner reviews each page's captures against the brand references in the same change that builds it.
- The final audit then confirms. It shouldn't be finding things for the first time.

## 6. Golden snapshots come last `[verified]`

**Origin:** 96 goldens were committed, and then the comparison showed they had locked in five defects.

- Create or regenerate goldens only after the brand comparison for those routes passes and the images have been looked at.
- Pin the clock, mask dynamic regions, wait for async renders (charts, diagrams, fonts), and require a second run without `--update-snapshots` to pass.
- Record every regeneration with a reason. Regenerating to make a failure go away is not a fix.

## 7. Small UI fixes have one owner `[practice]`

A chain of spec, build agent, QA agent, review and gate is right for a feature. For "this row wraps badly at 320", it turns a ten-minute fix into hours. For small fixes, one owner does the build, the capture-and-look loop and the local checks, and hands over a clean result.

## 8. Test infrastructure is not the product `[verified]`

**Origin:** hours went into chasing dev-server cold-start timeouts in the middle of a change, and the operator had to stop it.

- Give a flaky test one reproduction and one cheap check to tell the app from the environment.
- If it's the environment, log it and continue: warm the server, pin the fonts, record the flake.
- Ask before starting any longer investigation.

## Checklist before any UI handoff

- [ ] Every touched route captured at 320 and 1440, light and dark, and the images opened.
- [ ] No overlap, no clipping, fills visible, controls correct, nothing under 12px.
- [ ] Brand comparison done for these routes.
- [ ] The appearance checks and the token checks pass.
- [ ] The look manifest exists, covers every touched route, width and theme, and passes its check.
- [ ] Goldens regenerated, if at all, only after all of the above, with the reason recorded.
