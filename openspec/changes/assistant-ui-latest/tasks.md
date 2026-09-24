## 1. Upgrade

- [x] 1.1 Pin `@assistant-ui/react@0.15.21`, `@assistant-ui/react-markdown@0.14.16`, `@assistant-ui/react-devtools@1.2.20`; run `npx assistant-ui@0.0.117 upgrade`; verify packages resolve (`npm ls`) and record remaining type errors
- [x] 1.2 Add the `@assistant-ui` registry to `components.json` and replace `tooltip-icon-button` and `attachment` with the base-nova registry versions (fix CLI-emitted imports if needed); verify the attachment tile trigger has button semantics (`role="button"`, `tabIndex={0}`, Base UI dialog trigger) by inspecting the registry markup — attachments are unreachable in the running app because no attachment adapter is configured, so no runtime test is possible (amended during 1.2)

## 2. Migrate chat components

- [x] 2.1 Move `enhanced-thread.tsx` off deprecated APIs (children render functions for Messages/Parts with an explicit rich-block switch, `useAuiState` instead of `useMessagePart*`, `AuiIf` instead of primitive `If`); verify `npm run typecheck` and that `grep -n "components={{\|useMessagePart" src/components/assistant-ui` is empty
- [x] 2.2 Update `enhanced-markdown-text.tsx` to react-markdown 0.14 APIs; verify code, KaTeX and mermaid blocks render in the harness thread capture
- [x] 2.3 Fix dropped early stream blocks: the store creates the streaming assistant message on the first event of any kind; unit tests prove skill/context/memory-recall/tool-call before the first delta are kept in order; restore the realistic SSE fixture order

## 3. Verify behavior

- [x] 3.1 Add an e2e spec: stream the fixture, assert every block type is visible, reload the thread and assert the conversation and its blocks are restored from local storage with no chat request; keep the runtime conversion contract under unit test (metadata on every message, `attachments: []` on user messages)

## 4. Verification

- [ ] 4.1 Run `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`; confirm no direct or transitive `@radix-ui` remains if 0.15 dropped it; compare screenshots with the previous run; record results in `verification.md`
