---
name: chat-ui-model-output-safety
description: Rules for safely rendering untrusted model output (markdown, raw HTML, generated web pages, tool results and errors) in an AI chat UI. Covers iframe sandboxing of generated HTML, sanitizing markdown with rehype-raw, rehype-sanitize and KaTeX in the right order, never showing raw runtime or tool errors to users, and retry or regenerate without duplicated turns. Use this skill whenever building or reviewing a chat or agent front end that renders LLM output, HTML artifacts, react-markdown or rehype pipelines, tool-call results, or error states, even if the user only asks to "support HTML in messages" or "render artifacts".
license: MIT
metadata:
  origin: "KnowMe AI web client, chat-surfaces-flat2 change, 2026-09"
---

# Rendering model output safely

Scope: rendering in the chat or agent UI. Server-side output filtering, moderation and prompt-injection defences in the agent itself are separate topics.

Treat everything the model produces, and every tool result it relays, as untrusted input from the internet. Prompt injection means a web page the agent read can author the HTML your UI renders.

**Evidence tags** on each rule: `[verified]` = a failing-then-passing test, a reproduced error or a mutation proof in the origin project; `[docs]` = upstream documentation; `[review]` = found by independent review, fix designed but not yet proven here; `[practice]` = a working convention, not independently tested. Re-check anything version-sensitive against your own versions.

## 1. Generated HTML runs in a sandboxed iframe with `allow-scripts` only `[verified]`

```tsx
<iframe sandbox="allow-scripts" srcDoc={html} title="Generated page preview" />
```

- **Never add `allow-same-origin` next to `allow-scripts`.** Together they give the page your app's origin: IndexedDB, localStorage, cookies and authenticated API calls. It can then remove its own sandbox.
- **No "open in new tab" through a `blob:` URL.** Blob URLs inherit the app's origin, which undoes the sandbox. If you need a pop-out, serve it from a separate origin.
- The sandbox doesn't stop network access. A script in the page can still send out whatever the artifact contains. Put a CSP in the generated document (`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:">`), or serve artifacts from a separate origin whose CSP blocks `connect-src`.
- Size the frame from a `postMessage` the page sends. Check `event.source` against the iframe's `contentWindow`, and never read the frame's DOM directly.

## 2. Markdown with raw HTML: sanitize after raw, before math `[verified]`

Plugin order matters:

```ts
rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeKatex]}
```

```tsx
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeKatex from "rehype-katex";

const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-/, "math-inline", "math-display"]],
  },
  protocols: { ...defaultSchema.protocols, href: ["http", "https", "mailto"] },
};

<ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeKatex]}>
  {text}
</ReactMarkdown>
```

- `rehype-raw` turns embedded HTML into nodes, `rehype-sanitize` cleans them, and KaTeX runs **after** sanitizing, so its trusted markup isn't stripped.
- Start from `defaultSchema` (GitHub's). Extend it only for what you need, such as the `language-*` classes on `code` and the math classes. Limit `href` to `http`, `https` and `mailto`.
- Write the tests red first: `<script>`, `onerror=`, `javascript:` links, `<iframe>` and `style` injection must all come out inert.
- Keep KaTeX's `trust` option off (the default), so `\href`, `\url` and HTML extensions stay inert, and load KaTeX's CSS.
- Pin the sanitizer's exact version. A schema change is a security change.

## 3. Never show raw errors `[verified]`

- Runtime stream errors, tool errors and storage errors get fixed, plain-language text in the UI, with a "try again" path. Send the raw error to logs, redacted the same way (tokens, keys, paths, personal data).
- Tool error payloads can contain paths, tokens or other people's data. Redact them before any "details" view.
- Test it: assert that the known raw error strings are **absent** from the DOM.
- Successful tool results are untrusted too. Render them as text, or through the same sanitizing markdown pipeline, never as raw HTML.

## 4. Status is never colour-only `[verified]`

A failed tool call shows an icon **and** a text label, as well as a colour. Check that the status you map from actually reaches the component; a mapped status that never fires is dead code.

## 5. Retry and regenerate without duplicates `[verified]`

"Try again" on a failed turn and "Regenerate" on a good one both have to:
1. Delete the messages after the parent, and **await** that delete, locally and in any persisted store.
2. Re-stream without re-appending the user message.
3. Survive a reload. Test that a reload right after shows exactly one user turn and one reply.

## 6. Live regions `[practice]`

Announce each finished message, not each streamed token. Use `aria-live="polite"` on the log, and fill it when the message completes. Generated interactive widgets get their own labelled live region.
