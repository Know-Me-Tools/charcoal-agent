/**
 * stream-load spec (phase chat-export-and-block-copy, task 1.7) — the only
 * spec the `webkit-iphone` project runs (testMatch in playwright.config.ts).
 *
 * Streams the 400-delta long-stream fixture through the real chat path: the
 * composer POSTs `/api/chat/completion`, which an init-script fetch override
 * answers with the fixture body paced one SSE event per DELTA_INTERVAL_MS
 * (route.fulfill can only deliver a body atomically, which would not exercise
 * a multi-second stream; the pattern follows holdChatStreamOpen in
 * support/uar-mock.ts, and non-streaming requests such as thread-title
 * generation still fall through to the route mock). No instrumentation is
 * added to the app; everything is measured in the page:
 *
 *   1. DOM mutation batches per second on the thread viewport
 *      (MutationObserver — each callback delivery is one batch).
 *   2. requestAnimationFrame gaps over RAF_GAP_MS (WebKit has no Long Tasks
 *      API, so long frames are the jank proxy).
 *   3. Wall time from send to final render.
 *
 * Assertions are design properties, not performance claims: mutation batches
 * never exceed 20 per second during the stream (one per 50 ms — the bound the
 * delta coalescer and the 10/s streaming parse throttle are designed to
 * keep), the final DOM contains all 400 deltas of text in order, the 3 code
 * blocks and the Mermaid diagram are rendered after the stream ends, and no
 * text is lost.
 */
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { FIXTURE_THREAD_ID, waitForAppReady } from "./support/routes";
import {
  LONG_STREAM_CODE_FENCES,
  LONG_STREAM_CODE_REGION_LABEL,
  LONG_STREAM_DELTA_COUNT,
  LONG_STREAM_MARKERS,
  LONG_STREAM_SSE_BODY,
} from "./fixtures/long-stream";

/** One SSE event every 5 ms: a realistic token stream (~2 s for 402 events). */
const DELTA_INTERVAL_MS = 5;
/** Design bound: at most one DOM mutation batch per 50 ms during a stream. */
const MAX_MUTATION_BATCHES_PER_SECOND = 20;
/** rAF gaps longer than this count as jank (WebKit has no Long Tasks API). */
const RAF_GAP_MS = 50;

interface StreamProbe {
  /** performance.now() at send time. */
  t0: number;
  /** performance.now() of every MutationObserver callback on the viewport. */
  mutationTimes: number[];
  /** Count of rAF gaps over RAF_GAP_MS (runs for the life of the page). */
  rafGaps: number;
  /** performance.now() when the final render was first observed, else null. */
  finalRenderAt: number | null;
  /** rafGaps at the moment of final render (the page idles rAF afterwards). */
  rafGapsAtFinalRender: number | null;
}

declare global {
  interface Window {
    __streamProbe?: StreamProbe;
  }
}

/**
 * Installs the probe and the paced stream before any page script runs.
 * The rAF gap counter runs for the life of the page; mutation times are
 * collected by attachProbe() once the viewport exists.
 */
async function installPacedStream(page: Page): Promise<void> {
  await page.addInitScript(
    ({ body, intervalMs, rafGapMs }) => {
      window.__streamProbe = {
        t0: 0,
        mutationTimes: [],
        rafGaps: 0,
        finalRenderAt: null,
        rafGapsAtFinalRender: null,
      };

      let lastRaf = 0;
      const tick = (ts: number) => {
        const probe = window.__streamProbe;
        if (probe && lastRaf !== 0 && ts - lastRaf > rafGapMs) probe.rafGaps += 1;
        lastRaf = ts;
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      const originalFetch = window.fetch.bind(window);
      window.fetch = async (input, init) => {
        const url =
          typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
        if (url.includes("/api/chat/completion")) {
          let isStream = true;
          try {
            const parsed =
              typeof init?.body === "string" ? (JSON.parse(init.body) as { stream?: boolean }) : null;
            isStream = parsed?.stream !== false;
          } catch {
            isStream = true;
          }
          if (isStream) {
            // The body is event:…\ndata:…\n\n blocks; JSON.stringify never
            // emits literal newlines, so splitting on the blank line is exact.
            const events = body
              .split("\n\n")
              .filter((chunk) => chunk.trim())
              .map((chunk) => chunk + "\n\n");
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
              async start(controller) {
                for (const event of events) {
                  controller.enqueue(encoder.encode(event));
                  await new Promise((resolve) => setTimeout(resolve, intervalMs));
                }
                controller.close();
              },
            });
            return new Response(stream, {
              status: 200,
              headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
            });
          }
        }
        return originalFetch(input, init);
      };
    },
    { body: LONG_STREAM_SSE_BODY, intervalMs: DELTA_INTERVAL_MS, rafGapMs: RAF_GAP_MS },
  );
}

/**
 * Attaches the MutationObserver to the thread viewport and the final-render
 * detector. Final render means: the last delta's marker is in the text, every
 * code fence has rendered as a Shiki region (`aria-label="ts code"` — a bare
 * `pre` count does not work: the markdown `pre` override wraps every fenced
 * block, code or not, in an outer <pre>), and the Mermaid fence has rendered
 * its SVG.
 */
