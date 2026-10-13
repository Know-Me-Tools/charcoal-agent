#!/usr/bin/env bash
# Tests scripts/ops/check-uar-mcp-store.sh with a fake kubectl on PATH and a local node HTTP
# stub standing in for UAR and the gate. Touches no cluster and no real service. All "secret"
# values below are fake markers made for this test.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
script="$here/check-uar-mcp-store.sh"
work="$(mktemp -d)"
STUB_PID=""
cleanup() {
  [[ -z "$STUB_PID" ]] || kill "$STUB_PID" 2>/dev/null || true
  rm -rf "$work"
}
trap cleanup EXIT
mkdir "$work/bin"

FAKE_ADMIN="FAKE-ADMIN-KEY-aaaa1111"
FAKE_CLIENT_ID="FAKE-CLIENT-ID-bbbb2222"
FAKE_CLIENT_SECRET="FAKE-CLIENT-SECRET-cccc3333"
FAKE_TOKEN="FAKE-TOKEN-dddd4444"

# Fake kubectl: logs every argv line, answers the few calls the script makes.
cat >"$work/bin/kubectl" <<'STUB'
#!/usr/bin/env bash
printf '%s\n' "$*" >>"$KUBECTL_LOG"
b64() { printf '%s' "$1" | base64 | tr -d '\n'; }
case "$*" in
  *"config get-contexts"*) echo "know-me" ;;
  *"port-forward"*) exec sleep 120 ;;
  *"get secret uar-secrets -o jsonpath"*) b64 "$FAKE_ADMIN" ;;
  *"get secret site-gate-client -o jsonpath={.data.SITE_GATE_CLIENT_ID}"*) b64 "$FAKE_CLIENT_ID" ;;
  *"get secret site-gate-client -o jsonpath={.data.SITE_GATE_CLIENT_SECRET}"*) b64 "$FAKE_CLIENT_SECRET" ;;
  *"get svc uar"* | *"get secret"*) ;;
  *) echo "unexpected kubectl call: $*" >&2; exit 1 ;;
esac
STUB
chmod +x "$work/bin/kubectl"

# Local stub: /readyz, POST /oauth/token, GET /api/uar/mcp/servers. The servers reply is read
# from $work/reply.status and $work/reply.json on every request. Every request is logged as
# "METHOD path" plus whether the two auth headers carried the expected fake values.
cat >"$work/stub.mjs" <<'JS'
import http from "node:http";
import fs from "node:fs";
const w = process.env.WORK;
const srv = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    const auth = req.headers["authorization"] === `Bearer ${process.env.FAKE_TOKEN}`;
    const admin = req.headers["x-uar-admin-key"] === process.env.FAKE_ADMIN;
    fs.appendFileSync(`${w}/requests.log`, `${req.method} ${req.url} auth=${auth} admin=${admin}\n`);
    if (req.url === "/readyz") return void res.writeHead(200).end("ok");
    if (req.url === "/oauth/token" && req.method === "POST") {
      const ok = body.includes(`client_secret=${process.env.FAKE_CLIENT_SECRET}`) && body.includes(`client_id=${process.env.FAKE_CLIENT_ID}`);
      res.writeHead(ok ? 200 : 401, { "content-type": "application/json" });
      return void res.end(JSON.stringify(ok ? { access_token: process.env.FAKE_TOKEN } : { error: "bad client" }));
    }
    if (req.url === "/api/uar/mcp/servers" && req.method === "GET") {
      const status = Number(fs.readFileSync(`${w}/reply.status`, "utf8").trim());
      res.writeHead(status, { "content-type": "application/json" });
      return void res.end(fs.readFileSync(`${w}/reply.json`, "utf8"));
    }
    res.writeHead(404).end("no");
  });
});
srv.listen(0, "127.0.0.1", () => fs.writeFileSync(`${w}/port`, String(srv.address().port)));
JS

command -v node >/dev/null || { echo "node is required for the stub"; exit 2; }
WORK="$work" FAKE_TOKEN="$FAKE_TOKEN" FAKE_ADMIN="$FAKE_ADMIN" FAKE_CLIENT_ID="$FAKE_CLIENT_ID" FAKE_CLIENT_SECRET="$FAKE_CLIENT_SECRET" \
  node "$work/stub.mjs" &
STUB_PID=$!
for _ in $(seq 1 50); do [[ -s "$work/port" ]] && break; sleep 0.1; done
[[ -s "$work/port" ]] || { echo "stub did not start"; exit 2; }
PORT="$(cat "$work/port")"

export PATH="$work/bin:$PATH" KUBECTL_LOG="$work/kubectl.log"
export FAKE_ADMIN FAKE_CLIENT_ID FAKE_CLIENT_SECRET
export LOCAL_PORT="$PORT" SITE_GATE_TOKEN_URL="http://127.0.0.1:$PORT/oauth/token" READY_WAIT_SECS=10

