# BossFang and upstream LibreFang

## What BossFang inherits from LibreFang

The agent operating system itself comes from LibreFang: the kernel that runs agents, their tools and memory, messaging channels, networking between agents, the web dashboard and the command line. LibreFang is written in Rust on tokio and axum. Package listings, partner announcements, install scripts and project statistics in the repository README describe upstream LibreFang. They are not BossFang claims, and this knowledge base does not repeat them.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-12.

## BossFang-specific storage

BossFang makes SurrealDB its default operational store, embedded on disk or reached as a remote server, where upstream uses SQLite. SQLite stays as a fallback, and a command imports existing SQLite data into SurrealDB. Its configuration store in SurrealDB records only the names of environment variables for secrets, never secret values.

Source: BossFang feature ledger, retrieved 2026-10-12.

## BossFang-specific memory and model access

BossFang uses the Surreal Memory Server library for memory. It adds an opt-in driver and a manifest translator so agents can run their model calls through the Universal Agent Runtime.

Source: BossFang AGENTS.md, product identity and fork additions, retrieved 2026-10-12.
Source: BossFang feature ledger, retrieved 2026-10-12.

## Other BossFang-specific features

BossFang adds a WASI component-model plugin host whose permissions are denied by default. It carries BossFang branding in the dashboard and desktop app, with its own desktop identity and update channel. Its `BOSSFANG_*` environment variables take priority over the `LIBREFANG_*` names, which still work. Internal crate and function names keep their LibreFang names on purpose.

Source: BossFang feature ledger, retrieved 2026-10-12.
