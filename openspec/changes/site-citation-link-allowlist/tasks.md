## 1. Citation-link allowlist

- [ ] 1.1 Build-time extraction: a script reads `content/knowledge/*.md` and emits the exact set of absolute URL strings to a generated module (e.g. `src/lib/link-policy/corpus-urls.ts`); it runs as part of `npm run build` so the list cannot drift from the corpus.
- [ ] 1.2 Site-owned host allowlist in one file (e.g. `src/lib/link-policy/allowed-hosts.ts`), starting with `know-me.tools` and hosts the operator approves; km-security-officer signs off the list in this change.
- [ ] 1.3 `isAllowedLink(url)`: parse with `URL`; accept only `https:`; return true on an exact corpus URL string match or an exact host match against the allowlist (no suffix or substring match, so `know-me.tools.evil.com` and `evil.com/know-me.tools` fail); reject `javascript:`, `data:`, userinfo (`user@host`) and unparsable input.
- [ ] 1.4 Change `CitationBlock` in `src/features/chat/components/citation-block.tsx`: render the `<a>` wrapper and `ExternalLinkIcon` only when `isAllowedLink(url)`; otherwise render the card as plain text with the full URL visible, not hidden behind the source name.
- [ ] 1.5 Unit tests for `isAllowedLink` covering corpus match, allowlisted host, lookalike host, `http:`, `javascript:`, `data:`, userinfo, IDN/punycode lookalike, and malformed input; component tests that a disallowed URL produces no `<a>` and shows the full URL.
- [ ] 1.6 km-security-officer review of the policy module and the host list, recorded in this change.
- [ ] 1.7 Visual-first capture of an allowed and a disallowed citation at 320 and 1440 in both themes, viewed and listed.
- [ ] 1.8 Integration check: `npx vitest run src/features/chat/components/citation-block.test.tsx src/lib/link-policy` passes, and on the local compose stack a scripted turn whose stream carries a citation to `https://evil.example/x` renders no anchor for it while a corpus URL renders as a link. Evidence filed for §6.4 item 12.
