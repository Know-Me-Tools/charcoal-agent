## 1. SHA and digest pins with a CI check

- [x] 1.1 Inventory every `uses:` line in `.github/workflows/site.yml` (`actions/checkout@v7`, `actions/setup-node@v7`, `docker/setup-buildx-action@v4`, `docker/login-action@v4`, `docker/build-push-action@v7`, `azure/setup-kubectl@v5`) and every `image:` in `k8s/base/*.yaml` and `docker-compose.yaml`; list each with its current tag in this change's evidence.

  **Actions inventory (pre-pin tags, resolved via `curl https://api.github.com/repos/<owner>/<repo>/git/refs/tags/<tag>`):**
  | `uses:` | tag | resolved commit SHA |
  |---|---|---|
  | `actions/checkout` | `v7` | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
  | `actions/setup-node` | `v7` | `820762786026740c76f36085b0efc47a31fe5020` |
  | `docker/setup-buildx-action` | `v4` | `f87e5991a6d7451dcb8d9637bfbc97413f497069` |
  | `docker/login-action` | `v4` | `dbcb813823bdd20940b903addbd779551569679f` |
  | `docker/build-push-action` | `v7` | `c3c9e263c25d99ce0380d002d59b67737d91b0dc` |
  | `azure/setup-kubectl` | `v5` | `829323503d1be3d00ca8346e5391ca0b07a9ab0d` (tag `v5` is an annotated tag object `ad56756f...`; dereferenced via `git/tags/<sha>` to its target commit) |

  **Images inventory (pre-pin):** `ghcr.io/know-me-tools/knowme-web:main` (k8s + compose — see 1.5), `ghcr.io/prometheus-ags/universal-agent-runtime:main` (k8s + compose), `ghcr.io/prometheus-ags/surreal-memory-server:main` (k8s + compose), `alpine:3.21` (`k8s/base/seed-job.yaml`), `surrealdb/surrealdb:v3.3.0@sha256:681c6c22...` (already pinned, unchanged).

- [x] 1.2 Resolve each action tag to its full 40-character commit SHA from the action's official repository, and rewrite each `uses:` as `owner/repo@<sha> # vX.Y.Z`.
  All six `uses:` lines in `.github/workflows/site.yml` rewritten to `owner/repo@<sha> # vX.Y.Z` using the SHAs in 1.1. `actionlint .github/workflows/site.yml` exits 0.

- [x] 1.3 Resolve the UAR image (`ghcr.io/prometheus-ags/universal-agent-runtime`) to a digest whose build contains #321 (and #324), verified from the image's build provenance or commit label; pin it as `:tag@sha256:<digest>` in `k8s/base/uar-deployment.yaml` and `docker-compose.yaml`.

  Pinned to `ghcr.io/prometheus-ags/universal-agent-runtime:main@sha256:94e4af0f524c3d9a4ec281c8e553909224ccfc212b6e87fac9f4a2bc0e2a7568` (the digest handed to this lane) in both `k8s/base/uar-deployment.yaml` and `docker-compose.yaml`. Verified, not just trusted:
  ```
  $ docker buildx imagetools inspect ghcr.io/prometheus-ags/universal-agent-runtime@sha256:94e4af0f524c3d9a4ec281c8e553909224ccfc212b6e87fac9f4a2bc0e2a7568
  # resolves an OCI image index: linux/amd64 + linux/arm64 manifests + attestation manifests.
  ```
  Fetched the SLSA provenance attestation blob (`ghcr.io/v2/.../blobs/sha256:c15e5deae276fd975d0b6f0630b1012056279de2552b3193a494447b30b1c96b`, `in-toto.io/predicate-type: https://slsa.dev/provenance/v1`):
  ```json
  "request": { "root": { "request": { "args": {
    "vcs:revision": "e73b5f674a15fda3c9910bdc10395b86b04796c7",
    "vcs:source": "https://github.com/Prometheus-AGS/universal-agent-runtime"
  }}}}
  ```
  `e73b5f674a15fda3c9910bdc10395b86b04796c7` is itself PR #324's merge commit (`gh`/GitHub API: `pulls/324.merge_commit_sha == e73b5f67...`, merged 2026-10-02T10:51:08Z). `pulls/321.merge_commit_sha == 19ec514c6415a6238f9c2d40f990a42b065d104a` (merged 2026-10-01T15:02:22Z); `compare/19ec514c...e73b5f67` reports `status: ahead, ahead_by: 16, behind_by: 0`, i.e. #321's merge commit is an ancestor of this digest's build commit. This also matches the independent evidence already on file in `uar-kb-retrieval-embedding` tasks.md 1.4 ("GHCR `main` = `sha-e73b5f67` (digest `sha256:94e4af0f…`)"). **Confirmed: the pinned digest's build contains both #321 and #324.**

