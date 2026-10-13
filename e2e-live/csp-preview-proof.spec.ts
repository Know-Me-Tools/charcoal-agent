/**
 * site-reply-content-hardening 3.5: what a model-written HTML preview frame
 * can and cannot do under the ENFORCING Content-Security-Policy.
 *
 * The page is served by the real site server (`server/`), so the real
 * `content-security-policy` header applies. Only the chat stream is faked, in
 * the browser, so no model is needed. Each case streams one reply holding one
 * fenced ```html block (over 100 characters, so it renders as an
 * `HtmlArtifactCard` preview frame).
 *
 * Evidence per case: `securitypolicyviolation` events (a listener injected
 * into every frame, including the `about:srcdoc` preview), console messages,
 * and every request the page and its frames make. Results are written to
 * `test-results/csp-proof/results.json`.
 *
 * Two kinds of probe:
 * - model-authored: what the HTML in the reply does on its own;
 * - devtools probe: `frame.evaluate` runs code in the frame through the
 *   DevTools protocol, which CSP does not stop. It answers "if a script did
 *   run in the frame, what could it reach?"; requests it makes are still
 *   subject to the frame's policy.
 *
 * Run (server must be up, see the 3.5 evidence file for start steps):
 *   LIVE_BASE_URL=http://127.0.0.1:18080 npx playwright test \
 *     -c playwright.live.config.ts e2e-live/csp-preview-proof.spec.ts
 */
import { expect, test, type ConsoleMessage, type Frame, type Page, type Request } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const RESULTS_DIR = "test-results/csp-proof";
const REMOTE_ORIGIN = "https://example.invalid";
/** 1x1 red PNG. */
const DATA_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==";

interface CaseLog {
  violations: Record<string, unknown>[];
  /** DevTools Audits issues of type ContentSecurityPolicyIssue. */
  cspIssues: Record<string, unknown>[];
  /** Frames the violation listener was installed in. */
  listenerIn: string[];
  console: string[];
  requests: { url: string; method: string; frame: string; postData?: string | null }[];
  remoteHits: string[];
  popups: number;
  probes: Record<string, unknown>;
}

const results: Record<string, CaseLog> = {};

// Cases are independent: one failing must not hide the others' evidence.
test.describe.configure({ mode: "default" });
// PW_CHANNEL=chrome uses the installed Google Chrome when Playwright's own
// Chromium is not downloaded.
if (process.env.PW_CHANNEL) test.use({ channel: process.env.PW_CHANNEL });

test.afterAll(() => {
  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(`${RESULTS_DIR}/results.json`, JSON.stringify(results, null, 2));
});

