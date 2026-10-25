#!/usr/bin/env bash
# Operator step: run the concierge scenarios against CANDIDATE copies of the site agents on the
# LIVE UAR, before a prompt change is merged. Production agents are never touched.
#
# Why: site.yml reseeds knowme-site and knowme-site-web on every push to main, so a merged prompt is
# live to visitors at once. This script puts the new prompts on two throwaway agents, sends the
# scenarios in docs/knowledge-source/eval/concierge-scenarios.json through the same
# /api/chat/completion route the site server uses, applies pass and critical-fail assertions,
# prints a table, stores transcripts and deletes the candidates.
#
# Usage:
#   scripts/ops/check-candidate-agent.sh --context know-me
#   AGENT_FILE=uar/agents/knowme-site.json WEB_AGENT_FILE=uar/agents/knowme-site-web.json \
#     scripts/ops/check-candidate-agent.sh --context know-me
#   scripts/ops/check-candidate-agent.sh --context know-me --only soc2,sample-code
#   scripts/ops/check-candidate-agent.sh --context know-me --dry-run
#   scripts/ops/check-candidate-agent.sh --context know-me --cleanup-only
#
# Flags:
#   --context <name>  kubectl context. REQUIRED (or KUBE_CONTEXT); must be `know-me`.
#   --only <ids>      comma-separated scenario ids to run (default: all).
#   --keep            leave the candidate agents registered afterwards (for manual chats).
#   --cleanup-only    delete the two candidate agents and exit; sends no chat.
#   --dry-run         print the plan and exit. Runs no kubectl, curl or git.
#
# Env:
#   AGENT_FILE, WEB_AGENT_FILE  agent artifacts to test. Default: uar/agents/knowme-site.json and
#                     knowme-site-web.json as they are on $CANDIDATE_REF (default
#                     origin/feat/concierge-agent-prompt, PR #165), read with `git show` after a
#                     read-only `git fetch`. After #165 merges, point these at the checked-out files.
#   CANDIDATE_REF     git ref for the defaults above.
#   SCENARIOS_FILE    default docs/knowledge-source/eval/concierge-scenarios.json
#   OUT_ROOT          transcripts go to $OUT_ROOT/<UTC timestamp>/ (default logs/candidate-eval, which
#                     .gitignore already excludes).
#   KUBECTL, NAMESPACE (default knowme), SITE_GATE_TOKEN_URL, READY_WAIT_SECS (default 300),
#   LOCAL_PORT, REQUEST_TIMEOUT_SECS (default 150).
#
# Safety, in the order it matters:
#   - Only the ids knowme-site-candidate and knowme-site-web-candidate are ever written or deleted.
#     They are constants in this script, not read from the files; the files' ids are rewritten in a
#     temp copy (scripts/ops/check-candidate-agent.mjs prepare) and the PUT path is built from the
#     constants after assert_candidate_id. It does NOT call scripts/seed-site-agent.sh: that script
#     also writes the shared presentation templates and, in other modes, the knowledge base.
#   - The candidates read the production knowledge base `knowme-site` (read-only retrieval). No KB
#     or template write happens here.
#   - It reads only Secret site-gate-client (gate client id and secret) and uses them for one token
#     request. Values stay in shell variables and 0600 files in a temp dir removed on exit; they are
#     never echoed, logged, put on a command line, or written to the repo or to the transcripts.
#   - It does not read, patch or mention the ConfigMap site-chat-kill-switch or the repo variable
#     SITE_CHAT_KILL_SWITCH_EXPECTED.
#   - Chats go straight to UAR through a port-forward, so they bypass the site server's rate limit,
#     spend meter and artifact filter. They are real LLM calls: about 11 runs.
#
# Exit status: 0 all pass; 1 a CRITICAL FAIL; 2 a FAIL on a pass criterion; 3 a run did not
# complete; 64 setup error.

set -euo pipefail