- [x] 1.4 Resolve the memory-server image (`ghcr.io/prometheus-ags/surreal-memory-server`) to a digest and pin it in `k8s/base/memory-server-deployment.yaml` and `docker-compose.yaml`. Pin `alpine:3.21` in `k8s/base/seed-job.yaml` by digest too.
  `docker buildx imagetools inspect ghcr.io/prometheus-ags/surreal-memory-server:main` → `sha256:6315ca4a0f5f6bc503b2e4f8aed9c00f3ee7acf6b8cc10dbd03c28ffc62a8647` (linux/amd64 + linux/arm64 index); pinned in both files. `docker buildx imagetools inspect alpine:3.21` → `sha256:ce64758a109eb420d874a118f87920e625e12d3634e03b4a5573fd9f6e5d3507`; pinned in `k8s/base/seed-job.yaml`.

- [x] 1.5 Leave `knowme-web` as the CI-set digest (`kustomize edit set image … @${{ needs.image.outputs.digest }}`) and document that `ghcr.io/know-me-tools/knowme-web:main` in the base is replaced at deploy time; the check allows exactly this one exception.
  Unchanged in `k8s/base/knowme-web-deployment.yaml` (`:main`) and `k8s/base/kustomization.yaml`'s `images:` entry (still `newTag: main`, now the *only* entry there — see 1.3/1.4's note on why the uar/memory-server entries were removed from that transformer instead of left to conflict with their new direct pins). `scripts/check-pins.sh` hard-codes this one file+image pair as its only exception.

- [x] 1.6 Add `scripts/check-pins.sh`: fails if any `uses:` in `.github/workflows/` is not `@<40-hex>`, or any `image:` in `k8s/` or `docker-compose.yaml` lacks `@sha256:`, except the documented `knowme-web` base entry. Run it as the first step of the CI workflow.
  New `scripts/check-pins.sh` (`shellcheck -S warning` clean). Wired as the first step of the `verify` job in `.github/workflows/site.yml` (right after checkout, before setup-node/lint/test/build).

