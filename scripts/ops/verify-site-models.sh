#!/usr/bin/env bash
# Operator step: verify the KnowMe site agents' models on the LIVE UAR.
#
# Why: UAR builds that include commit a42f23bb answer every chat run with HTTP 422
# `model_not_verified` until each model the agents use has been verified, and the
# receipt is voided by any provider edit or API key rotation. CI cannot do this (it
# cannot read the UAR admin key, by design), so the operator runs this script from
# their own shell after rolling the UAR image or rotating a provider key.
#
# Usage:
#   scripts/ops/verify-site-models.sh --context know-me [--web] [--smoke]
#   KUBE_CONTEXT=know-me scripts/ops/verify-site-models.sh --dry-run
#
# Flags:
#   --context <name>  kubectl context to use. REQUIRED (or KUBE_CONTEXT); there is no default,
#                     and the name must be `know-me` (the know-me LKE cluster), so this can
#                     never reach another cluster.
#   --web             also verify the web-search agent's model (uar/agents/knowme-site-web.json).
#   --smoke           after verifying, send ONE tiny chat request through the port-forward to the
#                     site agent and report the HTTP status and whether agui.done arrived. The
#                     answer text is never printed. This is a real LLM call.
#   --dry-run         print the plan and the resolved context, ports and agent files, then exit.
#                     Runs no kubectl and no curl.
#
# What it does:
#   1. Preflight (names and states only).
#   2. kubectl -n knowme port-forward svc/uar <free local port>:6565 in the background; a trap
#      always kills it. Waits up to ~5 minutes for /readyz (UAR takes 50 to 95 s to start).
#   3. Reads, inside this process, UAR's settings admin key (Secret uar-secrets, key
#      UAR_SECURITY__SETTINGS_ADMIN_KEY) and the gate client credentials (Secret site-gate-client,
#      keys SITE_GATE_CLIENT_ID and SITE_GATE_CLIENT_SECRET, the same ones seed-job.yaml uses).
#      UAR in the cluster accepts only gate-minted tokens (JWKS), so the Bearer is a gate
#      client-credentials token from https://gate.know-me.tools/oauth/token (override with
#      SITE_GATE_TOKEN_URL). Values go into shell variables and 0600 header files in a mktemp
#      directory removed on exit. They are never echoed, never placed on a command line and never
#      written to the repo.
#   4. Runs scripts/seed-site-agent.sh with SEED_MODE=verify, so the verification logic is the
#      seed's step 1c (POST /api/providers/<provider>/test {"model": ...}; one retry on 5xx;
#      fails on any error). Only provider/model ids, HTTP status, ok and latency_ms are printed.
#   5. With --smoke, one chat completion (see above).
# Exit status is non-zero on any failure.
#
# Test seams (env): KUBECTL (default kubectl), SITE_GATE_TOKEN_URL, LOCAL_PORT (default: first
# free port from 16565), READY_WAIT_SECS (default 300), NAMESPACE (default knowme).

set -euo pipefail

KUBECTL="${KUBECTL:-kubectl}"
NAMESPACE="${NAMESPACE:-knowme}"
EXPECTED_CONTEXT="know-me"
SITE_GATE_TOKEN_URL="${SITE_GATE_TOKEN_URL:-https://gate.know-me.tools/oauth/token}"
READY_WAIT_SECS="${READY_WAIT_SECS:-300}"
ADMIN_KEY_SECRET="uar-secrets"
ADMIN_KEY_NAME="UAR_SECURITY__SETTINGS_ADMIN_KEY"
GATE_SECRET="site-gate-client"
SITE_AGENT_FILE="uar/agents/knowme-site.json"
WEB_AGENT_FILE="uar/agents/knowme-site-web.json"

CONTEXT="${KUBE_CONTEXT:-}"
WITH_WEB=0
SMOKE=0
DRY_RUN=0

log() { printf '[verify-site-models] %s\n' "$*" >&2; }
die() {
  printf '[verify-site-models] ERROR: %s\n' "$*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --context)
      [[ $# -ge 2 ]] || die "--context requires a name"
      CONTEXT="$2"
      shift 2
      ;;
    --web) WITH_WEB=1; shift ;;
    --smoke) SMOKE=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h | --help)
      sed -n '2,/^set -euo pipefail/p' "$0" | sed '$d'
      exit 0
      ;;
    *) die "unknown argument: $1" ;;
  esac
