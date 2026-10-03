#!/usr/bin/env bash
# ci-supply-chain-pins: fail CI if a GitHub Action is referenced by a mutable
# tag instead of a full commit SHA, or a container image is referenced by
# tag instead of digest.
#
# Checks:
#   1. Every `uses: owner/repo@REF` line under .github/workflows/*.y*ml has a
#      REF that is exactly 40 lowercase hex characters.
#   2. Every `image: ...` line in k8s/**/*.y*ml and docker-compose.yaml
#      carries `@sha256:<64-hex>`, except the one documented exception:
#      `ghcr.io/know-me-tools/knowme-web:main` in
#      k8s/base/knowme-web-deployment.yaml, which CI replaces with the
#      build digest at deploy time (ci-supply-chain-pins 1.5).
#
# Usage: ./scripts/check-pins.sh
# Exits 0 if every reference is pinned, non-zero (naming each offending
# file:line) otherwise.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

fail=0

log_fail() {
  printf '[check-pins] FAIL: %s\n' "$*" >&2
  fail=1
}

# ── 1. GitHub Actions pinned by full commit SHA ─────────────────────────────
if [[ -d .github/workflows ]]; then
  while IFS=: read -r file lineno content; do
    # Extract the "owner/repo@ref" token after `uses:`, dropping a trailing
    # `# comment` (e.g. the required `# vX.Y.Z` annotation) and surrounding
    # quotes/whitespace.
    ref_expr="$(printf '%s' "$content" \
      | sed -n 's/^[[:space:]]*-\{0,1\}[[:space:]]*uses:[[:space:]]*//p' \
      | sed -e 's/#.*$//' -e 's/[[:space:]]*$//' -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'\$/\1/")"
    [[ -n "$ref_expr" ]] || continue
    # Skip local/docker-scheme uses (./path, docker://...) — not an action tag/SHA.
    case "$ref_expr" in
      ./*|docker://*) continue ;;
    esac
    ref="${ref_expr##*@}"
    if ! [[ "$ref" =~ ^[0-9a-f]{40}$ ]]; then
      log_fail "$file:$lineno: action not pinned by full commit SHA: $ref_expr"
    fi
  done < <(grep -rnE '^\s*-?\s*uses:\s*\S+@\S+' .github/workflows --include='*.yml' --include='*.yaml')
fi

# ── 2. Container images pinned by digest ────────────────────────────────────
# One documented exception: the knowme-web base entry, replaced by CI with
# the build digest on every deploy (ci-supply-chain-pins 1.5). Locally built
# images (no registry/org prefix, i.e. no "/" in the name) are also exempt:
# there is nothing to pin, they are built from this repo's own Dockerfile.
is_documented_exception() {
  local file="$1" image="$2"
  if [[ "$file" == "k8s/base/knowme-web-deployment.yaml" && "$image" == "ghcr.io/know-me-tools/knowme-web:main" ]]; then
    return 0
  fi
  if [[ "$image" != */* ]]; then
    return 0
  fi
  return 1
}

check_image_lines() {
  local pattern_files=("$@")
  local f
  for f in "${pattern_files[@]}"; do
    [[ -f "$f" ]] || continue
    while IFS=: read -r lineno content; do
      local image
      image="$(printf '%s' "$content" | sed -n 's/^[[:space:]]*image:[[:space:]]*"\{0,1\}\([^"[:space:]]*\)"\{0,1\}[[:space:]]*$/\1/p')"
      [[ -n "$image" ]] || continue
      if [[ "$image" == *"@sha256:"* ]]; then
        continue
      fi
      if is_documented_exception "$f" "$image"; then
        continue
      fi
      log_fail "$f:$lineno: image not pinned by digest: $image"
    done < <(grep -nE '^\s*image:\s*\S+' "$f")
  done
}

mapfile -t K8S_FILES < <(find k8s -type f \( -name '*.yaml' -o -name '*.yml' \) | sort)
check_image_lines "${K8S_FILES[@]}"
check_image_lines docker-compose.yaml

if [[ "$fail" -ne 0 ]]; then
  echo "[check-pins] one or more references are not pinned; see failures above." >&2
  exit 1
fi

echo "[check-pins] all workflow actions are pinned by commit SHA and all images are pinned by digest (apart from the documented knowme-web exception)."