function sse(markdown: string): string {
  const rid = "csp-proof";
  const events = [
    { event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
    { event: "agui.message.delta", data: { kind: "message", phase: "delta", request_id: rid, delta: { text: markdown } } },
    { event: "agui.done", data: { kind: "done", request_id: rid } },
  ];
  return events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join("");
}

const fence = (html: string) => `Here is the preview.\n\n\`\`\`html\n${html}\n\`\`\`\n\nDone.`;

/** Instrument the page, stream one reply, and return the case log. */
async function streamReply(page: Page, name: string, markdown: string): Promise<CaseLog> {
  const log: CaseLog = {
    violations: [],
    cspIssues: [],
    listenerIn: [],
    console: [],
    requests: [],
    remoteHits: [],
    popups: 0,
    probes: {},
  };
  results[name] = log;

  const cdp = await page.context().newCDPSession(page);
  cdp.on("Audits.issueAdded", ({ issue }) => {
    if (issue.code !== "ContentSecurityPolicyIssue") return;
    const d = issue.details.contentSecurityPolicyIssueDetails;
    log.cspIssues.push({
      violatedDirective: d?.violatedDirective,
      blockedURL: d?.blockedURL,
      isReportOnly: d?.isReportOnly,
      type: d?.contentSecurityPolicyViolationType,
    });
  });
  await cdp.send("Audits.enable");

  await page.addInitScript(() => {
    console.log("CSPL " + location.href);
    document.addEventListener("securitypolicyviolation", (e) => {
      console.log(
        "CSPV " +
          JSON.stringify({
            document: location.href,
            effectiveDirective: e.effectiveDirective,
            violatedDirective: e.violatedDirective,
            blockedURI: e.blockedURI,
            disposition: e.disposition,
            // Which policy fired: the inherited header carries report-uri, the
            // preview meta starts with default-src 'none'.
            policy: e.originalPolicy.slice(0, 40),
          }),
      );
    });
  });
  page.on("console", (m: ConsoleMessage) => {
    const text = m.text();
    if (text.startsWith("CSPL ")) log.listenerIn.push(text.slice(5));
    else if (text.startsWith("CSPV ")) log.violations.push(JSON.parse(text.slice(5)) as Record<string, unknown>);
    else log.console.push(`[${m.type()}] ${text}`);
  });
  page.on("request", (r: Request) => {
    const url = r.url();
    if (url.startsWith("data:")) return;
    log.requests.push({
      url,
      method: r.method(),
      frame: r.frame() === page.mainFrame() ? "main" : r.frame().url(),
      postData: r.method() === "POST" ? r.postData() : undefined,
    });
  });
  page.context().on("page", () => {
    log.popups += 1;
  });
  // Any request that reaches the network for the remote origin is recorded here.
  await page.route(`${REMOTE_ORIGIN}/**`, (route) => {
    log.remoteHits.push(route.request().url());
    return route.fulfill({ status: 204, body: "" });
  });
  await page.route("**/api/chat/completion", (route) => {
    const body = route.request().postDataJSON() as { stream?: boolean } | null;
    if (body?.stream === false) {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ content: "CSP proof" }) });
    }
    return route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
      body: sse(markdown),
    });
  });

  const response = await page.goto(`/threads/${randomUUID()}`);
  const headers = response?.headers() ?? {};
  expect(headers["content-security-policy"], "enforcing CSP header").toBeTruthy();
  expect(headers["content-security-policy-report-only"], "no report-only header").toBeUndefined();
  log.probes.header = headers["content-security-policy"];

  const composer = page.locator("textarea").filter({ visible: true }).first();
  await composer.fill(`CSP proof: ${name}`);
  await composer.press("Enter");
  await expect(page.getByText("Done.").first()).toBeVisible();
  return log;
}

async function previewFrame(page: Page): Promise<Frame> {
  const iframe = page.locator('iframe[title="html artifact"]').first();
  await expect(iframe).toBeVisible();
  await expect(iframe).toHaveAttribute("sandbox", "allow-scripts");
  const frame = await (await iframe.elementHandle())!.contentFrame();
  if (!frame) throw new Error("no preview frame");
  await frame.waitForLoadState("load");
  return frame;
}

/** Let late violation events and requests arrive. */
const settle = (page: Page) => page.waitForTimeout(1_500);

/** Devtools probe: a fetch from inside the frame, if a script could run there. */
function probeFetch(frame: Frame, url: string, init?: RequestInit) {
  return frame.evaluate(
    async ([u, i]) => {
      try {
        const r = await fetch(u, i ?? undefined);
        let text = "";
        try {
          text = (await r.text()).slice(0, 80);
        } catch (e) {
          text = `body unreadable: ${String(e)}`;
        }
        return { sent: true, type: r.type, status: r.status, text };
      } catch (e) {
        return { error: String(e) };
      }
    },
    [url, init ?? null] as const,
  );
}

