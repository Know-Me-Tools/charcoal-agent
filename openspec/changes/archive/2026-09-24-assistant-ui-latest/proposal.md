## Why

Operator decision D-003: assistant-ui must be on its latest release (0.12 → 0.15) using the Base UI component registry that matches the `base-nova` shadcn style adopted in `shadcn-base-ui-migration`. The chat is the core surface, and the rebrand restyles it next (`chat-surfaces-flat2`), so it must sit on current APIs first. The upgrade also carries a correctness bug found by the verification harness: stream events that arrive before the first text/thinking token (skill activation, context update, memory recall, tool calls) are silently dropped, although the runtime plausibly emits skill activation first.

## What Changes

- Upgrade `@assistant-ui/react` 0.12.10 → 0.15.21, `@assistant-ui/react-markdown` 0.12.3 → 0.14.16, `@assistant-ui/react-devtools` 0.2.3 → 1.2.20 (exact pins); run the official `assistant-ui upgrade` codemods.
- Register the style-aware `@assistant-ui` registry in `components.json` and replace `tooltip-icon-button` and `attachment` with the registry's Base UI (`base-nova`) versions, fixing the attachment tile's trigger semantics.
- Keep the KnowMe-specific `enhanced-thread` / `enhanced-markdown-text` (rich blocks, KaTeX, Shiki, Mermaid routing) and move them off deprecated APIs: `components` props → children render functions, `useMessagePartText` → `useAuiState`, primitive `If` → `AuiIf`.
- **Fix:** the chat store keeps every block event received before the first token by creating the streaming assistant message when the stream begins; the e2e SSE fixture returns to the realistic order (skill/context/memory before thinking).
- Keep the `useExternalStoreRuntime` adapter contract (every message carries `metadata`; user messages carry `attachments: []`) and PGlite history loading.
- Remove the transitive Radix dependency that came with assistant-ui 0.12 (if 0.15 no longer requires it).

Out of scope: visual restyling of chat (next changes); composing A2UI surfaces; Mermaid diagram rendering of artifacts.

## Capabilities

### New Capabilities
- `chat-stream-rendering`: what a streamed assistant reply must show — every block type in arrival order, including blocks that precede the first token — and how stored conversations reload.

### Modified Capabilities
<!-- none -->

## Impact

- Code: `package.json`/lockfile, `components.json`, `src/components/assistant-ui/*`, `src/features/chat/use-chat-runtime.ts`, `src/stores/chat-message-store.ts`, `e2e/fixtures/sse.ts`, tests.
- No UAR API or PGlite schema changes.
