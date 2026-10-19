# qa-browser-matrix task 1.5: is there any producer of an image content block?

Commit searched: `cc35905cf64d4b8e107fad006093159eb5b3cd32` (origin/main), branch `feat/qa-browser-matrix`. Date 2026-10-19. Tools: ripgrep and reading the files named below. The question: can any non-test code under `src` create an `ImageContentBlock` (`{ type: "image", url, alt? }`, `src/types/chat-content.ts:58`), so that a remote image URL could reach the export?

## Result

No producer found in non-test `src` code. The type exists, one consumer exists, and the only code that builds image blocks is test code. The one way such a block could still exist at run time is a stored row, because stored content is parsed without validation (details below). Nothing is registered.

## Commands and what they showed

1. Control: does the search find image-block code at all?
   - `rg -n "ImageContentBlock" src --glob '!**/*.test.*'` returned `src/features/export/okf-blocks.ts:11` (import), `:79` (`imageMarkdown(block: ImageContentBlock)`), and `src/types/chat-content.ts:58,138` (definition and union member). So the search finds the consumer in `okf-blocks.ts`, and `rg -n "image" src/features/export/okf-blocks.ts` finds its allowlist entry (`image: "serialized"`, line 23). `okf-serialize.ts:179` reads `block.type === "image"`.
2. Literal producers: `rg -n "type:\s*[\"']image[\"']" src --glob '!**/*.test.*' --glob '!**/test/**'` returned one line, `src/types/chat-content.ts:59`, the type definition. No object literal builds one.
3. Any quoted "image" in non-test src: `rg -n "[\"']image[\"']" src ...` returned the type, the consumer (`okf-serialize.ts:179`), and unrelated hits in `use-attachment-src.ts`, `attachment.tsx` and `markdown-block-copy.tsx` (assistant-ui attachment type and a copy-mode string, not a content block).
4. Test code that builds image blocks: `rg -ln 'type: "image"' src e2e` returned `chat-content.ts`, `okf-serialize.test.ts`, `okf-omission.test.ts`, `use-chat-runtime.memo.test.ts`, `e2e/chat-export-omission.spec.ts` (the stored-chat test writes one into PGlite on the dev server). All tests.
5. History: `git log --oneline -S'type: "image"' -- src ':!src/**/*.test.*'` returned `0ce33c9` (the first chat commit, which added the type) and `90bbe9c` (the serializer). No commit ever added a literal producer in non-test src.

## Files read (not only counted)

- `src/types/chat-content.ts` (the block definition and union).
- `src/stores/chat-message-store.ts` lines 300-480: every `message.content.push` site. They push `text`, `reasoning`, `tool-call` (via `toolCall as ContentBlock`, line 352), `citation`, `skill-activation`, `context-update`, `memory-recall`, `memory-mutation`, `artifact`, `step` and `error`. The spreads (`{ type: "artifact", ...artifact }`, `{ type: "context-update", ...update }` and the memory ones) put `type` first, but the argument types are `Omit<..., "type">` and their callers build named fields.
- `src/features/chat/agui-event-handlers.ts` lines 260-280, 370-600: the AG-UI stream conversion. Every call into the store passes explicitly named fields (`artifactId`, `strategy`, `items`, and so on); no handler spreads an event payload into a block and none sets `type` from the payload. The `agui.custom` handler makes a `display` artifact with a JSON string.
- `src/features/chat/use-chat-runtime.ts` lines 25-250: converts blocks to assistant-ui parts; line 228 reads "image, error: intentionally skipped (no assistant-ui equivalent)". User messages are built as a single `text` block (lines 40, 56); `attachments: []` (line 43).
- `src/lib/db/pglite.ts` lines 225-290 and 430-445: the storage paths (below).
- `src/components/assistant-ui/enhanced-markdown-text.tsx` / `markdown-block-copy.tsx`: the markdown `img` renderer (`MarkdownImage`) renders an `<img>` for markdown inside a text block. It does not create a content block.

## The one path that could carry an image block

`rowToMessage` in `src/lib/db/pglite.ts:433` returns `JSON.parse(row.content) as ContentBlock[]` (or the JSONB value cast the same way) with no check of block types. The legacy import at lines 225-290 (flag `charcoal-pglite-migrated-v1`) does the same for messages read from the old `localStorage` key `charcoal-chat-messages`. So a stored row holding `{ "type": "image", "url": "https://..." }` would load as an image block and reach the export, and the omission rule in `imageMarkdown` is what then drops a remote URL (this is what the stored-chat test in `chat-export-omission.spec.ts` exercises). A row like that could come only from something that wrote it into IndexedDB: an older app build, the browser's dev tools, or a script. No current code path writes one. I did not search old app versions' output (only `git log -S`, which found no producer commit).

## Limits of the method

- ripgrep finds text. A block built through a computed `type` string, a `Record<string, unknown>` cast, or a library that adds blocks would not match `type: "image"`. I covered those by reading the conversion files and the two storage casts, but I did not read every file under `src`.
- The 300+ line `agui-event-handlers.ts` and `chat-message-store.ts` were read at the push and dispatch sites, not line by line.
- Nothing was run against a live UAR; the server (`../prometheus/universal-agent-runtime`) could in principle send events this client maps differently, but the client code shows no mapping to an image block.
- "No producer found" is the state at commit cc35905, not a guarantee for later commits. The control search in step 1 shows the method does see image-block code when it exists.

Descoped, nothing registered: no follow-up was filed.
