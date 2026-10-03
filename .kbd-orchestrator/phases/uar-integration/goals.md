# Goals

Operator request, 2026-09-30. Credentials are redacted here: they live only in git-ignored `.env` files.

1. **Local UAR in Docker.** Build a Docker image from `/Users/gqadonis/Projects/prometheus/universal-agent-runtime` and run it through this repo's `docker-compose.yaml` for local testing, alongside the KnowMe UI.
2. **Kubernetes deployment in `k8s/`.** Put the manifests for a UAR deployment on the `know-me` kubectl context in the `k8s/` subdirectory. Configuration comes from Kubernetes secrets, never literals.
3. **Public DNS and TLS.** Serve the instance at an appropriate `<name>.know-me.tools` host. Share the cluster's **existing Envoy Gateway** rather than installing another. For TLS, use cert-manager with Let's Encrypt, or reuse an existing wildcard certificate for `*.know-me.tools` if one exists.
4. **GitHub Actions deploy.** A workflow that builds the image and deploys it to the `know-me` context using the `k8s/` config, with credentials and settings supplied as GitHub secrets.
5. **Default chat model configured automatically.** UAR's embedded liter-llm settings use the operator-specified Qwen "3.8 max" model through the Alibaba Token Plan. The key and URL are in `/Users/gqadonis/Projects/know-me/know-me-decision/.env`. The exact model id must be confirmed from Alibaba documentation, not guessed. It becomes the default model, so the deployed UAR has a working model.
6. **Default embedding model.** A Qwen embedding model through DashScope's OpenAI-compatible endpoint (`https://dashscope-intl.aliyuncs.com/compatible-mode/v1`), using a DashScope API key the operator supplied in session.
   - The model id comes from web research.
   - The key is written to `know-me-decision/.env`, never to a tracked file.
7. **Local `.env`.** A git-ignored `.env` in this repo holds every setting needed to run the stack locally.
8. **Carried from complete-rebranding:**
   - the deferred live UAR smoke test against the real runtime
   - About-page endpoint truth (landing S5)

## Constraints
- No secret in any tracked file, commit, PR, log or `goals.md`. Local development uses `.env`; the cluster uses Kubernetes secrets populated from GitHub secrets.
- The operator pasted the DashScope key in chat. It has therefore been exposed in the session transcript; rotating it after setup is recommended.
- Reuse the existing cluster infrastructure (Envoy Gateway, cert-manager) and install nothing that already exists.
