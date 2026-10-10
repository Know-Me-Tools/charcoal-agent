#!/usr/bin/env bash
# One-time cluster bootstrap for the KnowMe site stack (namespace `knowme` on
# the `know-me` LKE cluster), run by the operator from a machine with admin
# access to the cluster and `gh` logged in to Know-Me-Tools/charcoal-agent.
#
# It never prints a secret. Generated values go straight into Kubernetes
# Secrets or GitHub secrets. Every Secret is created only if it does not
# already exist, so re-running never rotates a live credential (rotation is a
# deliberate act: delete the Secret, then re-run).
#
# Usage:
#   scripts/ops/bootstrap-site.sh secrets  [--env-file <path>]
#       Namespace, CI deploy kubeconfig, all out-of-band Secrets, the kill
#       switch (on), and the gate OAuth client `knowme-site`.
#       Needs LLM_API_KEY (chat, Qwen Token Plan) and EMBEDDING_API_KEY
#       (DashScope) in the environment or in --env-file (sourced, not printed).
#   scripts/ops/bootstrap-site.sh meter-user
#       After the first deploy (SurrealDB running): defines the meter's
#       database-scoped user (ns=site, db=meter) from Secret site-meter-auth.
#   scripts/ops/bootstrap-site.sh kill-switch on|off
#       Sets the site chat kill switch. The site server reads it within ~10 s.
#   scripts/ops/bootstrap-site.sh a2ui on|off
#       Sets the A2UI opt-in (ConfigMap site-a2ui-optin). The site server
#       reads it within ~10 s. Absent means off. `off` creates it if missing.
#   RESEND_API_KEY=... scripts/ops/bootstrap-site.sh alert-email <to-address> [from-address]
#       Creates Secret site-alert-mail and applies k8s/alerts: a CronJob that
#       emails the site server's alert log lines every 5 minutes. The key is
#       read from the environment, never printed. The from-address must be on
#       a domain verified in Resend (default site-alerts@prometheusags.ai).
#
# Requires: kubectl, gh, openssl, htpasswd, jq.
set -euo pipefail

CONTEXT="${KNOWME_CONTEXT:-know-me}"
NS="knowme"
REPO="Know-Me-Tools/charcoal-agent"
GATE_NS="flint-core"
GATE_CLIENT_ID="knowme-site"
GATE_AUDIENCE="uar"
KILL_SWITCH_CM="site-chat-kill-switch"
A2UI_OPTIN_CM="site-a2ui-optin"
UAR_IMAGE="ghcr.io/prometheus-ags/universal-agent-runtime@sha256:688a97e42a0be63247b95c3b1a3c5ebd9da9078c79d63c4f31d979d469b77888"

log() { printf '[bootstrap-site] %s\n' "$*" >&2; }
die() { printf '[bootstrap-site] ERROR: %s\n' "$*" >&2; exit 1; }
kc() { kubectl --context "$CONTEXT" "$@"; }
rand() { openssl rand -hex "${1:-32}"; }

need() { for c in "$@"; do command -v "$c" >/dev/null 2>&1 || die "required command not found: $c"; done; }

secret_exists() { kc -n "$1" get secret "$2" >/dev/null 2>&1; }

# create_secret <name> KEY=VALUE... — values passed through a 0600 temp env
# file, never on the command line.
create_secret() {
  local name="$1"; shift
  if secret_exists "$NS" "$name"; then
    log "secret $name exists; leaving it unchanged"
    return
  fi
  local tmp
  tmp="$(mktemp)"; chmod 600 "$tmp"
  printf '%s\n' "$@" >"$tmp"
  kc -n "$NS" create secret generic "$name" --from-env-file="$tmp" >/dev/null
  rm -f "$tmp"
  log "created secret $name"
}

