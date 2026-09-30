# Reflection: complete-rebranding

Closed 2026-09-27. Implementation 13/13, per canonical `prometheus kbd status`. All changes are archived under `openspec/changes/archive/`. Operator sign-off on the golden baseline: `brand-fidelity-audit/verification.md`.

## Delta between plan and delivery

- **Visible UI defects reached the final audit.**
  - The brand reference comparison in change 13 found five major defects in pages built earlier in the phase:
    - D1–D3: 320px overlap and clipping on providers, skills and appearance
    - D4: a broken switch primitive
    - D5: chips invisible because two fill tokens were identical
  - All five passed every rule-based gate, and the first golden baseline locked them in.
  - The root cause is process, not difficulty. Build briefs told agents to skip browser runs, and no one looked at a screenshot until the audit.
  - All five are fixed, along with two defects found only by looking: the first D5 fix worked in light only, and a mid-word break on the appearance page. Postmortem: `.prometheus/postmortems/2026-09-27-ui-defects-found-late.md`.
- **The phase grew by one change and several side branches.**
  - Added:
    - `chat-persistence-durability`, split out from chat-surfaces by operator decision
    - self-hosted fonts, which fixed network-dependent page loads
    - the Node 24 pin
    - 7 project skills, 1 of them created this phase for the late-defect failure
    - two agent roles, `km-cmo` and `km-content-creator`
  - None were in the plan's change list.
- **Plan item 11's "adopt entity components where they fit" delivered none.** D-008 decided they don't fit: the package components hard-code borders, shadows, blur, sub-12px text and `outline-none`. The upstream request is drafted.
- **Scope decisions deferred work out of this phase.** The chat-led marketing site is its own phase ("restyle now, concept later"). The live UAR smoke was deferred by the operator until UAR work follows this phase.
- **The process cost was high, and the operator called it out repeatedly.**
  - Per-change spec, handoffs, QA, independent review and archive were applied even to small UI fixes.
  - Orchestrator errors cost extra rounds:
    - a test-infrastructure rabbit hole on dev-server cold starts
    - a review packet with duplicate definitions, which made a whole review round invalid
    - guard files committed without the naming-scan exclusion, twice, which turned a pushed branch red
    - two landing tasks left open in the runtime because end-task output was suppressed; found and closed at reflect time

## Goal achievement

| Goal | Status | Evidence / gap |
|---|---|---|
| KnowMe brand from `know-me-system/docs` as the single source of truth | MET | knowme-brand-identity, knowme-brand-tokens; `knowme-brand-standard` skill; brand paths corrected |
| Colour system (tokens, light and dark) | MET | `src/styles/tokens.css` with contrast tests; `--km-band`, `--km-ember-hover` added. Residual: `--km-muted` equals `--km-band` in light and `--km-surface` equals `--km-band` in dark, so nested fills must use `bg-raised` (see debt) |
| KnowMe typography | MET | Space Grotesk, Inter, Roboto and JetBrains Mono, self-hosted (`@fontsource-variable` 5.3.0) |
| Logos, icons and product naming | MET | brand marks and icons; naming guard `brand-naming.test.ts` |
| Restyle every surface | PARTIAL | every listed surface is restyled and the 5 major deviations are fixed. 8 minor deviations remain (BFA-CD-06..13) |
| Retheme primitives via tokens | PARTIAL | tokens throughout; Button, Switch, Tabs, ScrollArea and Select focus fixed. F-1..F-3 remain (avatar ring, `outline` button, input default border) |
| Visual verification at 4 widths × 2 themes; build, tests, lint, WCAG | MET | 96 committed goldens, operator signed off; strict axe 0 violations site-wide; the final gate is green. The reference comparison reviewed 320 and 1440 only |
| Modernize the stack (Tailwind 4, shadcn on Base UI, assistant-ui, entity graph) | MET | all four migrated; entity components not adopted by decision (D-008) |

Six of eight MET, two PARTIAL, none NOT MET.

## Delivered changes (13)

tailwind-v4-foundation, visual-verification-harness, entity-graph-data-layer, shadcn-base-ui-migration, assistant-ui-latest, knowme-brand-tokens, knowme-brand-identity, app-shell-flat2, chat-surfaces-flat2, chat-persistence-durability, landing-and-about-brand, app-pages-flat2-entity-views, brand-fidelity-audit.

Merged to `main` through PRs #1–#4. #5, the Karpathy logs, is open. Agent team: PR #2.

## Artifact Quality Summary

| Metric | Value |
|---|---|
| Changes with an artifact-refiner QA log | 9/13 (the last four used critic, product-owner and cross-model review instead) |
| First-pass pass rate (refiner) | 9/9 |
| Changes with independent review recorded | 13/13 (cross-model judge and/or artifact-critic) |
| Review rounds that blocked on a real CRITICAL | chat-persistence (dead-tab replay; new thread lost on replay), landing (slogan guard), app-pages (Tab-through loop exited early) |

### Recurring issues
- **Guard files tripping the repo-wide naming scan once tracked:** 3 times (brand-copy, app-pages spec, plus earlier). The remedy is structural: add new guard files to `GUARD_FILES` in the same commit.
- **Rule-based UI tests missing visual defects:** across landing, app-pages and the audit. The new `visual-first-ui-delivery` skill addresses it.
- **Flaky dev-server cold start under concurrency:** mitigated by the e2e warm-up global setup.

## Technical debt introduced or left open

1. **The `visual-first-ui-delivery` checks aren't implemented in this repo yet:** the look-manifest check, the appearance checks (overlap, clipping, visible fills, control state), and the nested-fill token test. Top priority.
2. **Bundle size:** 11.35 MB JS and about 58 s mobile LCP (Lighthouse, recorded not gated).
3. **Minor brand deviations and component borders:** BFA-CD-06..15 and F-1..F-3.
4. **Token ambiguity:** two pairs of fill tokens are equal in one theme each. Consider a token change with a recalibrated fill-separation test.
5. **Deferred and pending items:**
   - the live UAR smoke (deferred)
   - the four font pins for `versions.toml` (operator must add them; agents may not edit it)
   - `single-writer.sh` still keys the session on `$PPID` (stale locks recur; the fix is denied to agents)
6. **Durable outbox:** several Karpathy progress receipts are queued because `pk` timed out.

## Lessons captured

- **Project skills (`.agents/skills/`):**
  - pglite-browser-persistence
  - durable-browser-writes
  - browser-storage-e2e-testing
  - tailwind4-shadcn-baseui-migration
  - chat-ui-model-output-safety
  - agent-verification-hygiene
  - visual-first-ui-delivery
- **Postmortem:** `2026-09-27-ui-defects-found-late.md`.
- **Gotchas entries:** Node 26 and jsdom, Google Fonts stalls, `calc()` spacing, fill-token equality, stale locks.
- **Operator working rules** (memory):
  - batch code, then test once
  - finish rather than chase infrastructure rabbit holes
  - look at screenshots before any UI handoff

## Recommended next phase

Recommended order: the operator signalled UAR work comes next.

1. **`uar-integration`:** the deferred live UAR smoke and the runtime work the operator has planned. Start with the About endpoint truth (landing S5).
2. **`ui-quality-debt`:** implement the visual-first checks in the repo, fix BFA-CD-06..15 and F-1..F-3, and cut the bundle and mobile LCP. Small, with one owner per fix.
3. **`agent-led-marketing-site`:** the chat-led concept, with `km-cmo` and `km-content-creator` driving positioning and content under the operator approval gate. Pricing depends on skeleton features, so it waits for operator decisions.