- [ ] 1.7 Record the pinned SHAs and digests in `versions.toml`, and note Dependabot (or Renovate) for SHA updates as the update path.
  `versions.toml` is operator-owned and denied to this lane (`.claude/settings.json`; this lane's ground rules). Proposed lines (operator to add under `[pins]`):
  ```toml
  "actions/checkout" = "3d3c42e5aac5ba805825da76410c181273ba90b1" # v7
  "actions/setup-node" = "820762786026740c76f36085b0efc47a31fe5020" # v7
  "docker/setup-buildx-action" = "f87e5991a6d7451dcb8d9637bfbc97413f497069" # v4
  "docker/login-action" = "dbcb813823bdd20940b903addbd779551569679f" # v4
  "docker/build-push-action" = "c3c9e263c25d99ce0380d002d59b67737d91b0dc" # v7
  "azure/setup-kubectl" = "829323503d1be3d00ca8346e5391ca0b07a9ab0d" # v5
  "ghcr.io/prometheus-ags/universal-agent-runtime" = "sha256:94e4af0f524c3d9a4ec281c8e553909224ccfc212b6e87fac9f4a2bc0e2a7568" # main as of 2026-10-02, contains #321 and #324
  "ghcr.io/prometheus-ags/surreal-memory-server" = "sha256:6315ca4a0f5f6bc503b2e4f8aed9c00f3ee7acf6b8cc10dbd03c28ffc62a8647" # main as of 2026-10-03
  "alpine" = "sha256:ce64758a109eb420d874a118f87920e625e12d3634e03b4a5573fd9f6e5d3507" # 3.21 as of 2026-10-03
  ```
  Update path: Renovate (`config:recommended`, already extended in `renovate.json`), with its `kubernetes` manager now pointed at `k8s/base/*.yaml` (the pins moved off the kustomize images transformer into the Deployment/StatefulSet/Job manifests themselves — see 1.3/1.4) and the default `github-actions` and `docker-compose` managers for the rest. `scripts/check-pins.sh` in CI is the backstop that fails a PR which re-introduces a tag.

- [x] 1.8 Mark `uar-jwks-es256` closable: record the pinned UAR digest and the evidence it carries #321.
  Recorded under 1.3 above: the pinned digest's build commit (`e73b5f67...`) is 16 commits ahead of, 0 behind, PR #321's merge commit (`19ec514c...`, "feat(security): verify ES256 tokens from JWKS issuers"). This lane does not own or edit `uar-jwks-es256`'s own files; flagging here for whoever closes that change.

- [ ] 1.9 Integration check: `scripts/check-pins.sh` exits 0 on the branch and exits non-zero on a scratch edit that reverts one action to a tag and one image to `:main`; `kubectl kustomize k8s/ | grep 'image:'` shows only `@sha256:` references; the CI run on the branch is green with the pin check executed. Evidence filed for §6.4 item 13.
  Local evidence (no CI run available from this lane):
  ```
  $ ./scripts/check-pins.sh
  [check-pins] all workflow actions are pinned by commit SHA and all images are pinned by digest (apart from the documented knowme-web exception).
  $ echo $?
  0

  # scratch mutation (reverted after, not committed): actions/checkout@v7 and
  # k8s/base/uar-deployment.yaml's image reverted to :main
  $ ./scripts/check-pins.sh
  [check-pins] FAIL: .github/workflows/site.yml:23: action not pinned by full commit SHA: actions/checkout@v7
  [check-pins] FAIL: .github/workflows/site.yml:47: action not pinned by full commit SHA: actions/checkout@v7
  [check-pins] FAIL: .github/workflows/site.yml:85: action not pinned by full commit SHA: actions/checkout@v7
  [check-pins] FAIL: k8s/base/uar-deployment.yaml:40: image not pinned by digest: ghcr.io/prometheus-ags/universal-agent-runtime:main
  $ echo $?
  1

  $ kubectl kustomize k8s/ | grep 'image:'
          image: ghcr.io/know-me-tools/knowme-web:main
          image: ghcr.io/prometheus-ags/surreal-memory-server:main@sha256:6315ca4a0f5f6bc503b2e4f8aed9c00f3ee7acf6b8cc10dbd03c28ffc62a8647
          image: ghcr.io/prometheus-ags/universal-agent-runtime:main@sha256:94e4af0f524c3d9a4ec281c8e553909224ccfc212b6e87fac9f4a2bc0e2a7568
          image: surrealdb/surrealdb:v3.3.0@sha256:681c6c22c287421b5c7d99e0fde79b6e0d32c36c1ddeaab2762a1661cb04cd20
  ```
  `knowme-web` is the one documented exception (1.5); every other rendered `image:` carries `@sha256:`. The "CI run on the branch is green with the pin check executed" half stays open — needs an actual CI run, not available from this lane.