cmd_secrets() {
  need kubectl gh openssl htpasswd jq
  local env_file=""
  if [[ "${1:-}" == "--env-file" ]]; then
    env_file="${2:?--env-file needs a path}"
    [[ -f "$env_file" ]] || die "env file not found: $env_file"
    set -a
    # shellcheck disable=SC1090
    . "$env_file"
    set +a
  fi
  [[ -n "${LLM_API_KEY:-}" ]] || die "LLM_API_KEY (chat model key) must be set"
  [[ -n "${EMBEDDING_API_KEY:-}" ]] || die "EMBEDDING_API_KEY (DashScope key) must be set"
  gh auth status >/dev/null 2>&1 || die "gh is not logged in"

  # 1. Namespace and the CI deploy identity (namespace-scoped).
  log "minting the CI deploy kubeconfig (namespace $NS)"
  # The mint script refuses to overwrite an existing file, so give it a path
  # that does not exist yet inside a private temp directory.
  local kubeconfig_dir kubeconfig
  kubeconfig_dir="$(mktemp -d)"; chmod 700 "$kubeconfig_dir"
  kubeconfig="$kubeconfig_dir/kubeconfig"
  "$(dirname "$0")/../../k8s/bootstrap/mint-deployer-kubeconfig.sh" "$CONTEXT" "$kubeconfig"
  gh secret set KNOWME_KUBECONFIG -R "$REPO" <"$kubeconfig"
  rm -rf "$kubeconfig_dir"
  log "set GitHub secret KNOWME_KUBECONFIG"

  # 2. Database root password: one value shared by SurrealDB and UAR.
  local surreal_root=""
  if ! secret_exists "$NS" surrealdb-auth; then
    surreal_root="$(rand 24)"
    create_secret surrealdb-auth "SURREALDB_ROOT_PASSWORD=$surreal_root"
  fi
  if ! secret_exists "$NS" uar-secrets; then
    if [[ -z "$surreal_root" ]]; then
      surreal_root="$(kc -n "$NS" get secret surrealdb-auth -o jsonpath='{.data.SURREALDB_ROOT_PASSWORD}' | base64 -d)"
    fi
    create_secret uar-secrets \
      "UAR_LLM__API_KEY=$LLM_API_KEY" \
      "UAR_LLM__EMBEDDING__API_KEY=$EMBEDDING_API_KEY" \
      "UAR_SECURITY__JWT_SECRET=$(rand 32)" \
      "UAR_SECURITY__SETTINGS_ADMIN_KEY=$(rand 32)" \
      "UAR_PERSISTENCE__SURREAL_PASS=$surreal_root"
  fi
  surreal_root=""

  # 3. Site server secrets.
  create_secret site-session "secret=$(rand 32)"
  create_secret site-meter-auth "SITE_METER_USER=site_meter" "SITE_METER_PASS=$(rand 24)"

  # 4. Kill switch, created ON. Never overwritten here.
  if kc -n "$NS" get configmap "$KILL_SWITCH_CM" >/dev/null 2>&1; then
    log "configmap $KILL_SWITCH_CM exists; leaving it unchanged"
  else
    kc -n "$NS" create configmap "$KILL_SWITCH_CM" --from-literal=state=on >/dev/null
    log "created configmap $KILL_SWITCH_CM (state=on: chat refused)"
  fi

  # 5. Gate OAuth client knowme-site (aud=uar) + Secret site-gate-client +
  #    the same credential as GitHub secrets for the CI seed step.
  if secret_exists "$NS" site-gate-client; then
    log "secret site-gate-client exists; gate client left unchanged"
  else
    local client_secret hash db_url
    client_secret="$(rand 32)"
    hash="$(htpasswd -nbBC 12 "" "$client_secret" | tr -d ':\n')"
    db_url="$(kc -n "$GATE_NS" get secret flint-gate -o jsonpath='{.data.database-url}' | base64 -d)"
    kc -n "$GATE_NS" exec -i statefulset/postgres -c postgres -- \
      psql "$db_url" -v ON_ERROR_STOP=1 -q -v hash="$hash" -v cid="$GATE_CLIENT_ID" -v aud="$GATE_AUDIENCE" <<'SQL'
INSERT INTO oauth_clients (client_id, secret_hash, scopes, audience, active)
VALUES (:'cid', :'hash', '[]'::jsonb, :'aud', true)
ON CONFLICT (client_id) DO UPDATE
  SET secret_hash = EXCLUDED.secret_hash, audience = EXCLUDED.audience, active = true;
SQL
    db_url=""
    log "registered gate OAuth client $GATE_CLIENT_ID (aud=$GATE_AUDIENCE)"
    create_secret site-gate-client "SITE_GATE_CLIENT_ID=$GATE_CLIENT_ID" "SITE_GATE_CLIENT_SECRET=$client_secret"
    printf '%s' "$GATE_CLIENT_ID" | gh secret set SITE_GATE_CLIENT_ID -R "$REPO"
    printf '%s' "$client_secret" | gh secret set SITE_GATE_CLIENT_SECRET -R "$REPO"
    client_secret=""
    log "set GitHub secrets SITE_GATE_CLIENT_ID and SITE_GATE_CLIENT_SECRET"
  fi

  log "done. Next: merge to main (CI builds and deploys), then: $0 meter-user"
}

