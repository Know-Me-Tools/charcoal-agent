# Plan: uar-integration

Planned 2026-09-30 from `assessment.md` plus the operator decisions made during plan. The adversarial review was skipped by operator decision.

## Scope as decided

The KnowMe corporate site (this repo) moves off Lovable hosting and onto the `know-me` LKE cluster, behind the shared Envoy Gateway. It runs as a stack of four services, identical locally (compose) and in the cluster (`k8s/`):

| Service | Image | Role |
|---|---|---|
| `knowme-web` | `ghcr.io/know-me-tools/knowme-web`, built here | A Rust **Axum server** (`server/`) that embeds the SPA (built by `build.rs`) and is the only public path to the site agent. It forwards the AG-UI chat to UAR and hosts the site's own APIs. It replaces nginx (operator decision, 2026-09-30) |
| `uar` | `ghcr.io/prometheus-ags/universal-agent-runtime`, built by UAR CI | Agent runtime. Chat model `qwen3.8-max` (Token Plan), embedding `text-embedding-v4` at 1024 dims (DashScope) |
| `surrealdb` | `surrealdb/surrealdb:v3.3.0@sha256:681c6c22c287421b5c7d99e0fde79b6e0d32c36c1ddeaab2762a1661cb04cd20`, the same pin UAR uses | Shared database. UAR persistence uses it remotely, not embedded |
| `surreal-memory-server` | `ghcr.io/prometheus-ags/surreal-memory-server`, built by that repo's CI | Memory service in the same SurrealDB, in its own namespace |

**The site agent.**
- A dedicated UAR agent, `knowme-site`, is pinned to the Qwen configuration.
- It retrieves from knowledge base `knowme-site`, which holds public-safe product content covering:
  - the company
  - **KnowMe** (`know-me-system`)
  - **The Boss** (`/Users/gqadonis/Projects/prometheus/the-boss`)
  - **IPFS Obsidian Sync** (`/Users/gqadonis/obsidian/.ipfs-sync`)
- The site chat talks to this agent over UAR's AG-UI stream (`POST /api/chat/completion`, `stream_mode: "dual"`).

**Hosts.** All three sit on `argocd/argocd-gateway` at `23.239.29.33`.

| Host | Serves | DNS today |
|---|---|---|
| `know-me.tools` | the site | points at the Lovable host, `185.158.133.1`; the operator cuts over in change 12 |
| `www.know-me.tools` | redirects to the apex | points elsewhere; cut over in change 12 |
| `runtime.know-me.tools` | UAR API, JWT required | already points at the gateway |

**CI.** Every push to `main` here rebuilds and redeploys the site (change 11). UAR and the memory server each publish their own images on pushes to their own `main`. Renovate PRs here bump the pinned digests.

## Corrections to assessment.md

**C1: the "wildcard" certificate isn't one.**
- `argocd/wildcard-know-me-tools-tls` has SANs only for `auth`, `sso`, `gate`, `api` and `rt.know-me.tools`, issued by `letsencrypt-http01`.
- It covers none of this phase's hosts.
- `letsencrypt-prod` has a **Cloudflare DNS-01** solver. It can issue a certificate for all three hosts before DNS moves, with no downtime (change 4).

**C2: the local UAR checkout is stale.**
- It is 142 commits behind `Prometheus-AGS/universal-agent-runtime` `main`.
- The UAR work uses the org repo (remote `org`), and is read here from a detached worktree of `org/main`.
- `crates/prometheus-skill-system` is also 123 commits behind.

**C3: the memory server has its own repo.**
- It lives at `/Users/gqadonis/Projects/prometheus/surreal-memory-server` (`Prometheus-AGS/surreal-memory-server`, public, local `main` even with origin).
- The only workflow there is `docs.yml`, so no image is published.
- The working tree has uncommitted local edits under `.kbd-orchestrator/`, `.claude/` and `.prometheus/`. They must not be committed by this phase.

## UAR facts the design depends on

Verified at `org/main` `853490db`, via research and spot-checks.

