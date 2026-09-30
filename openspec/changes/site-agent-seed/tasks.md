## 1. The knowme-site agent and knowledge base, seeded idempotently

- [x] 1.1 (km-conversational-designer) Write `uar/agents/knowme-site.json` (AgentArtifact): `policy.provider.default` = the Qwen provider/model; `memory.kb = {enabled: true, knowledge_bases: ["knowme-site"], citation_required: true}`; a system prompt that answers from the KB, discloses it is an AI, never claims unshipped features, and says when it does not know.
- [x] 1.2 (km-devops-engineer) Write `scripts/seed-site-agent.sh`: from env (UAR URL, JWT secret) mint a short-lived HS256 JWT `sub=knowme-site`; `PUT /api/agents/knowme-site`; create KB `knowme-site` if missing; upload `content/knowledge/*.md` replacing only changed files (content hash); optionally mint the site API key and print it once to stdout, never to disk.
- [ ] 1.3 Integration gate against the local stack: a corpus-only question returns a cited answer; an unshipped-feature question is answered as planned; a second run changes nothing.
