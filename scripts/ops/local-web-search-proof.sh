#!/usr/bin/env bash
# Local web-search proof harness (OpenSpec change site-web-search, tasks 16.6.1
# to 16.6.6). THE OPERATOR RUNS THIS with their own keys; no agent does.
#
#   bash scripts/ops/local-web-search-proof.sh --dry-run   # preflight and plan only
#   bash scripts/ops/local-web-search-proof.sh             # the real run
#
# What it does, in order (see the README in the evidence directory):
#   1. Preflight: env var NAMES (printed as set/MISSING, never the value), the
#      UAR binary, free ports, tools. Any failure stops the run before anything
#      starts. --dry-run reports the same and exits 0 without starting anything.
#   2. Builds the wrapper (websearch/) and the site server (server/) in release.
#   3. Starts, all on 127.0.0.1 or loopback-bound ports well away from the real
#      ones, under a mktemp directory: a local SurrealDB (UAR persistence and the
#      spend meter), the wrapper, UAR (twice more with other mcp.json files), a
#      stub wrapper for the injection fixture (P3), and the site server.
#   4. Seeds both agents with scripts/seed-site-agent.sh against that local UAR.
#   5. Runs web-proof-capture.mjs for each task and prints PASS/FAIL/UNKNOWN.
#   6. Always, on exit: kills what it started and removes the temp directory,
#      which holds the generated bearer token and the other generated secrets.
#
# It never touches the cluster, kubectl or the kill-switch ConfigMap. The one
# kill switch it uses is a file it creates in its own temp directory.
#
# Environment variable NAMES it reads (values are never printed):
#   FIRECRAWL_API_KEY            required; must be exported
#   LLM, one complete group:
#     QWEN_TOKEN_PLAN_OPENAI_URL + QWEN_TOKEN_PLAN_API_KEY  [QWEN_TOKEN_PLAN_MODEL]
#       (docker-compose.yaml; the agents are pinned to qwen3.8-max)
#     or OPENAI_API_KEY          (run-agent.sh; model from LWS_OPENAI_MODEL, default gpt-5.2)
#   Knowledge base embeddings (optional; without them the KB seed is skipped):
#     DASHSCOPE_OPENAI_URL + DASHSCOPE_API_KEY  [QWEN_EMBEDDING_MODEL QWEN_EMBEDDING_DIMENSIONS]
#     (with OPENAI_API_KEY alone, text-embedding-3-small at 1536 dimensions is used)
# Optional knobs: UAR_REPO, UAR_BIN, LWS_PORT_BASE (default 18100), LWS_EVIDENCE_DIR,
#   LWS_KEEP_LOGS=1 (keep process logs, which may hold prompts, in the temp dir),
#   LWS_UAR_CWD=repo (run UAR from its repository directory, as run-agent.sh does),
#   LWS_TURN_TIMEOUT_MS.

# SC2015: the pf_ok/pf_bad pairs always return 0, so A && B || C is safe here.
# SC2030/SC2031: each child process gets its environment in its own subshell on
# purpose, so a secret never enters this shell's exported environment.
# SC2329: cleanup runs from the EXIT trap.
# shellcheck disable=SC2015,SC2030,SC2031,SC2329

# Re-run under bash 4+ when the shell that started us is older (macOS ships 3.2,
# and scripts/seed-site-agent.sh needs associative arrays).
if [ "${BASH_VERSINFO[0]:-0}" -lt 4 ] && [ -x /opt/homebrew/bin/bash ] && [ -z "${LWS_REEXEC:-}" ]; then
  LWS_REEXEC=1 exec /opt/homebrew/bin/bash "$0" "$@"
fi

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DRY_RUN=0
SKIP_BUILD=0

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --skip-build) SKIP_BUILD=1 ;;
    -h | --help)
      sed -n '2,/^# Optional knobs/p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "unknown argument: $arg (use --dry-run, --skip-build or --help)" >&2
      exit 2
      ;;
  esac
done

BASE="${LWS_PORT_BASE:-18100}"
PORT_WRAP=$((BASE + 1))
PORT_STUB=$((BASE + 2))
PORT_UAR=$((BASE + 3))
PORT_SITE=$((BASE + 4))
PORT_SURREAL=$((BASE + 5))
PORT_GRPC=$((BASE + 6)) # UAR's A2A gRPC listener; its default 50051 collides with a UAR already running on the machine
EVIDENCE="${LWS_EVIDENCE_DIR:-$REPO_ROOT/.kbd-orchestrator/phases/site-chat-hardening-and-polish/evidence/13-local-web-search-proof}"
FIXTURE_WEB="$REPO_ROOT/server/tests/fixtures/web"
OPS="$REPO_ROOT/scripts/ops"