**Agents**
- An agent is a JSON `AgentArtifact`, created with `POST /api/agents` or `PUT /api/agents/{id}` (schema `src/uar/domain/artifact.rs:37-320`).
- The model comes from `policy.provider.default`. RAG comes from `memory.kb {enabled, knowledge_bases, citation_required}`.
- Nothing loads agents from files at startup, so the agent must be seeded through the API.

**Knowledge bases**
- A KB is owned by the creating user's `user_id`. Retrieval filters by owner.
- So the KB, the agent's runs and the site's API key must all belong to one service identity: JWT `sub = knowme-site`.
- Documents are uploaded as multipart to `/api/uar/knowledge-bases/{id}/documents`.
- **KB retrieval is hard-wired to local fastembed** (bge-small, 384 dims; `src/uar/api/knowledge.rs:678-690`), while ingestion uses the global `llm.embedding` (`src/server.rs:570-572`). The operator chose to fix this in UAR (change 2).

**Auth**
- One global middleware. Only `/health`, `/healthz`, `/readyz` and `/metrics` are exempt.
- Everything else needs a Bearer JWT (HS256 `jwt_secret`) or an `X-API-Key` header. API keys are minted with `POST /api/uar/auth/keys`, with the caller as subject.
- There is no anonymous or per-agent public access.
- A request can override `agent_id`, `model` and `run_policy` (`src/server.rs:5378-5396`). That is why the public site goes through a proxy that pins them.

**The memory server**
- It supports `SURREAL_MODE=server` with `SURREAL_ENDPOINT=ws://…`.
- Its OpenAI embedding provider has **no base-URL setting**, so it can't use DashScope unmodified. This phase runs it on local embeddings (bge-small), in its own SurrealDB namespace `memory`. DashScope for the memory server is a follow-up.

## Ordered changes

**Repos:** **UAR** = `Prometheus-AGS/universal-agent-runtime`; **SMS** = `Prometheus-AGS/surreal-memory-server`; **Cluster** = `Prometheus-AGS/know-me-cluster`; **Here** = this repo.

External-repo changes are tracked here as OpenSpec changes, and each one's PR link is recorded as evidence.

### 1. `uar-ghcr-multiarch-publish` (UAR PR · km-devops-engineer · depends on nothing)

**Adds to `deploy.yml`:**
- native per-architecture builds on `ubuntu-24.04` (amd64) and `ubuntu-24.04-arm` (arm64), each pushing by digest to `ghcr.io/prometheus-ags/universal-agent-runtime`
- a merge job that publishes a manifest list tagged with the commit SHA and `main`, plus `vX.Y.Z` on version tags
- `packages: write`, the existing `SUBMODULES_TOKEN` and `github_token` build secret, a free-disk step, and a per-architecture cache scope

The ACR and AKS jobs stay untouched.

**Done when:**
- a `main` run is green
- `docker buildx imagetools inspect …:main` lists both platforms
- an anonymous pull works, after the operator makes the package public

**Risk:** a 45–75 minute build per architecture, and arm64 has never been built. On failure, stop and ask; no silent QEMU fallback.

### 2. `uar-kb-retrieval-embedding` (UAR PR · km-rust-engineer · depends on nothing)

**What:**
- KB query embedding uses the same backend as ingestion (`llm.embedding`), not the hard-coded fastembed.
- The KB records the embedding model and dimension it was built with.
- A query against a KB built with a different model returns an explicit error, not empty results.
- Includes a UAR integration test: ingest with one backend, retrieve with the same backend, and assert non-empty cited results.

