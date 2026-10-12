## 1. site-bundle-attribution

- [ ] 8.1 CWV baseline (Lighthouse mobile) on the live site: LCP, TBT, JS bytes.
- [ ] 8.2 Fix a numeric target strictly below the baseline from the attribution, re-baselined after change 14's build because the KB is compiled into the client (P7); state plainly if 300 kB gzip is unreachable without a product change.
- [ ] 8.3 Behaviour-preserving cuts (for example KaTeX only when a message has math).
- [ ] 8.4 PGlite on the site: operator decision before any change.
- [ ] 8.5 Size-gate script (no new dependency) that fails above the recorded target; the target cannot equal the current size.

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-chat-hardening-and-polish/plan.md` under Task model assignments, keyed by phase path `site-chat-hardening-and-polish`, change `site-bundle-attribution` and the task ID above.
