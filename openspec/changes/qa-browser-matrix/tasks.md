## 1. qa-browser-matrix

- [x] 1.1 Install the Playwright WebKit and Firefox browsers locally for the version pinned in `package.json`; record the versions and what was downloaded
- [x] 1.2 `playwright.config.ts`: add a desktop `webkit` project and a `firefox` project that run `chat-export-omission.spec.ts` and `db-reset-notice.spec.ts`; leave `webkit-iphone` and `chromium` as they are
- [x] 1.3 Run the two specs in WebKit and Firefox on the built app; record the counts; classify every failure as a product defect or an engine difference before changing anything
- [x] 1.4 Mutation check per engine: alter each string constant, show the matching spec fails in WebKit and in Firefox, restore, show it passes
- [x] 1.5 Remote-image export: search `src` for any producer of an image content block (spreads, storage, JSON paths included); record the method and the result; descope or register a follow-up
- [x] 1.6 Fix the existing `tsc -p e2e/tsconfig.json` error (`chat-export-bundle-load.spec.ts`, TS2307) and run the type check on the e2e project
- [ ] 1.7 Real-phone sheet for the reset notice, the export omission line and the export flow; waivable; record the operator's results or the waiver
- [ ] 1.8 Integration gate: the CI Verify sequence (pins, manifests, `npm ci --ignore-scripts`, lint, full `npm test`, build) and the e2e type check, then open the pull request ready (not draft)

Model assignments for these tasks are in `.kbd-orchestrator/phases/site-ci-gates-and-chat-polish/plan.md` under Task model assignments, keyed by phase path `site-ci-gates-and-chat-polish`, change ID `qa-browser-matrix` and the task IDs above.
