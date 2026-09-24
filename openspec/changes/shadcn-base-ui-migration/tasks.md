## 1. Prepare

- [x] 1.1 Delete dead components with no consumers (`components/assistant-ui/{thread,markdown-text,tool-fallback,assistant-modal,assistant-sidebar,thread-list}.tsx`, `components/chat/*`) and the 26 unused shadcn primitives after a repo-wide grep confirms zero consumers; verify `npm run typecheck` and `npm run build`
- [ ] 1.2 Switch `components.json` to `base-nova` (Tailwind config `""`, `iconLibrary: "lucide"`) and install `@base-ui/react`; verify `npx shadcn@4.21.0 info` reports the base-nova style

## 2. Migrate

- [ ] 2.1 Reinstall the used primitives with `npx shadcn@4.21.0 add … --overwrite`; review the diff, revert unrelated `src/index.css` token changes; verify every `src/components/ui/*.tsx` that wraps a primitive imports from `@base-ui/react` and none from `@radix-ui`
- [ ] 2.2 Migrate call sites to Base UI APIs (`asChild` → `render`, handler signatures, null-safe Select values, `tooltip-icon-button` without Radix Slot); verify `npm run typecheck` and `npm run lint` report 0 errors
- [ ] 2.3 Toasts: remove shadcn `toast`/`toaster`/`use-toast` and the extra `<Toaster />`; make the Sonner wrapper follow the app theme store; verify exactly one toaster is mounted and `grep -rn "next-themes" src` is empty

## 3. Clean up and verify behavior

- [ ] 3.1 Uninstall direct `@radix-ui/*` dependencies and `next-themes`; verify `grep -rn "@radix-ui\|next-themes" src package.json` is empty and `npm run build` passes
- [ ] 3.2 Add component tests for the ui-primitives spec (dialog focus trap/Escape/focus return, select keyboard selection, tooltip on focus, switch Space, collapsible expanded state) and an e2e spec for the agent editor select and tabs plus the thread's reasoning collapsible; verify `npm test` and `npm run test:e2e` pass

## 4. Verification

- [ ] 4.1 Run `npm run build && npm run typecheck && npm run lint && npm test && npm run test:e2e`; compare screenshots with the previous run for layout regressions; record results in `verification.md`
