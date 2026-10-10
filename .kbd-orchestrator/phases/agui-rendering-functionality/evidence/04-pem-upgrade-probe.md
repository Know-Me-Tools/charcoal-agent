# PEM upgrade probe: official A2UI 0.10.2 to 0.12.0

PEM `origin/main` commit `35f43cb7d589ef242bcff4dd45c1ddf8fc13dd43` (release 4.1.1 plus docs). A scratch git worktree, since removed; nothing in PEM changed. Node v24.11.1, pnpm 10.33.0.

Change under test: `packages/a2ui-react/package.json` dependencies only: `@a2ui/react` 0.10.2->0.12.0, `@a2ui/web_core` 0.10.5->0.12.0, `@a2ui/markdown-it` 0.1.0->0.2.0. Commands: `pnpm install --no-frozen-lockfile --filter @prometheus-ags/a2ui-react...`, `pnpm --filter @prometheus-ags/entity-graph-core build`, then `pnpm --filter @prometheus-ags/a2ui-react typecheck` and `test`.

## Baseline (as published: 0.10.2 / 0.10.5 / 0.1.0)
```
typecheck: 0 errors
 Test Files  2 passed (2)
      Tests  30 passed (30)
```

## After the bump (0.12.0 / 0.12.0 / 0.2.0), entity-graph-core built
```
src/official/catalog.ts(110,5): error TS2345: Argument of type 'ReactComponentImplementation[]' is not assignable to parameter of type 'string | (string & {})'.
src/official/runtime.ts(327,5): error TS2322: Type 'Record<string, any>' is not assignable to type 'A2uiClientCapabilities'.
src/official/runtime.ts(329,7): error TS2561: Object literal may only specify known properties, but 'version' does not exist in type 'CapabilitiesOptions'. Did you mean to write 'versions'?
src/official/runtime.ts(335,5): error TS2322: Type 'Record<string, unknown> | undefined' is not assignable to type '{ version: "v0.9.1" | "v0.9"; surfaces: Record<string, Record<string, any>>; } | undefined'.
src/official/runtime.ts(484,47): error TS2345: Argument of type 'MessageProcessor<ComponentApi<ZodTypeAny>>' is not assignable to parameter of type 'MessageProcessor<PrometheusA2uiComponentImplementation>'.
⎯⎯⎯⎯⎯⎯ Failed Tests 14 ⎯⎯⎯⎯⎯⎯⎯
 Test Files  1 failed | 1 passed (2)
      Tests  14 failed | 16 passed (30)
--- distinct failure messages:
  14 Error: Official A2UI function is unavailable: add
```

Not investigated: the root cause of `Official A2UI function is unavailable: add`; the `v1-compat` bridge in isolation.
