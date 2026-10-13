# Task 3.5: the HTML preview frame under the enforcing CSP (browser proof)

Run 2026-10-13, locally, by km-qa-engineer. Branch `feat/csp-preview-proof` = `origin/feat/csp-enforcing` (PR #45, enforcing header) rebased on `origin/main` (preview meta CSP from `preview-document.ts`, reply-content policy).

## What ran

- **Page server:** the real site server (`server/`, debug build) serving a fresh `vite build` of this branch through `KNOWME_WEB_ROOT`. Not the Vite dev server.
- **Browser:** Google Chrome 155.0.8059.40 (installed Chrome via Playwright `channel: "chrome"`; Playwright's own Chromium is not downloaded on this machine), Playwright 1.63.0, headless.
- **Model:** none. Only `POST /api/chat/completion` is answered inside the browser (`page.route`) with an SSE body of `agui.stream.start`, one `agui.message.delta` holding the reply markdown, `agui.done`. Every case's reply has one fenced `html` block over 100 characters, so it renders as `HtmlArtifactCard` (`iframe srcdoc`, `sandbox="allow-scripts"`, title `html artifact`). The page HTML, assets and `/api/csp-report` come from the real server, so the real header applies.
- **Spec:** `e2e-live/csp-preview-proof.spec.ts` (committed). Results JSON: `test-results/csp-proof/results.json` (gitignored).

Header asserted by every case in the browser (`response.headers()` of the page navigation):

```
content-security-policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'sha256-G4PYLKhJEo2KWmN299upbhMOxraLGkp1cuF7f3/duOw='; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; report-uri /api/csp-report; report-to csp-endpoint
content-security-policy-report-only: (absent)
```

`curl -sI` on `/` also showed `reporting-endpoints: csp-endpoint="/api/csp-report"`, `cross-origin-opener-policy: same-origin`, `cross-origin-embedder-policy: require-corp`, `x-frame-options: SAMEORIGIN`.

The preview meta found as the first element of the frame's `<head>` (case 7):
`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:">`

Evidence sources per case: Chrome console messages (they name the directive and which policy fired: the header's text contains `'wasm-unsafe-eval'`/`'self'`, the meta's starts with `default-src 'none'`); `securitypolicyviolation` events from a listener injected into every frame (confirmed installed in `about:srcdoc`); every request the page and its frames made (`page.on("request")`); a `page.route` on `https://example.invalid/**` that records any request reaching the network layer; popups (`context.on("page")`).

"Devtools probe" below means `frame.evaluate(...)`: code run inside the frame through the DevTools protocol, which CSP does not stop. It answers "if a script did run in the frame, what could it reach?". Requests it makes are still checked against the frame's policies.

## Result table

| # | Case | Result | Evidence |
|---|---|---|---|
| 1 | Static HTML+CSS renders | **PASS** | `#t` text "case one static preview" visible; `#box` computed `background-color` = `rgb(255, 0, 0)`; screenshot `test-results/csp-proof/1-static.png` (inspected: heading and red box). 0 violations, 0 console errors, 0 frame requests. |
| 2 | Inline `<script>` runs? | **BLOCKED** (expected) | `#out` stays "script did not run". Console: `Executing inline script violates the following Content Security Policy directive 'script-src 'self' 'wasm-unsafe-eval' 'sha256-G4PY…''` → the **inherited header** (`script-src`, element: `script-src-elem`) blocks it; the meta would allow it (`'unsafe-inline'`), but a meta can only tighten. No `securitypolicyviolation` event was observed in the frame for this parse-time block (listener was installed in `about:srcdoc`); the console line is the evidence. |
| 3 | Remote `fetch('https://example.invalid/x')` | **BLOCKED** | Model-authored: the fetch never runs (its inline script is blocked as in case 2; `#out` stays "waiting"). Devtools probe: `TypeError: Failed to fetch`; two `securitypolicyviolation` events in `about:srcdoc`, `effectiveDirective: connect-src`, `blockedURI: https://example.invalid/x`, one from each policy (header `connect-src 'self'`, meta `default-src 'none'`). 0 requests reached the network (`remoteHits` = 0). |
| 4 | Same-origin `fetch('/healthz')`, `POST /api/csp-report` from the opaque-origin frame | **BLOCKED, not sent** | Frame `self.origin` = `"null"` (opaque). Model-authored fetch never runs (script blocked). Devtools probes to `/healthz` (relative and absolute) and a `POST /api/csp-report` with a sentinel body (`effective-directive: probe-case-4`): all `TypeError: Failed to fetch`; 3 `connect-src` violations, **all from the meta** (`default-src 'none'`); the header's `connect-src 'self'` raised none, i.e. the header alone would have let them through. Requests from the frame after the probes: 0. Server log: 0 lines containing `probe-case`. Nothing was sent, so nothing was readable. |
| 5 | `<script src="/assets/index-CXDpHSHV.js">` (the built entry bundle, read from the served `index.html`) | **BLOCKED, not requested** | Console: `Loading the script 'http://127.0.0.1:18080/assets/index-CXDpHSHV.js' violates … "script-src 'unsafe-inline'"` → blocked by the **meta only**; the header's `script-src 'self'` would allow it. 0 requests for the asset from the frame. |
| 6 | Remote `<img>` blocked, `data:` image renders | **PASS** | Remote: `naturalWidth` 0; console shows both policies refusing it (`img-src 'self' data: blob:` and `img-src data:`); 0 requests reached the network (`remoteHits` = 0). Note: Playwright emitted one `request` event for `https://example.invalid/p.png` from the frame, but the network route never saw it; the console says blocked. Data image: `naturalWidth` 1 (1x1 PNG decoded). |
| 7 | `<!DOCTYPE html>` document is in standards mode | **PASS** | `document.compatMode` = `CSS1Compat`, **read by devtools probe** (the document's own script that would print it is blocked: `#out` stays "mode unknown"). The meta is the first child of `<head>` and the doctype is kept. |
| 8 | Form submit and `target=_blank` link do nothing | **PASS** | Console: `Blocked form submission to '/api/csp-report' because the form's frame is sandboxed and the 'allow-forms' permission is not set.` and `Blocked opening 'https://example.invalid/open' in a new window because the request was made in a sandboxed frame whose 'allow-popups' permission is not set.` Popups 0, pages 1, requests after the clicks 0, `remoteHits` 0, no POST with the `probe-case-8` body. |
| 9 | Markdown `![x](https://example.invalid/p.png)` in a reply | **PASS** | 0 `img` elements with a remote `src`; reply text renders as "A picture: x"; 0 requests to `example.invalid` (page events and route). |

Extra cases (not in the 3.5 list, run because they bear on the recommendation):

| # | Case | Result | Evidence |
|---|---|---|---|
| 8b | Link with no target, clicked: the frame navigates itself to `https://example.invalid/nav` | **BLOCKED, preview replaced by an error page** | Violation in the **top document** (the thread page), `effectiveDirective: frame-src` (fallback `default-src 'self'`), `blockedURI: https://example.invalid`. Frame URL afterwards `chrome-error://chromewebdata/`; the preview content is gone. 0 requests reached the network. |
| 8c | `<meta http-equiv="refresh" content="0;url=https://example.invalid/refresh">` (no script needed) | **BLOCKED, preview replaced by an error page** | Same `frame-src` violation in the top document; the frame's `#t` is gone (locator timed out). 0 requests reached the network. |
| 10 | Do preview-frame reports reach `/api/csp-report`? | **NOT OBSERVED** | One page kept open 103 s after an inline-script and a remote-image violation in the frame: 0 new `csp violation` lines in the server log. |
| 11 | Control: a top-document violation (devtools-probe fetch to `https://example.invalid/control` in the thread page) | **NOT OBSERVED** | `connect-src` violation in the top document confirmed by event and console; 0 new `csp violation` lines in 103 s. Report delivery did not happen in this headless setup at all, so case 10 says nothing about preview reports. |

## Commands and files

All scratch output went to a session scratch directory (`$SCRATCH` below). No credentials: the upstream UAR and meter point at a closed local port (the chat stream is answered in the browser), and the session secret is a throwaway local test value.

1. Web bundle (same public-build env as `server/build.rs`; `.env` not read by me, its keys forced empty):
   `VITE_UAR_API_KEY= VITE_UAR_BASE_URL= VITE_SITE_AGENT_ID=knowme-site ./node_modules/.bin/vite build --outDir "$SCRATCH/web-dist" --emptyOutDir` → `✓ built in 15.20s`, entry `assets/index-CXDpHSHV.js`.
2. Server (fixture bundle embedded, real bundle served at runtime; own target dir):
   `cd server && KNOWME_WEB_DIST_DIR="$PWD/tests/fixtures/web" CARGO_TARGET_DIR="$SCRATCH/server-target" cargo build --bin knowme-site-server` → `Finished dev profile … in 1m 00s`.
3. Start the server:
   ```sh
   printf 'off\n' > "$SCRATCH/kill-switch"
   env -i PATH="$PATH" HOME="$HOME" PORT=18080 UAR_UPSTREAM=http://127.0.0.1:9 \
     SITE_SESSION_SECRET=local-csp-proof-only-0123456789abcdef0123 \
     SITE_METER_URL=http://127.0.0.1:9 SITE_METER_USER=proof SITE_METER_PASS=proof \
     SITE_KILL_SWITCH_FILE="$SCRATCH/kill-switch" KNOWME_WEB_ROOT="$SCRATCH/web-dist" RUST_LOG=info \
     "$SCRATCH/server-target/debug/knowme-site-server" > "$SCRATCH/server.log" 2>&1 &
   ```
   Log: `"listening","addr":"0.0.0.0:18080",…,"external_web_root":"Some(…/web-dist)"`.
4. Run the proof (from the repo root; `PW_CHANNEL` only when Playwright's Chromium is not installed; `SERVER_LOG` enables cases 10 and 11, which take about 105 s each):
   ```sh
   SERVER_LOG="$SCRATCH/server.log" PW_CHANNEL=chrome LIVE_BASE_URL=http://127.0.0.1:18080 \
     npx playwright test -c playwright.live.config.ts e2e-live/csp-preview-proof.spec.ts
   ```
   Final full run: `11 passed (4.1m)` (cases 1-9, 10, 11). Cases 8b and 8c were added afterwards and run alone against a restarted server: `2 passed (13.7s)`. As the caller advised for the command-text hook, the build and the test run were started from script files holding the lines above; no hook blocked any command.

## What I could not verify

- **Report delivery (cases 10, 11).** Neither a preview-frame report nor a control top-document report reached the server within 103 s in headless Chrome. So I cannot say whether preview-frame violations produce reports, which endpoint (`report-to` vs `report-uri`) a `srcdoc` frame uses, or what document URL those reports carry. This needs a headed browser or a deployed run.
- **The acceptance rule cannot be applied from the server log as written.** The `csp violation` log line (`server/src/interface/routes/api.rs`) records `directive`, `blocked` (origin or keyword) and `disposition`, never the document. Rule (a) on `CSP_HEADER` ("inline script, eval or connect violations whose document is a preview frame") needs the document; an inline-script report from a preview and one from the app look identical in the log. Owner: km-rust-engineer / km-security-officer.
- **The acceptance rule misses violations this proof produced.** Reports the header would generate from normal model output: `img-src` (remote image in a preview, case 6: the header refuses it too) and `frame-src` from the **top document** (a preview link or meta refresh, cases 8b/8c). Neither is inline script, eval or connect. Read literally, one such report forces the revert. Owner: km-security-officer.
- **`securitypolicyviolation` events** were observed in the frame only for `connect-src` (devtools-probe fetches), not for the parse-time script, image or script-src blocks, although the listener was installed in `about:srcdoc`. The console lines are the evidence for those. DevTools `Audits` CSP issues were enabled but none arrived. I do not know why.
- **Only Chrome.** Firefox and Safari were not run. `srcdoc` CSP inheritance and sandbox behaviour are specified, but untested here.
- **Not tested:** inline event-handler attributes (`onclick=`; the header should block them, no `'unsafe-hashes'`), `javascript:` URLs, a same-origin self-navigation (`<a href="/">`: allowed by the parent's `frame-src` fallback `'self'`, so the site would load inside the sandboxed, opaque-origin frame), SVG fences (they use the same card), `tsx`/`jsx` fences (same card).
- **Case 6 request event.** Playwright reported a `request` event for the blocked remote image, while the route never saw the request and Chrome logged the CSP block. I did not record the `requestfailed` reason.

## Decision (2026-10-13)

- **Option 1 adopted.** The operator keeps previews and keeps the CSP enforced. On the site build, `HtmlArtifactCard` shows "Scripts do not run in previews." (DRAFT copy, `content/site/preview-note.ts`) when the previewed code contains a `<script>` element, an `on…=` attribute or a `javascript:` URL (`src/features/artifacts/preview-scripts.ts`). The app build sends no such header and shows no note. Checked in the browser against the real server: spec case 2b, at 320 px in light and dark, the note is visible with no horizontal overflow (`2 passed`; screenshots inspected). A fence of 100 characters or fewer is not previewed at all; it renders as plain code.
- **Option 2 deferred.** It reopens only if interactive previews become a stated product need. It then needs its own change with the header exemption, the `postMessage` shell and a browser proof run against the new route.
- **Acceptance rule corrected** (`CSP_HEADER` doc comment in `server/src/interface/routes/mod.rs`, plan task 3.4): any `about:srcdoc` report, plus top-page `frame-src`/`default-src` reports from a preview navigating away, plus browser-extension origins, count as expected; any other report in the first 48 hours triggers the revert. The `csp violation` log line now carries the report's document (query and fragment stripped, thread ids masked as `:id`, at most 200 characters).
- **Report delivery is still undemonstrated.** It did not work in headless Chrome (cases 10 and 11), so the 48-hour watch must first prove delivery on the real site with one deliberate violation in the app page (plan task 15.4, first step). It is also unverified that a browser reports a `srcdoc` frame's violations with `document-uri` `about:srcdoc`. That is what the browser exposes as the frame's `location.href` (seen in this proof), but no real report was captured. The same 15.4 step should confirm it with one preview-frame violation.

## Recommendation (based only on the results above)

What the results establish:

1. Inline-script previews are **blocked** under the enforcing header (case 2). The meta CSP is not the cause; the inherited header is. No change inside `preview-document.ts` can fix this, because a meta can only tighten.
2. Static HTML/CSS previews **work** (cases 1, 6, 7).
3. The meta CSP is **load-bearing**: it alone stops the frame loading the app's own bundle (case 5) and making same-origin requests (case 4). The header's `'self'` would allow both.
4. The parent's `default-src 'self'` (as `frame-src`) stops a preview navigating itself to a remote page, with or without scripts (8b, 8c), but the preview then shows a browser error page, and the block is a top-document `frame-src` violation.

So **option 1 is true today** with no server change: static previews render, scripted ones render their static parts and the scripts silently do nothing.

**Option 1 (static-only, with a note).** Keep previews; when the parsed document contains a `<script>` element (or `on*` attributes), show a visible note such as "Scripts do not run in previews" next to the card. Change: `HtmlArtifactCard`/`preview-document.ts` only (km-frontend-engineer). Cost: interactive demos the model writes will not work.

**Option 2 (dedicated preview route with its own CSP).** Minimal server change (km-rust-engineer):
- A static route, e.g. `GET /preview-frame`, returning a fixed shell document (no model content stored server-side), with its own header `Content-Security-Policy: default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; frame-ancestors 'self'; form-action 'none'; base-uri 'none'`. The global `SetResponseHeaderLayer::overriding(CSP_HEADER, …)` in `routes/mod.rs` must **exclude** this route, or it replaces the route's header with the site policy (and scripts are blocked again). The route keeps COEP/COOP and `X-Frame-Options: SAMEORIGIN`.
- The card uses `<iframe src="/preview-frame" sandbox="allow-scripts">` instead of `srcdoc` and sends the model HTML by `postMessage` once the shell loads; the shell's inline script checks `event.source === parent` and writes the document (keeping the meta as defence in depth).
- Sandbox flags stay exactly `allow-scripts`: never `allow-same-origin` (with it, the frame would be the site's origin with script access to its storage and cookies), never `allow-forms`, `allow-popups`, `allow-top-navigation*`, `allow-modals`.

Is option 2 safe? On this evidence, mostly yes for the site's data: the frame stays an opaque origin (`"null"`, case 4), so script in it cannot read the site's cookies, storage or DOM; with `default-src 'none'` it cannot connect anywhere (cases 3, 4 show the meta-equivalent policy blocking both); forms and popups stay blocked by the sandbox (case 8); remote self-navigation stays blocked by the parent's `frame-src` (8b, 8c). What it adds: model-written script runs in the visitor's browser. That code can still navigate its own frame to a same-origin path (untested here), and nothing stops a script from burning CPU or looping. It also needs code that does not exist yet and a header exemption, which is where a mistake would undo the isolation. **None of option 2 was built or tested in this proof.**

**I recommend option 1 now.** It matches what the browser already does, needs no server change and no new attack surface, and the note makes the gap honest to the visitor. Option 2 is a reasonable later change if interactive previews are a stated product need; build it behind its own browser proof (the same spec, pointed at the new route). Independent of the choice: fix the acceptance rule and the report log gaps listed above before the 48-hour watch, or the first remote image in a preview forces a revert.
