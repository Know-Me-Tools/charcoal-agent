# Plan-stage research 02: KB pipeline, content push, memory scope

Source: read-only investigation of this repository on 2026-10-12 (model output, spot-checked by the adversarial plan review, which verified the memory flag, the flat glob, the FR-8 checks and the workflow triggers).

## Knowledge-base pipeline (`scripts/seed-site-agent.sh`)
- Reads only the top level of `content/knowledge/*.md`; no subdirectories; no front-matter parsing; the file is uploaded as is (multipart, `text/markdown`) to `POST /api/uar/knowledge-bases/{kb}/documents`.
- Remote filename is `<basename>.<sha256-first-12>.md`; unchanged files are skipped by comparing that name; changed files are uploaded then the old document deleted; removed files are deleted remotely.
- KB created with: recursive chunking, 1000-character chunks, `retrieval_top_k=5`, `retrieval_min_score=0.5`, embeddings text-embedding-v4 at 1024 dimensions. No overlap value is set by the script. Changing these requires `--recreate-kb`.
- FR-8 health check: waits up to 180 s for ingestion; every corpus file must be `indexed`; two content checks: (1) top 5 for the IPFS Sync version question must contain `v0.2.0` and `Obsidian 1.12.3` and no chunk may end on a bare version fragment; (2) top 5 for the Boss platforms question must contain a chunk from `the-boss.md` with both "Windows" and "macOS". A failure fails the deploy job.
- Citations: the agent has `citation_required: true`; the public stream filter keeps `document_name`, `snippet` (and `marker`) for `agui.rag_citations`; visitors therefore see the uploaded filename including the hash suffix unless the client maps it (not yet read; plan task 5.2 maps it).

## Pushing content without a deploy
- `site.yml` triggers on push to `main` and `workflow_dispatch` with no inputs and no path filters; the seed runs only inside the deploy job (which is gated by the `production` environment). It re-PUTs the agent on every run; there is no KB-only flag.
- `[skip ci]` suppresses push-triggered runs only; `workflow_dispatch` is unaffected.
- The Dockerfile copies all of `content/` into the web build, so `content/site/**` ships in the bundle; only `content/knowledge/**` and `docs/knowledge-source/**` are safe to exclude from deploy triggers.

## Memory scope
- `uar/agents/knowme-site.json` enables conversation memory and a KB with citations; but `server/src/domain/chat_request.rs` sets `memory_enabled:false` on every turn (FR-41), which disables recall and capture upstream.
- Visitor identity: a signed `knowme_vid` cookie; the proxy forwards an HMAC-derived per-visitor-per-thread session id, never the client's own value; all visitors share one upstream principal (`sub=knowme-site`). If recall were enabled, user- or agent-scoped memories could cross visitors; only session-scoped ones are isolated.
- Whether the memory service is enabled in the live UAR was not proven from this repository.

## Starter prompts
- No existing starter-prompt feature in `src/`, `content/` or `uar/`. `content/site/*.ts` was not checked for hard-coded example prompts.

## Unknowns carried into the plan
Client display of `document_name`; chunk overlap default; per-KB size limits; whether the KB delete endpoint exists in the deployed UAR (the script flags it as an assumption).
