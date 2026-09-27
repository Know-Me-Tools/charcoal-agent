# KnowMe site agent team (`knowme-site`)

Twelve roles that design, build, market and maintain the KnowMe AI, LLC website, and market the KnowMe product line (flagship: `know-me-system`). The source of truth is `team-request.json`; the native agent files in each harness directory are generated from it by the `agent-team-creator` skill. Edit the manifest, re-export, and review before replacing any installed file.

## Roles and owned paths

Ownership is a working agreement: a role edits only its own paths and asks the owner for anything else. Reviewers read everything.

| Role | Does | Owns | Depends on |
|---|---|---|---|
| `km-product-owner` | Roadmap, acceptance criteria, routing, decisions, measurement plan | `openspec/changes/**`, `docs/product/**` | — |
| `km-creative-director` | Creative concept for the chat-led site, design system, tokens, motion, campaign and OG visuals | `docs/design/**`, `src/styles/**`, `src/components/brand/**`, `src/index.css`, `scripts/brand/**`, `marketing/assets/**`, `public/og/**` | product owner |
| `km-conversational-designer` | Concierge agent persona, opener, chips, flows, guardrails, AI disclosure | `src/features/concierge/**`, `src/lib/skills/**`, `docs/conversation/**`, `prompts/**` | creative director, content officer |
| `km-frontend-engineer` | React 19/Vite/shadcn/assistant-ui build, prerendering, tests | app code under `src/` (pages, shell, chat, hooks, stores, db, types), `index.html`, `vite.config.ts`, `package.json` | creative director, conversational designer |
| `km-cmo` | Chief marketing officer for the KnowMe product line: positioning, claims register, go-to-market, launches, campaigns, marketing metrics | `marketing/strategy/**`, `marketing/launches/**`, `marketing/campaigns/**`, `.agents/product-marketing.md` | product owner |
| `km-marketing-officer` | Site growth: SEO, AI engine optimization, structured data, crawler policy, site launch checklists, instrumenting the CMO's metrics | `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`, `src/seo/**`, `docs/marketing/**` | product owner, content officer, CMO |
| `km-content-creator` | Articles, social, email, video and podcast scripts, launch announcements, release notes, all to CMO briefs | `marketing/content/**` | CMO, content officer |
| `km-chief-content-officer` | Voice, messaging and language, editorial pre-review, site copy, content model and AI-assisted CMS | `content/**`, `docs/content/**`, `docs/cms/**` | product owner, CMO |
| `km-rust-engineer` | Axum backend, Tauri shell, entity-graph layer (`@prometheus-ags/prometheus-entity-management` 4.x) | `backend/**`, `src-tauri/**`, `src/lib/entity-graph/**` | product owner |
| `km-qa-engineer` | E2E, visual, accessibility (WCAG 2.2 AA) and Core Web Vitals gates | `e2e/**`, `src/test/**`, `playwright.config.ts`, `vitest.config.ts`, `docs/qa/**` | frontend, rust |
| `km-security-officer` | Threat models, CSP/headers, AI abuse controls, privacy, AI disclosure | `docs/security/**`, `docs/legal/**`, `SECURITY.md` | frontend, rust, conversational |
| `km-devops-engineer` | CI/CD, Docker/nginx, deploys, Tauri release signing, monitoring | `Dockerfile`, `docker-compose.yaml`, `nginx.conf`, `.github/**`, `scripts/deploy/**`, `.env.example` | rust |

### Marketing and content flow

1. **Product truth:** the product repo's README, implementation roadmap and `versions.toml`, or an operator decision in the decision log.
2. **CMO brief:** `km-cmo` writes it, drawing only on verified claims in `marketing/strategy/claims-register.md`.
3. **Creator draft:** `km-content-creator` writes it, with claim sources. The CMO checks it fits the brief.
4. **Editorial pre-review:** `km-chief-content-officer` reviews the draft, an AI pre-review, and writes the record to `docs/content/reviews/`.
5. **Operator approval:** the human gate. It's recorded with name, date and git hash.
6. **Publishing:** the operator alone publishes anything off the site. Site-bound pieces become one OpenSpec change per launch or campaign, opened by the product owner.

