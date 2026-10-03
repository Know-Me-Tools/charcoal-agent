## 1. UAR: KB retrieval uses the configured embedding backend

- [x] 1.1 Make KB query embedding use the same backend as ingestion (`llm.embedding`).
- [x] 1.2 Record the embedding model and dimension on each KB at creation; a query against a KB built with a different model returns an explicit error, not empty results.
- [x] 1.3 Add a UAR integration test: ingest and retrieve with the same backend, assert non-empty cited results; and a mismatch test asserting the explicit error.
- [x] 1.4 Open the PR against `Prometheus-AGS/universal-agent-runtime`, record the link, and confirm the published image (change `uar-ghcr-multiarch-publish`) contains it.
  Evidence (2026-10-02): UAR #316 merged; GHCR `main` = `sha-e73b5f67` (digest `sha256:94e4af0f…`, linux/amd64 + linux/arm64, run 36997759532) and `c52a4af7`, `72cd9889` are ancestors of `e73b5f67`.