cmd_meter_user() {
  need kubectl
  kc -n "$NS" rollout status statefulset/surrealdb --timeout=5m >/dev/null
  local job
  job="site-meter-user-$(date +%s)"
  kc -n "$NS" apply -f - <<YAML
apiVersion: batch/v1
kind: Job
metadata:
  name: $job
  namespace: $NS
spec:
  backoffLimit: 0
  ttlSecondsAfterFinished: 300
  template:
    metadata:
      labels:
        app.kubernetes.io/name: site-meter-bootstrap
    spec:
      restartPolicy: Never
      containers:
        - name: define-meter-user
          image: $UAR_IMAGE
          command: ["sh", "-c"]
          args:
            - >-
              curl -fsS -X POST -u "root:\$ROOT" -H "Accept: application/json"
              --data-binary "DEFINE NAMESPACE IF NOT EXISTS site; USE NS site;
              DEFINE DATABASE IF NOT EXISTS meter; USE NS site DB meter;
              DEFINE USER OVERWRITE \$METER_USER ON DATABASE PASSWORD '\$METER_PASS' ROLES EDITOR;"
              http://surrealdb:8000/sql >/dev/null
          env:
            - name: ROOT
              valueFrom: {secretKeyRef: {name: surrealdb-auth, key: SURREALDB_ROOT_PASSWORD}}
            - name: METER_USER
              valueFrom: {secretKeyRef: {name: site-meter-auth, key: SITE_METER_USER}}
            - name: METER_PASS
              valueFrom: {secretKeyRef: {name: site-meter-auth, key: SITE_METER_PASS}}
YAML
  kc -n "$NS" wait --for=condition=complete "job/$job" --timeout=2m >/dev/null \
    || die "meter user job failed: kubectl --context $CONTEXT -n $NS logs job/$job"
  log "defined the meter user in ns=site db=meter"
}

cmd_kill_switch() {
  need kubectl
  local state="${1:-}"
  [[ "$state" == on || "$state" == off ]] || die "kill-switch takes on|off"
  kc -n "$NS" create configmap "$KILL_SWITCH_CM" --from-literal=state="$state" \
    --dry-run=client -o yaml | kc apply -f - >/dev/null
  log "kill switch $state (applies within ~10 s, no restart)"
}

cmd_a2ui() {
  need kubectl
  local state="${1:-}"
  [[ "$state" == on || "$state" == off ]] || die "a2ui takes on|off"
  kc -n "$NS" create configmap "$A2UI_OPTIN_CM" --from-literal=state="$state" \
    --dry-run=client -o yaml | kc apply -f - >/dev/null
  log "A2UI opt-in $state (applies within ~10 s, no restart)"
}

cmd_alert_email() {
  local to="${1:-}" from="${2:-site-alerts@prometheusags.ai}"
  [ -n "$to" ] || die "usage: alert-email <to-address> [from-address]"
  [ -n "${RESEND_API_KEY:-}" ] || die "RESEND_API_KEY is not set (a send-only Resend key)"
  local tmp
  tmp="$(mktemp)"; chmod 600 "$tmp"
  printf '%s\n' "RESEND_API_KEY=$RESEND_API_KEY" "ALERT_TO=$to" "ALERT_FROM=$from" >"$tmp"
  kc -n "$NS" create secret generic site-alert-mail --from-env-file="$tmp" \
    --dry-run=client -o yaml | kc -n "$NS" apply -f - >/dev/null
  rm -f "$tmp"
  kc apply -k "$(dirname "$0")/../../k8s/alerts" >/dev/null
  log "alert mailer applied: alerts go to $to from $from, every 5 minutes"
}

case "${1:-}" in
  alert-email) shift; cmd_alert_email "$@" ;;
  secrets) shift; cmd_secrets "$@" ;;
  meter-user) cmd_meter_user ;;
  kill-switch) shift; cmd_kill_switch "$@" ;;
  a2ui) shift; cmd_a2ui "$@" ;;
  *) die "usage: $0 secrets [--env-file <path>] | meter-user | kill-switch on|off | a2ui on|off" ;;
esac
