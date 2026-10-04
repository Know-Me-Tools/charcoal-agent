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
