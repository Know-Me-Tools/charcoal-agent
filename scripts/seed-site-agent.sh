#!/usr/bin/env bash
# Idempotently seed the knowme-site UAR agent, its knowledge base, and its
# corpus of content/knowledge/*.md documents.
#
# Every UAR resource this script touches (the agent, the KB, its documents)
# is owned by one service identity: JWT `sub=knowme-site`. This script mints
# that short-lived JWT itself from UAR_JWT_SECRET — it never reads a token
# from disk and never prints one.
#
# Usage:
#   UAR_JWT_SECRET=... ./scripts/seed-site-agent.sh
#   UAR_URL=http://localhost:6565 UAR_JWT_SECRET=... ./scripts/seed-site-agent.sh
#   UAR_JWT_SECRET=... ./scripts/seed-site-agent.sh --mint-key-to-file /path/to/key
#   UAR_JWT_SECRET=... ./scripts/seed-site-agent.sh --mint-key-to-k8s-secret knowme/site-proxy
#
# Env:
#   UAR_URL          Base URL of the UAR API (default: http://localhost:6565)
#   UAR_JWT_SECRET    HS256 secret UAR verifies JWTs with (required)
#   AGENT_FILE        Path to the AgentArtifact JSON (default: uar/agents/knowme-site.json)
#   CORPUS_DIR        Directory of *.md corpus files (default: content/knowledge)
#   KB_NAME           Knowledge base name (default: knowme-site)
#   KB_EMBEDDING_PROVIDER   KB embedding provider for new KBs (default: openai)
#   KB_EMBEDDING_MODEL      KB embedding model for new KBs (default: $QWEN_EMBEDDING_MODEL or text-embedding-v4)
#   KB_VECTOR_DIMENSIONS    KB vector dimensions for new KBs (default: $QWEN_EMBEDDING_DIMENSIONS or 1024)
#
# Flags:
#   --mint-key-to-file <path>          Mint a fresh site API key and write it to <path> (0600). Never printed.
#   --mint-key-to-k8s-secret <ns>/<name>   Mint a fresh site API key and apply it as
#                                           Secret <name> in namespace <ns> (key SITE_PROXY_API_KEY),
#                                           via `kubectl ... --dry-run=client -o yaml | kubectl apply -f -`.
#                                           Never printed or passed as a kubectl argument.
#
# Idempotency: the agent PUT is a full replace (safe to repeat). The KB is
# looked up by name before creating. Corpus documents are synced by content
# hash embedded in the remote filename (see "Corpus sync" below) — a second
# run against unchanged inputs uploads and deletes nothing.

set -euo pipefail

UAR_URL="${UAR_URL:-http://localhost:6565}"
AGENT_FILE="${AGENT_FILE:-uar/agents/knowme-site.json}"
CORPUS_DIR="${CORPUS_DIR:-content/knowledge}"
KB_NAME="${KB_NAME:-knowme-site}"
KB_EMBEDDING_PROVIDER="${KB_EMBEDDING_PROVIDER:-openai}"
KB_EMBEDDING_MODEL="${KB_EMBEDDING_MODEL:-${QWEN_EMBEDDING_MODEL:-text-embedding-v4}}"
KB_VECTOR_DIMENSIONS="${KB_VECTOR_DIMENSIONS:-${QWEN_EMBEDDING_DIMENSIONS:-1024}}"
JWT_SUBJECT="knowme-site"
JWT_TTL_SECS=600

MINT_KEY_TO_FILE=""
MINT_KEY_TO_K8S_SECRET=""

log() { printf '[seed-site-agent] %s\n' "$*" >&2; }
die() {
  printf '[seed-site-agent] ERROR: %s\n' "$*" >&2
  exit 1
}

