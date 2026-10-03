## ADDED Requirements

### Requirement: Runtime host closed
No UAR endpoint SHALL answer a request from the internet to `runtime.know-me.tools`, and the manifests SHALL NOT contain an HTTPRoute for that host.

#### Scenario: Internet request to the runtime host
- **GIVEN** the stack deployed after this change and any previously applied runtime route deleted
- **WHEN** a client requests `https://runtime.know-me.tools/readyz`, `/metrics`, `/admin` or `/api/agents`
- **THEN** no UAR endpoint answers (no route, or a refusal), and the output is recorded in the change

#### Scenario: Rendered manifests
- **GIVEN** the kustomize base in `k8s/`
- **WHEN** `kubectl kustomize k8s` renders it
- **THEN** the output contains no `runtime.know-me.tools` hostname

### Requirement: UAR reachable only from admitted pods
A NetworkPolicy SHALL admit ingress to `uar:6565` only from `knowme-web`, flint-gate and, if this change decides so, the seed job.

#### Scenario: Unadmitted pod
- **GIVEN** a pod in the cluster without an admitted label
- **WHEN** it opens a connection to `uar:6565`
- **THEN** the connection fails, while a `knowme-web` pod connects

### Requirement: CI does not call the runtime host
The deploy workflow's health and agent checks SHALL run inside the cluster or through the proxy, not against `runtime.know-me.tools`.

#### Scenario: Workflow checks
- **GIVEN** `.github/workflows/site.yml`
- **WHEN** it is searched for `runtime.know-me.tools`
- **THEN** no match is found