KUBECTL="${KUBECTL:-kubectl}"
NAMESPACE="${NAMESPACE:-knowme}"
EXPECTED_CONTEXT="know-me"
SITE_GATE_TOKEN_URL="${SITE_GATE_TOKEN_URL:-https://gate.know-me.tools/oauth/token}"
READY_WAIT_SECS="${READY_WAIT_SECS:-300}"
REQUEST_TIMEOUT_SECS="${REQUEST_TIMEOUT_SECS:-150}"
GATE_SECRET="site-gate-client"
CANDIDATE_REF="${CANDIDATE_REF:-origin/feat/concierge-agent-prompt}"
SCENARIOS_FILE="${SCENARIOS_FILE:-docs/knowledge-source/eval/concierge-scenarios.json}"
OUT_ROOT="${OUT_ROOT:-logs/candidate-eval}"
CAND_DEFAULT_ID="knowme-site-candidate"
CAND_WEB_ID="knowme-site-web-candidate"

CONTEXT="${KUBE_CONTEXT:-}"
ONLY=""
KEEP=0
CLEANUP_ONLY=0
DRY_RUN=0

log() { printf '[check-candidate-agent] %s\n' "$*" >&2; }
die() {
  printf '[check-candidate-agent] ERROR: %s\n' "$*" >&2
  exit 64
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --context)
      [[ $# -ge 2 ]] || die "--context requires a name"
      CONTEXT="$2"
      shift 2
      ;;
    --only)
      [[ $# -ge 2 ]] || die "--only requires scenario ids"
      ONLY="$2"
      shift 2
      ;;
    --keep) KEEP=1; shift ;;
    --cleanup-only) CLEANUP_ONLY=1; shift ;;
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
HELPER="scripts/ops/check-candidate-agent.mjs"
[[ -f "$HELPER" && -f "$SCENARIOS_FILE" ]] || die "missing $HELPER or $SCENARIOS_FILE (run from a checkout of the repo)"

# The only agent ids this script may write or delete.
assert_candidate_id() {
  case "$1" in
    "$CAND_DEFAULT_ID" | "$CAND_WEB_ID") return 0 ;;
    *) die "internal guard: '$1' is not a candidate agent id; refusing" ;;
  esac
}

if [[ "$DRY_RUN" == 1 ]]; then
  cat <<EOF
[check-candidate-agent] DRY RUN (no kubectl, curl or git is run)
  kubectl context   $CONTEXT (required name: $EXPECTED_CONTEXT), namespace $NAMESPACE
  agent sources     ${AGENT_FILE:-uar/agents/knowme-site.json @ $CANDIDATE_REF}, ${WEB_AGENT_FILE:-uar/agents/knowme-site-web.json @ $CANDIDATE_REF}
  writes (only)     agents $CAND_DEFAULT_ID and $CAND_WEB_ID via PUT/POST /api/agents/<id>
  deletes (only)    the same two agents, on exit$([[ "$KEEP" == 1 ]] && echo " (skipped: --keep)")
  never touches     knowme-site, knowme-site-web, presentation templates, the KB, site-chat-kill-switch, SITE_CHAT_KILL_SWITCH_EXPECTED
  secrets read      $GATE_SECRET/SITE_GATE_CLIENT_ID, $GATE_SECRET/SITE_GATE_CLIENT_SECRET (names only)
  scenarios         $SCENARIOS_FILE${ONLY:+ (only: $ONLY)}
  transcripts       $OUT_ROOT/<timestamp>/ (gitignored)
  chats             $([[ "$CLEANUP_ONLY" == 1 ]] && echo "none (--cleanup-only)" || echo "real LLM calls, one per scenario and agent")
EOF
  exit 0
fi

for cmd in "$KUBECTL" curl jq base64 node; do
  command -v "$cmd" >/dev/null 2>&1 || die "required command not found: $cmd"
done

