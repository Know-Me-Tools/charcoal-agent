import {
	AssistantRuntimeProvider,
	MessagePrimitive,
	ThreadPrimitive,
	type ThreadMessageLike,
	useExternalStoreRuntime,
} from "@assistant-ui/react";
import { render, screen, waitFor } from "@testing-library/react";
import { Profiler, type FC } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnhancedMarkdownText } from "./enhanced-markdown-text";

/**
 * Task 1.4 (b) and (c): while a reply streams, a fenced code or Mermaid
 * block whose closing fence has not arrived yet renders as plain
 * preformatted text and never reaches Shiki or Mermaid; the moment the
 * closing fence arrives it renders normally; and an unterminated fence at
 * the end of the stream still renders fully. The harness renders the real
 * `EnhancedMarkdownText` (throttle, fence gating, component routing and all)
 * inside a real external-store runtime, with only the two expensive leaf
 * renderers mocked.
 */
const mocks = vi.hoisted(() => ({
	shiki: vi.fn(),
	mermaid: vi.fn(),
}));

vi.mock("@/features/artifacts/shiki-code-block", () => ({
	ShikiCodeBlock: (props: { code: string; language?: string }) => {
		mocks.shiki(props);
		return (
			<div data-testid="shiki-code-block" data-language={props.language}>
				{props.code}
			</div>
		);
	},
}));
vi.mock("@/features/artifacts/mermaid-block", () => ({
	MermaidBlock: (props: { source: string }) => {
		mocks.mermaid(props);
		return <div data-testid="mermaid-block">{props.source}</div>;
	},
}));

type StreamStatus = "running" | "complete";

function message(text: string, status: StreamStatus): ThreadMessageLike {
	return {
		id: "a1",
		role: "assistant",
		content: [{ type: "text", text }],
		status: status === "running" ? { type: "running" } : { type: "complete", reason: "stop" },
		attachments: [],
		metadata: { custom: {} },
	};
}

const Parts: FC = () => (
	<MessagePrimitive.Root>
		<MessagePrimitive.Parts>
			{({ part }) => (part.type === "text" ? <EnhancedMarkdownText /> : null)}
		</MessagePrimitive.Parts>
	</MessagePrimitive.Root>
);

function Harness({ text, status }: { text: string; status: StreamStatus }) {
	const runtime = useExternalStoreRuntime<ThreadMessageLike>({
		messages: [message(text, status)],
		convertMessage: (m) => m,
		onNew: async () => {},
	});
	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<ThreadPrimitive.Messages>{() => <Parts />}</ThreadPrimitive.Messages>
		</AssistantRuntimeProvider>
	);
}

beforeEach(() => {
	mocks.shiki.mockClear();
	mocks.mermaid.mockClear();
});

describe("EnhancedMarkdownText — streaming fence gating", () => {
	it("renders an open code fence as plain preformatted text without calling Shiki", async () => {
		render(<Harness text={"Here is code:\n\n```ts\nconst x = 1;\n"} status="running" />);

		// The code is visible as plain text while the fence is open.
		const plain = await screen.findByText(/const x = 1;/);
		expect(plain.closest("pre")).not.toBeNull();

		expect(mocks.shiki).not.toHaveBeenCalled();
		expect(mocks.mermaid).not.toHaveBeenCalled();
		expect(screen.queryByTestId("shiki-code-block")).toBeNull();
	});

	it("renders an open Mermaid fence as plain preformatted text without calling Mermaid", async () => {
		render(<Harness text={"Diagram:\n\n```mermaid\ngraph LR\n  A --> B\n"} status="running" />);

		await screen.findByText(/A --> B/);

		expect(mocks.mermaid).not.toHaveBeenCalled();
		expect(mocks.shiki).not.toHaveBeenCalled();
		expect(screen.queryByTestId("mermaid-block")).toBeNull();
	});

	it("calls Shiki once the closing fence arrives, with the complete code", async () => {
		const open = "Here is code:\n\n```ts\nconst x = 1;\n";
		const { rerender } = render(<Harness text={open} status="running" />);
		await screen.findByText(/const x = 1;/);
		expect(mocks.shiki).not.toHaveBeenCalled();

		rerender(<Harness text={`${open}\`\`\`\n`} status="running" />);

		await waitFor(() => expect(mocks.shiki).toHaveBeenCalled());
		expect(screen.getByTestId("shiki-code-block")).toHaveAttribute("data-language", "ts");
		// Shiki only ever saw the complete block, never a partial stream.
		for (const call of mocks.shiki.mock.calls) {
			expect(call[0].code).toContain("const x = 1;");
		}
	});

	it("calls Mermaid once the closing fence of a diagram arrives", async () => {
		const open = "Diagram:\n\n```mermaid\ngraph LR\n  A --> B\n";
		const { rerender } = render(<Harness text={open} status="running" />);
		await screen.findByText(/A --> B/);
		expect(mocks.mermaid).not.toHaveBeenCalled();

		rerender(<Harness text={`${open}\`\`\`\n`} status="running" />);

		await waitFor(() => expect(mocks.mermaid).toHaveBeenCalled());
		for (const call of mocks.mermaid.mock.calls) {
			expect(call[0].source).toContain("A --> B");
		}
	});

	it("keeps highlighting earlier closed fences while a later fence is still open", async () => {
		const text = "```ts\nconst done = 1;\n```\n\ntext\n\n```python\npartial = ";
		render(<Harness text={text} status="running" />);

		await waitFor(() => expect(mocks.shiki).toHaveBeenCalled());
		// Only the closed block reached Shiki; the open one did not.
		for (const call of mocks.shiki.mock.calls) {
			expect(call[0].code).toContain("const done = 1;");
		}
		expect(screen.getAllByTestId("shiki-code-block")).toHaveLength(1);
	});

	it("renders an unterminated fence fully once the stream ends", async () => {
		render(<Harness text={"Here is code:\n\n```ts\nconst x = 1;\n"} status="complete" />);

		await waitFor(() => expect(mocks.shiki).toHaveBeenCalled());
		expect(screen.getByTestId("shiki-code-block")).toHaveAttribute("data-language", "ts");
	});

	it("renders an unterminated Mermaid fence as a diagram once the stream ends", async () => {
		render(<Harness text={"Diagram:\n\n```mermaid\ngraph LR\n  A --> B\n"} status="complete" />);

		await waitFor(() => expect(mocks.mermaid).toHaveBeenCalled());
	});
});

