# uar/agents

UAR `AgentArtifact` definitions for this site, deployed by `scripts/seed-site-agent.sh`.

- `knowme-site.json` — the public concierge agent for know-me.tools. Answer-only
  (no tools that act, no file/shell/web-fetch/code-execution access), scoped to
  the `knowme-site` knowledge base with citations required.

The seed script `PUT`s each artifact here to UAR's agent-store API using a
short-lived service JWT (`sub = knowme-site`), so these files are the source
of truth for the agent's policy and prompt, not a UAR file-loader — UAR has no
file-based agent loading; this directory only feeds the script.

Edit the JSON here, then re-run the seed script against the target UAR
instance to apply the change. The script is idempotent: a run with no
changes makes no writes.

## Two agents, one selector

- `knowme-site.json` is the default agent. Its only tool is `presentation_render`; it has no web search.
- `knowme-site-web.json` adds the read-only `websearch__search` tool (MCP server `websearch`). The site server maps a request with `web_search: true` to this agent (`SITE_WEB_AGENT_ID`; unset defaults to `knowme-site-web`). The web route is already live (`VITE_SITE_WEB_SEARCH=1`).

The two stay separate on purpose. Web search sends a visitor-derived query to a third party, so it stays an opt-in with its own "Searching the web" step and `[W#]` citation frame. `server/tests/site_server.rs` pins the default agent to `presentation_render` only.

`max_tool_calls_per_turn` is 2 on the web agent: one search plus the answer card. Knowledge-base retrieval goes through `memory.kb`, not a tool, so a third call could only be a second search. The default agent sets no cap; its allowlist holds the card alone.

Both system prompts share one body and differ in the web paragraph and the comparison mode; edit them together.

## When changes go live

`.github/workflows/site.yml` runs `scripts/seed-site-agent.sh` on every push to `main` with `SEED_MODE=all` and `SEED_WEB_AGENT=1`, so merging a change to either file puts both prompts live. Rollback: revert the change on `main` (the next deploy re-seeds the old prompts), or re-seed with `SEED_MODE=agent`. `SITE_WEB_AGENT_ID=""` only disables the web route; it does not restore a prompt. The kill switch stops all chat; do not use it for a prompt rollback.