test("1 static HTML and CSS renders", async ({ page }) => {
  await streamReply(
    page,
    "1-static",
    fence(
      `<!DOCTYPE html><html><head><style>#box{width:120px;height:40px;background:rgb(255,0,0)}</style></head>` +
        `<body><h1 id="t">case one static preview</h1><div id="box"></div></body></html>`,
    ),
  );
  const frame = await previewFrame(page);
  await expect(frame.locator("#t")).toHaveText("case one static preview");
  const bg = await frame.locator("#box").evaluate((el) => getComputedStyle(el).backgroundColor);
  results["1-static"].probes.boxBackground = bg;
  expect(bg).toBe("rgb(255, 0, 0)");
  await page.locator('iframe[title="html artifact"]').first().screenshot({ path: `${RESULTS_DIR}/1-static.png` });
  await settle(page);
});

test("2 an inline script does not run", async ({ page }) => {
  const log = await streamReply(
    page,
    "2-inline-script",
    fence(
      `<p id="out">script did not run</p>` +
        `<script>document.getElementById("out").textContent = "script ran";</script>` +
        `<p>Padding so the fence is over one hundred characters long.</p>`,
    ),
  );
  const frame = await previewFrame(page);
  await settle(page);
  const text = await frame.locator("#out").textContent();
  log.probes.outText = text;
  expect(text).toBe("script did not run");
  // The inherited header (not the preview meta) is the policy that refuses it.
  expect(
    log.console.some((c) => c.includes("Executing inline script violates") && c.includes("'wasm-unsafe-eval'")),
  ).toBe(true);
});

test("3 a remote fetch from the frame is blocked", async ({ page }) => {
  const log = await streamReply(
    page,
    "3-remote-fetch",
    fence(
      `<p id="out">waiting</p><script>fetch("${REMOTE_ORIGIN}/x").then(()=>{out.textContent="fetched"},` +
        `(e)=>{out.textContent="fetch failed "+e})</script>`,
    ),
  );
  const frame = await previewFrame(page);
  log.probes.devtoolsFetch = await probeFetch(frame, `${REMOTE_ORIGIN}/x`);
  await settle(page);
  log.probes.outText = await frame.locator("#out").textContent();
  expect(log.remoteHits).toEqual([]);
  expect(log.probes.devtoolsFetch).toHaveProperty("error");
});

test("4 a same-origin fetch from the opaque-origin frame", async ({ page }) => {
  const log = await streamReply(
    page,
    "4-same-origin-fetch",
    fence(
      `<p id="out">waiting</p><script>fetch("/healthz").then(r=>r.text()).then(t=>{out.textContent="read "+t},` +
        `(e)=>{out.textContent="fetch failed "+e})</script>`,
    ),
  );
  const frame = await previewFrame(page);
  log.probes.frameOrigin = await frame.evaluate(() => self.origin);
  log.probes.frameUrl = frame.url();
  const before = log.requests.length;
  log.probes.devtoolsHealthz = await probeFetch(frame, "/healthz");
  log.probes.devtoolsHealthzAbsolute = await probeFetch(frame, new URL("/healthz", page.url()).href);
  log.probes.devtoolsCspReport = await probeFetch(frame, new URL("/api/csp-report", page.url()).href, {
    method: "POST",
    headers: { "content-type": "application/csp-report" },
    body: JSON.stringify({ "csp-report": { "effective-directive": "probe-case-4", "blocked-uri": "probe" } }),
  });
  await settle(page);
  log.probes.outText = await frame.locator("#out").textContent();
  log.probes.requestsFromFrameAfterProbe = log.requests.slice(before).filter((r) => r.frame !== "main");
});

test("5 a script src of the app's own bundle does not load", async ({ page, request }) => {
  const html = await (await request.get("/")).text();
  const asset = html.match(/<script[^>]+src="(\/assets\/[^"]+\.js)"/)?.[1];
  expect(asset, "an /assets/*.js in index.html").toBeTruthy();
  const log = await streamReply(
    page,
    "5-script-src-self",
    fence(`<p id="out">waiting</p><script src="${asset}"></script><p>The bundle above must not load in here.</p>`),
  );
  log.probes.asset = asset;
  await previewFrame(page);
  await settle(page);
  log.probes.assetRequestsFromFrame = log.requests.filter((r) => r.url.endsWith(asset!) && r.frame !== "main");
  expect(log.probes.assetRequestsFromFrame).toEqual([]);
});

