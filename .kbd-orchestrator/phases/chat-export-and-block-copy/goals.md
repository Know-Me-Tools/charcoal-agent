# Goals

- Per-block Copy buttons for code, Mermaid, SVG, table, image, video and A2UI card blocks, with one shared CopyButton (docs/specs/chat-export-okf-and-block-copy.md sections 2.3 and 7)
- Rendering support for SVG (img-based preview), own-host-only video and image decisions, with sanitizer, reply policy and CSP changes and a km-security-officer review
- Export the current conversation as one Open Knowledge Format v0.2 markdown document, built client-side only, from an allowlist of block types
- Export all conversations as a zip OKF bundle (index.md, log.md, one concept per conversation), built client-side only
- Privacy: the export makes no network request, a test proves it, and the UI says so in operator-approved wording (content officer pre-review)
- Constraints: client changes deploy on merge (no production approval stop, so no unreviewed security change merges); verify any new dependency version from the registry; never touch the kill switch; operator merges PRs; no secrets or internal ids in any export
