#!/bin/sh
# Emails the site server's structured alert lines (meter_budget_warning,
# meter_budget_exhausted, meter_excess, meter_unavailable,
# meter_settlement_failed, kill_switch_changed) to the operator.
#
# Runs every 5 minutes from a CronJob and looks back 6, so an alert is never
# missed across a scheduling gap. The cost is that one logged in the overlap
# can be sent twice. A failure to read logs or to send exits non-zero, so the
# failed Job stays visible instead of alerts silently stopping.
set -eu

: "${ALERT_TO:?ALERT_TO is required}"
: "${ALERT_FROM:?ALERT_FROM is required}"
: "${RESEND_API_KEY:?RESEND_API_KEY is required}"
SINCE="${ALERT_SINCE:-6m}"
SELECTOR="${ALERT_SELECTOR:-app.kubernetes.io/name=knowme-web}"

logs="$(kubectl logs -l "$SELECTOR" --since="$SINCE" --tail=-1)"
lines="$(printf '%s\n' "$logs" | grep '"alert":"' | sort -u || true)"
if [ -z "$lines" ]; then
  echo "no alerts in the last $SINCE"
  exit 0
fi

count="$(printf '%s\n' "$lines" | wc -l | tr -d ' ')"
names="$(printf '%s\n' "$lines" | jq -r '.fields.alert // empty' | sort -u | paste -sd, -)"
payload="$(jq -n \
  --arg from "$ALERT_FROM" --arg to "$ALERT_TO" \
  --arg subject "[KnowMe site] $count alert(s): $names" \
  --arg text "Alert lines from the site server in the last $SINCE:

$lines" \
  '{from: $from, to: [$to], subject: $subject, text: $text}')"

status="$(curl -sS -o /tmp/resend-response -w '%{http_code}' \
  -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H 'Content-Type: application/json' \
  -d "$payload")"
case "$status" in
  2??) echo "sent $count alert(s): $names" ;;
  *) echo "Resend answered $status:" >&2; cat /tmp/resend-response >&2; exit 1 ;;
esac
