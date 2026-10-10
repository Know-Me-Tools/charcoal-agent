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
#   UAR_JWT_SECRET=... ./scripts/seed-site-agent.sh --recreate-kb
#
# Env:
#   UAR_URL          Base URL of the UAR API (default: http://localhost:6565)
#   UAR_JWT_SECRET    HS256 secret UAR verifies JWTs with (required)
#   AGENT_FILE        Path to the AgentArtifact JSON (default: uar/agents/knowme-site.json)
#   CORPUS_DIR        Directory of *.md corpus files (default: content/knowledge)
#   PRESENTATIONS_DIR Directory of presentation template drafts (default: uar/presentations)
#   KB_NAME           Knowledge base name (default: knowme-site)
#   KB_EMBEDDING_PROVIDER   KB embedding provider for new KBs (default: openai)
#   KB_EMBEDDING_MODEL      KB embedding model for new KBs (default: $QWEN_EMBEDDING_MODEL or text-embedding-v4)
#   KB_VECTOR_DIMENSIONS    KB vector dimensions for new KBs (default: $QWEN_EMBEDDING_DIMENSIONS or 1024)
#   KB_CHUNK_STRATEGY       KB chunk strategy for new KBs (default: recursive)
#   KB_CHUNK_SIZE           Characters per chunk for the recursive strategy (default: 1000). One chunk
#                           per whole document (`document`) scored 0.66 for the right document against
#                           UAR's default min_score of 0.7 (2026-10-04), so a question retrieved nothing;
#                           section-sized chunks keep each chunk on one topic.
#   KB_RETRIEVAL_MIN_SCORE  Similarity a chunk needs to reach the agent's prompt (default: 0.5). UAR's
#                           chat retrieval defaults to 0.7, but text-embedding-v4 scores real answers
#                           0.58 to 0.67 for short questions. Needs a UAR image with
#                           Prometheus-AGS/universal-agent-runtime#353; older images ignore it.
#   KB_RETRIEVAL_TOP_K      Chunks retrieved per turn (default: 5; UAR's default is 3)
#
# Flags:
#   --mint-key-to-file <path>          Mint a fresh site API key and write it to <path> (0600). Never printed.
#   --mint-key-to-k8s-secret <ns>/<name>   Mint a fresh site API key and apply it as
#                                           Secret <name> in namespace <ns> (key SITE_PROXY_API_KEY),
#                                           via `kubectl ... --dry-run=client -o yaml | kubectl apply -f -`.
#                                           Never printed or passed as a kubectl argument.
#   --recreate-kb                      kb-chunking-quality 1.3: delete the KB named $KB_NAME if it
#                                       exists, recreate it with the current KB_CHUNK_STRATEGY/
#                                       KB_EMBEDDING_* config, and re-ingest every corpus document.
#                                       Use this to change an existing KB's config — the normal path
#                                       sends `config` only on create and skips documents that are
#                                       already present, so it cannot change a KB already created with
#                                       a different chunk strategy.
#                                       ASSUMPTION (unverified against UAR source in this repo):
#                                       deletion calls `DELETE /api/uar/knowledge-bases/{id}`, mirroring
#                                       the per-document `DELETE .../documents/{id}` already used below.
#                                       Confirm this path exists in UAR before running against a live
#                                       UAR for the first time.
#
# Idempotency: the agent PUT is a full replace (safe to repeat). The KB is
# looked up by name before creating. Corpus documents are synced by content
# hash embedded in the remote filename (see "Corpus sync" below) — a second
# run against unchanged inputs uploads and deletes nothing.

set -euo pipefail

