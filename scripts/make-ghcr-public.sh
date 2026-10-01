#!/usr/bin/env bash
# Make GHCR container packages public, then confirm anonymous pulls work.
#
# GitHub has no API for changing a package's visibility (REST, GraphQL and gh
# all lack it), so the one click happens in the browser. This script checks
# each package, opens its settings page when it is still private, and waits
# until an anonymous pull succeeds.
#
# Usage: scripts/make-ghcr-public.sh [package ...]
#   default packages: universal-agent-runtime surreal-memory-server
# Env: GHCR_ORG (default prometheus-ags), GHCR_TAG (default main)
set -euo pipefail

ORG="${GHCR_ORG:-prometheus-ags}"
TAG="${GHCR_TAG:-main}"
PACKAGES=("$@")
[ ${#PACKAGES[@]} -eq 0 ] && PACKAGES=(universal-agent-runtime surreal-memory-server)
POLL_SECONDS=5
TIMEOUT_SECONDS=600

# Prints the HTTP status of an anonymous manifest request:
# 200 public and tagged, 404 public but the tag isn't published yet, 401/403 private.
anonymous_status() {
  local pkg="$1" token
  token=$(curl -fsS "https://ghcr.io/token?scope=repository:${ORG}/${pkg}:pull" | jq -r '.token // empty') || true
  curl -s -o /dev/null -w '%{http_code}' \
    -H "Authorization: Bearer ${token}" \
    -H 'Accept: application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json' \
    "https://ghcr.io/v2/${ORG}/${pkg}/manifests/${TAG}"
}

is_public() { case "$(anonymous_status "$1")" in 200|404) return 0 ;; *) return 1 ;; esac; }

open_url() {
  if command -v open >/dev/null; then open "$1"
  elif command -v xdg-open >/dev/null; then xdg-open "$1"
  else echo "Open this URL: $1"
  fi
}

for cmd in curl jq; do
  command -v "$cmd" >/dev/null || { echo "error: $cmd is required" >&2; exit 1; }
done

for pkg in "${PACKAGES[@]}"; do
  if is_public "$pkg"; then
    echo "✓ ${pkg}: already public (HTTP $(anonymous_status "$pkg"))"
    continue
  fi

  url="https://github.com/orgs/${ORG}/packages/container/${pkg}/settings"
  echo "• ${pkg}: private. Opening its settings page:"
  echo "    ${url}"
  echo "  In Danger Zone: Change visibility → Public → type '${pkg}' → confirm."
  echo "  (If Public is greyed out, allow public packages first:"
  echo "   https://github.com/organizations/${ORG}/settings/packages)"
  open_url "$url"

  waited=0
  until is_public "$pkg"; do
    if [ "$waited" -ge "$TIMEOUT_SECONDS" ]; then
      echo "✗ ${pkg}: still private after ${TIMEOUT_SECONDS}s" >&2
      exit 1
    fi
    sleep "$POLL_SECONDS"; waited=$((waited + POLL_SECONDS))
  done
  status=$(anonymous_status "$pkg")
  if [ "$status" = 404 ]; then
    echo "✓ ${pkg}: public (tag '${TAG}' not published yet)"
  else
    echo "✓ ${pkg}: public (HTTP ${status})"
  fi
done