log() { printf '[web-proof] %s\n' "$*"; }
die() {
  printf '[web-proof] ERROR: %s\n' "$*" >&2
  exit 1
}

# ── 1. Preflight ─────────────────────────────────────────────────────────────
PF_FAIL=0
pf_ok() { printf '  %-9s %s\n' "[ok]" "$*"; }
pf_bad() {
  printf '  %-9s %s\n' "[PROBLEM]" "$*"
  PF_FAIL=1
}
env_state() { if [[ -n "${!1:-}" ]]; then printf 'set'; else printf 'MISSING'; fi; }
port_busy() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

resolve_uar_repo() {
  if [[ -n "${UAR_REPO:-}" ]]; then
    printf '%s' "$UAR_REPO"
    return
  fi
  # run-agent.sh uses ../../prometheus/universal-agent-runtime relative to the
  # main checkout. From a worktree that path differs, so start from the main
  # checkout (the parent of the shared .git directory).
  local common main
  common="$(git -C "$REPO_ROOT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
  main="${common%/.git}"
  [[ -n "$main" && -d "$main/../../prometheus/universal-agent-runtime" ]] && {
    (cd "$main/../../prometheus/universal-agent-runtime" && pwd)
    return
  }
  [[ -d "$REPO_ROOT/../../prometheus/universal-agent-runtime" ]] && (cd "$REPO_ROOT/../../prometheus/universal-agent-runtime" && pwd)
}