test("6 a remote image is blocked and a data image renders", async ({ page }) => {
  const log = await streamReply(
    page,
    "6-images",
    fence(
      `<p>Two images follow.</p><img id="remote" alt="remote" src="${REMOTE_ORIGIN}/p.png">` +
        `<img id="data" alt="data" width="20" height="20" src="${DATA_PNG}">`,
    ),
  );
  const frame = await previewFrame(page);
  await settle(page);
  const sizes = await frame.evaluate(() =>
    ["remote", "data"].map((id) => {
      const img = document.getElementById(id) as HTMLImageElement;
      return { id, complete: img.complete, naturalWidth: img.naturalWidth };
    }),
  );
  log.probes.images = sizes;
  expect(log.remoteHits).toEqual([]);
  expect(sizes.find((s) => s.id === "data")?.naturalWidth).toBe(1);
  expect(sizes.find((s) => s.id === "remote")?.naturalWidth).toBe(0);
});

test("7 a document with a doctype is in standards mode", async ({ page }) => {
  const log = await streamReply(
    page,
    "7-doctype",
    fence(
      `<!DOCTYPE html>\n<html><head><title>Mode</title></head><body>` +
        `<p id="out">mode unknown</p><script>out.textContent = document.compatMode;</script></body></html>`,
    ),
  );
  const frame = await previewFrame(page);
  await settle(page);
  log.probes.compatModeReadByDevtools = await frame.evaluate(() => document.compatMode);
  log.probes.outText = await frame.locator("#out").textContent();
  log.probes.firstChildOfHead = await frame.evaluate(() => document.head.firstElementChild?.outerHTML);
  expect(log.probes.compatModeReadByDevtools).toBe("CSS1Compat");
});

test("8 a form submit and a target=_blank link do nothing", async ({ page }) => {
  const log = await streamReply(
    page,
    "8-form-and-popup",
    fence(
      `<form id="f" action="/api/csp-report" method="post"><input name="q" value="probe-case-8">` +
        `<button id="submit" type="submit">Send</button></form>` +
        `<a id="link" href="${REMOTE_ORIGIN}/open" target="_blank">open a window</a>`,
    ),
  );
  const frame = await previewFrame(page);
  const urlBefore = frame.url();
  const before = log.requests.length;
  await frame.locator("#submit").click();
  await frame.locator("#link").click();
  await settle(page);
  log.probes.frameUrlBefore = urlBefore;
  log.probes.frameUrlAfter = frame.url();
  log.probes.requestsAfterClicks = log.requests.slice(before);
  log.probes.pages = page.context().pages().length;
  expect(log.popups).toBe(0);
  expect(log.remoteHits).toEqual([]);
  expect(log.requests.slice(before).filter((r) => r.url.includes("/api/csp-report") && r.method === "POST" && (r.postData ?? "").includes("probe-case-8"))).toEqual([]);
});

/**
 * Extra (not in the 3.5 list): can the frame navigate ITSELF to a remote page?
 * Sandbox allows self-navigation; the parent's `default-src 'self'` (the
 * frame-src fallback) is what would stop it. Two routes: a clicked link with
 * no target, and a meta refresh.
 */
test("8b the frame cannot navigate itself to a remote page", async ({ page }) => {
  const log = await streamReply(
    page,
    "8b-self-navigation-link",
    fence(`<p>Click the link below to leave the preview.</p><a id="self" href="${REMOTE_ORIGIN}/nav">navigate this frame</a>`),
  );
  const frame = await previewFrame(page);
  await frame.locator("#self").click();
  await settle(page);
  log.probes.frameUrlAfter = frame.url();
  log.probes.frameStillHasLink = await page
    .frameLocator('iframe[title="html artifact"]')
    .locator("#self")
    .count()
    .catch((e: unknown) => String(e));
  expect(log.remoteHits).toEqual([]);
});