async function attachProbe(page: Page): Promise<void> {
  const finalMarker = LONG_STREAM_MARKERS[LONG_STREAM_MARKERS.length - 1];
  await page.evaluate(
    ({ marker, codeFences, codeRegionLabel }) => {
      const probe = window.__streamProbe;
      const viewport = document.querySelector(".aui-thread-viewport");
      if (!probe) throw new Error("stream probe not installed");
      if (!viewport) throw new Error("thread viewport not found");
      const observer = new MutationObserver(() => {
        const now = performance.now();
        probe.mutationTimes.push(now);
        if (
          probe.finalRenderAt === null &&
          (viewport.textContent ?? "").includes(marker) &&
          viewport.querySelectorAll(`[role=region][aria-label="${codeRegionLabel}"]`).length ===
            codeFences &&
          viewport.querySelector("svg[id^=mermaid]") !== null
        ) {
          probe.finalRenderAt = now;
          // The page throttles rAF when idle, so gaps counted after the
          // render are not stream jank — clip the counter here.
          probe.rafGapsAtFinalRender = probe.rafGaps;
        }
      });
      observer.observe(viewport, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
    },
    {
      marker: finalMarker,
      codeFences: LONG_STREAM_CODE_FENCES,
      codeRegionLabel: LONG_STREAM_CODE_REGION_LABEL,
    },
  );
}

test("a 400-delta stream keeps mutation batches bounded and renders completely, in order", async ({
  page,
}) => {
  test.setTimeout(120_000);

  // The shared fixture's auto UAR mock answers every non-chat backend path;
  // the paced fetch override (installed before goto) owns the streaming POST.
  await installPacedStream(page);
  await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
  await waitForAppReady(page);
  await attachProbe(page);

  await page.evaluate(() => {
    window.__streamProbe!.t0 = performance.now();
  });
  // The accessible name is identical on the app and site builds; the
  // placeholder text is not (site build uses its own empty-state copy).
  const composer = page.getByLabel("Message input").filter({ visible: true });
  await composer.fill("Stream the long reply.");
  await composer.press("Enter");

  await expect
    .poll(() => page.evaluate(() => window.__streamProbe?.finalRenderAt ?? null), {
      timeout: 90_000,
      message: "final render of the 400-delta reply",
    })
    .not.toBeNull();

  const probe = await page.evaluate(() => {
    const p = window.__streamProbe!;
    return {
      t0: p.t0,
      mutationTimes: p.mutationTimes,
      rafGaps: p.rafGapsAtFinalRender as number,
      finalRenderAt: p.finalRenderAt as number,
    };
  });
  const dom = await page.evaluate(
    ({ markers, codeRegionLabel }) => {
      const viewport = document.querySelector(".aui-thread-viewport");
      const text = viewport?.textContent ?? "";
      let cursor = -1;
      let orderedCount = 0;
      for (const marker of markers) {
        const idx = text.indexOf(marker, cursor + 1);
        if (idx === -1) break;
        cursor = idx;
        orderedCount += 1;
      }
      return {
        orderedCount,
        codeRegionCount:
          viewport?.querySelectorAll(`[role=region][aria-label="${codeRegionLabel}"]`).length ?? 0,
        mermaidCount: viewport?.querySelectorAll("svg[id^=mermaid]").length ?? 0,
      };
    },
    { markers: [...LONG_STREAM_MARKERS], codeRegionLabel: LONG_STREAM_CODE_REGION_LABEL },
  );

  // Mutation batches per second, over the stream window only (send → final
  // render): the sliding-window peak is the design assertion, the average is
  // recorded for the baseline comparison.
  const inStream = probe.mutationTimes.filter((t) => t >= probe.t0 && t <= probe.finalRenderAt);
  let maxBatchesPerSecond = 0;
  for (let i = 0; i < inStream.length; i += 1) {
    let count = 0;
    for (let j = i; j < inStream.length && inStream[j] < inStream[i] + 1000; j += 1) count += 1;
    maxBatchesPerSecond = Math.max(maxBatchesPerSecond, count);
  }
  const wallMs = probe.finalRenderAt - probe.t0;
  const metrics = {
    deltas: LONG_STREAM_DELTA_COUNT,
    wallMs: Math.round(wallMs),
    mutationBatches: inStream.length,
    avgBatchesPerSecond: Number((inStream.length / (wallMs / 1000)).toFixed(1)),
    maxBatchesPerSecond,
    rafGapsOver50ms: probe.rafGaps,
  };
  console.log(`STREAM_LOAD_METRICS ${JSON.stringify(metrics)}`);
  test.info().annotations.push({ type: "stream-load-metrics", description: JSON.stringify(metrics) });

  // Design assertions (not performance claims).
  expect(inStream.length, "the observer saw mutations — a zero count means it detached").toBeGreaterThan(0);
  expect(maxBatchesPerSecond, "mutation batches per second during the stream").toBeLessThanOrEqual(
    MAX_MUTATION_BATCHES_PER_SECOND,
  );
  expect(dom.orderedCount, "all 400 delta markers present in the final DOM, in order").toBe(
    LONG_STREAM_DELTA_COUNT,
  );
  expect(dom.codeRegionCount, "the 3 fenced code blocks rendered").toBe(LONG_STREAM_CODE_FENCES);
  expect(dom.mermaidCount, "the Mermaid fence rendered as a diagram").toBeGreaterThanOrEqual(1);
});