/**
 * Task 1.10: smoothing is off for good (`smooth={false}`), so the moment a
 * stream ends there is no off-to-on flip. With the old conditional
 * (`smooth={!isStreaming}`) the flip re-entered `useSmooth` with an empty
 * reveal buffer; when assistant-ui's render-phase resync did not fire (it
 * only fires on a part identity change or a text discontinuity, and the
 * empty buffer is a prefix of any text), the first commit after the flip
 * painted an empty container — a one-frame empty reply. The Profiler below
 * reads the committed DOM inside `onRender`, which runs in the commit phase
 * after DOM mutations but before the passive-effect flush that would paper
 * over the empty commit, so the frame is observable here.
 */
function ProbeHarness({
	text,
	status,
	onCommit,
}: {
	text: string;
	status: StreamStatus;
	onCommit: (committedText: string) => void;
}) {
	const runtime = useExternalStoreRuntime<ThreadMessageLike>({
		messages: [message(text, status)],
		convertMessage: (m) => m,
		onNew: async () => {},
	});
	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<Profiler
				id="markdown-commit-probe"
				onRender={() => {
					onCommit(document.querySelector(".aui-md")?.textContent ?? "");
				}}
			>
				<ThreadPrimitive.Messages>{() => <Parts />}</ThreadPrimitive.Messages>
			</Profiler>
		</AssistantRuntimeProvider>
	);
}

describe("EnhancedMarkdownText — no empty frame at stream end", () => {
	it("never re-renders an empty text container once text has appeared, and commits the full text at completion", async () => {
		const first = "The first half of the reply.";
		const tail = "And the rest, delivered at completion.";
		const full = `${first}\n\n${tail}`;

		const commits: string[] = [];
		const record = (t: string) => {
			commits.push(t);
		};
		const { rerender } = render(
			<ProbeHarness text={first} status="running" onCommit={record} />,
		);

		await screen.findByText(/The first half of the reply/);

		// From the first commit that showed real text, no later commit may be
		// empty.
		const firstNonEmpty = commits.findIndex((t) => t.trim().length > 0);
		expect(firstNonEmpty).toBeGreaterThanOrEqual(0);
		for (const committedText of commits.slice(firstNonEmpty)) {
			expect(committedText.trim().length).toBeGreaterThan(0);
		}

		// The stream ends: the status flips running -> complete with the full
		// text. This is where a conditional `smooth` prop would flip off-to-on.
		commits.length = 0;
		rerender(<ProbeHarness text={full} status="complete" onCommit={record} />);

		await screen.findByText(/delivered at completion/);

		// No commit during the flip may be empty (the one-frame empty reply),
		// and the last commit carries the complete text.
		for (const committedText of commits) {
			expect(committedText.trim().length).toBeGreaterThan(0);
		}
		const finalText = commits.at(-1) ?? "";
		expect(finalText).toContain(first);
		expect(finalText).toContain(tail);
		expect(document.querySelector(".aui-md")).toHaveAttribute("data-status", "complete");
	});
});
