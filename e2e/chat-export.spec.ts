/**
 * Export entry points and privacy proof for change `app-chat-export-okf-single`
 * (KBD tasks 4.3, 4.4, 4.6, phase `chat-export-and-block-copy`).
 *
 * Privacy proof (spec P-3): every request the context issues is recorded from
 * just before the Export button is clicked until the download, the share or the
 * clipboard write has completed, and the list must be empty. The test has a
 * mutation check: the same recorder must go red when the export code calls
 * `fetch` (see the PR evidence for the run with a temporary `fetch('/api/ping')`).
 *
 * The app's 30 s health poll is switched off for these tests (the only
 * `setInterval` of exactly 30000 ms), so a poll that happens to land inside the
 * short recording window cannot be mistaken for an export request. The first
 * health check, at load, runs before the window opens.
 *
 *   npx playwright test e2e/chat-export.spec.ts --project=chromium --workers=1
 *   VITE_SITE_AGENT_ID=knowme-site npx playwright test e2e/chat-export.spec.ts --project=chromium
 *   npx playwright test e2e/chat-export.spec.ts --project=webkit-iphone
 *
 * Set EXPORT_CAPTURE_DIR to write the menu and sheet screenshots.
 */
import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { seedTheme } from "./support/page-helpers";
import { FIXTURE_THREAD_ID, THEMES, waitForAppReady } from "./support/routes";
import { TITLE_RESPONSE, toSseBody, type SseEvent } from "./fixtures/sse";
import { CHAT_EXPORT_CONTENT as C } from "../content/site/chat-export";

const rid = "req-chat-export-e2e";
const QUESTION = "What is the latest stable Rust release?";
const ANSWER = "The latest stable Rust release in this fixture is 1.99.0.";
const CAPTURE_DIR = process.env.EXPORT_CAPTURE_DIR;

const EVENTS: SseEvent[] = [
	{ event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
	{ event: "agui.message.delta", data: { kind: "message", phase: "delta", request_id: rid, delta: { text: ANSWER } } },
	{ event: "agui.done", data: { kind: "done", request_id: rid } },
];

async function openFinishedThread(page: Page, width: number, theme: (typeof THEMES)[number]): Promise<void> {
	await seedTheme(page, theme);
	await page.addInitScript(() => {
		const original = window.setInterval.bind(window);
		window.setInterval = ((handler: TimerHandler, ms?: number, ...args: unknown[]) =>
			ms === 30_000 ? 0 : original(handler, ms, ...args)) as typeof window.setInterval;
	});
	await page.setViewportSize({ width, height: 900 });
	await page.route("**/api/chat/completion", async (route) => {
		const body = route.request().postDataJSON() as { stream?: boolean } | null;
		if (body?.stream === false) {
			return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) });
		}
		return route.fulfill({ status: 200, contentType: "text/event-stream", body: toSseBody(EVENTS) });
	});
	await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
	await waitForAppReady(page);
	const composer = page.getByLabel("Message input").filter({ visible: true });
	await expect(composer).toBeVisible();
	await composer.fill(QUESTION);
	await composer.press("Enter");
	await expect(page.getByText(ANSWER).first()).toBeAttached();
	// The reply has finished once the composer offers Send again (not Stop).
	await expect(page.getByRole("button", { name: /^Stop/ })).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Export", exact: true })).toBeVisible();
	await page.evaluate(() => document.fonts.ready);
	await settleNetwork(page);
}

/**
 * Waits until the app has made no request for a full second, so the skills
 * sync and the first health check that follow a page load are finished before
 * a test opens its recording window.
 */
async function settleNetwork(page: Page): Promise<void> {
	let last = Date.now();
	const mark = () => (last = Date.now());
	page.on("request", mark);
	while (Date.now() - last < 1_000) await page.waitForTimeout(250);
	page.off("request", mark);
}

/** Records every request the context issues, from any page or worker. */
function recordRequests(context: BrowserContext): { requests: string[]; stop: () => void } {
	const requests: string[] = [];
	const onRequest = (request: { method(): string; url(): string }) => requests.push(`${request.method()} ${request.url()}`);
	context.on("request", onRequest);
	return { requests, stop: () => context.off("request", onRequest) };
}

async function capture(page: Page, name: string): Promise<void> {
	if (!CAPTURE_DIR) return;
	fs.mkdirSync(CAPTURE_DIR, { recursive: true });
	await page.screenshot({ path: path.join(CAPTURE_DIR, `${name}.png`) });
}