test("8c a meta refresh cannot navigate the frame to a remote page", async ({ page }) => {
  const log = await streamReply(
    page,
    "8c-self-navigation-meta-refresh",
    fence(
      `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${REMOTE_ORIGIN}/refresh"></head>` +
        `<body><p id="t">meta refresh probe</p></body></html>`,
    ),
  );
  await previewFrame(page);
  await page.waitForTimeout(3_000);
  log.probes.frameText = await page
    .frameLocator('iframe[title="html artifact"]')
    .locator("#t")
    .textContent({ timeout: 2_000 })
    .catch((e: unknown) => String(e).slice(0, 120));
  expect(log.remoteHits).toEqual([]);
});

test("9 a markdown remote image makes no request", async ({ page }) => {
  const log = await streamReply(
    page,
    "9-markdown-image",
    `A picture: ![x](${REMOTE_ORIGIN}/p.png)\n\nDone.`,
  );
  await settle(page);
  log.probes.imgElementsWithRemoteSrc = await page
    .locator(`img[src^="${REMOTE_ORIGIN}"]`)
    .count();
  log.probes.replyText = (await page.getByText("A picture").first().innerText()).slice(0, 200);
  log.probes.remoteRequests = log.requests.filter((r) => r.url.startsWith(REMOTE_ORIGIN));
  expect(log.remoteHits).toEqual([]);
  expect(log.probes.remoteRequests).toEqual([]);
});

/**
 * Does a report for a preview-frame violation reach the server? Reports go
 * through the Reporting API, out of band and batched, so this keeps one page
 * open and watches the server's log. Needs SERVER_LOG (the server's stdout).
 */
test("10 reports from a preview frame reach /api/csp-report", async ({ page }) => {
  const serverLog = process.env.SERVER_LOG;
  test.skip(!serverLog, "SERVER_LOG not set");
  test.setTimeout(150_000);
  const reportLines = () =>
    readFileSync(serverLog!, "utf8")
      .split("\n")
      .filter((l) => l.includes('"csp violation"'));
  const before = reportLines().length;
  const log = await streamReply(
    page,
    "10-reports",
    fence(
      `<p id="out">script did not run</p><script>out.textContent = "ran";</script>` +
        `<img alt="remote" src="${REMOTE_ORIGIN}/report.png"><p>Report probe padding.</p>`,
    ),
  );
  await previewFrame(page);
  const started = Date.now();
  while (Date.now() - started < 100_000 && reportLines().length === before) await page.waitForTimeout(2_000);
  // Let a batch that just started finish arriving.
  await page.waitForTimeout(3_000);
  log.probes.newReportLines = reportLines().slice(before);
  log.probes.secondsWaited = Math.round((Date.now() - started) / 1000);
});

/**
 * Control for case 10: a violation in the app's own top-level document. If
 * this report arrives and the preview one does not, delivery works and the
 * preview frame's reports are the ones that are not sent.
 */
test("11 control: a top-document violation report reaches /api/csp-report", async ({ page }) => {
  const serverLog = process.env.SERVER_LOG;
  test.skip(!serverLog, "SERVER_LOG not set");
  test.setTimeout(150_000);
  const reportLines = () =>
    readFileSync(serverLog!, "utf8")
      .split("\n")
      .filter((l) => l.includes('"csp violation"'));
  const before = reportLines().length;
  const log = await streamReply(page, "11-control-top-document", "No preview here.\n\nDone.");
  log.probes.devtoolsFetchInTopDocument = await page.evaluate(() =>
    fetch("https://example.invalid/control").then(
      () => "fetched",
      (e: unknown) => String(e),
    ),
  );
  const started = Date.now();
  while (Date.now() - started < 100_000 && reportLines().length === before) await page.waitForTimeout(2_000);
  await page.waitForTimeout(3_000);
  log.probes.newReportLines = reportLines().slice(before);
  log.probes.secondsWaited = Math.round((Date.now() - started) / 1000);
});