Prices, tiers and roadmap claims are decided by the operator only.

Unowned shared files (`AGENTS.md`, `CLAUDE.md`, `.agents/skills/**`) change only with the product owner's agreement.

## Skills

Each role's `skills` list is in `team-request.json`. Skills live in `.agents/skills/` (read by Codex, OpenCode, Kimi, Zed and MiniMax) and are symlinked into `.claude/skills/` for Claude Code. `.agents/skills/VENDORED.md` records the source repo, commit and licence of each third-party skill. Two were written for this project:

- `knowme-brand-standard`: Flat 2.0, tokens, type, marks, naming and voice.
- `agent-led-marketing-site`: the chat-first marketing pattern (prerendered crawlable layer, concierge, AI disclosure, accessibility, cost/abuse limits, measurement).

Six more capture what this project learned, written to be shared with other projects (agentskills.io format, MIT, every rule tagged with its evidence: `[verified]`, `[docs]`, `[review]` or `[practice]`). They were built with `pmpo-skill-creator` (Simple tier) and `skill-creator`, validated with the creator's `validate-skill.sh`, and reviewed by a second model (gpt-5.5) until it passed with no CRITICAL findings:

- `pglite-browser-persistence`: PGlite on IndexedDB in Vite: pre-bundling, `idb://` names, durability semantics, safe purge, migrations, real in-memory PGlite in vitest.
- `durable-browser-writes`: serial write queue, page-exit journal and replay, idempotency, multi-tab hazards, save-failure notices.
- `browser-storage-e2e-testing`: IndexedDB failure injection, holding writes pending, `addInitScript`, mutation proofs, flake triage.
- `tailwind4-shadcn-baseui-migration`: codemod, shadcn CLI, Base UI and assistant-ui pitfalls; token guard and contrast tests.
- `chat-ui-model-output-safety`: sandboxed generated HTML, sanitizer order, no raw errors, retry without duplicates.
- `agent-verification-hygiene`: commit gates, honest verification records, review packets, harness side effects.

The rest come from the user-level skill library (`~/.claude/skills`, mirrored into `~/.agents/skills`).

## Using the team in each harness

| Harness | Where the roles live | How to use | Verified |
|---|---|---|---|
| Claude Code | `.claude/agents/km-*.md` (hard roles on `opus`, others `sonnet`) | Ask for a role by name, e.g. "use km-qa-engineer to…" | live: a headless session listed all 10 |
| OpenCode | `.opencode/agents/km-*.md` (subagents) | `@km-rust-engineer …` or let the primary agent delegate | live: `opencode agent list` shows all 10 |
| Kimi Code | `.kimi-code/agents/km-*.md` | `kimi --agent km-chief-content-officer` (or `-p` for one prompt) | live: ran `km-qa-engineer`; unknown names are rejected |
| Codex | `.codex/agents/km-*.toml` | Ask Codex to spawn the `km-*` subagent | files parse with required fields; live check blocked by the local Codex model endpoint (`127.0.0.1:11434` rejected the connection) |
| MiniMax Code | `~/.minimax/agents/km-*/agent.md` (user data dir, not the repo) | Select the agent in MiniMax; `mcode exec` has no agent selector | frontmatter validated; not live-tested |
| Zed | No native role agents | Run a role through Zed's external agents (`claude-acp`, `opencode`, `codex-acp` in your Zed settings), which load the files above. Zed's own agent reads `AGENTS.md` and `.agents/skills`; two optional profiles are proposed in `zed/agent-profiles.json` | proposal only, not applied |

Models: only Claude Code carries a per-role model. For the others, pick the model at invocation or in that harness's config; Kimi ignores per-agent models.

## Changing the team

```sh
node ~/.claude/skills/agent-team-creator/scripts/cli.mjs validate --input .agent-team/team-request.json
node ~/.claude/skills/agent-team-creator/scripts/cli.mjs export --input .agent-team/export-<target>.json   # to a new out dir
```

The exporter never overwrites. Diff the new export against the installed files, then copy.
