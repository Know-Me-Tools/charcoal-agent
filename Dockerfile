# KnowMe site image: the Axum site server (server/) with the Vite bundle
# embedded in the binary. One process serves the SPA and proxies the audited
# UAR routes; there is no nginx.
#
# Stages:
#   web     - `npm ci` + `npm run build` (Node from .nvmrc: 24)
#   server  - cargo build against the prebuilt dist via KNOWME_WEB_DIST_DIR,
#             so the Rust image needs no Node and each stage caches on its own
#             inputs (a copy change does not recompile the crate graph)
#   runtime - distroless cc, non-root (UID 65532), no shell
#
# Base images are pinned by digest (checked 2026-09-30); Renovate bumps them.

# ─── Stage 1: web bundle ─────────────────────────────────────────────────────
FROM node:24.21.0-trixie-slim@sha256:8ec5d7557396cfe32d21c3f9c13072355ceab22b584578ca4bb28af31120cffe AS web

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY content ./content
COPY src ./src

# The public build pins every chat thread to the site agent. It never carries
# a UAR key or base URL: the site calls its own origin and the server injects
# the key. .env files are excluded by .dockerignore; the empty values here are
# a second guard.
ARG VITE_SITE_AGENT_ID=knowme-site
RUN VITE_SITE_AGENT_ID="${VITE_SITE_AGENT_ID}" VITE_UAR_API_KEY= VITE_UAR_BASE_URL= \
    npm run build

# ─── Stage 2: server binary ──────────────────────────────────────────────────
FROM rust:1.98.1-slim-trixie@sha256:4cd829461bd5c4d511c32e269da9cb8929223b666519d8004e35fc8d1d771ab7 AS server

WORKDIR /build/server

# Dependency layer: compile the locked crate graph against stub sources, so it
# stays cached until Cargo.toml or Cargo.lock change.
COPY server/Cargo.toml server/Cargo.lock ./
RUN mkdir src \
 && echo 'fn main() {}' > build.rs \
 && echo 'fn main() {}' > src/main.rs \
 && touch src/lib.rs \
 && cargo build --release --locked -p knowme-site-server \
 && rm -rf src build.rs \
      target/release/knowme-site-server* \
      target/release/deps/knowme_site_server* target/release/deps/libknowme_site_server* \
      target/release/.fingerprint/knowme-site-server-* \
      target/release/build/knowme-site-server-*

COPY server/build.rs ./
COPY server/src ./src
COPY --from=web /app/dist /web-dist

ENV KNOWME_WEB_DIST_DIR=/web-dist
RUN touch build.rs src/main.rs src/lib.rs \
 && cargo build --release --locked -p knowme-site-server

# ─── Stage 3: runtime ────────────────────────────────────────────────────────
FROM gcr.io/distroless/cc-debian13:nonroot@sha256:54df941ed0d06a1bd95ef5e0ce391fd8d9f94b64782dc9a60062727849ee3f97 AS runtime

COPY --from=server /build/server/target/release/knowme-site-server /usr/local/bin/knowme-site-server

# The distroless "nonroot" user; the k8s securityContext pins the same UID.
USER 65532:65532
ENV PORT=8080 \
    RUST_LOG=info
EXPOSE 8080

# No HEALTHCHECK: the image has no shell or HTTP client. Kubernetes probes
# /healthz (liveness) and /readyz (readiness).
ENTRYPOINT ["/usr/local/bin/knowme-site-server"]
