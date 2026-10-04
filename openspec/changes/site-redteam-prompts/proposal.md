## Why

No red-team evidence exists for the public agent. §6.4 item 6 requires a red-team prompt set run against the deployed controls with results filed in `docs/security/`. UAR's input guardrail matches a fixed substring list (`INJECTION_PHRASES`, UAR `src/uar/guardrails.rs:41-57`, including "you are now" and "act as if") and runs detect-only in Phase 0 (plan N10). Benign visitor phrasings hit that list ("If you are now able to…", "act as if I'm new to Obsidian"), so turning on blocking without a measured false-positive rate could refuse ordinary questions.

## What Changes

- A red-team prompt set covering injection, persona override, prompt extraction, tool elicitation, cross-visitor probes and link smuggling, run against the deployed controls, with results in `docs/security/`.
- **Amendment (plan A2, N24):** include benign visitor phrasings that hit the guardrail substring list, to measure the false-positive rate that decides whether injection blocking can be turned on.
- Lands in: this repo. Owner: km-security-officer; km-qa-engineer runs.
- Depends on: `site-agent-tool-allowlist`, `site-session-binding`, `site-citation-link-allowlist`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3); `docs/agent-led-site/sections/09-implementation-plan.md` (Phase 0, new changes); amendment N24 in `.kbd-orchestrator/phases/uar-integration/children/uar-capability-assessment/plan.md` table A2.

## Impact

- Capability: `site-redteam-prompts`.
- Files: `docs/security/redteam/prompt-set.md`, a runner script under `scripts/`, `docs/security/redteam/runs/`, a guardrail false-positive report.
