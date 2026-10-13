## 1. kb-landscape-and-competition

- [ ] 12.1 Research plan: categories (always-on cloud agents including OpenAI dots; local-first and sovereign assistants; agent runtimes; agent memory systems; desktop agent clients; prior-authorization tools) and the primary-source rule.
- [x] 12.2 Firecrawl research by the main thread; each fetched page is logged to `evidence/` with URL, retrieval date and the excerpt relied on.
  - Partial: the research ran in subagents with Firecrawl (not the main thread, which turned out to be possible) and is logged as paraphrased facts with URL and retrieval date in `evidence/06-landscape-research-log.md`. Several entries are model-extracted summaries marked as such; one primary page per product beyond OpenAI dots, Microsoft Agent Framework, Gemini Spark and Claude Cowork. Licences and protocols are often not stated on the pages read. Task 12.5 re-checks a sample of claims against the cited pages.
- [ ] 12.3 OKF concepts per category with sourced claims only.
- [ ] 12.4 Comparison tables by capability and trade-off; every cell sourced or "not stated".
- [ ] 12.5 Independent verification: the critic re-checks a sample of claims against the logged excerpts (no web access needed).

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` under Task model assignments, keyed by phase path `site-chat-hardening-and-polish`, change `kb-landscape-and-competition` and the task ID above.