preflight() {
  log "preflight (names and states only; values are never printed)"
  echo "environment variables:"
  local n
  for n in FIRECRAWL_API_KEY QWEN_TOKEN_PLAN_OPENAI_URL QWEN_TOKEN_PLAN_API_KEY OPENAI_API_KEY DASHSCOPE_OPENAI_URL DASHSCOPE_API_KEY; do
    printf '  %-30s %s\n' "$n" "$(env_state "$n")"
  done
  [[ -n "${FIRECRAWL_API_KEY:-}" ]] && pf_ok "FIRECRAWL_API_KEY" || pf_bad "FIRECRAWL_API_KEY is not set (export it in your shell)"
  LLM_MODE=""
  if [[ -n "${QWEN_TOKEN_PLAN_OPENAI_URL:-}" && -n "${QWEN_TOKEN_PLAN_API_KEY:-}" ]]; then
    LLM_MODE="qwen"
  elif [[ -n "${OPENAI_API_KEY:-}" ]]; then
    LLM_MODE="openai"
  fi
  if [[ -n "$LLM_MODE" ]]; then pf_ok "LLM credentials: group '$LLM_MODE' is complete"; else pf_bad "no complete LLM group: set QWEN_TOKEN_PLAN_OPENAI_URL and QWEN_TOKEN_PLAN_API_KEY, or OPENAI_API_KEY"; fi
  KB_ENABLED=0
  if [[ "$LLM_MODE" == "qwen" && -n "${DASHSCOPE_OPENAI_URL:-}" && -n "${DASHSCOPE_API_KEY:-}" ]]; then
    KB_ENABLED=1
  elif [[ "$LLM_MODE" == "openai" ]]; then
    KB_ENABLED=1
  fi
  if [[ "$KB_ENABLED" == 1 ]]; then pf_ok "embedding credentials present: the knowledge base will be seeded"; else echo "  [note]    no embedding credentials: the KB seed is skipped; P2 and P8 KB citation checks report UNKNOWN"; fi

  echo "tools:"
  local c
  for c in curl jq openssl node cargo surreal; do
    command -v "$c" >/dev/null 2>&1 && pf_ok "$c" || pf_bad "$c not found on PATH"
  done
  if command -v node >/dev/null 2>&1; then
    local major
    major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
    [[ "$major" -ge 24 ]] && pf_ok "node $major (>= 24)" || pf_bad "node $major is older than 24 (versions.toml pin)"
  fi
  [[ "${BASH_VERSINFO[0]:-0}" -ge 4 ]] && pf_ok "bash ${BASH_VERSINFO[0]} (seed-site-agent.sh needs 4+)" || pf_bad "bash ${BASH_VERSINFO[0]:-3} is too old: run with /opt/homebrew/bin/bash (brew install bash)"

  echo "UAR binary:"
  UAR_REPO_DIR="$(resolve_uar_repo || true)"
  UAR_BIN="${UAR_BIN:-${UAR_REPO_DIR:+$UAR_REPO_DIR/target/release/universal-agent-runtime}}"
  if [[ -n "$UAR_BIN" && -x "$UAR_BIN" ]]; then
    pf_ok "found $UAR_BIN"
    if grep -aq 'preapproved_tools' "$UAR_BIN" 2>/dev/null; then
      pf_ok "binary contains the preapproved_tools field (UAR PR #381)"
    else
      pf_bad "binary does not contain 'preapproved_tools': it predates UAR PR #381. Build it: cd <UAR repo> && git switch main && git pull --ff-only && cargo build --release --bin universal-agent-runtime"
    fi
  else
    pf_bad "UAR binary not found (${UAR_BIN:-no UAR repo located}). Set UAR_REPO or UAR_BIN, or build: cd <UAR repo> && git switch main && git pull --ff-only && cargo build --release --bin universal-agent-runtime"
  fi

  echo "repository inputs:"
  local f
  for f in scripts/seed-site-agent.sh uar/agents/knowme-site.json uar/agents/knowme-site-web.json websearch/Cargo.toml server/Cargo.toml server/tests/fixtures/web/index.html scripts/ops/validate-live.mjs; do
    [[ -f "$REPO_ROOT/$f" ]] && pf_ok "$f" || pf_bad "$f is missing"
  done

  echo "ports (loopback, away from 6565 and 8080):"
  local p
  for p in "$PORT_WRAP:wrapper" "$PORT_STUB:fixture stub" "$PORT_UAR:UAR" "$PORT_SITE:site server" "$PORT_SURREAL:SurrealDB" "$PORT_GRPC:UAR gRPC"; do
    port_busy "${p%%:*}" && pf_bad "port ${p%%:*} (${p#*:}) is already in use; set LWS_PORT_BASE to move them" || pf_ok "port ${p%%:*} (${p#*:}) is free"
  done

  echo "temp and evidence:"
  [[ -d "${TMPDIR:-/tmp}" && -w "${TMPDIR:-/tmp}" ]] && pf_ok "temp directory ${TMPDIR:-/tmp} is writable" || pf_bad "temp directory ${TMPDIR:-/tmp} is not writable"
  pf_ok "evidence goes to ${EVIDENCE#"$REPO_ROOT"/}"
}