UAR_URL="${UAR_URL:-http://localhost:6565}"
AGENT_FILE="${AGENT_FILE:-uar/agents/knowme-site.json}"
CORPUS_DIR="${CORPUS_DIR:-content/knowledge}"
PRESENTATIONS_DIR="${PRESENTATIONS_DIR:-uar/presentations}"
KB_NAME="${KB_NAME:-knowme-site}"
KB_EMBEDDING_PROVIDER="${KB_EMBEDDING_PROVIDER:-openai}"
KB_EMBEDDING_MODEL="${KB_EMBEDDING_MODEL:-${QWEN_EMBEDDING_MODEL:-text-embedding-v4}}"
KB_VECTOR_DIMENSIONS="${KB_VECTOR_DIMENSIONS:-${QWEN_EMBEDDING_DIMENSIONS:-1024}}"
KB_CHUNK_STRATEGY="${KB_CHUNK_STRATEGY:-recursive}"
KB_CHUNK_SIZE="${KB_CHUNK_SIZE:-1000}"
KB_RETRIEVAL_MIN_SCORE="${KB_RETRIEVAL_MIN_SCORE:-0.5}"
KB_RETRIEVAL_TOP_K="${KB_RETRIEVAL_TOP_K:-5}"
JWT_SUBJECT="knowme-site"
JWT_TTL_SECS=600

MINT_KEY_TO_FILE=""
MINT_KEY_TO_K8S_SECRET=""
RECREATE_KB=0

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
    --recreate-kb)
      RECREATE_KB=1
      shift
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
# Auth mode: gate client credentials (cluster) when all three SITE_GATE_* are
# set; otherwise a self-minted HS256 JWT from UAR_JWT_SECRET (local compose,
# where UAR has no JWKS configured).
GATE_MODE=0
if [[ -n "${SITE_GATE_TOKEN_URL:-}" || -n "${SITE_GATE_CLIENT_ID:-}" || -n "${SITE_GATE_CLIENT_SECRET:-}" ]]; then
  [[ -n "${SITE_GATE_TOKEN_URL:-}" && -n "${SITE_GATE_CLIENT_ID:-}" && -n "${SITE_GATE_CLIENT_SECRET:-}" ]] \
    || die "set all of SITE_GATE_TOKEN_URL, SITE_GATE_CLIENT_ID, SITE_GATE_CLIENT_SECRET, or none"
  GATE_MODE=1
else
  [[ -n "${UAR_JWT_SECRET:-}" ]] || die "UAR_JWT_SECRET must be set (or the SITE_GATE_* client credentials)"
fi
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

# Gate client credentials: the token's sub is the client id (knowme-site) and
# its aud is the client's audience (uar). Never echoed.
gate_token() {
  local body
  body="$(curl -sS --max-time 10 -X POST "$SITE_GATE_TOKEN_URL" \
    --data-urlencode grant_type=client_credentials \
    --data-urlencode "client_id=${SITE_GATE_CLIENT_ID}" \
    --data-urlencode "client_secret=${SITE_GATE_CLIENT_SECRET}")" || die "gate token request failed"
  jq -er '.access_token' <<<"$body" 2>/dev/null || die "gate returned no access_token"
}

if [[ "$GATE_MODE" == 1 ]]; then
  JWT="$(gate_token)"
else
  JWT="$(mint_jwt)"
fi

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

