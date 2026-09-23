---
type: SessionRecord
id: karpathy-session-f7b1116076d4da39
title: Karpathy session f7b1116076d4
tags:
- karpathy
- session-learning
sources:
- session:f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
timestamp: 2026-09-23T22:18:07.941072+00:00
created_at: 2026-09-23T22:18:07.941072+00:00
updated_at: 2026-09-23T22:18:07.941072+00:00
revision: 0
---

## Delta

I wrote `CLAUDE.md` at the repo root. There was no existing one, and no Cursor or Copilot rules to fold in. The README is still the stock Lovable template, so I only kept the stack details from it.

What the file covers:
- **What the repo is:** a React 19 + Vite chat front end for the Universal Agent Runtime (UAR), the Rust backend in `../prometheus/universal-agent-runtime`, with an optional Tauri desktop wrapper.
- **Commands:** dev server, build, lint, tests (including how to run one file or one test by name), Tauri, `run-agent.sh`, and `docker compose`.
- **How it talks to UAR:** everything goes through `api-client.ts`. In dev, requests go through Vite's proxy, which avoids cross-origin (CORS) errors. Every request sends the current thread's ID in an `X-UAR-Session-ID` header.
- **How a chat message flows:** the streaming hook reads UAR's event stream, the message store turns events into content blocks, each block type has its own component, and assistant-ui displays them. The file also lists the steps for adding a new event type.
- **Local storage:** threads and message history are saved in the browser with PGlite, using versioned migrations. New threads are hidden from the sidebar until the first message is sent.
- **Skills:** on startup the app compares its built-in skills with UAR's and pushes any that are missing or disabled.

Things I noticed and wrote down as gotchas:
- **Tauri dev won't find the app:** `src-tauri/tauri.conf.json` expects the dev server on port 3000 and runs it with `bun`, but Vite actually serves on port 8080.
- **`npm test` includes the integration tests:** `vitest.config.ts` overrides the `test` section of `vite.config.ts`, so the exclusion there has no effect. The skills-sync integration test skips itself when no UAR is running.

You have a Codex config at `~/.codex/config.toml`. If you want to bring its MCP servers, commands, skills or instructions into Claude Code, reply `/import` to see what can be imported. Then run `/import --yes=<digest>` using the digest the scan prints. If `/import` isn't available here, run `claude import` from a terminal instead.

## Root Cause

No explicit root-cause section was captured; preserve this as a session record, not an inferred diagnosis.

## Corrective Actions

Review and promote only reusable findings.

## Session Metadata

- Harness: claude-code
- Session: f387bcbd-326d-4e0b-a0d8-b156ce6cbd80
- Captured: 2026-09-23T22:18:07.408012Z
- Project: /Users/gqadonis/Projects/know-me/charcoal-agent

## Changed Paths

- .agents/
- .claude/
- .kimi-code/
- .opencode/
- CLAUDE.md
- docs/xhtml-docs/
- openspec/
