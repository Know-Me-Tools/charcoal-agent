import {
	AssistantRuntimeProvider,
	ThreadPrimitive,
	type ThreadMessageLike,
	useExternalStoreRuntime,
} from "@assistant-ui/react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UserMessage } from "./enhanced-thread";

vi.mock("@/features/artifacts/mermaid-block", () => ({ MermaidBlock: () => null }));
vi.mock("@/features/artifacts/shiki-code-block", () => ({ ShikiCodeBlock: () => null }));

// Markdown characters and several lines: the copy must be the raw text typed.
const TYPED = "**bold** and _italic_ with a [link](https://know-me.tools)\n\n- first\n- second\n\n> quoted";

const MESSAGES: ThreadMessageLike[] = [
	{ id: "u1", role: "user", content: [{ type: "text", text: TYPED }], attachments: [], metadata: { custom: {} } },
];

function Harness() {
	const runtime = useExternalStoreRuntime<ThreadMessageLike>({
		messages: MESSAGES,
		convertMessage: (message) => message,
		onNew: async () => {},
	});
	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<ThreadPrimitive.Messages>{() => <UserMessage />}</ThreadPrimitive.Messages>
		</AssistantRuntimeProvider>
	);
}

afterEach(() => {
	Object.defineProperty(navigator, "clipboard", { configurable: true, value: undefined });
});

describe("user message Copy", () => {
	it("copies exactly what the visitor typed, not the You: label", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
		render(<Harness />);

		const button = await screen.findByRole("button", { name: "Copy" });
		expect(button.tagName).toBe("BUTTON");
		await act(async () => {
			fireEvent.click(button);
		});

		expect(writeText).toHaveBeenCalledTimes(1);
		expect(writeText).toHaveBeenCalledWith(TYPED);
		expect(writeText.mock.calls[0][0]).not.toContain("You:");
		expect(screen.getAllByRole("status").some((s) => s.textContent === "Copied")).toBe(true);
	});

	it("keeps Edit beside Copy", async () => {
		render(<Harness />);
		await screen.findByRole("button", { name: "Copy" });
		expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
	});
});
