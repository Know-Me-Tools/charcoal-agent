#!/usr/bin/env bash
# check-manifests: fail CI if the Kubernetes manifests are not valid YAML or
# render to a workload with a container that has no image.
#
# Born from PR #82, which merged `image:ghcr.io/...` (no space after the
# colon) into k8s/base/uar-deployment.yaml. That is a valid plain scalar, so
# nothing complained until the deploy did.
#
# Checks:
#   1. Every *.yaml / *.yml under k8s/, plus docker-compose.yaml, parses as
#      YAML (all documents).
#   2. Every kustomization under k8s/ renders with `kubectl kustomize`
#      (catches invalid YAML and missing resources).
#   3. In the rendered output, every container and initContainer of every
#      Deployment, StatefulSet, DaemonSet, Job and CronJob has a non-empty
#      string `image`.
#   4. If `kubeconform` is installed, rendered output is schema-validated
#      (-ignore-missing-schemas, no network). Skipped silently if absent.
#
# Needs: kubectl, and python3 with PyYAML (or `yq` v4 as a fallback parser).
# Never installs or downloads anything.
#
# Usage: ./scripts/check-manifests.sh [ROOT]
#   ROOT defaults to the repository root; tests point it at a scratch copy
#   containing k8s/ (and optionally docker-compose.yaml).

set -euo pipefail

ROOT="${1:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT"

fail=0
log_fail() {
  printf '[check-manifests] FAIL: %s\n' "$*" >&2
  fail=1
}

command -v kubectl >/dev/null 2>&1 || { log_fail "kubectl not found"; exit 1; }
command -v python3 >/dev/null 2>&1 || { log_fail "python3 not found"; exit 1; }

# Shared loader: PyYAML if importable, else `yq -o=json`.
PY_LOADER='
import json, subprocess, sys
try:
    import yaml
    def load_all(text):
        return [d for d in yaml.safe_load_all(text)]
except ImportError:
    def load_all(text):
        p = subprocess.run(["yq", "-o=json", "-I=0", "."], input=text,
                           capture_output=True, text=True)
        if p.returncode != 0:
            raise ValueError(p.stderr.strip() or "yq failed")
        dec, i, out = json.JSONDecoder(), 0, []
        s = p.stdout
        while i < len(s):
            while i < len(s) and s[i].isspace():
                i += 1
            if i < len(s):
                d, i = dec.raw_decode(s, i)
                out.append(d)
        return out
'

PARSE_FILE_PY="$PY_LOADER
try:
    load_all(open(sys.argv[1]).read())
except Exception as e:
    print(sys.argv[1] + ': ' + str(e).replace(chr(10), ' ')[:300])
    sys.exit(1)
"

CHECK_IMAGES_PY="$PY_LOADER
where = sys.argv[1]
try:
    docs = load_all(sys.stdin.read())
except Exception as e:
    print(where + ': rendered output does not parse: ' + str(e)[:300])
    sys.exit(1)
kinds = ('Deployment', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob')
bad = []
for doc in docs:
    if not isinstance(doc, dict) or doc.get('kind') not in kinds:
        continue
    name = '%s/%s' % (doc.get('kind'), (doc.get('metadata') or {}).get('name'))
    spec = doc.get('spec') or {}
    if doc['kind'] == 'CronJob':
        spec = (spec.get('jobTemplate') or {}).get('spec') or {}
    pod = (spec.get('template') or {}).get('spec') or {}
    for key in ('containers', 'initContainers'):
        for i, c in enumerate(pod.get(key) or []):
            img = c.get('image') if isinstance(c, dict) else None
            if not isinstance(img, str) or not img.strip():
                cname = c.get('name') if isinstance(c, dict) else repr(c)
                bad.append('%s: %s %s[%d] (%s) has no image' % (where, name, key, i, cname))
    if not pod.get('containers'):
        bad.append('%s: %s has no containers' % (where, name))
if bad:
    print(chr(10).join(bad))
    sys.exit(1)
"

if ! python3 -c 'import yaml' 2>/dev/null && ! command -v yq >/dev/null 2>&1; then
  log_fail "need python3 with PyYAML, or yq, to parse YAML; neither is available"
  exit 1
fi

# 1. Every YAML file parses.
files=()
while IFS= read -r f; do files+=("$f"); done < <(find k8s -type f \( -name '*.yaml' -o -name '*.yml' \) 2>/dev/null | sort)
if [[ -f docker-compose.yaml ]]; then files+=(docker-compose.yaml); fi
if [[ ${#files[@]} -eq 0 ]]; then
  log_fail "no YAML files found under $ROOT/k8s"
  exit 1
fi
for f in "${files[@]}"; do
  if ! python3 -I -c "$PARSE_FILE_PY" "$f" >&2; then
    log_fail "$f: does not parse as YAML"
  fi
done

# 2 + 3 (+ 4). Render each kustomization and check workload images.
kdirs=()
while IFS= read -r d; do kdirs+=("$d"); done < <(find k8s -type f -name kustomization.yaml -exec dirname {} \; | sort)
for d in "${kdirs[@]}"; do
  if ! rendered="$(kubectl kustomize "$d" 2>&1)"; then
    log_fail "$d: kubectl kustomize failed: $(printf '%s' "$rendered" | tr '\n' ' ' | cut -c1-400)"
    continue
  fi
  if ! printf '%s\n' "$rendered" | python3 -I -c "$CHECK_IMAGES_PY" "$d" >&2; then
    log_fail "$d: a rendered workload container is missing its image (see above)"
  fi
  if command -v kubeconform >/dev/null 2>&1; then
    if ! out="$(printf '%s\n' "$rendered" | kubeconform -ignore-missing-schemas -summary 2>&1)"; then
      log_fail "$d: kubeconform: $(printf '%s' "$out" | tr '\n' ' ' | cut -c1-400)"
    fi
  fi
done

if [[ "$fail" -ne 0 ]]; then
  echo "[check-manifests] manifests are invalid; see failures above." >&2
  exit 1
fi

echo "[check-manifests] ${#files[@]} YAML files parse; ${#kdirs[@]} kustomizations render; every workload container has an image."
