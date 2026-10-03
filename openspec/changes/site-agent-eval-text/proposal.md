## Why

There is no golden set: §5.8 specifies 20 questions at `docs/conversation/eval/`, scored by hand until a scripted grader exists, and none of it is built. Phase 0 exit needs the text-only pass on the deployed agent (§6.4 item 16, NFR quality text): >= 18/20 on groundedness and on citation, zero fabrications on the pricing and contact items, zero executed tools on the tool-eliciting items, the `activate_skill` forced-call fixture denied, and zero links outside the allowlist. Running it before the KB chunking fix would measure the chunker, not the agent: `kb-chunking-quality` is now a configuration change (D-22, `chunk_strategy: "document"`) and must land first.

## What Changes

- A text-only golden set (§5.8) in `docs/conversation/eval/` with a scripted runner, run only after `kb-chunking-quality` lands. It includes the pricing and contact items, the tool-eliciting items and `activate_skill` fixture from `site-agent-tool-allowlist`, and link items for FR-16. Route items for FR-6 and FR-9 join in Phase 1. No surface items.
- Lands in: this repo. Owner: km-conversational-designer, km-qa-engineer.
- Depends on: `site-agent-prompt-fixes`, `kb-chunking-quality` (D-22).
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3); `docs/agent-led-site/sections/09-implementation-plan.md` (Phase 0, new changes); D-22 in `.kbd-orchestrator/phases/uar-integration/children/uar-capability-assessment/plan.md`.

## Impact

- Capability: `site-agent-eval-text`.
- Files: `docs/conversation/eval/golden-set.md` (or a machine-readable companion), a runner script under `scripts/`, recorded runs under `docs/conversation/eval/runs/`.
