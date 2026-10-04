# Assessment: uar-integration

Assessed 2026-09-30. All inspection was read-only: the UAR repo, this repo at `29c6697`, and the `know-me` kube context (Linode LKE on Akamai, the only deploy target). No secret value was read or printed.

**UAR baseline correction.** The local UAR checkout is at `dce44e78`, 142 commits behind the canonical `Prometheus-AGS/universal-agent-runtime` `main` (`853490db`). Its `gqadonis` remote points at a URL that no longer exists; a remote named `org` was added. Findings below were re-checked against `org/main`:
- Dockerfile port 1906, the curl-only runtime, and the `llm.embedding` defaults: unchanged.
- `deploy.yml`, `.gitmodules` and `src/config.rs`: changed (deploy.yml +93 lines, config.rs +418).

The plan must work from `org/main`, not the local checkout.

## Operator decisions (2026-09-30)

- **D1: Where the image is built.** Build the UAR image once, in the UAR repo's CI. Publish it to a shared registry that all projects pull from. This repo never builds UAR; it deploys a pinned digest, and local compose pulls the published image.
- **D2: Registry location.** Use the org namespace, `ghcr.io/prometheus-ags/universal-agent-runtime`. The repo is already `Prometheus-AGS/universal-agent-runtime` and **public**, so no transfer is needed.
- **D3: Image visibility.** The image is **public**. The existing GHCR package of that name is currently **private** and linked to the repo. Changing a package's visibility is done in the GitHub UI by an org admin. Making it public cannot be undone.
- **D4: Architecture.** Build **multi-arch**: linux/amd64 for the LKE nodes and linux/arm64 for Apple Silicon. Build each architecture on a native runner (`ubuntu-24.04-arm` for arm64), not under QEMU, then merge the per-architecture images under one manifest list.

## Summary

- No goal is met yet. This repo has a `docker-compose.yaml` for UAR, but it does not work with the current UAR image (G1).
- There is no `k8s/` directory and no `.github/workflows/` directory.
- Much of the cluster infrastructure already exists:
  - the Envoy Gateway `argocd/argocd-gateway` (class `eg`, address `23.239.29.33`)
  - a ready `*.know-me.tools` wildcard certificate
  - Let's Encrypt ClusterIssuers
- Two things sit outside this repo and block a public hostname:
  - DNS lives in Cloudflare, and there is no external-dns.
  - The gateway's listeners live in the GitOps repo `Prometheus-AGS/know-me-cluster`. Argo CD's selfHeal would revert a listener added with kubectl.
- **The uncomfortable part.** Goal 3 as written would publish an unauthenticated agent runtime at a public hostname, backed by the operator's paid Qwen key. UAR currently runs with `UAR_SECURITY__JWT_REQUIRED=false`, so anyone who finds the host can spend the quota. Also unconfirmed: whether Alibaba's Token Plan terms allow server-side use at all.

## Findings per goal

### G1 Local UAR in Docker: PARTIAL, broken

`docker-compose.yaml` builds `../prometheus/universal-agent-runtime` and runs it next to `knowme-web`. Against the current UAR `Dockerfile`, it has these defects:

| # | Defect | Evidence | Effect |
|---|---|---|---|
| 1a | The healthcheck runs `wget`, but the runtime stage installs only `curl`, on `ubuntu:24.04` | Compose `healthcheck.test`; UAR `Dockerfile:54-55,252-293` | `uar` never becomes healthy, and `knowme-web` (`depends_on: service_healthy`) never starts |
| 1b | The model settings point at OpenAI (`LLM_BASE_URL` default `https://api.openai.com`, `LLM_MODEL` default `gpt-4o`) | compose `environment` | No Qwen default |
| 1c | No embedding settings; `UAR_PERSISTENCE__VECTOR_DIMENSION` defaults to 384 | compose, `.env.example` | This conflicts with a 1024-dimension embedding model. The existing `uar_data` volume may hold 384-dimension vectors |
| 1d | The build needs initialised submodules. Three use `git@github.com:` SSH URLs (liter-llm, prometheus-entity-management, rust-mcp-filesystem), and the Dockerfile takes a `github_token` build secret for cargo git deps | `.gitmodules`; UAR `deploy.yml` `secrets: github_token=` | A plain `docker compose build` may fail without that secret |
| 1e | The image is a multi-toolchain build: Rust nightly-2026-07-18, Node 24, Python 3.13, Go 1.26.3, TinyGo, wasmtime | UAR `Dockerfile:24-45`; its CI comment says about 3 GB and about 45 min cold | Local iteration is slow |

