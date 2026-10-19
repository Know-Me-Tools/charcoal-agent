/**
 * Integration gate for task 1.4 of `app-export-omission-note`: a saved chat that
 * lost a card or a remote image ends with the omission line, and a chat that
 * lost nothing does not. The wording is read from the strings file, not typed here.
 *
 * Two routes into the same export:
 *  - "streamed": a real AG-UI stream puts a confirm card in the open chat. Runs
 *    against any server, including the built site bundle served by `vite preview`.
 *  - "stored": the stream never produces image blocks, so a thread with a form
 *    card and a remote image is written into the app's own PGlite database
 *    through the module the app uses, then opened. This needs the Vite dev
 *    server (it imports /src), so it is skipped when E2E_BUILT=1.
 *
 *   VITE_SITE_AGENT_ID=knowme-site npx playwright test e2e/chat-export-omission.spec.ts --project=chromium --workers=1
 *   E2E_BUILT=1 (against a built bundle; see the evidence file for the config used)
 */
import fs from "node:fs";
import type { Page } from "@playwright/test";
import { expect, test } from "./support/test";
import { FIXTURE_THREAD_ID, waitForAppReady } from "./support/routes";
import { TITLE_RESPONSE, toSseBody, type SseEvent } from "./fixtures/sse";
import { CHAT_EXPORT_CONTENT as C } from "../content/site/chat-export";
import { OKF_STRINGS, omissionLine } from "../src/features/export/okf-strings";

const rid = "req-omission-e2e";
const QUESTION = "Plan my week.";
const ANSWER = "Here is a plan for the week.";
const CARD_CANARY = "CARD-CANARY-ADD-THURSDAY-REVIEW";
const IMAGE_HOST_CANARY = "tracker.canary-images.example";
const LINE_CARDS = omissionLine({ cards: true, images: false });
const LINE_BOTH = omissionLine({ cards: true, images: true });

const PLAIN_EVENTS: SseEvent[] = [
	{ event: "agui.stream.start", data: { kind: "stream", phase: "start", request_id: rid } },
	{ event: "agui.message.delta", data: { kind: "message", phase: "delta", request_id: rid, delta: { text: ANSWER } } },
	{ event: "agui.done", data: { kind: "done", request_id: rid } },
];
const CARD_EVENTS: SseEvent[] = [
	PLAIN_EVENTS[0],
	PLAIN_EVENTS[1],
	{
		event: "agui.artifact_input_request",
		data: {
			kind: "artifact_input_request",
			request_id: rid,
			artifact_id: "art-confirm",
			artifact_type: "confirm",
			title: CARD_CANARY,
			content: JSON.stringify({ message: CARD_CANARY, accept_label: "Add", cancel_label: "Skip" }),
		},
	},
	PLAIN_EVENTS[2],
];

async function streamChat(page: Page, events: SseEvent[]): Promise<void> {
	await page.addInitScript(() => {
		const original = window.setInterval.bind(window);
		window.setInterval = ((handler: TimerHandler, ms?: number, ...args: unknown[]) =>
			ms === 30_000 ? 0 : original(handler, ms, ...args)) as typeof window.setInterval;
	});
	await page.setViewportSize({ width: 1440, height: 900 });
	await page.route("**/api/chat/completion", async (route) => {
		const body = route.request().postDataJSON() as { stream?: boolean } | null;
		if (body?.stream === false) {
			return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(TITLE_RESPONSE) });
		}
		return route.fulfill({ status: 200, contentType: "text/event-stream", body: toSseBody(events) });
	});
	await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
	await waitForAppReady(page);
	const composer = page.getByLabel("Message input").filter({ visible: true });
	await expect(composer).toBeVisible();
	await composer.fill(QUESTION);
	await composer.press("Enter");
	await expect(page.getByText(ANSWER).first()).toBeAttached();
	await expect(page.getByRole("button", { name: /^Stop/ })).toHaveCount(0);
	await expect(page.getByRole("button", { name: "Export", exact: true })).toBeVisible();
}

