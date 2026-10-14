# Web search activation runbook

OpenSpec change `site-web-search`. Status when written (2026-10-13): everything is built and proven locally; nothing is deployed. The wiring is held on `origin/wip/websearch-activation` (commit `70ae502`). This runbook turns it on in production, in an order that can be stopped and undone at every step.

Every claim carries a source: `file:line`, or the local-proof evidence directory `E = .kbd-orchestrator/phases/site-chat-hardening-and-polish/evidence/13-local-web-search-proof/` (`RESULTS.md` and `README.md` there). UAR paths are in the UAR repo at commit `aaf71da1` (worktree `/Users/gqadonis/Projects/prometheus/worktrees/uar-mcp-preapproved`, the build of UAR PR #381). Where a statement is an inference from code and not something anyone ran, it says so.

The uncomfortable part, first. The local proof used a UAR with governance off ("Tool governance is inactive for this loopback-only process", `E/RESULTS.md`), so it could not show whether production makes the search wait for an approver. Pre-approval (`preapproved_tools`) is meant to prevent that, and it worked locally, but the production answer comes only from step 8. Chat goes down for the minutes UAR restarts (step 4). The Firecrawl credit cost per turn has not been measured at all.

## Who does what

- **Operator**: creates Secrets, makes the GHCR package public, runs the three `scripts/ops` checks, approves the privacy wording, owns the kill switch, merges and approves deploys.
- **Agent** (devops): prepares the activation PR, reads CI output, never sees a credential value.
- Nothing here asks anyone to paste a value into a chat, a command line, a file in the repo or a shell history.

## Facts the order depends on

### F1. UAR stores MCP servers after the first start, and the stored copy wins

- On every start UAR loads `mcp.json` (from `MCP_CONFIG_PATH`) into its registry, then `hydrate` runs: `seed = stored.is_empty() && !current.is_empty(); effective = if seed { current } else { stored }` (`src/uar/admin/mcp.rs:220-223`). An empty store adopts the file once and writes it to the settings database; every later start reads the database. The setting key is `mcp.servers` (`mcp_admin.rs:22`); the Surreal record is `settings:mcp_servers` (the local harness read it back, `E/16.6.2-B-config-check.json`: `readable: true`).
- So the **first** start with the ConfigMap mounted must already carry the right `url`, the `headers` `secret_ref` and `preapproved_tools: ["search"]`. A later edit of `k8s/base/uar-mcp-configmap.yaml` to any of those does **not** take effect.
- Changing or rolling back the `websearch` entry means emptying the stored `mcp.servers`, then restarting UAR so `hydrate` seeds from the file again. **This is an inference from the code, not yet run.** Candidate routes, neither run: `DELETE /api/uar/mcp/servers/websearch` (`mcp_admin.rs:108`; the capability catalogue marks it scope Host, `src/uar/api/administration_capabilities.rs:1524-1528`, so an operator token may be refused), or deleting the record `settings:mcp_servers` in SurrealDB with the database root credential. There is no script for either. Stop and ask for one (owner: devops) before doing it live.
- The admin API `PUT /api/uar/mcp/servers/{name}` **drops `preapproved_tools`**: it rebuilds the entry with `preapproved_tools: Default::default()` (`mcp_admin.rs:74` and `:87`). Never use it on `websearch`. A save from any UI that calls it silently turns pre-approval off and the search then waits for an approver.
- The listing hides the field (`mcp_admin.rs:190`, `:207`: `preapproved_tools: _`), which is why `scripts/ops/check-uar-mcp-store.sh` prints "not shown by the API" and does not guess.
- Rotating the Secret value needs no database change: the config uses `secret_ref: env:WEBSEARCH_MCP_AUTH` (`k8s/base/uar-mcp-configmap.yaml`), resolved at connect time. Rotation: patch the Secret, bump `credential_revision`, restart the wrapper then UAR (`scripts/ops/bootstrap-site.sh` header). `credential_revision` is inside the stored entry, so bumping it in the ConfigMap alone does not reach a store that already exists; the label is cosmetic for an existing store. (Inference from F1, not run.)
- UAR connects an MCP server at start. If the wrapper is not reachable then, `hydrate` logs "persisted MCP server could not reconnect" and goes on without it (`mcp.rs`, the `upsert_server` error arm); `design.md` 10.1 records the wrapper agent's finding that it may not retry. Start order: wrapper first, UAR second. The stored entry survives a failed connect, so the repair is a UAR restart once the wrapper is Ready, not a store edit.

### F2. UAR API keys are in memory; model receipts are per provider and model

- UAR keeps API keys only in process memory (`InMemoryApiKeyStorage`, `src/server.rs:1356-1357`, `src/uar/security/api_keys.rs:145-147`); a restart voids any key minted by `seed-site-agent.sh --mint-key-to-*`. In the cluster the site proxy uses gate-minted tokens, not such a key.
- Model verification receipts are settings entries keyed by a hash of `(provider, model)` (`src/uar/api/model_verification.rs:14-16`) and valid only while the provider configuration and credential revision still match their digest (`:18-35`). They are not keyed by agent. Both site agents use `openai` / `qwen3.8-max` (`uar/agents/knowme-site.json:26-27`, `uar/agents/knowme-site-web.json:27-28`), so seeding the web agent needs no new receipt and does not void one. A provider edit or key rotation does.
- Whether a receipt survives a UAR restart was not tested (`E/README.md`, "Unverified by the author"); the local harness re-verifies after every restart. Treat a restart as voiding it and verify after the last restart (step 6).

### F3. Seed versus verify: the resolved order

- CI seeds but cannot verify. `site.yml` deploy runs `seed-site-agent.sh` with defaults (`.github/workflows/site.yml:193-217`, the "Seed the site agent (idempotent, every deploy)" step): `SEED_MODE=all`, `SEED_WEB_AGENT=1`, so **every deploy already PUTs both agents**, `knowme-site-web` included. `site-content.yml sync=agent` runs the same script (`.github/workflows/site-content.yml:93-116`). Neither holds `UAR_ADMIN_KEY`, so the verification step logs "NOT VERIFIED" and continues (`scripts/seed-site-agent.sh`, `verify_models`, the `unauthorized` arm).
- `verify-site-models.sh --web` reads the agent **files**, runs `SEED_MODE=verify` (no PUT), and so does not need the web agent to be seeded (`scripts/ops/verify-site-models.sh`, step 4). Its `--smoke` chats with `knowme-site`, not the web agent.
- Therefore: seed and verify are independent of each other. The one constraint is that the operator's verify runs **after the last UAR restart** (step 4) and before the production tests (step 8). It does not have to be re-run after a later `sync=agent`, only after a provider edit, a key rotation, or another UAR restart.
- Unverified: whether the production `knowme-site-web` already exists (the deploy seed step probably created it) and whether UAR accepted its `mcp_servers: selected ["websearch"]` while no such server was registered (`design.md` section 11, "Not verified here").

### F4. `web_search: true` already reaches the web agent

- `SITE_WEB_AGENT_ID` is not set in any manifest (`k8s/base/knowme-web-deployment.yaml` sets `SITE_AGENT_ID` only). When absent it defaults to `knowme-site-web` (`server/src/config.rs:189-193`). So a request body with `web_search: true` is served by `knowme-site-web` today, whatever the build flag says; the flag only hides the composer toggle (`Dockerfile:34`, `src/stores/web-search-preference-store.ts`). This is what lets step 8 test production with the toggle hidden. It also means any scripted caller can reach web search once the tool works (T-W14, `design.md` section 11: accepted, the daily cap and the per-IP limits still apply).
- **Rollback correction:** "unset `SITE_WEB_AGENT_ID`" does **not** switch search off, because absent means the default id. Off means set it **empty** (or equal to `SITE_AGENT_ID`) (`config.rs:53-56`, `:189-193`). The manifest has no such entry today.

## Order, owner, command, check, rollback

Each step lists how to undo it. Do not start step N+1 before step N's check passes.

### 0. Preconditions (agent reads, operator confirms)

- The merged UAR pin in `k8s/base/uar-deployment.yaml:71` is `...@sha256:7dc13eb3dab4...` (UAR `3e6af7c4`, includes #381 `preapproved_tools`; its comment says "unused until the site-websearch wiring lands").
- Chat is healthy now. The latest `site.yml` run on `main` (run `38452962361`, head `7ef169c7`) deployed but its **Smoke test failed with HTTP 502** (`curl: (22) ... 502`); the run before it (`38424983383`) passed every job including the smoke test. The cause was not investigated here. Do not stack an activation on a red chat: find out why first (`kubectl -n knowme get pods`, `scripts/ops/verify-site-models.sh --context know-me --smoke`, which also covers the `model_not_verified` 422 case).
- The wrapper image exists: the same run's job "Build and push websearch image" succeeded.

### 1. Operator creates the Secrets and makes the image pullable

Never type a value as a command argument. Run in bash, from your own shell, with kubectl pointed at `know-me`.

```sh
# 1a. Firecrawl key: a dedicated key for this site only; set any monthly credit limit the
# Firecrawl plan offers on it. read -s keeps it off the screen and out of history; the
# value goes to a 0600 file (mktemp creates it 0600), then straight into the Secret.
tmp="$(mktemp)"
IFS= read -rsp 'Firecrawl API key: ' k; echo
printf 'FIRECRAWL_API_KEY=%s\n' "$k" >"$tmp"; unset k
kubectl --context know-me -n knowme create secret generic websearch-firecrawl --from-env-file="$tmp"
rm -f "$tmp"

# 1b. The UAR-to-wrapper shared value, `Bearer <token>`. printf is a shell builtin, so the
# token is not in a process listing; the patch file is 0600. (Pattern from
# scripts/ops/bootstrap-site.sh, header "Web search".)
tmp="$(mktemp)"
printf '{"stringData":{"WEBSEARCH_MCP_AUTH":"Bearer %s"}}' "$(openssl rand -hex 32)" >"$tmp"
kubectl --context know-me -n knowme patch secret uar-secrets --type merge --patch-file "$tmp"
rm -f "$tmp"
```

- 1c. Make the GHCR package `ghcr.io/know-me-tools/site-websearch` public (GitHub web UI: organisation Know-Me-Tools, Packages, site-websearch, Package settings, Change visibility), or add an `imagePullSecret`. New packages start private and the namespace has none (`k8s/base/websearch-deployment.yaml` header). Without this the pinned image sits in `ImagePullBackOff` (401/403), which reads like "not pinned yet". Not scriptable with `gh`; unverified that the package is still private.
- Check (names only): `kubectl --context know-me -n knowme get secret websearch-firecrawl uar-secrets`; then confirm the key exists without printing it: `kubectl --context know-me -n knowme get secret uar-secrets -o jsonpath='{.data}' | jq 'has("WEBSEARCH_MCP_AUTH")'` prints `true`.
- Patching `uar-secrets` changes nothing in a running pod; it is read at the next UAR start.
- Rollback: `kubectl --context know-me -n knowme delete secret websearch-firecrawl`; remove the key with `kubectl ... patch secret uar-secrets --type json -p '[{"op":"remove","path":"/data/WEBSEARCH_MCP_AUTH"}]'`. Revoke the Firecrawl key in Firecrawl.

### 2. Operator learns whether the stored `mcp.servers` is empty

```sh
scripts/ops/check-uar-mcp-store.sh --context know-me --dry-run   # the plan, no kubectl, no curl
scripts/ops/check-uar-mcp-store.sh --context know-me             # read-only: GET /api/uar/mcp/servers
```

- Expected today: `stored MCP servers: NONE`. The image ships no `mcp.json` and none has been mounted, so the first start with the ConfigMap will seed the store, and the ConfigMap must already be right (F1).
- If a `websearch` entry is already listed: the ConfigMap will be ignored for it. Compare its `url` (`site-websearch:8080`) and decide with the owner whether to empty it first (F1, inference). `preapproved_tools` cannot be read this way; the only way to know it is the step 8 behaviour.
- Rollback: none needed, read-only.

### 3. Pin the wrapper digest and merge the activation PR (agent prepares, operator merges)

The activation PR changes exactly these files on top of current `main`:

1. `k8s/base/kustomization.yaml`: add `uar-mcp-configmap.yaml` after `uar-configmap.yaml`, and `websearch-deployment.yaml`, `websearch-service.yaml`, `websearch-networkpolicy.yaml` after `memory-server-service.yaml` (the 8 added lines of `70ae502`).
2. `k8s/base/uar-deployment.yaml`: the 26 lines of `70ae502`: `env` `MCP_CONFIG_PATH=/etc/uar/mcp/mcp.json`; `WEBSEARCH_MCP_AUTH` from `uar-secrets` with `optional: true`; volumeMount `uar-mcp` at `/etc/uar/mcp` read-only; volume `uar-mcp` from ConfigMap `uar-mcp`. **Do not** take `git diff origin/main origin/wip/websearch-activation` as the patch: the branch predates the UAR pin and that diff also reverts the digest `7dc13eb...` to `e955789...` and deletes the `model_not_verified` bump runbook comment. Use `git show 70ae502 -- k8s/base/kustomization.yaml k8s/base/uar-deployment.yaml` and apply only those hunks.
3. `k8s/base/websearch-deployment.yaml`: replace the all-zero placeholder digest with the CI digest. Read it from the job output, do not guess:
   `gh run view <run-id> -R Know-Me-Tools/charcoal-agent --job <job-id> --log | grep "site-websearch digest"`.
   As of this writing, job "Build and push websearch image" of run `38452962361` (head `7ef169c7`) printed `sha256:ac3a75c48c13e71a40cefd31c66db8e63930e2f6fd2b9d7d551b6d7dfacbc86c`. (The first `Digest:` line in that log is a base-image pull, not the push; the push digest is the `containerimage.digest` and the `site-websearch digest` echo.) `websearch/` has not changed since `85a611e`, so any later main build is the same source; re-read the digest from the newest run at PR time and confirm the package pulls (step 1c).
4. Cosmetic and recommended: `k8s/base/uar-mcp-configmap.yaml` still says `preapproved_tools` is a "PLACEHOLDER ... NOT merged". It merged (UAR #381) and the local run proved the key name and effect (`E/RESULTS.md`, 16.6.2-A). Correct the comment in the same PR. The JSON stays as is: it must be right before the first start (F1).

No `SITE_WEB_AGENT_ID` entry is added now (the default already maps `web_search: true` to `knowme-site-web`, F4). Checks before merge: `kubectl kustomize k8s | kubectl apply --dry-run=client -f -` renders; a repository scan finds no key or token. Rollback: do not merge, or revert the PR.

### 4. Deploy rolls the wrapper and the UAR mount (`site.yml`)

- Merging to `main` triggers `site.yml`; the deploy job applies `kubectl kustomize k8s` (`.github/workflows/site.yml:183`), which creates `site-websearch` and changes the UAR pod template, so **UAR restarts and chat is down for roughly 50 to 95 s plus rollout** (UAR start time, `uar-deployment.yaml` probe comment). Closing chat for the window is the operator's call: `scripts/ops/bootstrap-site.sh kill-switch on` (chat refused, applies in about 10 s), then `kill-switch off` at the end.
- This is the first start with `MCP_CONFIG_PATH`: the store is seeded from the ConfigMap (F1). From here the stored copy wins.
- The deploy job then PUTs both agents (F3). The smoke test may fail with 422 `model_not_verified` until step 6; that is expected here, not a regression.
- Rollback: `kubectl --context know-me -n knowme rollout undo deployment/uar` restores the previous pod template (no mount, no env). It does **not** empty the store: UAR will still load a stored `websearch` it can no longer reach and log "could not reconnect" (inference, not run). `kubectl ... delete deployment site-websearch` removes the wrapper; reverting the PR removes both for good.

### 5. Confirm start order and connection

Wrapper Ready first, then UAR. Both roll in the same apply, and UAR is slower, so this usually holds; check instead of trusting it.

```sh
kubectl --context know-me -n knowme rollout status deployment/site-websearch --timeout=10m
kubectl --context know-me -n knowme rollout status deployment/uar --timeout=10m
scripts/ops/check-uar-mcp-store.sh --context know-me
```

- Expected line: `websearch  enabled=true  connected=true  url=site-websearch:8080  preapproved_tools=not shown by the API`.
- `connected=false`: the wrapper was not reachable at UAR's start. The stored entry is correct; run `kubectl --context know-me -n knowme rollout restart deployment/uar` once the wrapper is Ready (chat is down again for that restart).
- Wrapper in `CreateContainerConfigError`: a Secret or key from step 1 is missing. `ImagePullBackOff`: step 1c or the digest.
- Rollback: as step 4.

### 6. Operator verifies the live models, after the last restart

```sh
scripts/ops/verify-site-models.sh --context know-me --dry-run
scripts/ops/verify-site-models.sh --context know-me --web --smoke
```

Real, tiny inference calls (F2, F3). `--smoke` proves one `knowme-site` chat turn is a complete direct stream; it does not exercise the web agent. Re-run after any provider edit, key rotation or UAR restart that follows. Rollback: none (read and verify only).

### 7. Seed the web agent only if it is not already there

The deploy already PUT both agents (F3), so this is usually a no-op. If `knowme-site-web` is missing or the agent files changed without a deploy, dispatch `site-content.yml` with `sync=agent` (the operator approves the `production` environment). The seed is idempotent and never deletes an agent. It cannot verify models (F3); step 6 does not need repeating for a seed.

- Rollback: `SEED_MODE=agent SEED_WEB_AGENT=0` re-seeds `knowme-site` only (`scripts/seed-site-agent.sh`, header). The web agent stays registered, unused once step "off" below is applied. Switch the route off with `SITE_WEB_AGENT_ID` set empty (F4), not unset.

### 8. Test web search in production with the toggle still hidden

```sh
node scripts/ops/validate-live.mjs --base-url https://know-me.tools --web --timeout-ms 45000 --delay-ms 3000
```

`--web` adds the eight prompts P1 to P8 of `design.md` section 9, each sent with `web_search: true` (`scripts/ops/validate-live.mjs:365-366`); the server maps that to `knowme-site-web` (F4) even though the build flag hides the toggle. Pass means `PROBLEMS: 0` and, for web prompts, one "Searching the web" step, exactly one `agui.web_citations` frame after the step finishes and before `agui.done`, and every `[Wn]` resolved. The frame is **not** required before the first message delta: the model writes a preamble while the search runs (`E/README.md`, "Citation frame order"; `validate-live.mjs:30-33`). P3 needs a staged result and has none in production; it runs as a real search and proves only that nothing leaks. The run spends real LLM calls and up to about six Firecrawl searches of the daily cap of 300.

Then one real question, by hand (no secret in this request):

```sh
curl -sS -N --max-time 60 -X POST https://know-me.tools/api/chat/completion \
  -H 'Content-Type: application/json' -H "X-UAR-Session-ID: $(uuidgen)" \
  -d '{"message":"What happened in the news about Rust 2026 this week?","stream":true,"stream_mode":"dual","web_search":true}'
```

**Stop condition:** a web turn that shows the search step and then hangs about 20 s with no `agui.tool_result` and no `agui.done` means the tool is waiting for an approval nobody will give (pre-approval not applied, or lost to a `PUT`, F1). Do not retry. `scripts/ops/bootstrap-site.sh kill-switch on`, then roll back below, then check the store with `check-uar-mcp-store.sh`. The 20 s cap is the one the local harness used (`E/16.6.2-B-observation.json`); the local run could not tell approval from latency.

Also read: the Firecrawl dashboard credit delta for the run against the number of searches (`E/16.6.6-credits.json`: UNKNOWN, the wrapper does not log credits), and the wrapper's counter logs (`kubectl -n knowme logs deployment/site-websearch`: outcome codes only, never query text).

- Rollback (route off, no client release): add `SITE_WEB_AGENT_ID: ""` to the `knowme-web` env in `k8s/base/knowme-web-deployment.yaml` and deploy; emergency, until the next apply overwrites it: `kubectl --context know-me -n knowme set env deployment/knowme-web SITE_WEB_AGENT_ID=` (empty value; not run). Then `web_search: true` is ignored and `knowme-site` answers (`config.rs:53-56`). Pair with `SEED_WEB_AGENT=0` re-seed only if the agent itself must stop receiving updates.

### 9. Operator approves the toggle and privacy wording (before step 10)

Every visitor-facing string is DRAFT until approved: `content/site/web-search.ts` (toggle label, tooltip, on/off, "Web" source label, marker title) and the disclosure strings of `design.md` section 8 destined for `content/site/ai-disclosure.ts`, `about-panel.ts` and `chat-offline-states.ts` (task 16.8.5). The disclosure must say the search words go to a third-party search service. The operator approves the wording; the content owner edits the files and removes the DRAFT markers. This runbook does not change the copy. Rollback: not applicable (nothing deployed).

### 10. Show the toggle: set the build flag and deploy

Only after steps 8 and 9 pass. In `.github/workflows/site.yml` `build-args` (`:74-75`), add `VITE_SITE_WEB_SEARCH=1` under `VITE_SITE_AGENT_ID=knowme-site`. The Dockerfile passes it to the build (`Dockerfile:34-35`); empty keeps the toggle hidden. Merge and let the deploy roll `knowme-web` only (UAR is untouched, so no chat gap beyond the web pod roll). Then open the site, turn the toggle on once, check the consent text and one answer's "Web" Sources; capture 320 and 1440 px in both themes and look at them (project rule).

- Rollback: set the build arg back to empty and deploy (flag back to empty hides the toggle for new loads; visitors with stored "on" state see nothing because the toggle is gone, and the server route is still reachable by script until the step 8 rollback is applied). For a full stop: step 8 rollback plus kill switch.

## What this run order does not prove

- Production governance behaviour without pre-approval: unknown until step 8 (`E/RESULTS.md`, 16.6.2-B UNKNOWN: local-only, governance off).
- P2 (KB-first with the toggle on) and P6 (cost loop) are UNKNOWN locally: the KB was not seeded in the proof, and the model never searched twice. 16.6.5 (forced `activate_skill` under `auto` with the new tools) is UNKNOWN: the model never called it. Step 8 is the first real sight of these.
- Credits per web turn: UNKNOWN. The cap of 300 searches a day is a count, not money.
- The wrapper's egress is TCP 443 to any non-private address, not only `api.firecrawl.dev` (LKE runs Calico OSS, no FQDN policy; `design.md` 10.1).
- The daily-cap counter survives a container restart but not a new pod (`design.md` 10.1): after a rollout the worst day is `cap x (pods that day)`.
- Web citations carry no snippet (operator decision after the P3 finding; `design.md` section 4 and the spec). The server, client and validator changes for it are being made by another owner (tasks 16.4.3, 16.8.1 to 16.8.3); until they are merged, a build still forwards a snippet. Do step 3 with a `main` that has them.
