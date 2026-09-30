#!/usr/bin/env bash
# Run ONCE by the operator, with an admin kubeconfig context, to stand up the
# namespace-scoped CI deploy identity and mint a kubeconfig for it. The
# resulting file's contents become the GitHub secret KNOWME_KUBECONFIG.
#
# Usage:
#   ./k8s/bootstrap/mint-deployer-kubeconfig.sh <admin-context> <output-path>
#
# Example:
#   ./k8s/bootstrap/mint-deployer-kubeconfig.sh know-me /path/to/knowme-deployer.kubeconfig
#
# Why a Secret-based token, not `kubectl create token`:
# `kubectl create token` mints a TokenRequest-API token that defaults to a
# 1-hour TTL (configurable, but still expires) and isn't meant to be written
# down. A kubeconfig stored as a long-lived GitHub secret needs a token that
# doesn't expire out from under a future deploy, so this script uses the
# classic `kubernetes.io/service-account-token` Secret pattern instead
# (k8s/bootstrap/serviceaccount.yaml already declares that Secret) — the
# tradeoff is that this token doesn't expire on its own and must be rotated
# by deleting the Secret and re-running this script if it's ever exposed.

set -euo pipefail

log() { printf '[mint-deployer-kubeconfig] %s\n' "$*" >&2; }
die() {
  printf '[mint-deployer-kubeconfig] ERROR: %s\n' "$*" >&2
  exit 1
}

[[ $# -eq 2 ]] || die "usage: $0 <admin-context> <output-path>"
ADMIN_CONTEXT="$1"
OUTPUT_PATH="$2"

NAMESPACE="knowme"
SA_NAME="knowme-deployer"
SECRET_NAME="knowme-deployer-token"
KCTL=(kubectl --context "$ADMIN_CONTEXT")

command -v kubectl >/dev/null 2>&1 || die "kubectl not found"
[[ ! -e "$OUTPUT_PATH" ]] || die "refusing to overwrite existing file: $OUTPUT_PATH"

log "applying k8s/bootstrap with context '$ADMIN_CONTEXT'"
"${KCTL[@]}" apply -k "$(dirname "$0")"

log "waiting for the service-account-token Secret to populate"
for _ in $(seq 1 30); do
  if "${KCTL[@]}" -n "$NAMESPACE" get secret "$SECRET_NAME" -o jsonpath='{.data.token}' 2>/dev/null | grep -q .; then
    break
  fi
  sleep 1
done

TOKEN_B64="$("${KCTL[@]}" -n "$NAMESPACE" get secret "$SECRET_NAME" -o jsonpath='{.data.token}')"
[[ -n "$TOKEN_B64" ]] || die "Secret $SECRET_NAME never populated a token"
TOKEN="$(printf '%s' "$TOKEN_B64" | base64 -d)"

CA_B64="$("${KCTL[@]}" -n "$NAMESPACE" get secret "$SECRET_NAME" -o jsonpath='{.data.ca\.crt}')"
[[ -n "$CA_B64" ]] || die "Secret $SECRET_NAME has no ca.crt"

SERVER="$("${KCTL[@]}" config view --minify --raw -o jsonpath='{.clusters[0].cluster.server}')"
[[ -n "$SERVER" ]] || die "could not resolve the API server URL for context '$ADMIN_CONTEXT'"

CA_FILE="$(mktemp)"
trap 'rm -f "$CA_FILE"' EXIT
printf '%s' "$CA_B64" | base64 -d > "$CA_FILE"

(
  umask 077
  KUBECONFIG="$OUTPUT_PATH" kubectl config set-cluster knowme \
    --server="$SERVER" \
    --certificate-authority="$CA_FILE" \
    --embed-certs=true >/dev/null
  KUBECONFIG="$OUTPUT_PATH" kubectl config set-credentials "$SA_NAME" \
    --token="$TOKEN" >/dev/null
  KUBECONFIG="$OUTPUT_PATH" kubectl config set-context "$SA_NAME" \
    --cluster=knowme --user="$SA_NAME" --namespace="$NAMESPACE" >/dev/null
  KUBECONFIG="$OUTPUT_PATH" kubectl config use-context "$SA_NAME" >/dev/null
)

unset TOKEN TOKEN_B64

log "wrote $OUTPUT_PATH (0600). Set it as the GitHub secret KNOWME_KUBECONFIG:"
log "  gh secret set KNOWME_KUBECONFIG < $OUTPUT_PATH"
log "The token does not expire on its own — rotate by deleting Secret $SECRET_NAME in namespace $NAMESPACE and re-running this script."