The image's built-in default port is 1906 (`src/config.rs:1085`; `EXPOSE 1906`). Compose overrides it with `PORT`/`UAR_SERVER__PORT=6565`. The routes `/health`, `/healthz` and `/readyz` all exist (`src/server.rs:1291-1293`).

### G2 Kubernetes manifests in `k8s/`: NOT MET

- This repo has no `k8s/`.
- The UAR repo has `k8s/base` (kustomize), `k8s/helm/uar` and `k8s/opentofu`, but they target AKS:
  - the `uar` namespace
  - the `prometheusagsacr.azurecr.io` image registry
  - Postgres, SurrealDB and Redis StatefulSets
- Its own deploy workflow says the live AKS namespace is operator-managed and must not be `kubectl apply -k`'d.
- Cluster facts for new manifests:
  - Two Linode nodes on k8s v1.36.3.
  - Storage classes: `linode-block-storage-retain` (the default) and `linode-block-storage`.
  - Existing know-me workloads pull from `ghcr.io/prometheus-ags/*` with no `imagePullSecrets`, so those packages are public.

A minimal single-replica set fits the goal: Deployment, Service, a ReadWriteOnce PVC for embedded SurrealDB (`rocksdb:///data/uar.db`), a ConfigMap, a Secret reference and an HTTPRoute. Vendoring the UAR base with its database StatefulSets would be heavier. As the UAR workflow notes, an RWO single replica needs the `Recreate` strategy, or rolling updates deadlock on Multi-Attach.

### G3 Public DNS and TLS: NOT MET, blocked outside this repo

**TLS: reuse, don't issue.**
- Certificate `argocd/wildcard-know-me-tools-tls` is Ready. It is issued via `letsencrypt-*` ClusterIssuers.
- Listeners on `argocd-gateway` reference that secret in their own namespace, so a new listener needs no ReferenceGrant.
- `allowedRoutes.namespaces.from: All` lets an HTTPRoute in a new namespace attach.

**Gateway: hostname-scoped listeners only.**
- Every listener is per hostname (`auth.`, `sso.`, `gate.`, `api.`, `rt.know-me.tools`, plus `onyx.prometheusags.ai`). There is no wildcard listener.
- A new hostname therefore needs a new HTTPS listener, plus an HTTP one for redirects, on `argocd-gateway`.
- The gateway is Argo-managed (`argocd-config`, `envoy-gateway` and `cluster-root` apps, all `selfHeal: true`, source `github.com/Prometheus-AGS/know-me-cluster`). The listener change must go to that repo.

**DNS: Cloudflare, with a conflicting wildcard.**
- NS records are `abdullah`/`yolanda.ns.cloudflare.com`.
- `*.know-me.tools` resolves to `35.238.217.92`, which is not this cluster.
- `uar.know-me.tools` and `chat.know-me.tools` resolve to `172.169.221.204`, which is not this cluster and is probably the AKS instance.
- `api.know-me.tools` resolves to `23.239.29.33`, the gateway.
- Any chosen name needs an explicit A record to `23.239.29.33`. `uar.` is taken.

### G4 GitHub Actions deploy: NOT MET

This repo has no workflows.

**Split across two repos by D1.**
- **UAR repo:** its `deploy.yml` builds only for amd64, pushes only to Azure ACR and deploys only to AKS. The only other build is a separate tag-triggered sidecar matrix. It needs a multi-arch GHCR publish job. It already holds the `SUBMODULES_TOKEN` secret the build needs.
- **This repo:** a deploy-only workflow, which needs the `know-me` kubeconfig as a GitHub secret.

Constraints found:

- **Source.** The image source is another repo (`GQAdonis/universal-agent-runtime`, remote `gqadonis`) with SSH submodules across three owners. Building here means a cross-repo checkout with a PAT secret, plus the `github_token` build secret.
- **Build cost.** A cold build takes 45–75 min and produces about a 3 GB image. The disk on `ubuntu-latest` is tight.
- **Kube credentials.** The deploy needs a kubeconfig for the LKE cluster as a GitHub secret. A namespace-scoped ServiceAccount is safer than the admin kubeconfig.
- **GitOps.** Deploying with `kubectl` from Actions runs outside the cluster's GitOps model. An Argo Application would be the cluster-native path. The operator asked for Actions, so this is recorded, not overridden.

### G5 Default chat model: NOT MET in config; model verified

