import {
	AssistantRuntimeProvider,
	MessagePrimitive,
	ThreadPrimitive,
	type ThreadMessageLike,
	useExternalStoreRuntime,
} from "@assistant-ui/react";
import { render, screen, waitFor } from "@testing-library/react";
import type { FC } from "react";
import { describe, expect, it, vi } from "vitest";
import { EnhancedMarkdownText } from "./enhanced-markdown-text";

vi.mock("@/features/artifacts/mermaid-block", () => ({ MermaidBlock: () => null }));
vi.mock("@/features/artifacts/shiki-code-block", () => ({ ShikiCodeBlock: () => null }));

/**
 * site-reply-content-hardening 3.1 (d): the visitor's own messages obey the
 * same link and image rules as the agent's replies. `enhanced-thread.tsx`
 * renders both roles' text parts with `EnhancedMarkdownText`; this suite
 * renders the real component (not a copy of its plugin chain) inside a real
 * external-store runtime, once per role.
 */
const BODY =
	"![x](https://evil.example/p.png) [label](https://evil.example/x) [ok](https://know-me.tools/a)";

const TextParts: FC<{ role: string }> = ({ role }) => (
	<MessagePrimitive.Root data-testid={`${role}-message`}>
		<MessagePrimitive.Parts>
			{({ part }) => (part.type === "text" ? <EnhancedMarkdownText /> : null)}
		</MessagePrimitive.Parts>
	</MessagePrimitive.Root>
);

function Harness({ messages }: { messages: ThreadMessageLike[] }) {
	const runtime = useExternalStoreRuntime<ThreadMessageLike>({
		messages,
		convertMessage: (message) => message,
		onNew: async () => {},
	});
	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<ThreadPrimitive.Messages>
				{({ message }) => <TextParts role={message.role} />}
			</ThreadPrimitive.Messages>
		</AssistantRuntimeProvider>
	);
}

const MESSAGES: ThreadMessageLike[] = [
	{
		id: "u1",
		role: "user",
		content: [{ type: "text", text: BODY }],
		attachments: [],
		metadata: { custom: {} },
	},
	{
		id: "a1",
		role: "assistant",
		content: [{ type: "text", text: BODY }],
		status: { type: "complete", reason: "stop" },
		metadata: { custom: {} },
	},
];

describe.each(["user", "assistant"])("EnhancedMarkdownText in a %s message", (role) => {
	it("applies the reply image and link policy", async () => {
		render(<Harness messages={MESSAGES} />);

		const message = await screen.findByTestId(`${role}-message`);
		await waitFor(() => expect(message).toHaveTextContent("label (https://evil.example/x)"));

		expect(message.querySelector("img")).toBeNull();
		expect(message.querySelector('a[href^="https://evil.example"]')).toBeNull();
		const allowed = message.querySelector('a[href="https://know-me.tools/a"]');
		expect(allowed).not.toBeNull();
		expect(allowed).toHaveAttribute("rel", "noopener noreferrer");
		expect(allowed).toHaveAttribute("target", "_blank");
	});
});
