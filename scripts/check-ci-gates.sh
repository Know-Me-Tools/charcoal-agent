#!/usr/bin/env bash
# check-ci-gates: structural guard for the CI wiring that stops a red server
# lint or test from reaching a deploy.
#
# Fails if any of these is false:
#   a. .github/workflows/site.yml: the `image` job's needs includes `server`.
#   b. .github/workflows/site.yml: the `server` job has
#      `uses: ./.github/workflows/server-verify.yml`.
#   c. .github/workflows/pr-verify.yml has a `pull_request` trigger under `on`.
#   d. .github/workflows/server-verify.yml runs clippy with `-D warnings`
#      and a `cargo ... test` command (comment lines do not count).
#
# Text checks only (bash, grep, awk, sed); no YAML parser, nothing installed.
# Jobs are found by indentation: a job is a two-space-indent key under the
# top-level `jobs:`.
#
# Supported `needs` forms on a job (four-space indent):
#   needs: verify
#   needs: [verify, server]
#   needs:
#     - verify
#     - server
# Supported `on` forms in pr-verify.yml: `on: pull_request`,
# `on: [push, pull_request]`, and a block with a two-space-indent
# `pull_request:` key.
#
# Usage: ./scripts/check-ci-gates.sh [ROOT]
#   ROOT defaults to the repository root; tests point it at a scratch copy
#   containing .github/workflows/.

set -euo pipefail

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT"

SITE=.github/workflows/site.yml
PR=.github/workflows/pr-verify.yml
SERVER=.github/workflows/server-verify.yml
REUSABLE=./.github/workflows/server-verify.yml

fail=0
log_fail() {
  printf '[check-ci-gates] FAIL: %s\n' "$*" >&2
  fail=1
}

for f in "$SITE" "$PR" "$SERVER"; do
  [[ -f "$f" ]] || { log_fail "$f: file not found under $ROOT"; exit 1; }
done

# Prints the lines of one job's block (everything after its two-space key).
job_block() { # file job
  awk -v job="$2" '
    /^jobs:/ { injobs = 1; next }
    injobs && /^[^ #]/ { injobs = 0 }
    injobs && /^  [A-Za-z0-9_-]+:/ {
      key = $1; sub(/:.*/, "", key); inblk = (key == job); next
    }
    inblk { print }
  ' "$1"
}

# Prints the job names listed in a job's `needs`, one per line.
job_needs() { # file job
  job_block "$1" "$2" | awk '
    /^    needs:/ {
      line = $0; sub(/^    needs:[ ]*/, "", line); sub(/[ ]*#.*/, "", line)
      if (line == "") { inlist = 1 } else { print line }
      next
    }
    inlist && /^ +-/ {
      line = $0; sub(/^ +-[ ]*/, "", line); sub(/[ ]*#.*/, "", line); print line; next
    }
    inlist && !/^[ ]*$/ && !/^[ ]*#/ { inlist = 0 }
  ' | tr -d '[],' | tr -s ' \t' '\n\n' | sed '/^$/d'
}

# a. image needs server
if ! job_block "$SITE" image | grep -q .; then
  log_fail "$SITE: no \`image\` job found"
elif ! job_needs "$SITE" image | grep -qx server; then
  log_fail "$SITE: the \`image\` job's needs does not include \`server\` (found: $(job_needs "$SITE" image | tr '\n' ' '))"
fi

# b. server job calls the reusable workflow
if ! job_block "$SITE" server | grep -q .; then
  log_fail "$SITE: no \`server\` job found"
elif ! job_block "$SITE" server | grep -Eq "^    uses:[ ]*${REUSABLE}[ ]*(#.*)?$"; then
  log_fail "$SITE: the \`server\` job does not have \`uses: ${REUSABLE}\`"
fi

# c. pr-verify.yml triggers on pull_request
if ! awk '
  /^on:/ {
    inon = 1; rest = $0; sub(/^on:[ ]*/, "", rest); sub(/[ ]*#.*/, "", rest)
    if (rest ~ /(^|[^A-Za-z_])pull_request([^A-Za-z_]|$)/) found = 1
    next
  }
  inon && /^[^ #]/ { inon = 0 }
  inon && /^  pull_request:/ { found = 1 }
  END { exit found ? 0 : 1 }
' "$PR"; then
  log_fail "$PR: no \`pull_request\` trigger under \`on\`"
fi

# d. server-verify.yml runs clippy -D warnings and cargo test
code="$(grep -Ev '^[[:space:]]*#' "$SERVER" || true)"
if ! printf '%s\n' "$code" | grep -Eq 'clippy.*-D[[:space:]]+warnings'; then
  log_fail "$SERVER: no clippy command with \`-D warnings\`"
fi
if ! printf '%s\n' "$code" | grep -Eq 'cargo[^|;&]*[[:space:]]test([[:space:]]|$)'; then
  log_fail "$SERVER: no \`cargo ... test\` command"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "[check-ci-gates] CI gate wiring is broken; see failures above." >&2
  exit 1
fi

echo "[check-ci-gates] image needs server; server calls ${REUSABLE}; pr-verify triggers on pull_request; server-verify runs clippy -D warnings and cargo test."