done

[[ -n "$CONTEXT" ]] || die "no kubectl context given: pass --context $EXPECTED_CONTEXT (or set KUBE_CONTEXT); there is no default"
[[ "$CONTEXT" == "$EXPECTED_CONTEXT" ]] || die "context '$CONTEXT' is not the know-me cluster context '$EXPECTED_CONTEXT'; refusing"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"
for f in "$SITE_AGENT_FILE" scripts/seed-site-agent.sh; do
  [[ -f "$f" ]] || die "missing $f (run from a checkout of the repo)"
done
[[ "$WITH_WEB" == 0 ]] || [[ -f "$WEB_AGENT_FILE" ]] || die "missing $WEB_AGENT_FILE"

free_port() {
  local p="${LOCAL_PORT:-16565}"
  if [[ -n "${LOCAL_PORT:-}" ]]; then
    printf '%s' "$p"
    return
  fi
  while (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; do p=$((p + 1)); [[ "$p" -lt 16665 ]] || die "no free local port in 16565-16664"; done
  printf '%s' "$p"
}

if [[ "$DRY_RUN" == 1 ]]; then
  cat <<EOF
[verify-site-models] DRY RUN (no kubectl, no curl is run)
  kubectl context   $CONTEXT (required name: $EXPECTED_CONTEXT)
  namespace         $NAMESPACE
  local port        ${LOCAL_PORT:-first free from 16565}  ->  svc/uar:6565
  readiness wait    up to ${READY_WAIT_SECS}s on /readyz
  secrets read      $ADMIN_KEY_SECRET/$ADMIN_KEY_NAME, $GATE_SECRET/SITE_GATE_CLIENT_ID, $GATE_SECRET/SITE_GATE_CLIENT_SECRET (names only)
  gate token url    $SITE_GATE_TOKEN_URL
  agent files       $SITE_AGENT_FILE$([[ "$WITH_WEB" == 1 ]] && printf ', %s' "$WEB_AGENT_FILE")
  verification      SEED_MODE=verify scripts/seed-site-agent.sh (POST /api/providers/<provider>/test per distinct provider/model)
  smoke chat        $([[ "$SMOKE" == 1 ]] && echo "yes: one request to /api/chat/completion, agent $(jq -r '.id' "$SITE_AGENT_FILE")" || echo "no (pass --smoke)")
EOF
  exit 0
fi

for cmd in "$KUBECTL" curl jq base64; do
  command -v "$cmd" >/dev/null 2>&1 || die "required command not found: $cmd"
done

WORK="$(umask 077 && mktemp -d)"
PF_PID=""
cleanup() {
  [[ -z "$PF_PID" ]] || kill "$PF_PID" 2>/dev/null || true
  rm -rf "$WORK"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

kc() { "$KUBECTL" --context "$CONTEXT" -n "$NAMESPACE" "$@"; }

# ── 1. Preflight ────────────────────────────────────────────────────────────
log "kubectl context: $CONTEXT, namespace: $NAMESPACE"
"$KUBECTL" config get-contexts -o name | grep -qxF -- "$CONTEXT" || die "kubectl has no context named '$CONTEXT'"
kc get svc uar >/dev/null 2>&1 || die "svc/uar not found in namespace $NAMESPACE on context $CONTEXT"
for s in "$ADMIN_KEY_SECRET" "$GATE_SECRET"; do
  kc get secret "$s" >/dev/null 2>&1 || die "Secret $s not readable in namespace $NAMESPACE (needs operator credentials)"
  log "secret $s: present"
done

# ── 2. Port-forward ─────────────────────────────────────────────────────────
PORT="$(free_port)"
log "port-forward svc/uar 6565 -> 127.0.0.1:$PORT"
# Not through kc(): a backgrounded function runs in a subshell, and the trap would kill that
# subshell instead of kubectl itself, leaving the port-forward running.
"$KUBECTL" --context "$CONTEXT" -n "$NAMESPACE" port-forward svc/uar "$PORT:6565" >"$WORK/port-forward.log" 2>&1 &
PF_PID=$!
UAR_BASE="http://127.0.0.1:$PORT"
printf '[verify-site-models] waiting for /readyz (up to %ss)' "$READY_WAIT_SECS" >&2
deadline=$((SECONDS + READY_WAIT_SECS))
until curl -fsS -o /dev/null --max-time 3 "$UAR_BASE/readyz" 2>/dev/null; do
  kill -0 "$PF_PID" 2>/dev/null || {
    printf '\n' >&2
    die "port-forward exited early (see: kubectl logs of svc/uar, and your cluster access)"
  }
  [[ "$SECONDS" -lt "$deadline" ]] || {
    printf '\n' >&2
    die "UAR did not become ready within ${READY_WAIT_SECS}s"
  }
  printf '.' >&2
  sleep 2
done
printf ' ready\n' >&2

# ── 3. Credentials (kept in variables and 0600 files; never printed) ────────
secret_value() { # secret key
  local v
  v="$(kc get secret "$1" -o "jsonpath={.data.$2}")" || die "could not read Secret $1"
  [[ -n "$v" ]] || die "Secret $1 has no key $2"
  printf '%s' "$v" | base64 --decode
}
UAR_ADMIN_KEY="$(secret_value "$ADMIN_KEY_SECRET" "$ADMIN_KEY_NAME")"
SITE_GATE_CLIENT_ID="$(secret_value "$GATE_SECRET" SITE_GATE_CLIENT_ID)"
SITE_GATE_CLIENT_SECRET="$(secret_value "$GATE_SECRET" SITE_GATE_CLIENT_SECRET)"
export UAR_ADMIN_KEY SITE_GATE_CLIENT_ID SITE_GATE_CLIENT_SECRET SITE_GATE_TOKEN_URL
log "credentials read: admin key, gate client id and secret (values not shown)"

# ── 4. Verify, using the seed's step 1c ─────────────────────────────────────
log "verifying models (each is a real, tiny inference call)"
UAR_URL="$UAR_BASE" SEED_MODE=verify SEED_WEB_AGENT="$WITH_WEB" \
  AGENT_FILE="$SITE_AGENT_FILE" WEB_AGENT_FILE="$WEB_AGENT_FILE" \
  bash scripts/seed-site-agent.sh || die "model verification failed (see the messages above)"
# The seed continues past a 401/403 when no admin key is set; here a key is always set,
# so any refusal already failed the run.
log "model verification: PASS"

# ── 5. Optional smoke chat ──────────────────────────────────────────────────
if [[ "$SMOKE" == 1 ]]; then
  agent_id="$(jq -r '.id' "$SITE_AGENT_FILE")"
  body="$(printf 'data-urlencode = "client_secret=%s"\n' "$SITE_GATE_CLIENT_SECRET" |
    curl -sS --max-time 15 -X POST "$SITE_GATE_TOKEN_URL" -K - \
      --data-urlencode grant_type=client_credentials \
      --data-urlencode "client_id=${SITE_GATE_CLIENT_ID}")" || die "gate token request failed"
  token="$(jq -er '.access_token' <<<"$body" 2>/dev/null)" || die "gate returned no access_token"
  (umask 077 && printf 'Authorization: Bearer %s\n' "$token" >"$WORK/chat-auth")
  unset token body
  session="$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen)"
  log "smoke: one chat request to agent $agent_id"
  status="$(curl -sS -o "$WORK/chat.sse" -w '%{http_code}' --max-time 90 -X POST "$UAR_BASE/api/chat/completion" \
    -H "@$WORK/chat-auth" -H "X-UAR-Session-ID: $session" -H 'Content-Type: application/json' \
    --data-binary "$(jq -nc --arg a "$agent_id" '{agent_id:$a, message:"Reply with the single word: ok", stream:true, memory_enabled:false}')")" || status=000
  if grep -q '^event: *agui.done' "$WORK/chat.sse" 2>/dev/null; then done_seen=yes; else done_seen=no; fi
  log "smoke: HTTP $status, agui.done: $done_seen"
  [[ "$status" == 2?? && "$done_seen" == yes ]] || die "smoke chat failed: HTTP $status, agui.done $done_seen (error.code: $(jq -r '.error.code // "none"' "$WORK/chat.sse" 2>/dev/null || echo none))"
  log "smoke chat: PASS"
fi
log "done"
