## 1. flint-gate external-authorization check endpoint

- [ ] 1.1 Add an HTTP `POST` check endpoint to flint-gate that authenticates the forwarded request with gate's existing `kratos`, `jwt`, `api_key` and `anonymous` providers, chosen per guarded route, and answers allow or deny.
- [ ] 1.2 On allow, mint an ES256 JWT with gate's existing minting and return it as an `Authorization: Bearer <jwt>` header for Envoy to inject upstream.
- [ ] 1.3 Strip client-supplied auth headers (`Authorization`, `X-API-Key`) so the upstream sees only the gate-minted bearer.
- [ ] 1.4 Integration tests with Envoy-shaped check requests: allow with a valid credential returns the injected bearer, and that bearer verifies against gate's JWKS; deny on a credential-required route without a credential; anonymous allow on an anonymous route; a client-supplied `Authorization` never reaches the upstream headers.
- [ ] 1.5 Deploy through the `gate-ci-gitops` path (flint-infra `images.yaml` build, know-me-cluster digest PR) before any SecurityPolicy references the endpoint.
- [ ] 1.6 Integration check: the 1.4 suite passes in flint-gate CI; from a pod in the know-me cluster, an Envoy-shaped `POST` to the deployed check endpoint returns allow with a bearer that verifies against `https://gate.know-me.tools/.well-known/jwks.json`, and deny for a credential-required route without a credential; output recorded.
