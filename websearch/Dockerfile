# site-websearch image: the web-search MCP wrapper (websearch/), one static
# binary on distroless. Build context is this directory:
#
#   docker build -t site-websearch websearch/
#
# Stages:
#   build   - cargo build --release --locked against the committed Cargo.lock
#   runtime - distroless cc, non-root (UID 65532), no shell. Its CA bundle is
#             what reqwest's rustls platform verifier reads for the TLS call
#             to api.firecrawl.dev.
#
# Base images are the same digests as the site image (../Dockerfile, pinned
# in versions.toml [pins] image/rust and image/distroless-cc, checked
# 2026-09-30); bump them together.

# ─── Stage 1: binary ─────────────────────────────────────────────────────────
FROM rust:1.98.1-slim-trixie@sha256:4cd829461bd5c4d511c32e269da9cb8929223b666519d8004e35fc8d1d771ab7 AS build

WORKDIR /build

# Dependency layer: compile the locked crate graph against stub sources, so it
# stays cached until Cargo.toml or Cargo.lock change.
COPY Cargo.toml Cargo.lock ./
RUN mkdir src \
 && echo 'fn main() {}' > src/main.rs \
 && touch src/lib.rs \
 && cargo build --release --locked \
 && rm -rf src \
      target/release/site-websearch* \
      target/release/deps/site_websearch* target/release/deps/libsite_websearch* \
      target/release/.fingerprint/site-websearch-*

COPY src ./src
RUN touch src/main.rs src/lib.rs \
 && cargo build --release --locked

# ─── Stage 2: runtime ────────────────────────────────────────────────────────
FROM gcr.io/distroless/cc-debian13:nonroot@sha256:54df941ed0d06a1bd95ef5e0ce391fd8d9f94b64782dc9a60062727849ee3f97 AS runtime

LABEL org.opencontainers.image.source="https://github.com/Know-Me-Tools/charcoal-agent" \
      org.opencontainers.image.description="KnowMe site web-search MCP wrapper"

COPY --from=build /build/target/release/site-websearch /usr/local/bin/site-websearch

# The distroless "nonroot" user; the k8s securityContext pins the same UID.
USER 65532:65532
ENV PORT=8080 \
    RUST_LOG=info
EXPOSE 8080

# No HEALTHCHECK: the image has no shell or HTTP client. Kubernetes probes
# /healthz (liveness) and /readyz (readiness).
ENTRYPOINT ["/usr/local/bin/site-websearch"]