# ── 1b. Presentation templates (A2UI answer cards) ─────────────────────────
# Owned by the same identity as the agent (sub=knowme-site), which is what makes
# them eligible for the site proxy's runs. Matched by title; created when
# missing, replaced only when the stored content differs, so a second run
# against unchanged inputs writes nothing.
shopt -s nullglob
for tpl in "$PRESENTATIONS_DIR"/*.json; do
  tpl_title="$(jq -er '.title' "$tpl")" || die "presentation $tpl has no .title"
  log "seeding presentation '$tpl_title' from $tpl"
  api GET "/api/uar/presentations"
  require_2xx "$API_STATUS" "list presentations"
  existing="$(printf '%s' "$REPLY_BODY" | jq -c --arg t "$tpl_title" '[.presentations[] | select(.content.title == $t)] | first // empty')"
  if [[ -z "$existing" ]]; then
    api POST "/api/uar/presentations" -H 'Content-Type: application/json' --data-binary @"$tpl"
    require_2xx "$API_STATUS" "create presentation '$tpl_title'"
    log "created presentation '$tpl_title'"
  elif [[ "$(printf '%s' "$existing" | jq -S '.content')" == "$(jq -S . "$tpl")" ]]; then
    log "presentation '$tpl_title' is up to date"
  else
    tpl_id="$(printf '%s' "$existing" | jq -r '.id')"
    tpl_rev="$(printf '%s' "$existing" | jq -r '.revision')"
    update_body="$(jq -n --argjson rev "$tpl_rev" --slurpfile c "$tpl" '{expected_revision: $rev, content: $c[0]}')"
    api PUT "/api/uar/presentations/${tpl_id}" -H 'Content-Type: application/json' --data-binary "$update_body"
    require_2xx "$API_STATUS" "update presentation '$tpl_title'"
    log "updated presentation '$tpl_title'"
  fi
done
shopt -u nullglob

# ── 2. Knowledge base: create if missing, looked up by name ────────────────
log "looking up knowledge base '$KB_NAME'"
api GET "/api/uar/knowledge-bases"
status="$API_STATUS"
require_2xx "$status" "list knowledge bases"
KB_ID="$(printf '%s' "$REPLY_BODY" | jq -r --arg name "$KB_NAME" '.[] | select(.name == $name) | .id' | head -n1)"

if [[ "$RECREATE_KB" -eq 1 && -n "$KB_ID" ]]; then
  # kb-chunking-quality 1.3: the normal path below sends `config` only on
  # create and skips documents already present, so it cannot change an
  # existing KB's chunk strategy. Delete and recreate instead.
  log "--recreate-kb: deleting knowledge base '$KB_NAME' ($KB_ID)"
  api DELETE "/api/uar/knowledge-bases/${KB_ID}"
  status="$API_STATUS"
  require_2xx "$status" "delete knowledge base '$KB_NAME' ($KB_ID) for --recreate-kb"
  KB_ID=""
fi

if [[ -z "$KB_ID" ]]; then
  log "knowledge base '$KB_NAME' not found; creating (chunk_strategy=$KB_CHUNK_STRATEGY, chunk_size=$KB_CHUNK_SIZE, retrieval_min_score=$KB_RETRIEVAL_MIN_SCORE, retrieval_top_k=$KB_RETRIEVAL_TOP_K)"
  create_body="$(jq -n \
    --arg name "$KB_NAME" \
    --arg provider "$KB_EMBEDDING_PROVIDER" \
    --arg model "$KB_EMBEDDING_MODEL" \
    --argjson dims "$KB_VECTOR_DIMENSIONS" \
    --arg chunk_strategy "$KB_CHUNK_STRATEGY" \
    --argjson chunk_size "$KB_CHUNK_SIZE" \
    --argjson min_score "$KB_RETRIEVAL_MIN_SCORE" \
    --argjson top_k "$KB_RETRIEVAL_TOP_K" \
    '{name: $name, description: "Public-safe KnowMe product content for the site agent.", config: {embedding_provider: $provider, embedding_model: $model, vector_dimensions: $dims, chunk_strategy: $chunk_strategy, chunk_size: $chunk_size, retrieval_min_score: $min_score, retrieval_top_k: $top_k}}')"
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

# ── 4. FR-8 KB health check (site-agent-seed 1.4, kb-chunking-quality 1.4) ──
#
# Confirmed against UAR origin/main (src/uar/api/knowledge.rs:93-134,
# administration_capabilities.rs:1326-1395): `POST /api/uar/knowledge-bases/{id}/search`
# takes `{query, limit, min_score}` (min_score defaults server-side to 0.7
# when omitted) and returns `{results: [{content, score, metadata,
# document_id}]}`. It is used below instead of a fabricated chunk-listing
# endpoint.
#
# DocumentResponse also carries `chunk_count`, but observed on a live UAR
# (2026-10-04, local compose stack) it stays 0 for documents whose status is
# `indexed` and whose ingestion log reports 3 to 17 chunks. So "has at least
# one chunk" is checked as `status == "indexed"`, and the search checks below
# prove the chunks are retrievable. Ingestion is asynchronous, so the check
# first waits for every corpus document to leave its in-progress status.

INGEST_WAIT_SECS="${INGEST_WAIT_SECS:-180}"

# wait_for_ingestion: poll the document list until no corpus document is in a
# non-terminal status (anything other than `indexed` or `failed`), or the wait
# expires. Leaves the last listing in POST_SYNC_DOCS_JSON.
wait_for_ingestion() {
  local deadline=$((SECONDS + INGEST_WAIT_SECS)) pending
  while :; do
    api GET "/api/uar/knowledge-bases/${KB_ID}/documents"
    require_2xx "$API_STATUS" "list documents for FR-8 health check"
    POST_SYNC_DOCS_JSON="$REPLY_BODY"
    pending="$(printf '%s' "$POST_SYNC_DOCS_JSON" \
      | jq '[.[] | select(.filename | test("\\.[0-9a-f]{12}\\.md$")) | select((.status // "") != "indexed" and (.status // "") != "failed")] | length')"
    [[ "$pending" -eq 0 ]] && return 0
    if (( SECONDS >= deadline )); then
      log "FR-8: $pending document(s) still ingesting after ${INGEST_WAIT_SECS}s"
      return 0
    fi
    sleep 3
  done
}

# FR-8 checks test chunk integrity and routing, not UAR's retrieval threshold:
# search with an explicit low min_score (UAR's default is 0.7, and relevant
# chunks score 0.58 to 0.67 for short questions against text-embedding-v4).
FR8_MIN_SCORE="${FR8_MIN_SCORE:-0.3}"
FR8_TOP_N="${FR8_TOP_N:-5}"
# The first search right after a KB is created and filled can time out (HTTP
# 408 "Request timed out") and then succeed on retry. Seen on the local stack
# and on the cluster's first deploy, where it failed the whole deploy even
# though ingestion had succeeded. Retry timeouts and 5xx; anything else (401,
# 404, 400) is a real error and fails at once.
FR8_SEARCH_ATTEMPTS="${FR8_SEARCH_ATTEMPTS:-6}"
FR8_SEARCH_RETRY_SECS="${FR8_SEARCH_RETRY_SECS:-10}"

# search_kb: POST .../search, leaves the `results` array in SEARCH_RESULTS_JSON.
search_kb() {
  local query="$1" limit="${2:-$FR8_TOP_N}" body attempt=1
  body="$(jq -n --arg q "$query" --argjson limit "$limit" --argjson min_score "$FR8_MIN_SCORE" \
    '{query: $q, limit: $limit, min_score: $min_score}')"
  while :; do
    api POST "/api/uar/knowledge-bases/${KB_ID}/search" -H 'Content-Type: application/json' --data-binary "$body"
    case "$API_STATUS" in
      408 | 5?? | 000)
        if (( attempt < FR8_SEARCH_ATTEMPTS )); then
          log "search KB '$KB_NAME' got HTTP $API_STATUS (attempt $attempt of $FR8_SEARCH_ATTEMPTS); retrying in ${FR8_SEARCH_RETRY_SECS}s"
          attempt=$((attempt + 1))
          sleep "$FR8_SEARCH_RETRY_SECS"
          continue
        fi
        ;;
    esac
    break
  done
  local search_status="$API_STATUS"
  require_2xx "$search_status" "search KB '$KB_NAME' for '$query'"
  SEARCH_RESULTS_JSON="$(printf '%s' "$REPLY_BODY" | jq -c '.results // []')"
}

# doc_id_for_base: the UAR document id for corpus file <base>.md, from the
# post-sync document listing (empty if not found).
doc_id_for_base() {
  local base="$1"
  printf '%s' "$POST_SYNC_DOCS_JSON" \
    | jq -r --arg base "$base" \
      '.[] | select(.filename | test("^" + $base + "\\.[0-9a-f]{12}\\.md$")) | .id' \
    | head -n1
}

log "checking every corpus document is present and indexed"
wait_for_ingestion

health_fail=0
shopt -s nullglob
for f in "$CORPUS_DIR"/*.md; do
  base="$(basename "$f" .md)"
  doc_json="$(printf '%s' "$POST_SYNC_DOCS_JSON" \
    | jq -c --arg base "$base" \
      '[.[] | select(.filename | test("^" + $base + "\\.[0-9a-f]{12}\\.md$"))] | first')"
  if [[ -z "$doc_json" || "$doc_json" == "null" ]]; then
    log "FR-8 health check: $base.md is not present in KB '$KB_NAME'"
    health_fail=1
    continue
  fi
  doc_status="$(printf '%s' "$doc_json" | jq -r '.status // ""')"
  if [[ "$doc_status" != "indexed" ]]; then
    log "FR-8 health check: $base.md status is '${doc_status:-unknown}', not 'indexed' (rerun re-uploads failed documents)"
    health_fail=1
  fi
done
shopt -u nullglob

# No chunk ends inside a version number ("v0.", "Obsidian 1."). The corpus's
# ipfs-sync-for-obsidian.md states "IPFS Sync for Obsidian is at v0.2.0" and
# "needs Obsidian 1.12.3 or later" — the original bug cut chunks exactly at
# those fragments. Among the top $FR8_TOP_N results, each full version string
# must appear intact, and no result may end on a bare version fragment. With
# section-sized chunks the two versions can sit in different chunks, so this
# checks the set, not only the top result.
if [[ -f "$CORPUS_DIR/ipfs-sync-for-obsidian.md" ]]; then
  log "FR-8: checking no chunk ends inside a version number (ipfs-sync-for-obsidian.md)"
  search_kb "What version of IPFS Sync for Obsidian is available, and what version of Obsidian does it need?"
  if [[ "$(printf '%s' "$SEARCH_RESULTS_JSON" | jq 'length')" -eq 0 ]]; then
    log "FR-8 version-number check: search returned no results"
    health_fail=1
  else
    for version in "v0.2.0" "Obsidian 1.12.3"; do
      if ! printf '%s' "$SEARCH_RESULTS_JSON" | jq -e --arg v "$version" 'any(.[]; .content | contains($v))' >/dev/null; then
        log "FR-8 version-number check: no top-$FR8_TOP_N chunk contains the full version '$version'"
        health_fail=1
      fi
    done
    # The bug's exact signature: a chunk's text ends right at a bare
    # version-number fragment instead of the sentence that follows it.
    fragment="$(printf '%s' "$SEARCH_RESULTS_JSON" \
      | jq -r '.[] | .content | rtrimstr("\n") | split("\n") | map(select(test("\\S"))) | last // empty' \
      | grep -E '([Vv]|Obsidian )[0-9]+(\.[0-9]+)*\.[[:space:]]*$' | head -n1 || true)"
    if [[ -n "$fragment" ]]; then
      log "FR-8 version-number check: a chunk ends on a bare version-number fragment: '$fragment'"
      health_fail=1
    fi
  fi
fi

# A question about The Boss's platforms retrieves a chunk from the-boss.md that
# states them: among the top $FR8_TOP_N results, one from the-boss.md names both
# Windows and macOS. (The intro chunk of the-boss.md can outrank the chunk that
# states the platforms, so "top result" is too strict for section-sized chunks.)
if [[ -f "$CORPUS_DIR/the-boss.md" ]]; then
  log "FR-8: checking The Boss's platforms question retrieves the-boss.md"
  boss_doc_id="$(doc_id_for_base "the-boss")"
  search_kb "What platforms does The Boss support?"
  if [[ -z "$boss_doc_id" ]]; then
    log "FR-8 platforms check: could not resolve the-boss.md's document id"
    health_fail=1
  elif printf '%s' "$SEARCH_RESULTS_JSON" | jq -e --arg id "$boss_doc_id" \
      'any(.[]; .document_id == $id and (.content | contains("Windows") and contains("macOS")))' >/dev/null; then
    log "FR-8 platforms check passed: a top-$FR8_TOP_N chunk from the-boss.md states Windows and macOS"
  else
    log "FR-8 platforms check: no top-$FR8_TOP_N chunk from the-boss.md ($boss_doc_id) states both Windows and macOS"
    health_fail=1
  fi
fi

if [[ "$health_fail" -ne 0 ]]; then
  die "FR-8 KB health check failed: see entries above"
fi
log "FR-8 KB health check passed"

# ── 5. Optional: mint the site API key ──────────────────────────────────────
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
