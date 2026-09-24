## Context

See proposal.md. Live assistant-ui code after `shadcn-base-ui-migration`: `enhanced-thread.tsx` (thread, composer, user/assistant messages, rich-block router that maps internal content blocks — encoded as tool-call parts named `__skill__`, `__context__`, `__citation__`, `__memory_recall__`, `__memory_mutation__`, `__artifact__` — to KnowMe block components), `enhanced-markdown-text.tsx` (react-markdown with KaTeX, Shiki, Mermaid), `attachment.tsx`, `tooltip-icon-button.tsx`. Runtime: `useExternalStoreRuntime` in `use-chat-runtime.ts`, converting `RichMessage` → `ThreadMessageLike`. Store: `chat-message-store.ts`, where only `appendTextDelta`/`appendThinkingDelta` create the streaming assistant message; every other `add*` returns early when none exists.

Upgrade facts (assistant-ui CLI 0.0.117 dry run and migration docs): codemod `v0-15/aui-accessor-calls-to-properties` applies; the `components` prop on primitives and `useMessagePart*` hooks are deprecated (not removed) in 0.15 in favor of children render functions and `useAuiState`; primitive `If` → `AuiIf`. The registry resolves `https://r.assistant-ui.com/styles/{style}/{name}.json`; `base-nova` items exist for `thread`, `markdown-text`, `attachment`, `tooltip-icon-button`, `tool-fallback`, `reasoning`.

## Goals / Non-Goals

**Goals:** latest assistant-ui on Base UI; no deprecated primitive APIs in our code; no dropped stream blocks; unchanged runtime/store contract and PGlite hydration.

**Non-Goals:** adopting the registry `thread` wholesale; chat visual design; follow-up suggestions / tool groups from the registry.

## Decisions

1. **Registry leaves, custom thread.** Pull only `tooltip-icon-button` and `attachment` (+ their `use-attachment-src` dependency) from the registry. The registry `thread` would replace our rich-block routing, KnowMe welcome state and prompt-caching control and pull in suggestion/tool-group features we do not use; porting our behavior into it is a larger rewrite than upgrading our thread's APIs, and the next change restyles the thread anyway. Revisit when composing A2UI surfaces.
2. **Children render functions.** `ThreadPrimitive.Messages` and `MessagePrimitive.Parts` switch from `components={…}` to `{({ message }) => …}` / `{({ part }) => …}`; the rich-block router becomes an explicit switch on `part.type` / `part.toolName`.
3. **Fix block loss at the store.** `beginStream` (called when the request starts) does not know the message yet; a single `ensureStreamingMessage(threadId)` helper used by every `add*` action creates the assistant message on the first event of any kind, so ordering is preserved and text/thinking paths share it. Alternative (buffer early events in `use-message-stream`) rejected: duplicates ordering logic outside the store.
4. **Fixture order back to realistic.** The SSE fixture sends skill/context/memory recall/tool call before the first thinking delta; the harness thread capture then doubles as the regression test for Decision 3.
5. **Pins and devtools.** Exact pins for all three packages. `@assistant-ui/react-devtools` has no import sites today; it is upgraded per D-003, not wired in (noted for the operator).

## Risks / Trade-offs

- [0.15 changes `ThreadMessageLike` or external-store semantics] → unit tests on `richMessageToThreadMessageLike` + e2e streaming and reload; the repository cycle guard in `_updateStoreSnapshot` requires stable, linear message ids — our ids are stable UUIDs per message.
- [react-markdown 0.14 API changes (`MarkdownTextPrimitive`, `useIsMarkdownCodeBlock`)] → typecheck + visual capture of code, math and mermaid blocks.
- [Registry `attachment` differs from ours] → attachments are not exercised by the harness today; component test covers trigger semantics.

## Migration Plan

Branch `rebrand/assistant-ui-latest`; e2e + unit gates; rollback = revert merge. PGlite schema untouched, so stored conversations stay readable across rollback.
