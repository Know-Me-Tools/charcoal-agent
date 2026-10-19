/**
 * Integration gate for task 5.6 of `app-chat-export-okf-bundle`: the zip of all
 * conversations at 1, 50 and 300 stored conversations, with main-thread
 * responsiveness measured while it is prepared.
 *
 * The conversations are written into the app's own PGlite database through the
 * module the app itself uses, so Prepare reads real stored rows. Responsiveness
 * is measured two ways: `longtask` entries where the browser has that API
 * (Chromium) and the gaps between animation frames everywhere. The numbers are
 * printed so the PR can quote them; the asserted bounds are loose on purpose and
 * only catch a freeze, not a regression of a few milliseconds.
 *
 *   npx playwright test e2e/chat-export-bundle-load.spec.ts --project=chromium --workers=1 --retries=0
 *   npx playwright test e2e/chat-export-bundle-load.spec.ts --project=webkit-iphone   (needs WebKit installed)
 */
import fs from "node:fs";
import { strFromU8, unzipSync } from "fflate";
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { FIXTURE_THREAD_ID, waitForAppReady } from "./support/routes";
import { CHAT_EXPORT_CONTENT as C } from "../content/site/chat-export";

const SIZES = [1, 50, 300] as const;
const MESSAGES_PER_THREAD = 6;
/** About 1.5 KB per message: a few paragraphs, like a real answer. */
const PARAGRAPH = "The Universal Agent Runtime owns inference, routing and governance, and BossFang connects to it. ";

/** Writes `count` finished conversations into the app's database. */
async function seedConversations(page: Page, count: number): Promise<void> {
	await page.evaluate(
		async ({ count: n, perThread, paragraph }) => {
			// A variable specifier keeps tsc from resolving the dev-server path; the browser imports it natively.
			const dbModule = "/src/lib/db/pglite.ts";
			const { getDbInstance } = (await import(/* @vite-ignore */ dbModule)) as {
				getDbInstance: () => { upsertThread(t: object): Promise<void>; insertMessage(id: string, m: object): Promise<void> };
			};
			const db = getDbInstance();
			const day = 24 * 60 * 60 * 1000;
			const base = Date.UTC(2026, 9, 14, 12, 0, 0);
			for (let i = 0; i < n; i += 1) {
				const id = crypto.randomUUID();
				const at = new Date(base - i * day);
				await db.upsertThread({
					id,
					sessionId: id,
					title: `Seeded conversation ${i}`,
					isEphemeral: false,
					createdAt: at.toISOString(),
					updatedAt: at.toISOString(),
				});
				for (let j = 0; j < perThread; j += 1) {
					await db.insertMessage(id, {
						id: crypto.randomUUID(),
						role: j % 2 === 0 ? "user" : "assistant",
						content: [{ type: "text", text: `Message ${j} of conversation ${i}. ${paragraph.repeat(j % 2 === 0 ? 1 : 14)}` }],
						createdAt: new Date(at.getTime() + j * 1000),
						status: "complete",
					});
				}
			}
		},
		{ count, perThread: MESSAGES_PER_THREAD, paragraph: PARAGRAPH },
	);
}

/** Starts recording frame gaps and long tasks in the page. */
async function startMeasuring(page: Page): Promise<void> {
	await page.evaluate(() => {
		const w = window as unknown as { __m: { gaps: number[]; long: number[]; stop: boolean } };
		w.__m = { gaps: [], long: [], stop: false };
		try {
			new PerformanceObserver((list) => {
				for (const entry of list.getEntries()) w.__m.long.push(entry.duration);
			}).observe({ entryTypes: ["longtask"] });
		} catch {
			// No longtask API (WebKit): the frame gaps carry the measurement.
		}
		let last = performance.now();
		const tick = (now: number) => {
			w.__m.gaps.push(now - last);
			last = now;
			if (!w.__m.stop) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	});
}

async function stopMeasuring(page: Page): Promise<{ maxGapMs: number; longTasks: number; maxLongTaskMs: number }> {
	return page.evaluate(() => {
		const w = window as unknown as { __m: { gaps: number[]; long: number[]; stop: boolean } };
		w.__m.stop = true;
		return {
			maxGapMs: Math.round(Math.max(0, ...w.__m.gaps)),
			longTasks: w.__m.long.length,
			maxLongTaskMs: Math.round(Math.max(0, ...w.__m.long)),
		};
	});
}

test.describe("export: all conversations at 1, 50 and 300 stored conversations", () => {
	for (const size of SIZES) {
		test(`prepares and saves ${size} conversation(s) without freezing the page`, async ({ page }) => {
			test.setTimeout(300_000);
			await page.setViewportSize({ width: 1440, height: 900 });
			await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
			await waitForAppReady(page);
			await seedConversations(page, size);

			await page.getByRole("button", { name: "Export", exact: true }).click();
			await startMeasuring(page);
			const startedAt = Date.now();
			await page.getByRole("menuitem", { name: C.prepareAll }).click();
			const save = page.getByRole("menuitem", { name: C.saveAll });
			await expect(save).toBeVisible({ timeout: 120_000 });
			const preparedMs = Date.now() - startedAt;
			const measured = await stopMeasuring(page);
			await expect(page.getByText(new RegExp(`Conversations ready: ${size},`))).toBeVisible();

			const downloadPromise = page.waitForEvent("download");
			await save.click();
			const download = await downloadPromise;
			const zipPath = (await download.path()) ?? "";
			const zipBytes = fs.statSync(zipPath).size;
			const entries = unzipSync(new Uint8Array(fs.readFileSync(zipPath)));
			const names = Object.keys(entries);
			const conversations = names.filter((n) => n.startsWith("conversations/"));

			console.log(
				`GATE size=${size} prepared_ms=${preparedMs} zip_bytes=${zipBytes} entries=${names.length} ` +
					`max_frame_gap_ms=${measured.maxGapMs} long_tasks=${measured.longTasks} max_long_task_ms=${measured.maxLongTaskMs}`,
			);

			expect(conversations).toHaveLength(size);
			expect(names).toContain("index.md");
			expect(names).toContain("log.md");
			expect(new Set(names).size).toBe(names.length);
			const index = strFromU8(entries["index.md"]);
			expect(index.match(/^\* \[/gm)).toHaveLength(size);
			// Freeze guard, not a benchmark: no frame gap or task over two seconds.
			expect(measured.maxGapMs).toBeLessThan(2_000);
			expect(measured.maxLongTaskMs).toBeLessThan(2_000);
		});
	}
});
