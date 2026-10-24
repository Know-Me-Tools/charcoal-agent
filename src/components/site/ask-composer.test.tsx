import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithRouter } from "@/test/utils/start-chat-harness";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { ASK_CONCIERGE_CONTENT } from "../../../content/site/ask-concierge";
import { AskComposer } from "./ask-composer";

// Focusing a composer prefetches the thread route chunks; not under test here.
vi.mock("@/lib/route-chunks", () => ({ prefetchThreadRoutes: vi.fn() }));

const PLACEHOLDER = "Ask about The Boss";

afterEach(() => {
	useChatIntentStore.setState({ pendingPrompt: null });
	useThreadRegistryStore.setState({ threads: {}, hydrated: false });
});

describe("AskComposer", () => {
	it("submits the typed text as the first message of a new thread", () => {
		renderWithRouter(<AskComposer placeholder={PLACEHOLDER} />);
		const field = screen.getByRole("textbox", { name: PLACEHOLDER });
		fireEvent.change(field, { target: { value: " How is it priced? " } });
		fireEvent.click(screen.getByRole("button", { name: ASK_CONCIERGE_CONTENT.composerSubmitLabel }));
		expect(screen.getByTestId("path").textContent).toMatch(/^\/threads\//);
		expect(useChatIntentStore.getState().pendingPrompt).toBe("How is it priced?");
	});

	it("starts nothing on an empty submit and returns focus to the field", () => {
		renderWithRouter(<AskComposer placeholder={PLACEHOLDER} />);
		const field = screen.getByRole("textbox", { name: PLACEHOLDER });
		fireEvent.click(screen.getByRole("button", { name: ASK_CONCIERGE_CONTENT.composerSubmitLabel }));
		expect(screen.getByTestId("path").textContent).toBe("/");
		expect(document.activeElement).toBe(field);
	});

	it("uses an explicit accessible name when given, and has 44px targets", () => {
		renderWithRouter(<AskComposer placeholder={PLACEHOLDER} label="Question for the concierge" />);
		const field = screen.getByRole("textbox", { name: "Question for the concierge" });
		expect(field.className).toContain("h-11");
		expect(screen.getByRole("button", { name: ASK_CONCIERGE_CONTENT.composerSubmitLabel }).className).toContain("h-11");
	});
});