print_plan() {
  cat <<EOF

PLAN (nothing is started in --dry-run)
  temp dir        \${TMPDIR:-/tmp}/lws-proof.XXXXXX (mode 700; holds generated secrets; removed on exit)
  evidence dir    ${EVIDENCE#"$REPO_ROOT"/}
  ports           wrapper $PORT_WRAP, fixture stub $PORT_STUB, UAR $PORT_UAR, site server $PORT_SITE, SurrealDB $PORT_SURREAL
  1  build        cargo build --release for websearch/ and server/ (server with KNOWME_WEB_DIST_DIR=server/tests/fixtures/web)
  2  start        SurrealDB (rocksdb in the temp dir), meter user, wrapper (daily cap 20, local bearer token)
  3  start        UAR with mcp.json {websearch -> wrapper, preapproved_tools: ["search"]}
  4  seed         knowme-site, knowme-site-web (+ two budget variants), presentations, site API key, KB (best effort)
  5  start        site server (SITE_AGENT_ID=knowme-site, SITE_WEB_AGENT_ID=knowme-site-web, meter on the local SurrealDB)
  6  capture      16.6.1 direct + proxy, 16.6.2 (preapproved), 16.6.3 budget, 16.6.4 P1 P2 P4-P8, 16.6.5 activate_skill, 16.6.6 meter rows
  7  restart UAR  with the fixture stub as 'websearch': 16.6.4 P3 (injection fixture)
  8  restart UAR  with mcp.json WITHOUT preapproved_tools: 16.6.2 (20 s cap, reported as 'would wait')
  9  finish       secret scan of the evidence, PASS/FAIL/UNKNOWN table, teardown
EOF
}

preflight
if [[ "$DRY_RUN" == 1 ]]; then
  print_plan
  if [[ "$PF_FAIL" == 1 ]]; then
    echo
    log "dry run: preflight found problems (listed above); a real run would stop here. Exiting 0 because this is --dry-run."
  else
    echo
    log "dry run: preflight passed"
  fi
  exit 0
fi
[[ "$PF_FAIL" == 0 ]] || die "preflight failed; nothing was started"

# ── Setup: temp dir, secrets, cleanup trap ───────────────────────────────────
WORK="$(mktemp -d "${TMPDIR:-/tmp}/lws-proof.XXXXXX")"
chmod 700 "$WORK"
SECRETS="$WORK/secrets"
LOGS="$WORK/logs"
AGENTS="$WORK/agents"
mkdir -p "$SECRETS" "$LOGS" "$AGENTS" "$WORK/uar-cwd"
# UAR reads ./config.yaml first and ~/.uar/config.yaml only if it is absent, so an empty
# one keeps the operator's real config out of the proof.
printf '{}\n' >"$WORK/uar-cwd/config.yaml"
chmod 700 "$SECRETS"
PIDS=()

cleanup() {
  local rc=$?
  trap - EXIT INT TERM
  local pid
  for pid in ${PIDS[@]+"${PIDS[@]}"}; do kill "$pid" 2>/dev/null || true; done
  sleep 1
  for pid in ${PIDS[@]+"${PIDS[@]}"}; do kill -9 "$pid" 2>/dev/null || true; done
  if [[ "${LWS_KEEP_LOGS:-0}" == 1 ]]; then
    rm -rf "$SECRETS" "$WORK/surreal.db" "$WORK/kill-switch"
    echo "[web-proof] logs kept in $LOGS (they may hold prompts; do not send them). The secrets directory was removed."
  else
    rm -rf "$WORK"
  fi
  echo "[web-proof] teardown done (processes stopped, temp directory removed)."
  exit "$rc"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Generated, local-only secrets, written 0600 and never printed.
gen_secret() { (umask 077 && openssl rand -hex 32 >"$SECRETS/$1"); }
for s in jwt admin session surreal-root meter-pass; do gen_secret "$s"; done
(umask 077 && printf 'Bearer %s' "$(openssl rand -hex 32)" >"$SECRETS/mcp-auth")
(umask 077 && printf 'off' >"$WORK/kill-switch")
chmod 600 "$SECRETS"/* "$WORK/kill-switch"
UAR_URL="http://127.0.0.1:$PORT_UAR"
SITE_URL="http://127.0.0.1:$PORT_SITE"
SURREAL_URL="http://127.0.0.1:$PORT_SURREAL"
METER_USER="lwsmeter"

wait_http() { # url seconds label
  local deadline=$((SECONDS + $2))
  until curl -fsS -o /dev/null --max-time 2 "$1" 2>/dev/null; do
    ((SECONDS < deadline)) || {
      echo "[web-proof] ERROR: $3 did not become ready within $2 s (log: $LOGS; rerun with LWS_KEEP_LOGS=1 to keep it)" >&2
      return 1
    }
    sleep 1
  done
  log "$3 is ready"
}

# ── 2. Build ─────────────────────────────────────────────────────────────────
target_dir() { cargo metadata --no-deps --format-version 1 --manifest-path "$1" | jq -r .target_directory; }
if [[ "$SKIP_BUILD" == 0 ]]; then
  log "building the wrapper (release); output in $LOGS/build-websearch.log"
  cargo build --release --manifest-path "$REPO_ROOT/websearch/Cargo.toml" >"$LOGS/build-websearch.log" 2>&1 || die "wrapper build failed (rerun with LWS_KEEP_LOGS=1 to read the log)"
  log "building the site server (release, fixture web bundle); output in $LOGS/build-server.log"
  KNOWME_WEB_DIST_DIR="$FIXTURE_WEB" cargo build --release --manifest-path "$REPO_ROOT/server/Cargo.toml" >"$LOGS/build-server.log" 2>&1 || die "server build failed (rerun with LWS_KEEP_LOGS=1 to read the log)"
fi
WRAP_BIN="$(target_dir "$REPO_ROOT/websearch/Cargo.toml")/release/site-websearch"
SERVER_BIN="$(target_dir "$REPO_ROOT/server/Cargo.toml")/release/knowme-site-server"
[[ -x "$WRAP_BIN" ]] || die "wrapper binary not found at the expected release path (build without --skip-build)"
[[ -x "$SERVER_BIN" ]] || die "server binary not found at the expected release path (build without --skip-build)"

# ── LLM and embedding settings, as the UAR environment ──────────────────────
if [[ "$LLM_MODE" == "qwen" ]]; then
  LLM_MODEL="${QWEN_TOKEN_PLAN_MODEL:-qwen3.8-max}"
else
  LLM_MODEL="${LWS_OPENAI_MODEL:-gpt-5.2}"
fi
KB_DIMS="${QWEN_EMBEDDING_DIMENSIONS:-1024}"
KB_EMB_MODEL="${QWEN_EMBEDDING_MODEL:-text-embedding-v4}"
if [[ "$LLM_MODE" == "openai" ]]; then
  KB_DIMS=1536
  KB_EMB_MODEL=text-embedding-3-small
fi

start_surreal() {
  (
    export SURREAL_USER=root SURREAL_PASS
    SURREAL_PASS="$(<"$SECRETS/surreal-root")"
    exec surreal start --bind "127.0.0.1:$PORT_SURREAL" --log warn "rocksdb:$WORK/surreal.db"
  ) >"$LOGS/surreal.log" 2>&1 &
  PIDS+=($!)
}

start_wrapper() {
  (
    export WEBSEARCH_MCP_AUTH PORT="$PORT_WRAP" WEBSEARCH_DAILY_CAP=20 WEBSEARCH_CAP_STATE_FILE="$WORK/cap-state" RUST_LOG=info
    WEBSEARCH_MCP_AUTH="$(<"$SECRETS/mcp-auth")"
    exec "$WRAP_BIN"
  ) >"$LOGS/wrapper.log" 2>&1 &
  PIDS+=($!)
}

start_stub() {
  node "$OPS/web-proof-stub-mcp.mjs" --port "$PORT_STUB" --auth-file "$SECRETS/mcp-auth" >"$LOGS/stub.log" 2>"$LOGS/stub.err" &
  PIDS+=($!)
}

UAR_PID=""
start_uar() { # mcp.json path
  local cwd="$WORK/uar-cwd"
  [[ "${LWS_UAR_CWD:-}" == repo ]] && cwd="$UAR_REPO_DIR"
  (
    export PORT="$PORT_UAR" UAR_SERVER__PORT="$PORT_UAR" UAR_SERVER__HOST=127.0.0.1 UAR_SERVER__GRPC_PORT="$PORT_GRPC"
    export UAR_SECURITY__JWT_REQUIRED=false UAR_SECURITY__JWT_SECRET UAR_SECURITY__SETTINGS_ADMIN_KEY
    UAR_SECURITY__JWT_SECRET="$(<"$SECRETS/jwt")"
    UAR_SECURITY__SETTINGS_ADMIN_KEY="$(<"$SECRETS/admin")"
    export UAR_PERSISTENCE__PROVIDER=surreal UAR_PERSISTENCE__DATABASE_URL="$SURREAL_URL" UAR_PERSISTENCE__VECTOR_DIMENSION="$KB_DIMS"
    export UAR_PERSISTENCE__SURREAL_USER=root UAR_PERSISTENCE__SURREAL_PASS UAR_PERSISTENCE__SURREAL_AUTH_LEVEL=root
    export UAR_PERSISTENCE__SURREAL_NS=uar UAR_PERSISTENCE__SURREAL_DB=uar
    UAR_PERSISTENCE__SURREAL_PASS="$(<"$SECRETS/surreal-root")"
    export UAR_LLM__MODEL="openai/$LLM_MODEL" UAR_LLM__BASE_URL UAR_LLM__API_KEY
    if [[ "$LLM_MODE" == "qwen" ]]; then
      UAR_LLM__BASE_URL="$QWEN_TOKEN_PLAN_OPENAI_URL"
      UAR_LLM__API_KEY="$QWEN_TOKEN_PLAN_API_KEY"
    else
      UAR_LLM__BASE_URL="https://api.openai.com"
      UAR_LLM__API_KEY="$OPENAI_API_KEY"
    fi
    if [[ "$KB_ENABLED" == 1 ]]; then
      export UAR_LLM__EMBEDDING__BACKEND=openai UAR_LLM__EMBEDDING__MODEL="$KB_EMB_MODEL" UAR_LLM__EMBEDDING__VECTOR_DIMENSION="$KB_DIMS" UAR_LLM__EMBEDDING__BATCH_SIZE=10
      export UAR_LLM__EMBEDDING__BASE_URL UAR_LLM__EMBEDDING__API_KEY
      if [[ "$LLM_MODE" == "qwen" ]]; then
        UAR_LLM__EMBEDDING__BASE_URL="$DASHSCOPE_OPENAI_URL"
        UAR_LLM__EMBEDDING__API_KEY="$DASHSCOPE_API_KEY"
      else
        UAR_LLM__EMBEDDING__BASE_URL="https://api.openai.com"
        UAR_LLM__EMBEDDING__API_KEY="$OPENAI_API_KEY"
      fi
    fi
    export MCP_CONFIG_PATH="$1" WEBSEARCH_MCP_AUTH RUST_LOG=info
    WEBSEARCH_MCP_AUTH="$(<"$SECRETS/mcp-auth")"
    cd "$cwd"
    exec "$UAR_BIN"
  ) >"$LOGS/uar-$(basename "$1" .json).log" 2>&1 &
  UAR_PID=$!
  PIDS+=("$UAR_PID")
}

stop_uar() {
  if [[ -n "$UAR_PID" ]]; then
    kill "$UAR_PID" 2>/dev/null || true
    wait "$UAR_PID" 2>/dev/null || true
    UAR_PID=""
  fi
}

write_mcp() { # file url preapproved(0|1)
  jq -n --arg url "$2" --argjson pre "$3" '
    {mcpServers: {websearch: ({
      url: $url,
      headers: {Authorization: {secret_ref: "env:WEBSEARCH_MCP_AUTH", credential_revision: "local-proof"}}
    } + (if $pre == 1 then {preapproved_tools: ["search"]} else {} end))}}' >"$1"
}

# ── 3. Start SurrealDB, meter user, wrapper ──────────────────────────────────
log "starting SurrealDB on 127.0.0.1:$PORT_SURREAL"
start_surreal
wait_http "$SURREAL_URL/health" 60 "SurrealDB"
SQL_FILE="$SECRETS/meter-user.sql"
(umask 077 && printf "DEFINE NAMESPACE IF NOT EXISTS site; USE NS site; DEFINE DATABASE IF NOT EXISTS meter; USE NS site DB meter; DEFINE USER OVERWRITE %s ON DATABASE PASSWORD '%s' ROLES EDITOR;" "$METER_USER" "$(<"$SECRETS/meter-pass")" >"$SQL_FILE")
printf 'user = "root:%s"\n' "$(<"$SECRETS/surreal-root")" | curl -fsS --max-time 20 -K - -X POST -H 'Accept: application/json' --data-binary "@$SQL_FILE" -o "$LOGS/meter-init.json" "$SURREAL_URL/sql" || die "could not define the meter user"
! grep -q '"status":"ERR"' "$LOGS/meter-init.json" || die "defining the meter user returned an error (see LWS_KEEP_LOGS=1)"
log "meter user defined (ns=site, db=meter)"

log "starting the wrapper on port $PORT_WRAP (daily cap 20)"
start_wrapper
wait_http "http://127.0.0.1:$PORT_WRAP/healthz" 30 "wrapper"

# ── 4. mcp.json files and UAR ────────────────────────────────────────────────
MCP_PRE="$WORK/mcp-preapproved.json"
MCP_PLAIN="$WORK/mcp-plain.json"
MCP_FIXTURE="$WORK/mcp-fixture.json"
write_mcp "$MCP_PRE" "http://127.0.0.1:$PORT_WRAP/mcp" 1
write_mcp "$MCP_PLAIN" "http://127.0.0.1:$PORT_WRAP/mcp" 0
write_mcp "$MCP_FIXTURE" "http://127.0.0.1:$PORT_STUB/mcp" 1

log "starting UAR on port $PORT_UAR with mcp-preapproved.json"
start_uar "$MCP_PRE"
wait_http "$UAR_URL/readyz" 120 "UAR" || die "UAR did not start"

# ── 5. Agents, API key, KB ───────────────────────────────────────────────────
prep_agent() { jq --arg m "$LLM_MODEL" '.policy.provider.default.model = $m' "$1" >"$2"; }
prep_agent "$REPO_ROOT/uar/agents/knowme-site.json" "$AGENTS/knowme-site.json"
prep_agent "$REPO_ROOT/uar/agents/knowme-site-web.json" "$AGENTS/knowme-site-web.json"
MODEL_OVERRIDDEN="$(jq -r --arg m "$LLM_MODEL" '.policy.provider.default.model != $m' "$REPO_ROOT/uar/agents/knowme-site-web.json")"
for n in 1 4; do
  jq --argjson n "$n" --arg id "lws-budget-$n" '
    .id = $id | .metadata.title = ("Budget variant " + ($n | tostring))
    | .extensions.budgets.max_tool_calls_per_turn = $n
    | .prompt.system |= sub("at most once per reply"; "up to three times per reply")' \
    "$AGENTS/knowme-site-web.json" >"$AGENTS/lws-budget-$n.json"
  jq -e '.prompt.system | contains("up to three times per reply")' "$AGENTS/lws-budget-$n.json" >/dev/null || die "could not build the budget variant prompt (the web agent system prompt changed)"
done

seed() { # label, then env assignments via `env`-free exports in a subshell
  local label="$1"
  shift
  (
    cd "$REPO_ROOT"
    export UAR_URL UAR_JWT_SECRET
    UAR_JWT_SECRET="$(<"$SECRETS/jwt")"
    # shellcheck disable=SC2163
    for kv in "$@"; do export "$kv"; done
    exec "$BASH" scripts/seed-site-agent.sh ${SEED_EXTRA_ARGS[@]+"${SEED_EXTRA_ARGS[@]}"}
  ) >"$LOGS/seed-$label.log" 2>&1
}

log "seeding agents knowme-site and knowme-site-web, and the site API key"
SEED_EXTRA_ARGS=(--mint-key-to-file "$SECRETS/site-key")
seed agents SEED_MODE=agent SEED_WEB_AGENT=1 "AGENT_FILE=$AGENTS/knowme-site.json" "WEB_AGENT_FILE=$AGENTS/knowme-site-web.json" || die "agent seed failed (rerun with LWS_KEEP_LOGS=1 to read $LOGS/seed-agents.log)"
SEED_EXTRA_ARGS=()
[[ -s "$SECRETS/site-key" ]] || die "the seed did not mint the site API key"
for n in 1 4; do
  seed "budget-$n" SEED_MODE=agent SEED_WEB_AGENT=0 "AGENT_FILE=$AGENTS/lws-budget-$n.json" || die "budget variant $n seed failed"
done
log "agents seeded"

KB_SEEDED=0
if [[ "$KB_ENABLED" == 1 ]]; then
  log "seeding the knowledge base (best effort; a failure here is recorded, not fatal)"
  if seed kb SEED_MODE=kb "KB_EMBEDDING_PROVIDER=openai" "KB_EMBEDDING_MODEL=$KB_EMB_MODEL" "KB_VECTOR_DIMENSIONS=$KB_DIMS" "INGEST_WAIT_SECS=240"; then
    KB_SEEDED=1
    log "knowledge base seeded and FR-8 checks passed"
  else
    log "knowledge base seed FAILED: P2 and P8 KB checks will report UNKNOWN (LWS_KEEP_LOGS=1 keeps $LOGS/seed-kb.log)"
  fi
else
  log "knowledge base seed skipped (no embedding credentials)"
fi

# ── 6. Site server ───────────────────────────────────────────────────────────
log "starting the site server on port $PORT_SITE"
(
  export UAR_UPSTREAM="$UAR_URL" SITE_PROXY_API_KEY SITE_SESSION_SECRET SITE_METER_PASS
  SITE_PROXY_API_KEY="$(<"$SECRETS/site-key")"
  SITE_SESSION_SECRET="$(<"$SECRETS/session")"
  SITE_METER_PASS="$(<"$SECRETS/meter-pass")"
  export SITE_AGENT_ID=knowme-site SITE_WEB_AGENT_ID=knowme-site-web SITE_METER_URL="$SURREAL_URL" SITE_METER_USER="$METER_USER"
  export SITE_KILL_SWITCH_FILE="$WORK/kill-switch" KNOWME_WEB_ROOT="$FIXTURE_WEB" PORT="$PORT_SITE"
  export CHAT_RATE_PER_MIN=600 CHAT_BURST=100 RUST_LOG=info
  exec "$SERVER_BIN"
) >"$LOGS/server.log" 2>&1 &
PIDS+=($!)
wait_http "$SITE_URL/readyz" 60 "site server" || die "site server did not become ready"

# ── 7. Capture ───────────────────────────────────────────────────────────────
mkdir -p "$EVIDENCE"
rm -f "$EVIDENCE"/result-*.json "$EVIDENCE/SUMMARY.json" "$EVIDENCE/scan.json"
capture() { # step [extra flags]
  local s="$1"
  shift
  log "capture: $s"
  node "$OPS/web-proof-capture.mjs" "$s" --out "$EVIDENCE" --uar "$UAR_URL" --site "$SITE_URL" \
    --site-key-file "$SECRETS/site-key" --wrapper-log "$LOGS/wrapper.log" "$@" || log "step '$s' failed (exit $?); it will show as not run"
}

capture direct
capture budget
capture prompts
capture skill
capture meter --surreal "$SURREAL_URL" --surreal-root-file "$SECRETS/surreal-root"

log "restarting UAR with the injection fixture standing in for the wrapper (P3)"
stop_uar
start_stub
wait_http "http://127.0.0.1:$PORT_STUB/healthz" 20 "fixture stub"
start_uar "$MCP_FIXTURE"
wait_http "$UAR_URL/readyz" 120 "UAR (fixture)" && capture fixture --stub-log "$LOGS/stub.log"

log "restarting UAR with an mcp.json WITHOUT preapproved_tools (16.6.2, 20 s cap)"
stop_uar
start_uar "$MCP_PLAIN"
wait_http "$UAR_URL/readyz" 120 "UAR (no pre-approval)" && capture approval-off
stop_uar

# ── 8. Run info, sanitised wrapper log, scan, summary ───────────────────────
jq -R -c 'fromjson? | select(.fields.message? == "search") | {timestamp, outcome: .fields.outcome, used_today: .fields.used_today, upstream_hits: .fields.upstream_hits, results: .fields.results}' "$LOGS/wrapper.log" >"$EVIDENCE/wrapper-search-log.jsonl" || true
jq -R -c 'fromjson? | select(.fields.message? == "search") | {outcome: .fields.outcome, fixture: .fields.fixture}' "$LOGS/stub.log" >"$EVIDENCE/stub-search-log.jsonl" 2>/dev/null || true
UAR_COMMIT="$(git -C "$UAR_REPO_DIR" rev-parse --short HEAD 2>/dev/null || echo unknown)"
jq -n \
  --arg date "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg repo_commit "$(git -C "$REPO_ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)" \
  --arg uar_checkout_head "$UAR_COMMIT" \
  --arg uar_binary_mtime "$(date -u -r "$UAR_BIN" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo unknown)" \
  --arg llm_group "$LLM_MODE" --arg model "$LLM_MODEL" \
  --argjson model_overridden "$MODEL_OVERRIDDEN" \
  --argjson kb_seeded "$KB_SEEDED" \
  --arg node "$(node -p process.versions.node)" \
  --arg surreal "$(surreal version 2>/dev/null | head -n1 || echo unknown)" \
  --argjson ports "{\"wrapper\":$PORT_WRAP,\"stub\":$PORT_STUB,\"uar\":$PORT_UAR,\"site\":$PORT_SITE,\"surreal\":$PORT_SURREAL}" \
  '{date:$date, repo_commit:$repo_commit, uar_checkout_head_not_necessarily_the_binary:$uar_checkout_head, uar_binary_mtime:$uar_binary_mtime,
    llm_group:$llm_group, model:$model, agent_model_overridden_from_committed_file:$model_overridden, kb_seeded:($kb_seeded==1),
    node:$node, surreal:$surreal, ports:$ports, wrapper_daily_cap:20}' >"$EVIDENCE/run-info.json"

capture scan --env-names "FIRECRAWL_API_KEY,QWEN_TOKEN_PLAN_API_KEY,DASHSCOPE_API_KEY,OPENAI_API_KEY" \
  --secret-files "mcp-auth=$SECRETS/mcp-auth,site-key=$SECRETS/site-key,jwt=$SECRETS/jwt,admin=$SECRETS/admin,session=$SECRETS/session,surreal-root=$SECRETS/surreal-root,meter-pass=$SECRETS/meter-pass"

RC=0
node "$OPS/web-proof-capture.mjs" summary --out "$EVIDENCE" || RC=$?
log "evidence written to ${EVIDENCE#"$REPO_ROOT"/}"
exit "$RC"
