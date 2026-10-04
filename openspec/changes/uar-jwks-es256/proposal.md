## Why

flint-gate mints ES256 tokens, and UAR's JWKS verifier accepted only RS256, so UAR could not verify a gate-minted token. FR-46 needs UAR to accept only gate-minted tokens.

## What Changes

- UAR's JWKS verifier accepts ES256 and ES384 as well as RS256, with each key bound to one algorithm.
- State (plan A2 N3): effectively done. Prometheus-AGS/universal-agent-runtime#321 is merged with 9 integration tests; the build fix #324 is merged; the post-merge `Build and Publish Images` run 36997759532 is green. Remaining: a digest-pinned UAR image that carries it, through `ci-supply-chain-pins`.
- Lands in: Prometheus-AGS/universal-agent-runtime; the pin lands in this repo through `ci-supply-chain-pins`. Owner: km-rust-engineer with the UAR maintainers.
- Depends on: none for the code; closing waits on `ci-supply-chain-pins`. Blocks `gate-site-credentials`.
- Plan: `.kbd-orchestrator/phases/uar-integration/plan.md` (revision 3).

## Impact

- Capability: `uar-jwks-es256`.
- Requirements: FR-46; part of §6.4 item 17.
