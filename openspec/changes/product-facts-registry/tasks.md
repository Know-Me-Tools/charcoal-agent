## 1. product-facts-registry

- [ ] 1.1 Extract the 58 portfolio entries (id, family, status wording, links) from the saved IPFS edition into data, recording the method
- [ ] 1.2 Establish release truth per product from gh releases, the registry and the cluster; record every portfolio disagreement (UAR first)
- [ ] 1.3 Write product-facts.json: one row per entry with version, version kind, source URL, checked date, status wording and a public/withheld flag (D1)
- [ ] 1.4 Add scripts/kb/check-product-facts.mjs (schema; --live compares stable versions with GitHub) and a unit test with a mutation check
- [ ] 1.5 Record decisions D-001 to D-005 and open the docs PR with [skip ci]

Model assignments for these tasks are in `.kbd-orchestrator/phases/usefulness-update/plan.md` under Task model assignments, keyed by phase path `usefulness-update`, change `product-facts-registry` and the task ids above.
