---
paths: ['src/features/chat/**', 'src/stores/chat-message-store.ts', 'src/types/chat-content.ts', 'src/components/assistant-ui/**']
---

# Chat architecture

Loaded when a matching file is read. Moved from CLAUDE.md to keep resident context small.

Data flow for one message:

1. `features/chat/use-chat-runtime.ts` adapts our state to `@assistant-ui/react` via `useExternalStoreRuntime`. It converts `RichMessage` → `ThreadMessageLike`; every converted message **must** include a `metadata` object (and user messages an `attachments: []`) or assistant-ui crashes on internal accessors.
2. `features/chat/use-message-stream.ts` POSTs to `/api/chat/completion` and parses the SSE stream of AG-UI events (`agui.message.delta`, `agui.thinking.delta`, `agui.tool_call.*`, `agui.tool_result`, `agui.citation.added`, `agui.skill.activated`, `agui.context.update`, `agui.memory.*`, `agui.artifact`, `agui.artifact_input_request`, `agui.done`, …). Event shapes mirror UAR's `src/uar/api/sse.rs` — change both sides together. Includes retry/backoff state.
3. Each event is dispatched into `stores/chat-message-store.ts` (Zustand + immer), which appends typed `ContentBlock`s (defined in `types/chat-content.ts`) to the streaming assistant message and writes through to PGlite.
4. Each block type renders via its own component in `features/chat/components/` (thinking, tool-call, citation, memory, skill-activation, context-update, artifact, a2ui-artifact). Adding a new event type means: type in `chat-content.ts` → store action → stream `case` → render component.
5. `use-thread-naming.ts` generates an LLM title after the first exchange.
