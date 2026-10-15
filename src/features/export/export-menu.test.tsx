import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { CHAT_EXPORT_CONTENT as C } from "../../../content/site/chat-export";
import { ExportMenu } from "./export-menu";
import { ask, reply } from "./test-fixtures";

const THREAD = "11111111-aaaa-4bbb-8ccc-222222222222";
const realMatchMedia = window.matchMedia;

function setViewportMobile(mobile: boolean): void {
	Object.defineProperty(window, "matchMedia", {
		writable: true,
		value: (query: string) => ({
			matches: mobile && query.includes("max-width"),
			media: query,
			onchange: null,
			addListener: () => {},
			removeListener: () => {},
			addEventListener: () => {},
			removeEventListener: () => {},
			dispatchEvent: () => {},
		}),
	});
}

function seedConversation(): void {
	useThreadRegistryStore.getState().registerThread(THREAD);
	act(() => {
		useChatMessageStore.getState().initThread(THREAD, [ask(), reply([{ type: "text", text: "1.99.0." }])]);
	});
}

beforeEach(() => {
	act(() => {
		useChatMessageStore.getState().clearThread(THREAD);
	});
});

afterEach(() => {
	window.matchMedia = realMatchMedia;
	vi.restoreAllMocks();
});

describe("ExportMenu states", () => {
	it("is ready: privacy line shown and both actions enabled", async () => {
		seedConversation();
		render(<ExportMenu threadId={THREAD} />);
		await userEvent.click(screen.getByRole("button", { name: C.menuLabel }));

		expect(await screen.findByText(C.privacyLine)).toBeVisible();
		expect(screen.getByRole("menuitem", { name: C.saveFile })).not.toHaveAttribute("data-disabled");
		expect(screen.getByRole("menuitem", { name: C.copyMarkdown })).not.toHaveAttribute("data-disabled");
		expect(screen.queryByText(C.disabledEmpty)).toBeNull();
		expect(screen.queryByText(C.disabledStreaming)).toBeNull();
	});

	it("nothing to export: actions disabled, reason is visible text", async () => {
		render(<ExportMenu threadId={THREAD} />);
		await userEvent.click(screen.getByRole("button", { name: C.menuLabel }));

		expect(await screen.findByText(C.disabledEmpty)).toBeVisible();
		expect(screen.getByRole("menuitem", { name: C.saveFile })).toHaveAttribute("data-disabled");
		expect(screen.getByRole("menuitem", { name: C.copyMarkdown })).toHaveAttribute("data-disabled");
	});

	it("reply streaming: actions disabled with the streaming reason", async () => {
		seedConversation();
		act(() => {
			useChatMessageStore.getState().beginStream(THREAD, "run-1");
		});
		render(<ExportMenu threadId={THREAD} />);
		await userEvent.click(screen.getByRole("button", { name: C.menuLabel }));

		expect(await screen.findByText(C.disabledStreaming)).toBeVisible();
		expect(screen.getByRole("menuitem", { name: C.saveFile })).toHaveAttribute("data-disabled");
	});

	it("Escape closes the menu and returns focus to the trigger", async () => {
		seedConversation();
		const user = userEvent.setup();
		render(<ExportMenu threadId={THREAD} />);
		const trigger = screen.getByRole("button", { name: C.menuLabel });
		await user.click(trigger);
		await screen.findByText(C.privacyLine);

		await user.keyboard("{Escape}");
		await vi.waitFor(() => expect(screen.queryByText(C.privacyLine)).toBeNull());
		expect(trigger).toHaveFocus();
	});

	it("below 768 px it opens a named bottom sheet with 44 px actions", async () => {
		setViewportMobile(true);
		seedConversation();
		render(<ExportMenu threadId={THREAD} />);
		await userEvent.click(screen.getByRole("button", { name: C.menuLabel }));

		expect(await screen.findByRole("dialog", { name: C.menuTitle })).toBeInTheDocument();
		expect(screen.getByText(C.privacyLine)).toBeVisible();
		const save = screen.getByRole("button", { name: C.saveFile });
		expect(save).toBeEnabled();
		expect(save.className).toContain("min-h-11");
		expect(screen.getByRole("button", { name: C.closeLabel }).className).toContain("size-11");
	});
});