fail=0
check() { # name actual expected
  if [[ "$2" == "$3" ]]; then echo "ok   $1"; else echo "FAIL $1: want '$3' got '$2'"; fail=1; fi
}
contains() { # name haystack needle
  if grep -qF -- "$3" <<<"$2"; then echo "ok   $1"; else echo "FAIL $1: output lacks '$3'"; fail=1; fi
}
lacks() { # name haystack needle
  if grep -qF -- "$3" <<<"$2"; then echo "FAIL $1: output has '$3'"; fail=1; else echo "ok   $1"; fi
}
reset() { : >"$work/kubectl.log"; : >"$work/requests.log"; }
reply() { printf '%s' "$1" >"$work/reply.status"; printf '%s' "$2" >"$work/reply.json"; }

# 1. missing context is refused
reset
if out="$(env -u KUBE_CONTEXT bash "$script" 2>&1)"; then check "missing context is refused" ok refused; else check "missing context is refused" ok ok; fi
contains "missing context says why" "$out" "no kubectl context given"
check "missing context: no kubectl call" "$(wc -l <"$work/kubectl.log" | tr -d ' ')" 0

# 2. wrong context is refused
reset
if out="$(bash "$script" --context prod 2>&1)"; then check "wrong context is refused" ok refused; else check "wrong context is refused" ok ok; fi
contains "wrong context says why" "$out" "is not the know-me cluster context"
check "wrong context: no kubectl call" "$(wc -l <"$work/kubectl.log" | tr -d ' ')" 0

# 3. dry-run makes no kubectl and no HTTP call
reset
out="$(bash "$script" --context know-me --dry-run 2>&1)"
contains "dry-run prints the route" "$out" "GET /api/uar/mcp/servers"
check "dry-run: no kubectl call" "$(wc -l <"$work/kubectl.log" | tr -d ' ')" 0
check "dry-run: no HTTP request" "$(wc -l <"$work/requests.log" | tr -d ' ')" 0

# 4. empty list
reset
reply 200 '{"servers":[]}'
out="$(bash "$script" --context know-me 2>&1)"
contains "empty list is reported" "$out" "stored MCP servers: NONE"

# 5. two servers listed: host:port only, honest preapproved wording, no path or headers
reset
reply 200 '{"servers":[
 {"name":"websearch","enabled":true,"connected":true,"transport":"remote_http","url":"http://site-websearch:8080/mcp","headerNames":["Authorization"],"headerSecretReferences":[{"name":"Authorization","secretRef":"env:WEBSEARCH_MCP_AUTH","credentialRevision":"r1"}],"tools":["websearch__search"]},
 {"name":"other","enabled":false,"connected":false,"transport":"remote_http","url":"https://user:pw@example.org:8443/x/y?z=1#f","tools":[]}]}'
out="$(bash "$script" --context know-me 2>&1)"
contains "two servers: count" "$out" "stored MCP servers: 2"
contains "websearch line" "$out" "websearch  enabled=true  connected=true  url=site-websearch:8080  preapproved_tools=not shown by the API"
contains "other line, userinfo and path stripped" "$out" "other  enabled=false  connected=false  url=example.org:8443  preapproved_tools=not shown by the API"
lacks "no URL path in output" "$out" "8080/mcp"
lacks "no header or secret-ref name in output" "$out" "WEBSEARCH_MCP_AUTH"
lacks "no userinfo in output" "$out" "user:pw"
check "both auth headers were accepted by the stub" "$(grep -c 'GET /api/uar/mcp/servers auth=true admin=true' "$work/requests.log")" 1
non_get="$( (grep -v '^GET ' "$work/requests.log" || true) | (grep -v '^POST /oauth/token ' || true) | wc -l | tr -d ' ')"
check "only GET against UAR (the sole POST is the gate token)" "$non_get" 0

# 6. HTTP 401 fails clearly
reset
reply 401 '{"error":"unauthorized"}'
if out="$(bash "$script" --context know-me 2>&1)"; then check "HTTP 401 fails" ok failed; else check "HTTP 401 fails" ok ok; fi
contains "HTTP 401 message" "$out" "UAR refused the request: HTTP 401"

# 7. no secret value in the fake kubectl argv log, nor in the script output
reset
reply 200 '{"servers":[]}'
out="$(bash "$script" --context know-me 2>&1)"
for v in "$FAKE_ADMIN" "$FAKE_CLIENT_ID" "$FAKE_CLIENT_SECRET" "$FAKE_TOKEN"; do
  b="$(printf '%s' "$v" | base64 | tr -d '\n')"
  check "kubectl argv log lacks $v" "$(grep -cF -e "$v" -e "$b" "$work/kubectl.log" || true)" 0
  lacks "output lacks $v" "$out" "$v"
done
check "kubectl made no write call" "$(grep -cE ' (create|delete|patch|apply|edit|replace|exec|scale|rollout|label|annotate) ' "$work/kubectl.log" || true)" 0

exit "$fail"
