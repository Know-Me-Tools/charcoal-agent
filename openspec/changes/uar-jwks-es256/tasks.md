## 1. UAR verifies ES256 gate tokens

- [x] 1.1 JWKS verifier accepts ES256 and ES384 as well as RS256, each key bound to one algorithm, with integration tests. Evidence: Prometheus-AGS/universal-agent-runtime#321 merged, 9 integration tests.
- [x] 1.2 Fix the image build broken after #321. Evidence: Prometheus-AGS/universal-agent-runtime#324 merged.
- [x] 1.3 Publish an image containing #321. Evidence: post-merge `Build and Publish Images` run 36997759532 green.
- [ ] 1.4 Done-when: `ci-supply-chain-pins` pins the UAR image by digest in the manifests and workflows, and that digest comes from run 36997759532 or a later green run whose source commit contains #321 (checked with `git merge-base --is-ancestor <#321 merge commit> <image source commit>` in the UAR repo).
