/**
 * Replays a REAL production stream (captured with curl, steps, citations, state
 * patches, the answer card and about 100 text deltas) through the real chat
 * path with the CPU throttled, and measures how much main-thread work one reply
 * costs. Built from an iPhone report on 2026-10-17: the server finished a reply
 * in 28 s while the phone was still rendering it two minutes later and was hot.
 * The existing stream-load spec streams only text deltas, so it cannot see the
 * cost of the other event types.
 *
 *   REAL_STREAM_FILE=/path/to/capture.sse CPU_RATE=6 EVENT_MS=30 \
 *     npx playwright test e2e/real-stream-probe.spec.ts --project=chromium --workers=1 --retries=0
 */
import fs from "node:fs";
import { expect, test } from "./support/test";
import { FIXTURE_THREAD_ID, waitForAppReady } from "./support/routes";

const FILE = process.env.REAL_STREAM_FILE ?? "";
const CPU_RATE = Number(process.env.CPU_RATE ?? "6");
const EVENT_MS = Number(process.env.EVENT_MS ?? "30");

test.skip(!FILE || !fs.existsSync(FILE), "set REAL_STREAM_FILE to a captured SSE stream");

test(`real stream under ${CPU_RATE}x CPU throttle: main-thread cost of one reply`, async ({ page }) => {
  test.setTimeout(240_000);
  const body = fs.readFileSync(FILE, "utf8");

  await page.addInitScript(
    ({ sse, intervalMs }) => {
      const w = window as unknown as { __long: number[]; __gaps: number[] };
      w.__long = [];
      w.__gaps = [];
      try {
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) w.__long.push(e.duration);
        }).observe({ entryTypes: ["longtask"] });
      } catch {
        // no longtask API
      }
      let last = 0;
      const tick = (ts: number) => {
        if (last !== 0) w.__gaps.push(ts - last);
        last = ts;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
        if (url.includes("/api/chat/completion")) {
          let isStream = true;
          try {
            isStream = (typeof init?.body === "string" ? (JSON.parse(init.body) as { stream?: boolean }) : null)?.stream !== false;
          } catch {
            isStream = true;
          }
          if (isStream) {
            const events = sse
              .split("\n\n")
              .filter((c) => c.trim())
              .map((c) => c + "\n\n");
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
              async start(controller) {
                for (const event of events) {
                  controller.enqueue(encoder.encode(event));
                  await new Promise((r) => setTimeout(r, intervalMs));
                }
                controller.close();
              },
            });
            return new Response(stream, { status: 200, headers: { "content-type": "text/event-stream", "cache-control": "no-cache" } });
          }
        }
        return originalFetch(input, init);
      };
    },
    { sse: body, intervalMs: EVENT_MS },
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  await waitForAppReady(page);

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: CPU_RATE });
  const read = async () => {
    const { metrics } = await cdp.send("Performance.getMetrics");
    const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
    return { task: m.TaskDuration, script: m.ScriptDuration, layout: m.LayoutDuration, style: m.RecalcStyleDuration, nodes: m.Nodes, heap: m.JSHeapUsedSize };
  };

  const profiling = process.env.PROFILE === "1";
  if (profiling) {
    await cdp.send("Profiler.enable");
    await cdp.send("Profiler.setSamplingInterval", { interval: 500 });
    await cdp.send("Profiler.start");
  }
  const before = await read();
  const t0 = Date.now();
  const composer = page.getByLabel("Message input").filter({ visible: true });
  await composer.fill("Explain in detail how The Boss differs from a plain chat client, with three code examples.");
  await composer.press("Enter");
  await expect(page.getByRole("button", { name: /^Stop/ })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /^Stop/ })).toHaveCount(0, { timeout: 200_000 });
  const wallMs = Date.now() - t0;
  const streamWindowMs = (body.split("\n\n").filter((c) => c.trim()).length) * EVENT_MS;
  const after = await read();
  if (profiling) {
    const { profile } = await cdp.send("Profiler.stop");
    const self = new Map<string, number>();
    const byId = new Map(profile.nodes.map((n) => [n.id, n]));
    profile.samples?.forEach((id, i) => {
      const n = byId.get(id);
      if (!n) return;
      const f = n.callFrame;
      const key = `${f.functionName || "(anon)"} ${f.url.replace(/^https?:\/\/[^/]+/, "").replace(/\?.*$/, "")}:${f.lineNumber + 1}`;
      self.set(key, (self.get(key) ?? 0) + (profile.timeDeltas?.[i] ?? 0));
    });
    const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30);
    for (const [key, us] of top) console.log(`PROFILE ${(us / 1000).toFixed(0).padStart(6)} ms  ${key}`);
  }
  // Let any trailing work settle, then measure idle cost for 3 s.
  const idleStart = await read();
  await page.waitForTimeout(3_000);
  const idleEnd = await read();
  const web = await page.evaluate(() => {
    const w = window as unknown as { __long: number[]; __gaps: number[] };
    return { longTasks: w.__long.length, maxLongMs: Math.round(Math.max(0, ...w.__long)), maxGapMs: Math.round(Math.max(0, ...w.__gaps)), gapsOver100: w.__gaps.filter((g) => g > 100).length };
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });

  const metrics = {
    cpuRate: CPU_RATE,
    eventMs: EVENT_MS,
    streamWindowMs,
    wallMs,
    taskSec: Number((after.task - before.task).toFixed(2)),
    scriptSec: Number((after.script - before.script).toFixed(2)),
    layoutSec: Number((after.layout - before.layout).toFixed(2)),
    styleSec: Number((after.style - before.style).toFixed(2)),
    nodes: after.nodes,
    idleTaskSecPer3s: Number((idleEnd.task - idleStart.task).toFixed(3)),
    ...web,
  };
  console.log(`REAL_STREAM_METRICS ${JSON.stringify(metrics)}`);
  expect(wallMs).toBeGreaterThan(0);
});
