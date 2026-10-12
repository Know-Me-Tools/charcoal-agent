# 21: Phase integration gate (2026-10-12)

Run on `main` a88ea02 plus the working-tree changes listed below.

| Gate | Result |
|---|---|
| lint (`npm run lint`) | 0 errors, 12 warnings (pre-existing react-refresh warnings) |
| typecheck (`npm run typecheck`) | exit 0 (app and e2e projects) |
| unit (`npm test`) | 57 files, 572 tests passed |
| production bundle (vite) | built; main chunk `index-C9syjkug.js` 2,510 kB (684.81 kB gzip) |
| full mocked browser suite | 320 passed (5.5 min), before the field fix |
| `e2e/a2ui-surface-captures.spec.ts` | 8 passed after the field fix (the only spec re-run after it) |
| live site | see `2026-10-12-live/README.md` |

Lint, typecheck and unit were re-run after the field fix: same results.

Bundle (app-a2ui-surface-renderer 1.7): A2UI is a separate lazy chunk, `a2ui-surface-block-DW5m-i7F.js`, 466.23 kB
(146.12 kB gzip). The main chunk is 684.81 kB gzip, over the 300 kB app-page budget. Not measured: how much of the
main chunk this phase added; there is no pre-phase baseline build in this record.

Working-tree changes at the time of the gate: `src/features/a2ui/catalog.tsx` (field fill),
`e2e/a2ui-surface-captures.spec.ts`, `e2e-live/site-a2ui-captures.spec.ts`.
