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
- `knowme-site-web.json` adds the read-only `websearch__search` tool (MCP server `websearch`) and is used only when the visitor switches web search on in the composer. The site server maps a request with `web_search: true` to this agent (`SITE_WEB_AGENT_ID`, default `knowme-site-web`).

The two stay separate on purpose. Web search sends a visitor-derived query to a third party, so it stays an opt-in with its own disclosure, "Searching the web" step and `[W#]` citation frame, none of which the default route has. `server/tests/site_server.rs` pins the default agent to `presentation_render` only, so a rollback (`SITE_WEB_AGENT_ID` set empty) leaves a tool-free agent. Both system prompts share the same modes and rules and differ only in the web paragraph and the comparison mode; edit them together.

`max_tool_calls_per_turn` is 3 on the web agent: one search, one knowledge-base lookup, one answer card. The default agent sets no cap; its allowlist holds the card alone.