**Done when:**
- the test passes in the UAR repo
- once published (via change 1's workflow), the image retrieves from a 1024-dimension `text-embedding-v4` KB in the local stack (checked in change 7)

### 3. `memory-server-ghcr-publish` (SMS PR · km-devops-engineer · depends on nothing)

**What:**
- a new `.github/workflows/image.yml`, triggered on pushes to `main`, version tags and `workflow_dispatch`
- the same native amd64/arm64 build-and-merge pattern as change 1
- publishes to `ghcr.io/prometheus-ags/surreal-memory-server`, tagged with the commit SHA, `main`, and `vX.Y.Z` on version tags
- checks that the `mempalace-core` git dependency (`GQAdonis/mempalace-rs`) is fetchable in CI; if it's private, add a token secret

Only the new workflow file is committed. The pre-existing local edits in that repo are left alone.

**Done when:**
- a `main` run is green
- a multi-architecture manifest exists
- the container answers `GET :3001/health`

### 4. `cluster-gateway-and-cert` (Cluster PR · km-devops-engineer · operator merges · depends on nothing)

**In `namespaces/argocd-config/manifests.yaml`:**
- Certificate `know-me-tools-site-tls` in `argocd`, covering `know-me.tools`, `www.know-me.tools` and `runtime.know-me.tools`, issued by `letsencrypt-prod` (DNS-01)
- On `argocd-gateway`, HTTPS (443) and HTTP (80) listeners for each of the three hosts, referencing that secret, with `allowedRoutes: All`

**Done when:**
- the PR is merged
- Argo shows Synced and Healthy
- the Certificate is Ready
- all six listeners show Programmed=True

### 5. `site-knowledge-corpus` (Here · km-cmo, km-content-creator, km-chief-content-officer · operator approves · depends on nothing)

**What:**
1. **Briefs:** km-cmo writes a status brief for each new product, in the flagship-brief format with shipped vs specified status and source citations:
   - `marketing/strategy/the-boss-brief.md`
   - `marketing/strategy/ipfs-obsidian-sync-brief.md`
2. **Corpus:** km-content-creator writes the corpus in `content/knowledge/*.md`, one topic per file:
   - company and about
   - KnowMe: overview, features, platforms and status, privacy model
   - The Boss
   - IPFS Obsidian Sync
   - FAQ
3. **Voice review** by km-chief-content-officer.

**Rules:**
- Nothing from internal documents: competitive analysis, assessments, ADRs, diagnostics, reports.
- Anything not shipped appears only as "planned", in operator-approved wording.

**Done when:**
- the operator approves the corpus in writing (recorded in the change)
- the naming guard and the brand-copy tests pass over `content/knowledge`

### 6. `local-compose-stack` (Here · km-devops-engineer · depends on 1 and 3)

**`docker-compose.yaml` runs the four services:**
- `knowme-web` is built locally.
- `uar` and `surreal-memory-server` pull `:main`.
- `surrealdb` uses the v3.3.0 pin, a volume, and root credentials from `.env`.
- UAR persistence points at the remote SurrealDB: `UAR_PERSISTENCE__PROVIDER=surreal`, `DATABASE_URL=http://surrealdb:8000`, namespace and database set, credentials from `.env`, vector dimension 1024.
- The memory server runs with `SURREAL_MODE=server`, `SURREAL_ENDPOINT=ws://surrealdb:8000`, namespace `memory`, and local embeddings.
- UAR uses the Qwen chat and embedding settings.
- The UAR healthcheck is `curl -fsS :6565/readyz`.
- Local JWT stays off.

**Tasks:**
1. Check the nested env-var spellings and the model-prefix form against the published image.
2. Add the new names to the git-ignored `.env`, from existing values.
3. Update `.env.example` with names and placeholders only.
4. Remove the old `uar_data` volume.

**Done when (this is the live UAR smoke carried from complete-rebranding):**
- all four services are healthy
- `/api/chat/completion` through the web proxy streams a `qwen3.8-max` reply
- the memory server `/health` returns 200, with data landing in SurrealDB namespace `memory`

### 7. `site-agent-seed` (Here · km-conversational-designer (prompt) + km-devops-engineer (script) · depends on 2, 5 and 6)

**What:**
- **Agent artifact** `uar/agents/knowme-site.json`:
  - `policy.provider.default` = the Qwen provider and model
  - `memory.kb = {enabled: true, knowledge_bases: ["knowme-site"], citation_required: true}`
  - a system prompt that answers from the KB, discloses that it is an AI, never claims unshipped features, and says so when it doesn't know
- **Idempotent seed script** `scripts/seed-site-agent.sh`:
  - takes the UAR URL plus the JWT secret, from env
  - mints a short-lived JWT with `sub = knowme-site`
  - `PUT`s the agent
  - creates the KB if it's missing
  - uploads the corpus, replacing only changed files by content hash
  - mints the site's API key, printed once to stdout for the operator or workflow to store (never written to disk)

**Done when, against the local stack:**
- a question answered only in the corpus returns an answer with a citation
- a question about an unshipped feature is answered as "planned"
- a second run of the script makes no changes

### 8. `site-chat-proxy` (Here · km-frontend-engineer (client) + km-rust-engineer (Axum site server, task 1.5) + km-security-officer · depends on 6 and 7)

**Revised 2026-09-30:** an Axum server replaces nginx as the site proxy; see task 1.5 in the change. The nginx design below is superseded.

**Client:**
- When `VITE_SITE_AGENT_ID` is set, every site chat thread uses that agent.
- The agent picker is hidden.
- The same-origin `/api` path is used, and the browser holds no credentials.

**nginx (the site proxy):**
- **Allowlist:** public UAR paths are limited to what the site chat uses. The route audit is a task; the starting set is `/api/chat/completion` and the session routes the chat needs.
- **API key:** `X-API-Key` is injected from an env var through the nginx template (`envsubst`). Any client `Authorization` or `X-API-Key` header is dropped.
- **Body rewrite:** `agent_id` is forced to `knowme-site`, and `model` and `run_policy` are stripped. This uses njs if the pinned `nginx:1.27-alpine` image ships `ngx_http_js_module`, which the first task checks. If it doesn't, stop and ask: the alternative is a UAR change that binds an API key to one agent.
- **Rate limiting:** `limit_req` per client IP, plus a body-size cap.
- **SSE:** the existing SSE settings are kept.

The public build hides the app-only pages (settings, agents, skills) that need UAR admin routes.

**Done when:**
- a proxy integration test against the local stack shows that:
  - a request carrying `agent_id=other` and `model=x` still runs `knowme-site` on `qwen3.8-max`
  - a disallowed path returns 403
  - a burst above the limit returns 429
- `visual-first-ui-delivery` capture of the chat at 320 and 1440 px, in both themes, has been viewed and the images are listed
- the existing tests and goldens pass, or are updated with operator sign-off

### 9. `about-endpoint-truth` (Here · km-frontend-engineer · depends on 6)

**What:** Landing follow-up S5. The About page's endpoint row shows the real same-origin target when `VITE_UAR_BASE_URL` is unset, instead of a guessed default.

**Done when:**
- the unit test passes
- screenshots have been viewed and are listed

### 10. `k8s-stack-manifests` (Here, `k8s/` · km-devops-engineer; km-security-officer reviews · depends on 1, 3, 4, 7 and 8)

**Kustomize base, namespace `knowme`:**
- **`surrealdb`:** StatefulSet with 1 replica, the pinned digest, a 20Gi PVC on `linode-block-storage-retain`, root credentials from Secret `surrealdb-auth`, and a ClusterIP Service. A NetworkPolicy lets only `uar` and `surreal-memory-server` reach it.
- **`uar`:** Deployment pinned by digest, remote SurrealDB, no PVC, readiness `/readyz` and liveness `/healthz` on 6565, `JWT_REQUIRED=true`, `envFrom` ConfigMap `uar-config` plus Secret `uar-secrets`.
- **`surreal-memory-server`:** Deployment pinned by digest, ClusterIP only.
- **`knowme-web`:** Deployment pinned by digest, with `X-API-Key` from Secret `site-proxy`.
- **HTTPRoutes:**
  - `know-me.tools` → `knowme-web`
  - `www` → 301 to the apex
  - `runtime.know-me.tools` → `uar`, with a 300s timeout for SSE
  - HTTP → HTTPS redirects on all three
- **Job** `seed-site-agent`, running the script from change 7.
- **`k8s/bootstrap/`:** a namespace-scoped ServiceAccount, Role and RoleBinding, plus a script the operator runs once with the admin context to mint the deployer kubeconfig.
- **`renovate.json`:** digest updates for the UAR and memory-server images.

There are no Secret manifests in git.

**Done when:**
- `kubectl kustomize k8s` renders
- `kubectl --context know-me apply -k k8s --dry-run=server` succeeds
- a grep finds no secret values

### 11. `github-deploy-workflows` (Here, `.github/workflows/` · km-devops-engineer; km-security-officer reviews · depends on 10)

**`site.yml`, on every push to `main` (plus `workflow_dispatch`):**
1. Run the repo's tests, lint and build.
2. Build `knowme-web` and push `ghcr.io/know-me-tools/knowme-web` (SHA tag plus digest).
3. Create or update the Secrets idempotently from GitHub secrets:
   - `uar-secrets`: Qwen key, DashScope key, JWT secret, settings admin key
   - `surrealdb-auth`
   - `site-proxy`
4. Set the web image digest with `kustomize edit set image`, then `kubectl apply -k`.
5. Wait for `rollout status` on each workload.
6. Run the seed Job when `content/knowledge/**` or `uar/agents/**` changed.

**Smoke test:**
- `https://know-me.tools/` returns 200. Before the DNS cutover, this is checked with `curl --resolve know-me.tools:443:23.239.29.33`.
- A site chat turn through the proxy returns a `qwen3.8-max` answer.
- `runtime.know-me.tools/readyz` returns 200.
- `/api/agents` without a token returns 401.

**Done when:** a `main` run is green end to end, and a second, trivial commit to `main` redeploys automatically.

### 12. `apex-dns-cutover` (operator · km-devops-engineer verifies · depends on 11)

**What:**
- The operator changes the Cloudflare A records for `know-me.tools` and `www` to `23.239.29.33` and retires Lovable hosting.
- Before the cutover, we verify with `--resolve` that the new site serves every page the current site serves. Content parity is a checklist.
- **Rollback:** restore the previous DNS records.

**Done when:**
- public `dig` shows the gateway IP
- `curl -I https://know-me.tools` shows the new site, with the Let's Encrypt certificate
- the chat works in production

## Order and parallelism

1. **Start at once, in parallel:** 1, 2, 3, 4 and 5. They are external PRs and content work; several wait on operator merges or approval.
2. Then 6 (needs 1 and 3), then 7 (needs 2, 5 and 6), then 8 and 9.
3. Then 10 and 11, then 12 (operator).

**Critical path:** 1 → 6 → 7 → 8 → 10 → 11 → 12. Change 2 must be merged and published before 7 can pass.

## Operator actions (not agent tasks)

1. **Make the packages public:** after the first runs of changes 1 and 3, make `universal-agent-runtime` and `surreal-memory-server` public in the GitHub UI.
2. **Merge the external PRs:** UAR (1, 2), SMS (3) and Cluster (4).
3. **Approve the corpus** (5).
4. **Set up cluster access and secrets:**
   - Run `k8s/bootstrap` once with the admin context.
   - Then `gh secret set` for: `KNOWME_KUBECONFIG`, `QWEN_TOKEN_PLAN_API_KEY`, `DASHSCOPE_API_KEY`, `UAR_JWT_SECRET`, `UAR_SETTINGS_ADMIN_KEY`, `SURREALDB_ROOT_PASSWORD` and `SITE_PROXY_API_KEY`.
5. **Confirm and rotate keys:** confirm the Token Plan terms allow a public site chat. Rotate the DashScope key.
6. **Cut over DNS** (12). Install the Renovate GitHub App if the org doesn't have it.

## The uncomfortable part

- **The public chat spends your Qwen quota.**
  - Anyone on the internet can use the site chat, and each turn spends the operator's Token Plan quota.
  - The proxy limits what they can do, but only rate limits cap how much.
  - A determined scraper using many IPs can still run up usage. There is no captcha or per-user auth by design.
  - If the Token Plan terms forbid serving the public, this whole design needs a different key before change 11 goes live.
- **The critical path runs through two builds that have never run.**
  - UAR: 45–75 minutes per architecture, with arm64 never built.
  - The memory server's dependency `mempalace-rs` lives in a personal account and may be private.
- **The DNS cutover replaces the live production site.**
  - The parity checklist in change 12 is the only guard against losing pages the Lovable site has today.
- **Two UAR changes carry the risk.**
  - Change 2 alters retrieval behaviour for every UAR user, not only this site.
  - The proxy's body rewrite (change 8) depends on njs being present. Both have a stated stop-and-ask point.
