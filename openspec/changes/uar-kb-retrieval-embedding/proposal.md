## Why

KB retrieval is hard-wired to local fastembed (`src/uar/api/knowledge.rs:678-690`) while ingestion uses `llm.embedding`, so a KB built with Qwen `text-embedding-v4` returns nothing. The operator chose to fix this in UAR.

## What Changes

- UAR: KB retrieval uses the configured embedding backend.
- Lands in: Prometheus-AGS/universal-agent-runtime. Owner: km-rust-engineer.
- Depends on: none.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md`.

## Impact

- Capability: `uar-kb-embeddings`.