/** Saves the open chat through the Export menu and returns the file text. */
async function saveOpenChat(page: Page): Promise<string> {
	// Desktop Safari accepts a file in navigator.canShare, so Save would open the
	// native share sheet and never fire a download. Report no file sharing so every
	// engine takes the same anchor-download route this spec reads the file from.
	await page.evaluate(() => Object.defineProperty(navigator, "canShare", { configurable: true, value: () => false }));
	const downloadPromise = page.waitForEvent("download");
	await page.getByRole("button", { name: "Export", exact: true }).click();
	await page.getByRole("menuitem", { name: C.saveFile }).click();
	const download = await downloadPromise;
	return fs.readFileSync((await download.path()) ?? "", "utf8");
}

test.describe("export: omission line (streamed chat)", () => {
	test("a chat with a confirm card ends with the omission line and carries none of the card", async ({ page }) => {
		await streamChat(page, CARD_EVENTS);
		const text = await saveOpenChat(page);
		console.log(`GATE_FILE_CARD_BEGIN\n${text}GATE_FILE_CARD_END`);
		expect(text).toContain(ANSWER);
		expect(text.trimEnd().endsWith(LINE_CARDS)).toBe(true);
		expect(text.match(new RegExp(OKF_STRINGS.omittedCards, "g"))).toHaveLength(1);
		expect(text).not.toContain(CARD_CANARY);
	});

	test("a plain chat has no omission line", async ({ page }) => {
		await streamChat(page, PLAIN_EVENTS);
		const text = await saveOpenChat(page);
		console.log(`GATE_FILE_PLAIN_BEGIN\n${text}GATE_FILE_PLAIN_END`);
		expect(text).toContain(ANSWER);
		expect(text).not.toContain("Left out of this file");
	});
});

test.describe("export: omission line (stored chat with a form card and a remote image)", () => {
	test.skip(() => process.env.E2E_BUILT === "1", "Needs the dev server to write the stored thread.");

	test("ends with one line naming both kinds and carries neither the card nor the image url", async ({ page }) => {
		await page.setViewportSize({ width: 1440, height: 900 });
		await page.goto(`/threads/${FIXTURE_THREAD_ID}`);
		await waitForAppReady(page);
		const threadId = await page.evaluate(
			async ({ answer, question, cardCanary, imageHost }) => {
				// A variable specifier keeps tsc from resolving the dev-server path; the browser imports it natively.
				const dbModule = "/src/lib/db/pglite.ts";
				const { getDbInstance } = (await import(/* @vite-ignore */ dbModule)) as {
					getDbInstance: () => { upsertThread(t: object): Promise<void>; insertMessage(id: string, m: object): Promise<void> };
				};
				const db = getDbInstance();
				const id = crypto.randomUUID();
				const at = new Date("2026-10-14T12:00:00Z");
				await db.upsertThread({ id, sessionId: id, title: "Stored omission chat", isEphemeral: false, createdAt: at.toISOString(), updatedAt: at.toISOString() });
				await db.insertMessage(id, {
					id: crypto.randomUUID(),
					role: "user",
					content: [{ type: "text", text: question }],
					createdAt: at,
					status: "complete",
				});
				await db.insertMessage(id, {
					id: crypto.randomUUID(),
					role: "assistant",
					content: [
						{ type: "text", text: answer },
						{ type: "artifact", artifactId: "art-form-0001", artifactType: "form", title: cardCanary, content: JSON.stringify({ message: cardCanary }), isInputRequest: true },
						{ type: "image", url: `https://${imageHost}/pixel.png`, alt: "IMG-ALT-CANARY" },
					],
					createdAt: new Date(at.getTime() + 1000),
					status: "complete",
				});
				return id;
			},
			{ answer: ANSWER, question: QUESTION, cardCanary: CARD_CANARY, imageHost: IMAGE_HOST_CANARY },
		);
		await page.goto(`/threads/${threadId}`);
		await waitForAppReady(page);
		await expect(page.getByText(ANSWER).first()).toBeAttached();
		const text = await saveOpenChat(page);
		console.log(`GATE_FILE_STORED_BEGIN\n${text}GATE_FILE_STORED_END`);
		expect(text.trimEnd().endsWith(LINE_BOTH)).toBe(true);
		expect(text.match(/Left out of this file/g)).toHaveLength(1);
		expect(text).not.toContain(CARD_CANARY);
		expect(text).not.toContain(IMAGE_HOST_CANARY);
		expect(text).not.toContain("IMG-ALT-CANARY");
	});
});
