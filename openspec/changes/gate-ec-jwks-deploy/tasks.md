## 1. Gate JWKS publishes a standard EC key

- [x] 1.1 JWKS EC key keeps `pem` and adds `crv`, `x` and `y`. Evidence: Know-Me-Tools/flint-gate#10, 7 of 7 `jwks_publish` tests passing locally.
- [x] 1.2 Build #10 on current gate main through flint-infra `images.yaml` and bump the gate digest in know-me-cluster. Evidence: Prometheus-AGS/know-me-cluster#2, deployed 2026-10-01.
- [x] 1.3 Deployed gate JWKS serves the EC key with `kty`, `crv`, `x` and `y`. Evidence: `https://gate.know-me.tools/.well-known/jwks.json` observed 2026-10-01.
- [x] 1.4 Re-check the JWKS serves kty, crv, x, y: `curl -fsS https://gate.know-me.tools/.well-known/jwks.json | jq -e '[.keys[] | select(.kty == "EC" and .crv and .x and .y)] | length > 0'` exits 0; output recorded.
  Evidence (2026-10-02): `curl https://gate.know-me.tools/.well-known/jwks.json` → 200; key `flint-gate-key` has `kty: EC`, `crv: P-256`, `x`, `y`.
