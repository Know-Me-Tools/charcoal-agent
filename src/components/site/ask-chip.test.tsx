import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithRouter } from "@/test/utils/start-chat-harness";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { AskChip } from "./ask-chip";

const PROMPT = "What is The Boss?";

afterEach(() => {
	useChatIntentStore.setState({ pendingPrompt: null });
	useThreadRegistryStore.setState({ threads: {}, hydrated: false });
});

describe("AskChip", () => {
	it("shows the whole question as its own name and starts a chat with it", () => {
		renderWithRouter(<AskChip prompt={PROMPT} />);
		const chip = screen.getByRole("button", { name: PROMPT });
		expect(chip.className).toContain("min-h-11");
		fireEvent.click(chip);
		expect(screen.getByTestId("path").textContent).toMatch(/^\/threads\//);
		expect(useChatIntentStore.getState().pendingPrompt).toBe(PROMPT);
	});

	it("in compact form shows the label and names the question, the label leading", () => {
		renderWithRouter(<AskChip prompt={PROMPT} label="Ask" />);
		const chip = screen.getByRole("button", { name: `Ask the concierge: ${PROMPT}` });
		expect(chip.textContent).toBe("Ask");
		fireEvent.click(chip);
		expect(useChatIntentStore.getState().pendingPrompt).toBe(PROMPT);
	});
});
