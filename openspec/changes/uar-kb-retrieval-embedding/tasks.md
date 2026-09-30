## 1. UAR: KB retrieval uses the configured embedding backend

- [x] 1.1 Make KB query embedding use the same backend as ingestion (`llm.embedding`).
- [x] 1.2 Record the embedding model and dimension on each KB at creation; a query against a KB built with a different model returns an explicit error, not empty results.
- [x] 1.3 Add a UAR integration test: ingest and retrieve with the same backend, assert non-empty cited results; and a mismatch test asserting the explicit error.
- [ ] 1.4 Open the PR against `Prometheus-AGS/universal-agent-runtime`, record the link, and confirm the published image (change `uar-ghcr-multiarch-publish`) contains it.