# ── Args ─────────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --mint-key-to-file)
      [[ $# -ge 2 ]] || die "--mint-key-to-file requires a path"
      MINT_KEY_TO_FILE="$2"
      shift 2
      ;;
    --mint-key-to-k8s-secret)
      [[ $# -ge 2 ]] || die "--mint-key-to-k8s-secret requires <namespace>/<name>"
      MINT_KEY_TO_K8S_SECRET="$2"
      shift 2
      ;;
    -h|--help)
      sed -n '2,40p' "$0"
      exit 0
      ;;
    *)
      die "unknown argument: $1"
      ;;
  esac
done

# ── Preflight ────────────────────────────────────────────────────────────────
for cmd in curl jq openssl; do
  command -v "$cmd" >/dev/null 2>&1 || die "required command not found: $cmd"
done
[[ -n "${UAR_JWT_SECRET:-}" ]] || die "UAR_JWT_SECRET must be set"
[[ -f "$AGENT_FILE" ]] || die "agent artifact not found: $AGENT_FILE (owned by km-conversational-designer)"

if [[ -n "$MINT_KEY_TO_K8S_SECRET" ]]; then
  command -v kubectl >/dev/null 2>&1 || die "kubectl not found (required for --mint-key-to-k8s-secret)"
  [[ "$MINT_KEY_TO_K8S_SECRET" == */* ]] || die "--mint-key-to-k8s-secret must be <namespace>/<name>"
fi

AGENT_ID="$(jq -r '.id // empty' "$AGENT_FILE")"
[[ -n "$AGENT_ID" ]] || die "$AGENT_FILE has no top-level .id"

# ── Mint a short-lived HS256 JWT (sub=knowme-site) ──────────────────────────
# Never echoed. UAR verifies the signature whenever an Authorization header is
# present, even with UAR_SECURITY__JWT_REQUIRED=false, so this authenticates
# as `sub=knowme-site` in every environment this script targets.
b64url() {
  openssl base64 -A | tr '+/' '-_' | tr -d '='
}

mint_jwt() {
  local now exp header_b64 payload_b64 signing_input signature_b64
  now="$(date +%s)"
  exp="$((now + JWT_TTL_SECS))"
  header_b64="$(printf '%s' '{"alg":"HS256","typ":"JWT"}' | b64url)"
  payload_b64="$(printf '{"sub":"%s","iat":%s,"exp":%s}' "$JWT_SUBJECT" "$now" "$exp" | b64url)"
  signing_input="${header_b64}.${payload_b64}"
  signature_b64="$(printf '%s' "$signing_input" | openssl dgst -sha256 -hmac "$UAR_JWT_SECRET" -binary | b64url)"
  printf '%s.%s' "$signing_input" "$signature_b64"
}

JWT="$(mint_jwt)"

# ── HTTP helper ──────────────────────────────────────────────────────────────
# Sets API_STATUS (HTTP status) and REPLY_BODY. Must run in the current shell,
# not in $(...): a subshell would drop REPLY_BODY. Never logs Authorization.
REPLY_BODY=""
API_STATUS=""
api() {
  local method="$1" path="$2"
  shift 2
  local tmp
  tmp="$(mktemp)"
  API_STATUS="$(curl -sS -o "$tmp" -w '%{http_code}' \
    -X "$method" "${UAR_URL}${path}" \
    -H "Authorization: Bearer ${JWT}" \
    "$@")" || API_STATUS="000"
  REPLY_BODY="$(cat "$tmp")"
  rm -f "$tmp"
}

require_2xx() {
  local status="$1" what="$2"
  case "$status" in
    2??) return 0 ;;
    *)
      log "$what failed: HTTP $status"
      log "response body: $REPLY_BODY"
      exit 1
      ;;
  esac
}

# ── 1. Agent: PUT, falling back to POST on 404 ──────────────────────────────
log "seeding agent '$AGENT_ID' from $AGENT_FILE"
api PUT "/api/agents/${AGENT_ID}" -H 'Content-Type: application/json' --data-binary @"$AGENT_FILE"
status="$API_STATUS"
if [[ "$status" == "404" ]]; then
  log "agent '$AGENT_ID' does not exist yet; creating"
  api POST "/api/agents" -H 'Content-Type: application/json' --data-binary @"$AGENT_FILE"
  status="$API_STATUS"
  require_2xx "$status" "create agent"
else
  require_2xx "$status" "replace agent"
fi
log "agent '$AGENT_ID' is up to date"

# ── 2. Knowledge base: create if missing, looked up by name ────────────────
log "looking up knowledge base '$KB_NAME'"
api GET "/api/uar/knowledge-bases"
status="$API_STATUS"
require_2xx "$status" "list knowledge bases"
KB_ID="$(printf '%s' "$REPLY_BODY" | jq -r --arg name "$KB_NAME" '.[] | select(.name == $name) | .id' | head -n1)"

if [[ -z "$KB_ID" ]]; then
  log "knowledge base '$KB_NAME' not found; creating"
  create_body="$(jq -n \
    --arg name "$KB_NAME" \
    --arg provider "$KB_EMBEDDING_PROVIDER" \
    --arg model "$KB_EMBEDDING_MODEL" \
    --argjson dims "$KB_VECTOR_DIMENSIONS" \
    '{name: $name, description: "Public-safe KnowMe product content for the site agent.", config: {embedding_provider: $provider, embedding_model: $model, vector_dimensions: $dims}}')"
  api POST "/api/uar/knowledge-bases" -H 'Content-Type: application/json' --data-binary "$create_body"
  status="$API_STATUS"
  require_2xx "$status" "create knowledge base"
  # The create response is not the list item shape, so read the id back from
  # the list, the same way an existing KB is found.
  api GET "/api/uar/knowledge-bases"
  status="$API_STATUS"
  require_2xx "$status" "list knowledge bases"
  KB_ID="$(printf '%s' "$REPLY_BODY" | jq -r --arg name "$KB_NAME" '.[] | select(.name == $name) | .id' | head -n1)"
  if [[ -z "$KB_ID" ]]; then
    die "created knowledge base '$KB_NAME' but it is not in the list"
  fi
  log "created knowledge base '$KB_NAME' ($KB_ID)"
else
  log "knowledge base '$KB_NAME' exists ($KB_ID)"
fi

# ── 3. Corpus sync ───────────────────────────────────────────────────────────
#
# UAR's document API has no content-hash or arbitrary-metadata field
# (src/uar/api/knowledge.rs: DocumentResponse has only id/filename/mime/status/etc.),
# so this script encodes the content hash INTO the uploaded filename instead of
# tracking state in a local file: `<basename>.<sha256-12>.md`. That makes the
# remote document list itself the source of truth for "is this file current" —
# no sidecar state to lose, and it works the same from a fresh checkout or a
# stateless CI runner. Only documents matching this `<name>.<12-hex>.md`
# convention are managed here; anything else already in the KB is left alone.

log "syncing corpus from $CORPUS_DIR"
api GET "/api/uar/knowledge-bases/${KB_ID}/documents"
status="$API_STATUS"
require_2xx "$status" "list documents"
REMOTE_DOCS_JSON="$REPLY_BODY"

hash_suffix_re='^(.*)\.([0-9a-f]{12})\.md$'

# base name -> "doc_id filename" (space-joined; base names in our corpus won't contain spaces)
declare -A remote_by_base
# Documents whose ingestion failed are not current: re-upload them.
declare -A remote_failed
while IFS=$'\t' read -r doc_id filename doc_status; do
  [[ -z "$doc_id" ]] && continue
  if [[ "$filename" =~ $hash_suffix_re ]]; then
    base="${BASH_REMATCH[1]}"
    remote_by_base["$base"]="${doc_id} ${filename}"
    [[ "$doc_status" == "failed" ]] && remote_failed["$base"]=1
  fi
done < <(printf '%s' "$REMOTE_DOCS_JSON" | jq -r '.[] | [.id, .filename, (.status // "")] | @tsv')

changed=0
declare -A seen_base

shopt -s nullglob
for f in "$CORPUS_DIR"/*.md; do
  base="$(basename "$f" .md)"
  seen_base["$base"]=1
  hash12="$(openssl dgst -sha256 "$f" | awk '{print $NF}' | cut -c1-12)"
  desired_filename="${base}.${hash12}.md"

  existing="${remote_by_base[$base]:-}"
  existing_filename="${existing#* }"

  if [[ -n "$existing" && "$existing_filename" == "$desired_filename" && -z "${remote_failed[$base]:-}" ]]; then
    continue
  fi

  if [[ -n "${remote_failed[$base]:-}" ]]; then
    log "re-uploading $desired_filename (previous ingestion failed)"
  else
    log "uploading $desired_filename (new or changed)"
  fi
  api POST "/api/uar/knowledge-bases/${KB_ID}/documents" \
    -F "file=@${f};filename=${desired_filename};type=text/markdown"
  status="$API_STATUS"
  require_2xx "$status" "upload $desired_filename"
  changed=1

  if [[ -n "$existing" ]]; then
    old_doc_id="${existing% *}"
    log "removing superseded document $existing_filename ($old_doc_id)"
    api DELETE "/api/uar/knowledge-bases/${KB_ID}/documents/${old_doc_id}"
    status="$API_STATUS"
    require_2xx "$status" "delete $existing_filename"
    changed=1
  fi
done
shopt -u nullglob

for base in "${!remote_by_base[@]}"; do
  if [[ -z "${seen_base[$base]:-}" ]]; then
    existing="${remote_by_base[$base]}"
    old_doc_id="${existing% *}"
    old_filename="${existing#* }"
    log "removing document for deleted source file: $old_filename ($old_doc_id)"
    api DELETE "/api/uar/knowledge-bases/${KB_ID}/documents/${old_doc_id}"
    status="$API_STATUS"
    require_2xx "$status" "delete $old_filename"
    changed=1
  fi
done

if [[ "$changed" -eq 0 ]]; then
  log "corpus already up to date; no changes"
else
  log "corpus sync complete"
fi

# ── 4. Optional: mint the site API key ──────────────────────────────────────
if [[ -n "$MINT_KEY_TO_FILE" || -n "$MINT_KEY_TO_K8S_SECRET" ]]; then
  log "minting a new site API key (sub=${JWT_SUBJECT})"
  key_body="$(jq -n --arg name "site-proxy-$(date +%s)" '{name: $name}')"
  api POST "/api/uar/auth/keys" -H 'Content-Type: application/json' --data-binary "$key_body"
  status="$API_STATUS"
  require_2xx "$status" "mint API key"
  RAW_KEY="$(printf '%s' "$REPLY_BODY" | jq -r '.raw_key')"
  [[ -n "$RAW_KEY" && "$RAW_KEY" != "null" ]] || die "mint API key: response had no raw_key"

  if [[ -n "$MINT_KEY_TO_FILE" ]]; then
    (umask 077 && printf '%s' "$RAW_KEY" > "$MINT_KEY_TO_FILE")
    log "wrote site API key to $MINT_KEY_TO_FILE (0600)"
  fi

  if [[ -n "$MINT_KEY_TO_K8S_SECRET" ]]; then
    ns="${MINT_KEY_TO_K8S_SECRET%%/*}"
    name="${MINT_KEY_TO_K8S_SECRET#*/}"
    log "applying Secret $name in namespace $ns"
    kubectl create secret generic "$name" \
      --namespace "$ns" \
      --from-file=SITE_PROXY_API_KEY=/dev/stdin \
      --dry-run=client -o yaml <<<"$RAW_KEY" \
      | kubectl apply -f -
    log "applied Secret $ns/$name (key not printed)"
  fi

  unset RAW_KEY
fi

log "done"
