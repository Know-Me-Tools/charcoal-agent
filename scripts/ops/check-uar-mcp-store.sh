#!/usr/bin/env bash
# Operator step: READ-ONLY look at the MCP servers the LIVE UAR has stored.
#
# Why: UAR copies the mcp.json server list into its settings database once, on the first
# start that finds the stored `mcp.servers` setting empty, and reads the database on every
# later start (UAR src/uar/admin/mcp.rs:220-223, `hydrate`; read at UAR commit aaf71da1,
# worktree uar-mcp-preapproved, not yet run against a live UAR). After that, editing the
# ConfigMap k8s/base/uar-mcp-configmap.yaml changes nothing for those servers. Before the
# web-search activation (docs/ops/web-search-activation.md, step 2) the operator needs to
# know whether the store is empty (the first start with the ConfigMap will seed it, so the
# ConfigMap must already be right) or already holds a `websearch` entry (the stored copy
# wins). This script answers that. It changes nothing.
#
# Usage:
#   scripts/ops/check-uar-mcp-store.sh --context know-me
#   KUBE_CONTEXT=know-me scripts/ops/check-uar-mcp-store.sh --dry-run
#
# Flags:
#   --context <name>  kubectl context to use. REQUIRED (or KUBE_CONTEXT); there is no default,
#                     and the name must be `know-me` (the know-me LKE cluster), so this can
#                     never reach another cluster.
#   --dry-run         print the plan and the resolved context, ports and route, then exit.
#                     Runs no kubectl and no curl.
#
# What it does:
#   1. Preflight (names and states only).
#   2. kubectl -n knowme port-forward svc/uar <free local port>:6565 in the background; a trap
#      always kills it. Waits up to ~5 minutes for /readyz (UAR takes 50 to 95 s to start).
#   3. Reads, inside this process, UAR's settings admin key (Secret uar-secrets, key
#      UAR_SECURITY__SETTINGS_ADMIN_KEY) and the gate client credentials (Secret
#      site-gate-client, keys SITE_GATE_CLIENT_ID and SITE_GATE_CLIENT_SECRET), exactly as
#      scripts/ops/verify-site-models.sh does. UAR in the cluster accepts only gate-minted
#      tokens, so the Bearer is a gate client-credentials token from
#      https://gate.know-me.tools/oauth/token (override with SITE_GATE_TOKEN_URL). Values go
#      into shell variables and 0600 header files in a mktemp directory removed on exit.
#      They are never echoed, never placed on a command line and never written to the repo.
#   4. Sends ONE request: GET /api/uar/mcp/servers (UAR src/server.rs:1921 nests
#      mcp_admin::build_router() at /api/uar/mcp; the list route is src/uar/api/mcp_admin.rs:107
#      and its handler `list_servers`, :230; the capability catalog marks it Admin/Read,
#      src/uar/api/administration_capabilities.rs:1510-1516, so both the Bearer and the
#      X-UAR-Admin-Key header are sent). The only HTTP method used against UAR is GET.
#      The one POST of the run goes to the gate's token endpoint.
#   5. Prints, per stored server: name, enabled, connected, and the URL as host:port only
#      (never the path, userinfo or headers). `preapproved_tools` is NOT shown by the API
#      (mcp_admin.rs:190 and :207 discard it with `preapproved_tools: _`), so this script
#      prints "not shown by the API" and never guesses. The response body is never printed.
#   Note: the list handler reads the stored `mcp.servers` setting and falls back to the
#   registry's entries only when settings storage is unavailable (mcp_admin.rs:134-151). An
#   empty list therefore means the stored setting is empty AND no server is registered.
# Exit status is non-zero on any failure (HTTP 401/403 and any other non-2xx included).
#
# Test seams (env): KUBECTL (default kubectl), SITE_GATE_TOKEN_URL, LOCAL_PORT (default: first
# free port from 16565), READY_WAIT_SECS (default 300), NAMESPACE (default knowme).
# Tests: scripts/ops/test-check-uar-mcp-store.sh.

set -euo pipefail

KUBECTL="${KUBECTL:-kubectl}"
NAMESPACE="${NAMESPACE:-knowme}"
EXPECTED_CONTEXT="know-me"
SITE_GATE_TOKEN_URL="${SITE_GATE_TOKEN_URL:-https://gate.know-me.tools/oauth/token}"
READY_WAIT_SECS="${READY_WAIT_SECS:-300}"
ADMIN_KEY_SECRET="uar-secrets"
ADMIN_KEY_NAME="UAR_SECURITY__SETTINGS_ADMIN_KEY"
GATE_SECRET="site-gate-client"
LIST_ROUTE="/api/uar/mcp/servers"

CONTEXT="${KUBE_CONTEXT:-}"
DRY_RUN=0