- **The model works.** `qwen3.8-max` at the Token Plan OpenAI-compatible URL returned HTTP 200 in this session.
- **Configuration route:** `UAR_LLM__MODEL`/`LLM_MODEL` plus `LLM_BASE_URL` and `LLM_API_KEY`. Model format is `provider/model` (`example.config.yaml:102-118`). `LLM_BASE_URL` bypasses provider auto-detection.
- **Still unverified:**
  - the exact `provider/` prefix UAR needs for an OpenAI-compatible custom base
  - whether UAR's `/api/providers` seeds this as the default the UI shows

### G6 Default embedding model: NOT MET in config; model verified

- **The model works.** DashScope `text-embedding-v4` at 1024 dimensions returned HTTP 200.
- **The config supports it.** UAR's `llm.embedding` section has `backend`, `model`, `api_key`, `base_url` and `vector_dimension` (`src/config.rs:1603-1630`).
- **The code honours it.** The OpenAI backend uses `base_url` and sends `dimensions` when the value isn't 1536 (`src/uar/rag/embeddings/openai.rs:22,59,68`).
- **Separate settings.** `memory.embedding_*` is a separate config (memory is off by default). `persistence.vector_dimension` must match (1024).
- **Unverified:** the env-var spelling for the nested keys (`UAR_LLM__EMBEDDING__BASE_URL`), and whether knowledge bases (`knowledge_bases.default.embedding_provider: fastembed`) follow `llm.embedding` or need their own override.

### G7 Local `.env`: PARTIAL

- `.env` is git-ignored (`.gitignore:34`).
- A marked `uar-integration` block with the seven model settings was appended earlier in this session.
- Its names (`QWEN_TOKEN_PLAN_*`, `DASHSCOPE_*`, `QWEN_EMBEDDING_*`) aren't the ones compose reads (`LLM_*`, `UAR_*`). Either compose maps them or `.env` gains the `UAR_*` names.
- The block was not inspected for duplicates of earlier keys.
- `.env.example` still documents OpenAI defaults and 384 dimensions.

### G8 Carried items: NOT MET

- **Live UAR smoke:** deferred from complete-rebranding. It depends on G1.
- **About-page endpoint truth (landing S5):** depends on a reachable UAR.

## Open questions for plan

| # | Question | Why it matters | Default if unanswered |
|---|---|---|---|
| Q1 | Which hostname? `uar.` is taken | Needed for DNS, the listener and the HTTPRoute | `runtime.know-me.tools` |
| Q2 | Who changes Cloudflare DNS and the `know-me-cluster` gateway listener: the operator, or a PR from us plus a Cloudflare token secret? | Both are outside this repo; the GitOps change is hard to reverse by kubectl | We draft the `know-me-cluster` listener PR; the operator adds the DNS record |
| Q3 | Authentication on the public endpoint | Unauthenticated means an open proxy on a paid key | Require JWT (`UAR_SECURITY__JWT_REQUIRED=true`), or restrict with an Envoy SecurityPolicy |
| Q4 | ~~Where is the image built~~ | Resolved by D1–D4 | UAR CI builds a multi-arch image and publishes it to public GHCR |
| Q7 | RESOLVED (default): how does this repo learn about new UAR images: `repository_dispatch` from UAR CI (automatic deploy), or Renovate digest PRs (reviewed deploy)? | Choice between deploy automation and control | Renovate PRs |
| Q8 | RESOLVED (default): do the existing ACR push and AKS deploy in UAR's `deploy.yml` stay alongside the GHCR push? | Changing another team's live deploy | Keep them; add GHCR as an additional target |
| Q5 | Deploy the KnowMe web UI too, or only UAR? | Goals name only UAR; a separate UI host would need CORS | UAR only |
| Q6 | Do the Token Plan terms permit a hosted, multi-user backend? | A licence or ban risk on the key | Operator confirms |

## Risks

- **An exposed key.** The DashScope key was pasted in chat. Rotate it after setup.
- **A vector-dimension change.** Moving from 384 to 1024 invalidates existing local vectors, so the local volume must be recreated. A fresh cluster PVC is unaffected.
- **Slow image builds.** Every compose or CI iteration that rebuilds UAR costs tens of minutes. Build once and reuse the image.

## Review record

- **Adversarial review skipped** by operator decision (2026-09-30), and not performed. The findings above have no independent vet.
- **Q7 and Q8 take their defaults:**
  - Renovate digest PRs deploy new images.
  - The ACR push and AKS deploy stay, and GHCR is added.
- **Q1–Q3, Q5 and Q6 carry into plan with their stated defaults.**