test.describe("export: privacy proof (zero requests)", () => {
	test.skip(({ browserName }) => browserName !== "chromium", "Runs on Chromium; the WebKit run below covers the tap path.");

	test("saving the file makes no request from the Export click to the download", async ({ page, context }) => {
		await openFinishedThread(page, 1440, "light");

		const recorder = recordRequests(context);
		const downloadPromise = page.waitForEvent("download");
		await page.getByRole("button", { name: "Export", exact: true }).click();
		await expect(page.getByText(C.privacyLine)).toBeVisible();
		await page.getByRole("menuitem", { name: C.saveFile }).click();
		const download = await downloadPromise;
		const text = fs.readFileSync((await download.path()) ?? "", "utf8");
		await expect(page.getByText(C.savedStatus)).toBeVisible();
		recorder.stop();

		expect(download.suggestedFilename()).toMatch(/^knowme-[a-z0-9-]+-\d{8}\.md$/);
		expect(text).toContain(QUESTION);
		expect(text).toContain(ANSWER);
		expect(recorder.requests, "requests between the Export click and the finished download").toEqual([]);
	});

	test("copying as Markdown makes no request from the Export click to the clipboard write", async ({ page, context }) => {
		await context.grantPermissions(["clipboard-read", "clipboard-write"]);
		await openFinishedThread(page, 1440, "light");

		const recorder = recordRequests(context);
		await page.getByRole("button", { name: "Export", exact: true }).click();
		await page.getByRole("menuitem", { name: C.copyMarkdown }).click();
		await expect(page.getByText(C.copiedStatus)).toBeVisible();
		const copied = await page.evaluate(() => navigator.clipboard.readText());
		recorder.stop();

		expect(copied).toContain(QUESTION);
		expect(copied).toContain(ANSWER);
		expect(recorder.requests, "requests between the Export click and the clipboard write").toEqual([]);
	});

	test("the share route makes no request either (navigator.share stubbed to accept the file)", async ({ page, context }) => {
		await openFinishedThread(page, 1440, "light");
		await page.evaluate(() => {
			const w = window as unknown as { __shared?: { name: string; text: string } };
			Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
			Object.defineProperty(navigator, "share", {
				configurable: true,
				value: async (data: { files: File[] }) => {
					w.__shared = { name: data.files[0].name, text: await data.files[0].text() };
				},
			});
		});

		const recorder = recordRequests(context);
		await page.getByRole("button", { name: "Export", exact: true }).click();
		await page.getByRole("menuitem", { name: C.saveFile }).click();
		await expect(page.getByText(C.savedStatus)).toBeVisible();
		recorder.stop();

		const shared = await page.evaluate(() => (window as unknown as { __shared?: { name: string; text: string } }).__shared);
		expect(shared?.name).toMatch(/\.md$/);
		expect(shared?.text).toContain(ANSWER);
		expect(recorder.requests).toEqual([]);
	});
});

