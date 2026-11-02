#!/usr/bin/env bash
# Keeps UAR's provider model limits equal to provider-models.json and keeps
# those models verified. Runs forever; a failed pass is logged and retried.
#
# Why this exists: UAR 1.4.0-rc.2 refuses to verify a model that has no
# context_window and max_output_tokens (HTTP 400 "Provider validation requires
# known model capacity and a positive bounded output allowance"), and then
# answers every chat run with model_not_verified. qwen3.8-max is not in UAR's
# catalog and UAR_LLM__MODEL has no key for either value. The settings store is
# SurrealDB, which can lose its data, so the values are re-applied from here.
# The route needs the settings admin key, which CI deliberately does not hold,
# so this runs in-cluster with the same Secrets UAR uses.
#
# Environment:
#   UAR_URL                    default http://uar:6565
#   PROVIDER_MODELS_FILE       default /etc/uar-provider-models/provider-models.json
#   RECONCILE_INTERVAL_SECS    default 300
#   UAR_ADMIN_KEY              settings admin key (Secret uar-secrets)
#   SITE_GATE_TOKEN_URL, SITE_GATE_CLIENT_ID, SITE_GATE_CLIENT_SECRET
#                              gate client credentials (Secret site-gate-client)
# No secret is printed.
set -u

UAR_URL="${UAR_URL:-http://uar:6565}"
CONFIG="${PROVIDER_MODELS_FILE:-/etc/uar-provider-models/provider-models.json}"
INTERVAL="${RECONCILE_INTERVAL_SECS:-300}"
WORK="$(umask 077 && mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

log() { printf '%s uar-provider-models: %s\n' "$(date -u +%FT%TZ)" "$*"; }

# Sets $WORK/auth and $WORK/admin as curl header files. Returns 1 on failure.
authenticate() {
  local token
  token="$(printf 'data-urlencode = "client_secret=%s"\n' "$SITE_GATE_CLIENT_SECRET" |
    curl -sS --max-time 15 -X POST "$SITE_GATE_TOKEN_URL" -K - \
      --data-urlencode grant_type=client_credentials \
      --data-urlencode "client_id=${SITE_GATE_CLIENT_ID}" | jq -er .access_token)" || return 1
  printf 'Authorization: Bearer %s\n' "$token" >"$WORK/auth"
  printf 'X-UAR-Admin-Key: %s\n' "$UAR_ADMIN_KEY" >"$WORK/admin"
}

# api METHOD PATH [curl args]: sets STATUS, writes the body to $WORK/body.
api() {
  local method="$1" path="$2"
  shift 2
  STATUS="$(curl -sS -o "$WORK/body" -w '%{http_code}' --max-time 90 -X "$method" \
    -H "@$WORK/auth" -H "@$WORK/admin" "$@" "${UAR_URL}${path}")" || STATUS=000
}

reconcile_model() {
  local provider="$1" model="$2" want_ctx="$3" want_out="$4" view changed=0 verified
  if ! [[ "$want_ctx" =~ ^[1-9][0-9]*$ && "$want_out" =~ ^[1-9][0-9]*$ ]] || ((want_out >= want_ctx)); then
    log "SKIP $provider/$model: context_window=$want_ctx and max_output_tokens=$want_out must be positive integers with output < context"
    return 0
  fi
  api GET "/api/providers/$provider"
  if [[ "$STATUS" != 200 ]]; then
    log "SKIP $provider/$model: GET provider answered HTTP $STATUS"
    return 0
  fi
  view="$(cat "$WORK/body")"
  if ! jq -e --arg m "$model" '.models[]? | select(.id == $m)' <<<"$view" >/dev/null; then
    log "SKIP $provider/$model: the provider has no such model"
    return 0
  fi
  if ! jq -e --arg m "$model" --argjson c "$want_ctx" --argjson o "$want_out" \
    '.models[] | select(.id == $m) | .context_window == $c and .max_output_tokens == $o' <<<"$view" >/dev/null; then
    jq --arg m "$model" --argjson c "$want_ctx" --argjson o "$want_out" \
      '.models |= map(if .id == $m then .context_window = $c | .max_output_tokens = $o else . end)
       | del(.credential_configured, .model_verifications, .api_key)' <<<"$view" >"$WORK/put.json"
    api PUT "/api/providers/$provider" -H 'Content-Type: application/json' --data-binary "@$WORK/put.json"
    if [[ "$STATUS" != 200 ]]; then
      log "FAILED $provider/$model: PUT answered HTTP $STATUS"
      return 1
    fi
    log "set $provider/$model context_window=$want_ctx max_output_tokens=$want_out"
    changed=1
  fi
  verified="$(jq -r --arg m "$model" '(.model_verifications // {}) | has($m)' <<<"$view")"
  if [[ "$changed" == 1 || "$verified" != true ]]; then
    api POST "/api/providers/$provider/test" -H 'Content-Type: application/json' \
      --data-binary "$(jq -nc --arg m "$model" '{model: $m}')"
    if [[ "$STATUS" == 2?? ]] && [[ "$(jq -r '.ok // false' "$WORK/body" 2>/dev/null)" == true ]]; then
      log "verified $provider/$model"
    else
      log "FAILED $provider/$model: verification answered HTTP $STATUS $(jq -r '.error // empty | tostring | .[0:160]' "$WORK/body" 2>/dev/null)"
      return 1
    fi
  fi
}

reconcile_once() {
  local rows provider model ctx out rc=0
  rows="$(jq -r '.providers | to_entries[] | .key as $p | .value.models | to_entries[]
                 | [$p, .key, (.value.context_window | tostring), (.value.max_output_tokens | tostring)] | @tsv' "$CONFIG")" || {
    log "FAILED: $CONFIG is not valid provider-models JSON"
    return 1
  }
  [[ -n "$rows" ]] || return 0
  curl -fsS -o /dev/null --max-time 5 "${UAR_URL}/readyz" || {
    log "UAR is not ready; trying again in ${INTERVAL}s"
    return 0
  }
  authenticate || {
    log "FAILED: could not get a gate token"
    return 1
  }
  while IFS=$'\t' read -r provider model ctx out; do
    reconcile_model "$provider" "$model" "$ctx" "$out" || rc=1
  done <<<"$rows"
  return "$rc"
}

while true; do
  reconcile_once || log "pass failed; trying again in ${INTERVAL}s"
  sleep "$INTERVAL"
done