WORK="$(umask 077 && mktemp -d)"
PF_PID=""
SEEDED=()
UAR_BASE=""
# shellcheck disable=SC2329 # invoked by the EXIT trap below
cleanup() {
  local id st
  if [[ "$KEEP" == 0 && ${#SEEDED[@]} -gt 0 && -n "$UAR_BASE" && -f "$WORK/auth" ]]; then
    for id in "${SEEDED[@]}"; do
      assert_candidate_id "$id"
      st="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 20 -X DELETE "$UAR_BASE/api/agents/$id" -H "@$WORK/auth" 2>/dev/null)" || st=000
      case "$st" in
        2??) log "cleanup: deleted agent $id (HTTP $st)" ;;
        *) log "cleanup: could NOT delete agent $id (HTTP $st). DELETE /api/agents/<id> is not confirmed against UAR in this repo. The candidate is inert (the site routes only to its configured ids) but remains registered: delete it with UAR's admin tooling, or re-run with --cleanup-only after checking the route." ;;
      esac
    done
  elif [[ "$KEEP" == 1 && ${#SEEDED[@]} -gt 0 ]]; then
    log "--keep: candidate agents left registered: ${SEEDED[*]} (remove with --cleanup-only)"
  fi
  [[ -z "$PF_PID" ]] || kill "$PF_PID" 2>/dev/null || true
  rm -rf "$WORK"
}
trap cleanup EXIT
trap 'exit 130' INT TERM

kc() { "$KUBECTL" --context "$CONTEXT" -n "$NAMESPACE" "$@"; }

# ── 1. Resolve and rewrite the agent files ──────────────────────────────────
if [[ "$CLEANUP_ONLY" == 0 ]]; then
  SRC_DEFAULT="${AGENT_FILE:-}"
  SRC_WEB="${WEB_AGENT_FILE:-}"
  if [[ -z "$SRC_DEFAULT" || -z "$SRC_WEB" ]]; then
    command -v git >/dev/null 2>&1 || die "git not found (needed to read the default agent files from $CANDIDATE_REF)"
    if [[ "$CANDIDATE_REF" == origin/* ]]; then
      git fetch -q origin "${CANDIDATE_REF#origin/}" || die "git fetch origin ${CANDIDATE_REF#origin/} failed"
    fi
    if [[ -z "$SRC_DEFAULT" ]]; then
      git show "$CANDIDATE_REF:uar/agents/knowme-site.json" >"$WORK/src-default.json" || die "cannot read uar/agents/knowme-site.json at $CANDIDATE_REF"
      SRC_DEFAULT="$WORK/src-default.json"
    fi
    if [[ -z "$SRC_WEB" ]]; then
      git show "$CANDIDATE_REF:uar/agents/knowme-site-web.json" >"$WORK/src-web.json" || die "cannot read uar/agents/knowme-site-web.json at $CANDIDATE_REF"
      SRC_WEB="$WORK/src-web.json"
    fi
  fi
  [[ -f "$SRC_DEFAULT" && -f "$SRC_WEB" ]] || die "agent file not found: $SRC_DEFAULT / $SRC_WEB"
  node "$HELPER" prepare --agent "$SRC_DEFAULT" --web "$SRC_WEB" --out-dir "$WORK/candidates" >/dev/null || die "could not prepare candidate files"
  for pair in "$CAND_DEFAULT_ID" "$CAND_WEB_ID"; do
    [[ "$(jq -r '.id' "$WORK/candidates/$pair.json")" == "$pair" ]] || die "candidate file for $pair has the wrong id after rewrite"
  done
  log "candidate files ready: ids $CAND_DEFAULT_ID and $CAND_WEB_ID (source ids rewritten in a temp copy)"
fi

# ── 2. Preflight and port-forward ───────────────────────────────────────────
log "kubectl context: $CONTEXT, namespace: $NAMESPACE"
contexts="$("$KUBECTL" config get-contexts -o name)" || die "kubectl config get-contexts failed"
grep -qxF -- "$CONTEXT" <<<"$contexts" || die "kubectl has no context named '$CONTEXT'"
kc get svc uar >/dev/null 2>&1 || die "svc/uar not found in namespace $NAMESPACE on context $CONTEXT"
kc get secret "$GATE_SECRET" >/dev/null 2>&1 || die "Secret $GATE_SECRET not readable in namespace $NAMESPACE (needs operator credentials)"

free_port() {
  local p="${LOCAL_PORT:-16565}"
  if [[ -n "${LOCAL_PORT:-}" ]]; then
    printf '%s' "$p"
    return
  fi
  while (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; do p=$((p + 1)); [[ "$p" -lt 16665 ]] || die "no free local port in 16565-16664"; done
  printf '%s' "$p"
}
PORT="$(free_port)"
log "port-forward svc/uar 6565 -> 127.0.0.1:$PORT"
# Not through kc(): a backgrounded function runs in a subshell and the trap would not kill kubectl.
"$KUBECTL" --context "$CONTEXT" -n "$NAMESPACE" port-forward svc/uar "$PORT:6565" >"$WORK/port-forward.log" 2>&1 &
PF_PID=$!
base="http://127.0.0.1:$PORT"
printf '[check-candidate-agent] waiting for /readyz (up to %ss)' "$READY_WAIT_SECS" >&2
deadline=$((SECONDS + READY_WAIT_SECS))
until curl -fsS -o /dev/null --max-time 3 "$base/readyz" 2>/dev/null; do
  kill -0 "$PF_PID" 2>/dev/null || {
    printf '\n' >&2
    die "port-forward exited early (check your cluster access)"
  }
  [[ "$SECONDS" -lt "$deadline" ]] || {
    printf '\n' >&2
    die "UAR did not become ready within ${READY_WAIT_SECS}s"
  }
  printf '.' >&2
  sleep 2
done
printf ' ready\n' >&2

# ── 3. Gate token (never printed) ───────────────────────────────────────────
secret_value() { # secret key
  local v
  v="$(kc get secret "$1" -o "jsonpath={.data.$2}")" || die "could not read Secret $1"
  [[ -n "$v" ]] || die "Secret $1 has no key $2"
  printf '%s' "$v" | base64 --decode
}
client_id="$(secret_value "$GATE_SECRET" SITE_GATE_CLIENT_ID)"
client_secret="$(secret_value "$GATE_SECRET" SITE_GATE_CLIENT_SECRET)"
token_body="$(printf 'data-urlencode = "client_secret=%s"\n' "$client_secret" |
  curl -sS --max-time 15 -X POST "$SITE_GATE_TOKEN_URL" -K - \
    --data-urlencode grant_type=client_credentials \
    --data-urlencode "client_id=${client_id}")" || die "gate token request failed"
token="$(jq -er '.access_token' <<<"$token_body" 2>/dev/null)" || die "gate returned no access_token"
(umask 077 && printf 'Authorization: Bearer %s\n' "$token" >"$WORK/auth")
unset client_id client_secret token_body token
log "gate token minted (value not shown)"
UAR_BASE="$base"

# ── 4. Seed ONLY the candidates ─────────────────────────────────────────────
seed_candidate() { # id
  local id="$1" file st
  assert_candidate_id "$id"
  file="$WORK/candidates/$id.json"
  [[ "$(jq -r '.id' "$file")" == "$id" ]] || die "refusing to PUT $file: its id is not $id"
  SEEDED+=("$id") # registered first, so the exit trap tries to delete it even if the PUT half-fails
  log "seeding candidate agent '$id'"
  st="$(curl -sS -o "$WORK/reply.json" -w '%{http_code}' --max-time 30 -X PUT "$base/api/agents/$id" \
    -H "@$WORK/auth" -H 'Content-Type: application/json' --data-binary @"$file")" || st=000
  if [[ "$st" == 404 ]]; then
    st="$(curl -sS -o "$WORK/reply.json" -w '%{http_code}' --max-time 30 -X POST "$base/api/agents" \
      -H "@$WORK/auth" -H 'Content-Type: application/json' --data-binary @"$file")" || st=000
  fi
  case "$st" in
    2??) log "candidate '$id' registered (HTTP $st)" ;;
    *) die "could not register candidate '$id': HTTP $st (response: $(head -c 300 "$WORK/reply.json" | tr -d '\r\n'))" ;;
  esac
}

if [[ "$CLEANUP_ONLY" == 1 ]]; then
  SEEDED=("$CAND_DEFAULT_ID" "$CAND_WEB_ID")
  log "--cleanup-only: deleting the two candidate agents"
  exit 0
fi

seed_candidate "$CAND_DEFAULT_ID"
seed_candidate "$CAND_WEB_ID"

# ── 5. Run the scenarios ────────────────────────────────────────────────────
OUT_DIR="$OUT_ROOT/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT_DIR"
log "transcripts: $OUT_DIR (gitignored)"
rc=0
node "$HELPER" run --base "$base" --auth-file "$WORK/auth" --scenarios "$SCENARIOS_FILE" --out-dir "$OUT_DIR" \
  --agent "$WORK/candidates/$CAND_DEFAULT_ID.json" --web "$WORK/candidates/$CAND_WEB_ID.json" \
  --corpus content/knowledge,docs/knowledge-source --timeout "$REQUEST_TIMEOUT_SECS" ${ONLY:+--only "$ONLY"} || rc=$?
log "exit $rc (0 pass, 1 critical fail, 2 fail, 3 incomplete run). Read the transcripts in $OUT_DIR before merging."
exit "$rc"