test.describe("export: states and fallbacks (Chromium)", () => {
	test.skip(({ browserName }) => browserName !== "chromium", "Chromium only.");

	test("a cancelled share sheet is silent: no failure message, no download, no fallback", async ({ page }) => {
		await openFinishedThread(page, 1440, "light");
		await page.evaluate(() => {
			Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
			Object.defineProperty(navigator, "share", {
				configurable: true,
				value: () => Promise.reject(Object.assign(new Error("cancelled"), { name: "AbortError" })),
			});
		});
		let downloaded = false;
		page.on("download", () => (downloaded = true));
		await page.getByRole("button", { name: "Export", exact: true }).click();
		await page.getByRole("menuitem", { name: C.saveFile }).click();
		await page.waitForTimeout(500);
		expect(downloaded).toBe(false);
		await expect(page.getByText(C.savedStatus)).toHaveCount(0);
		await expect(page.getByText(C.saveFailedStatus)).toHaveCount(0);
		await expect(page.getByRole("dialog")).toHaveCount(0);
	});

	test("when every route is unavailable the read-only text area opens with the Markdown", async ({ page }) => {
		await openFinishedThread(page, 1440, "light");
		await page.evaluate(() => {
			Object.defineProperty(URL, "createObjectURL", { configurable: true, value: undefined });
		});
		await page.getByRole("button", { name: "Export", exact: true }).click();
		await page.getByRole("menuitem", { name: C.saveFile }).click();
		const dialog = page.getByRole("dialog", { name: C.fallbackTitle });
		await expect(dialog).toBeVisible();
		const area = dialog.getByRole("textbox", { name: C.fallbackTextLabel });
		await expect(area).toHaveAttribute("readonly", "");
		await expect(area).toHaveValue(new RegExp(ANSWER.replace(/\./g, "\\.")));
		await area.focus();
		const selected = await area.evaluate((el: HTMLTextAreaElement) => el.value.slice(el.selectionStart, el.selectionEnd).length);
		expect(selected).toBeGreaterThan(100);
		await page.keyboard.press("Escape");
		await expect(dialog).toHaveCount(0);
	});

	test("a refused clipboard write shows the failure status and the fallback text", async ({ page }) => {
		await openFinishedThread(page, 1440, "light");
		await page.evaluate(() => {
			navigator.clipboard.writeText = () => Promise.reject(new Error("denied by test"));
		});
		await page.getByRole("button", { name: "Export", exact: true }).click();
		await page.getByRole("menuitem", { name: C.copyMarkdown }).click();
		await expect(page.getByText(C.copyFailedStatus)).toBeVisible();
		await expect(page.getByRole("dialog", { name: C.fallbackTitle })).toBeVisible();
	});

	test("with no complete message the actions are disabled and the reason is visible text", async ({ page }) => {
		await seedTheme(page, "light");
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
		await waitForAppReady(page);
		await page.getByRole("button", { name: "Export", exact: true }).click();
		await expect(page.getByText(C.disabledEmpty)).toBeVisible();
		await expect(page.getByRole("menuitem", { name: C.saveFile })).toHaveAttribute("data-disabled", "");
		await expect(page.getByRole("menuitem", { name: C.copyMarkdown })).toHaveAttribute("data-disabled", "");
	});

	test("keyboard: Enter opens, arrows move, Escape closes and returns focus to Export", async ({ page }) => {
		await openFinishedThread(page, 1440, "light");
		const trigger = page.getByRole("button", { name: "Export", exact: true });
		await trigger.focus();
		await page.keyboard.press("Enter");
		const save = page.getByRole("menuitem", { name: C.saveFile });
		await expect(save).toBeVisible();
		// Opened from the keyboard, the menu puts focus on its first item.
		await expect(save).toBeFocused();
		await page.keyboard.press("ArrowDown");
		await expect(page.getByRole("menuitem", { name: C.copyMarkdown })).toBeFocused();
		await page.keyboard.press("Escape");
		await expect(save).toHaveCount(0);
		await expect(trigger).toBeFocused();
	});

	for (const theme of THEMES) {
		test(`axe finds no WCAG 2.x A/AA violation in the open menu (${theme})`, async ({ page }) => {
			await openFinishedThread(page, 1440, theme);
			await page.getByRole("button", { name: "Export", exact: true }).click();
			await expect(page.getByText(C.privacyLine)).toBeVisible();
			const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
			// A logotype has no contrast requirement (WCAG 1.4.3): leave the wordmark out of color-contrast only.
			const violations = [];
			for (const violation of results.violations) {
				if (violation.id !== "color-contrast") {
					violations.push(violation);
					continue;
				}
				const inLogotype = await page.evaluate(
					(selectors) => selectors.map((s) => document.querySelector(s)?.closest("[data-slot='knowme-wordmark']") != null),
					violation.nodes.map((n) => String(n.target[0])),
				);
				const nodes = violation.nodes.filter((_, i) => !inLogotype[i]);
				if (nodes.length > 0) violations.push({ ...violation, nodes });
			}
			const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(" | ")}`);
			expect(summary, `axe violations with the menu open (${theme})`).toEqual([]);
		});
	}

	for (const width of [320, 1440]) {
		for (const theme of THEMES) {
			test(`captures: menu or sheet at ${width}px (${theme})`, async ({ page }) => {
				await openFinishedThread(page, width, theme);
				await page.getByRole("button", { name: "Export", exact: true }).click();
				await expect(page.getByText(C.privacyLine)).toBeVisible();
				await page.waitForTimeout(400);
				await capture(page, `export-${width}-${theme}`);
			});
		}
	}

	test("320px: the bottom sheet has 44px targets, a named dialog, and Escape closes it", async ({ page }) => {
		await openFinishedThread(page, 320, "light");
		const trigger = page.getByRole("button", { name: "Export", exact: true });
		const triggerBox = await trigger.boundingBox();
		expect(triggerBox?.width ?? 0).toBeGreaterThanOrEqual(44);
		expect(triggerBox?.height ?? 0).toBeGreaterThanOrEqual(44);
		await trigger.click();
		const dialog = page.getByRole("dialog", { name: C.menuTitle });
		await expect(dialog).toBeVisible();
		for (const name of [C.saveFile, C.copyMarkdown, C.closeLabel]) {
			const box = await dialog.getByRole("button", { name }).boundingBox();
			expect(box?.height ?? 0, `${name} height`).toBeGreaterThanOrEqual(44);
		}
		const sheet = await dialog.boundingBox();
		expect((sheet?.y ?? 0) + (sheet?.height ?? 0)).toBeGreaterThan(890);
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
		await page.keyboard.press("Escape");
		await expect(dialog).toHaveCount(0);
		await expect(trigger).toBeFocused();
	});
});

test.describe("export: tap path on WebKit (iPhone 14)", () => {
	test.skip(({ browserName }) => browserName !== "webkit", "WebKit only.");

	test("the bottom sheet opens and a tap on Save hands over a file with no request", async ({ page, context }) => {
		await openFinishedThread(page, 390, "light");
		const recorder = recordRequests(context);
		await page.getByRole("button", { name: "Export", exact: true }).tap();
		const dialog = page.getByRole("dialog", { name: C.menuTitle });
		await expect(dialog).toBeVisible();
		await expect(dialog.getByText(C.privacyLine)).toBeVisible();
		const downloadPromise = page.waitForEvent("download", { timeout: 8_000 }).catch(() => null);
		await dialog.getByRole("button", { name: C.saveFile }).tap();
		const download = await downloadPromise;
		// Playwright's WebKit may offer no share sheet; either the download
		// event fires or the saved status shows. A fallback dialog is a failure.
		if (download) expect(download.suggestedFilename()).toMatch(/\.md$/);
		else await expect(page.getByText(C.savedStatus)).toBeVisible();
		await expect(page.getByRole("dialog", { name: C.fallbackTitle })).toHaveCount(0);
		recorder.stop();
		expect(recorder.requests).toEqual([]);
	});
});