log() { printf '[check-uar-mcp-store] %s\n' "$*" >&2; }
die() {
  printf '[check-uar-mcp-store] ERROR: %s\n' "$*" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --context)
      [[ $# -ge 2 ]] || die "--context requires a name"
      CONTEXT="$2"
      shift 2
      ;;
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
[check-uar-mcp-store] DRY RUN (no kubectl, no curl is run)
  kubectl context   $CONTEXT (required name: $EXPECTED_CONTEXT)
  namespace         $NAMESPACE
  local port        ${LOCAL_PORT:-first free from 16565}  ->  svc/uar:6565
  readiness wait    up to ${READY_WAIT_SECS}s on /readyz
  secrets read      $ADMIN_KEY_SECRET/$ADMIN_KEY_NAME, $GATE_SECRET/SITE_GATE_CLIENT_ID, $GATE_SECRET/SITE_GATE_CLIENT_SECRET (names only)
  gate token url    $SITE_GATE_TOKEN_URL
  request           GET $LIST_ROUTE (the only call to UAR; read-only)
  prints            per stored MCP server: name, enabled, connected, url host:port; preapproved_tools: not shown by the API
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
contexts="$("$KUBECTL" config get-contexts -o name)" || die "kubectl config get-contexts failed"
grep -qxF -- "$CONTEXT" <<<"$contexts" || die "kubectl has no context named '$CONTEXT'"
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
printf '[check-uar-mcp-store] waiting for /readyz (up to %ss)' "$READY_WAIT_SECS" >&2
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
log "credentials read: admin key, gate client id and secret (values not shown)"

# The client secret reaches curl through a config on stdin (-K -), never argv.
body="$(printf 'data-urlencode = "client_secret=%s"\n' "$SITE_GATE_CLIENT_SECRET" |
  curl -sS --max-time 15 -X POST "$SITE_GATE_TOKEN_URL" -K - \
    --data-urlencode grant_type=client_credentials \
    --data-urlencode "client_id=${SITE_GATE_CLIENT_ID}")" || die "gate token request failed"
token="$(jq -er '.access_token' <<<"$body" 2>/dev/null)" || die "gate returned no access_token"
(umask 077 && printf 'Authorization: Bearer %s\n' "$token" >"$WORK/hdr-auth")
(umask 077 && printf 'X-UAR-Admin-Key: %s\n' "$UAR_ADMIN_KEY" >"$WORK/hdr-admin")
unset token body UAR_ADMIN_KEY SITE_GATE_CLIENT_ID SITE_GATE_CLIENT_SECRET

# ── 4. The one read ─────────────────────────────────────────────────────────
log "GET $LIST_ROUTE"
curl_rc=0
status="$(curl -sS -o "$WORK/servers.json" -w '%{http_code}' --max-time 30 -X GET "$UAR_BASE$LIST_ROUTE" \
  -H "@$WORK/hdr-auth" -H "@$WORK/hdr-admin")" || curl_rc=$?
status="${status:-000}"
[[ "$curl_rc" == 0 ]] || die "request to UAR failed (curl exit $curl_rc)"
case "$status" in
  2??) ;;
  401 | 403) die "UAR refused the request: HTTP $status (the gate token or the settings admin key was not accepted)" ;;
  *) die "UAR answered HTTP $status for GET $LIST_ROUTE" ;;
esac
jq -e '.servers | type == "array"' "$WORK/servers.json" >/dev/null 2>&1 || die "UAR answered HTTP $status but the body has no .servers array"

# ── 5. Report (names and flags only; never the body) ────────────────────────
count="$(jq -r '.servers | length' "$WORK/servers.json")"
if [[ "$count" == 0 ]]; then
  log "stored MCP servers: NONE (the list is empty)"
  log "meaning: the first UAR start with MCP_CONFIG_PATH set seeds the store from mcp.json, so the ConfigMap must be right before that start"
else
  log "stored MCP servers: $count"
  jq -r '.servers[] | [
      (.name // "?"),
      ((.enabled // false) | tostring),
      ((.connected // false) | tostring),
      ((.url // "") | if . == "" then "n/a" else (sub("^[A-Za-z][A-Za-z0-9+.-]*://"; "") | sub("^[^/?#@]*@"; "") | sub("[/?#].*$"; "")) end)
    ] | "  " + .[0] + "  enabled=" + .[1] + "  connected=" + .[2] + "  url=" + .[3] + "  preapproved_tools=not shown by the API"' \
    "$WORK/servers.json"
  log "meaning: these entries are what UAR loads at start; edits to mcp.json do NOT change them (UAR src/uar/admin/mcp.rs:220-223)"
fi
log "done (read-only: nothing was changed)"
