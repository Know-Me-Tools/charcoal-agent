# Verification notes — assistant-ui-latest

## 4.1 Gates (2026-09-24)
- `npm run build` ✓ · `npm run typecheck` 0 · lint 0 errors / 2 pre-existing warnings
- `npm test`: 13 files / 59 tests (adds 3 store-ordering tests + runtime conversion contract)
- `npm run test:e2e`: 129/129 (adds `chat-stream.spec.ts`: every block type incl. pre-token blocks, then reload restores the conversation from PGlite with zero `/api/chat/completion` requests)
- a11y baseline unchanged: 24 scans, 18 violations, 3 rules
- Packages pinned: `@assistant-ui/react@0.15.21`, `@assistant-ui/react-markdown@0.14.16`, `@assistant-ui/react-devtools@1.2.20` (devtools has no import sites; upgraded per D-003, not wired in)

## Radix
- Direct Radix dependencies: none. Transitive: `@assistant-ui/react@0.15.21` depends on the `radix-ui@1.6.7` umbrella (and `@assistant-ui/react-markdown` on `@radix-ui/react-primitive`), so Radix cannot be removed while using assistant-ui. The app's own primitives are all Base UI.

## What changed
- Official codemods (`assistant-ui upgrade`, CLI 0.0.117) produced no edits; the only break was the removed `useMessageRuntime` export (a dead placeholder reference).
- `ThreadPrimitive.Messages` and `MessagePrimitive.Parts` use children render functions; `useMessagePartText` replaced by part props. No `components={{…}}` or `useMessagePart*` remain.
- `attachment.tsx` and `tooltip-icon-button.tsx` replaced by the `@assistant-ui` base-nova registry versions; the attachment tile trigger now has `role="button"`, `tabIndex={0}` and is a Base UI dialog trigger (resolves the shadcn-base-ui-migration review warning). Attachments remain unreachable in the running app: no attachment adapter is configured.

## Defects found and fixed
1. **Early stream blocks dropped (correctness).** All block actions now go through `activeStreamingMessage()`, creating the assistant message on the first event of any kind. Store tests prove skill activation → context update → memory recall → tool call → text keep their order, and that citations/mutations/artifacts before text are kept. The e2e SSE fixture is back to the realistic order (skill/context/memory before thinking) and the harness thread capture now depends on the fix.
2. **Code-fence language ignored.** The markdown code dispatcher only read `data-language`, but react-markdown supplies `className="language-<lang>"`, so every block rendered as plain "text" (no Shiki highlighting) and fenced mermaid never became a diagram. Fixed; fixture gained a mermaid fence; capture shows highlighted TypeScript and a rendered diagram.
3. **Registry template ahead of the published package.** The registry `attachment` reads `message.submission`, absent from the published 0.15.21 types; that clause was dropped (upload state comes from adapter-reported progress only).
4. **shadcn CLI again** installed the stray `cn` package, rewrote `cn` imports in four existing primitives, and would have used bun via the stale `bun.lockb` — all reverted (`bun.lockb` moved aside during the add).

## Screenshot comparison vs. pre-change baseline
- All non-thread routes: ≤0.3% except `/threads` 0.6–1.8% (registry add-attachment button is smaller; composer shifts 1–2 px).
- Thread: taller at every width because fenced code is now highlighted and the fenced mermaid block renders as a diagram (fix 2).

## Adversarial review (diff mode)
- r1: **PASS**, 0 findings (gpt-5.5, verified-distinct; anti-theater score 0.0).
