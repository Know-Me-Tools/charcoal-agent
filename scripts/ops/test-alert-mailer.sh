#!/bin/sh
# Tests k8s/alerts/alert-mailer.sh with stub kubectl and curl on PATH.
set -eu
here="$(cd "$(dirname "$0")" && pwd)"
script="$here/../../k8s/alerts/alert-mailer.sh"
work="$(mktemp -d)"; trap 'rm -rf "$work"' EXIT
mkdir "$work/bin"

cat > "$work/bin/kubectl" <<'STUB'
#!/bin/sh
[ "${STUB_KUBECTL_FAIL:-}" = 1 ] && { echo "forbidden" >&2; exit 1; }
cat "$STUB_LOGS"
STUB
cat > "$work/bin/curl" <<'STUB'
#!/bin/sh
# Record the JSON body (-d) and answer with STUB_CURL_STATUS.
while [ $# -gt 0 ]; do
  case "$1" in -d) printf '%s' "$2" > "$STUB_BODY"; shift ;; -o) out="$2"; shift ;; esac
  shift
done
echo '{"id":"x"}' > "$out"
printf '%s' "${STUB_CURL_STATUS:-200}"
STUB
chmod +x "$work/bin/"*
export PATH="$work/bin:$PATH" STUB_LOGS="$work/logs" STUB_BODY="$work/body"
export ALERT_TO=op@example.test ALERT_FROM=alerts@example.test RESEND_API_KEY=k
fail=0
check() { if [ "$2" = "$3" ]; then echo "ok   $1"; else echo "FAIL $1: want '$3' got '$2'"; fail=1; fi; }

WARN='{"fields":{"message":"warn","alert":"meter_budget_warning"},"level":"WARN"}'
EXH='{"fields":{"message":"gone","alert":"meter_budget_exhausted"},"level":"ERROR"}'
INFO='{"fields":{"message":"finished processing request"},"level":"INFO"}'

printf '%s\n' "$INFO" "$INFO" > "$work/logs"; rm -f "$work/body"
sh "$script" >/dev/null; check "no alert lines: no email sent" "$([ -f "$work/body" ] && echo sent || echo none)" none

printf '%s\n' "$INFO" "$WARN" "$EXH" "$WARN" > "$work/logs"
sh "$script" >/dev/null
check "subject names each alert once" "$(jq -r .subject "$work/body")" "[KnowMe site] 2 alert(s): meter_budget_exhausted,meter_budget_warning"
check "sent to the operator" "$(jq -r '.to[0]' "$work/body")" op@example.test
check "info lines are not in the body" "$(jq -r .text "$work/body" | grep -c 'finished processing')" 0

if STUB_CURL_STATUS=403 sh "$script" >/dev/null 2>&1; then check "Resend 403 fails the job" ok fail; else check "Resend 403 fails the job" ok ok; fi
if STUB_KUBECTL_FAIL=1 sh "$script" >/dev/null 2>&1; then check "log read failure fails the job" ok fail; else check "log read failure fails the job" ok ok; fi
if env -u RESEND_API_KEY sh "$script" >/dev/null 2>&1; then check "missing key fails the job" ok fail; else check "missing key fails the job" ok ok; fi
exit $fail
