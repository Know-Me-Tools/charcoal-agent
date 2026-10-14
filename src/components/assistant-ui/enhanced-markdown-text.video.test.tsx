import {
	AssistantRuntimeProvider,
	MessagePrimitive,
	ThreadPrimitive,
	type ThreadMessageLike,
	useExternalStoreRuntime,
} from "@assistant-ui/react";
import { render, screen, waitFor } from "@testing-library/react";
import type { FC } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { describe, expect, it, vi } from "vitest";
import { EnhancedMarkdownText } from "./enhanced-markdown-text";
import { MarkdownVideo } from "./markdown-block-copy";
import { MARKDOWN_REHYPE_PLUGINS_NO_MATH } from "./markdown-rehype-plugins";

vi.mock("@/features/artifacts/mermaid-block", () => ({ MermaidBlock: () => null }));
vi.mock("@/features/artifacts/shiki-code-block", () => ({ ShikiCodeBlock: () => null }));

/**
 * app-block-copy-and-media-blocks 3.5: own-host video only. Drives the exact
 * rehype chain the chat renders with (not a copy), as the other policy
 * suites do. Every blocking rule has a test that fails when the rule is
 * removed (mutation-checked, see the task report).
 */
const OWN = "https://know-me.tools/media/tour.mp4";
const EVIL = "https://evil.example/tour.mp4";

function render0(markdown: string, withComponent = false): string {
	return renderToStaticMarkup(
		<ReactMarkdown
			remarkPlugins={[remarkGfm]}
			rehypePlugins={MARKDOWN_REHYPE_PLUGINS_NO_MATH}
			components={withComponent ? { video: MarkdownVideo } : undefined}
		>
			{markdown}
		</ReactMarkdown>,
	);
}

describe("video policy: what is allowed", () => {
	it("renders an own-host video with controls and preload none", () => {
		const html = render0(`<video controls><source src="${OWN}" type="video/mp4"></video>`);
		expect(html).toContain("<video");
		expect(html).toContain("controls");
		expect(html).toContain('preload="none"');
		expect(html).toContain(`<source src="${OWN}" type="video/mp4"/>`);
	});

	it("renders a same-origin path and a webm source", () => {
		const html = render0('<video><source src="/media/a.webm" type="video/webm"></video>');
		expect(html).toContain('src="/media/a.webm"');
		expect(html).toContain('preload="none"');
	});

	it("keeps digit width/height and an own-host poster", () => {
		const html = render0(
			`<video width="640" height="360" poster="https://know-me.tools/p.png"><source src="${OWN}" type="video/mp4"></video>`,
		);
		expect(html).toContain('width="640"');
		expect(html).toContain('height="360"');
		expect(html).toContain('poster="https://know-me.tools/p.png"');
	});

	it("gives the video a Copy video link button that copies the source URL", () => {
		const html = render0(`<video><source src="${OWN}" type="video/mp4"></video>`, true);
		expect(html).toContain("Copy video link");
	});
});

describe("video policy: what is stripped or neutralised", () => {
	it("renders no video for a remote source and shows its destination as text", () => {
		const html = render0(`<video controls><source src="${EVIL}" type="video/mp4"></video>`);
		expect(html).not.toContain("<video");
		expect(html).not.toContain("<source");
		expect(html).toContain(EVIL);
	});

	it("renders no video for a remote src on the video element", () => {
		const html = render0(`<video src="${EVIL}" controls></video>`);
		expect(html).not.toContain("<video");
		expect(html).toContain(EVIL);
	});

	it("blocks a video that mixes an own-host and a remote source", () => {
		const html = render0(
			`<video><source src="${OWN}" type="video/mp4"><source src="${EVIL}" type="video/webm"></video>`,
		);
		expect(html).not.toContain("<video");
		expect(html).not.toContain("<source");
	});

	it("rejects a subdomain, a lookalike host and plain http", () => {
		for (const src of [
			"https://cdn.know-me.tools/a.mp4",
			"https://know-me.tools.evil.example/a.mp4",
			"http://know-me.tools/a.mp4",
			"//evil.example/a.mp4",
		]) {
			const html = render0(`<video><source src="${src}" type="video/mp4"></video>`);
			expect(html, src).not.toContain("<video");
			expect(html, src).not.toContain("<source");
		}
	});

	it("drops a javascript: and a data: source", () => {
		for (const src of ["javascript:alert(1)", "data:video/mp4;base64,AAAA"]) {
			const html = render0(`<video><source src="${src}" type="video/mp4"></video>`);
			expect(html, src).not.toContain("<video");
			expect(html, src).not.toContain("javascript:");
			expect(html, src).not.toContain("data:");
		}
	});

	it("strips autoplay, loop, muted, ping, playsinline and event handlers", () => {
		const html = render0(
			`<video autoplay loop muted playsinline ping="https://evil.example/p" onplay="alert(1)" class="x" style="a:b" controls><source src="${OWN}" type="video/mp4"></video>`,
		);
		expect(html).toContain("<video");
		for (const banned of ["autoplay", "autoPlay", "loop", "muted", "playsinline", "playsInline", "ping", "onplay", "class=", "style="]) {
			expect(html, banned).not.toContain(banned);
		}
	});

	it("forces preload none whatever the model asked for", () => {
		const html = render0(`<video preload="auto"><source src="${OWN}" type="video/mp4"></video>`);
		expect(html).toContain('preload="none"');
		expect(html).not.toContain('preload="auto"');
	});

	it("drops a source with a type other than mp4 or webm", () => {
		const html = render0(
			`<video><source src="${OWN}" type="video/x-matroska"><source src="${OWN}"></video>`,
		);
		expect(html).not.toContain("<video");
		expect(html).not.toContain("<source");
	});

	it("drops a remote poster but keeps the video", () => {
		const html = render0(
			`<video poster="${EVIL}"><source src="${OWN}" type="video/mp4"></video>`,
		);
		expect(html).toContain("<video");
		expect(html).not.toContain("poster");
		expect(html).not.toContain(EVIL);
	});

	it("keeps iframe, embed, object and audio stripped", () => {
		const html = render0(
			`<iframe src="${OWN}"></iframe><embed src="${OWN}"><object data="${OWN}"></object><audio controls src="${OWN}"></audio><audio><source src="${OWN}" type="audio/mpeg"></audio>`,
		);
		for (const tag of ["<iframe", "<embed", "<object", "<audio"]) {
			expect(html, tag).not.toContain(tag);
		}
	});

	it("does not let a source outside a video carry a src", () => {
		const html = render0(`<picture><source src="${EVIL}" srcset="/a.png"><img src="/a.png" alt="a"></picture>`);
		expect(html).not.toContain(EVIL);
	});
});

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

const BODY = `<video autoplay><source src="${EVIL}" type="video/mp4"></video> <video autoplay loop><source src="${OWN}" type="video/mp4"></video>`;
const MESSAGES: ThreadMessageLike[] = [
	{ id: "u1", role: "user", content: [{ type: "text", text: BODY }], attachments: [], metadata: { custom: {} } },
	{ id: "a1", role: "assistant", content: [{ type: "text", text: BODY }], status: { type: "complete", reason: "stop" }, metadata: { custom: {} } },
];

describe.each(["user", "assistant"])("video policy in a %s message", (role) => {
	it("applies the same video rules", async () => {
		render(<Harness messages={MESSAGES} />);
		const message = await screen.findByTestId(`${role}-message`);
		await waitFor(() => expect(message.querySelector("video")).not.toBeNull());
		expect(message.querySelectorAll("video")).toHaveLength(1);
		const video = message.querySelector("video") as HTMLVideoElement;
		expect(video.getAttribute("preload")).toBe("none");
		expect(video.hasAttribute("autoplay")).toBe(false);
		expect(video.hasAttribute("loop")).toBe(false);
		expect(message.querySelector(`source[src="${EVIL}"]`)).toBeNull();
		expect(message).toHaveTextContent(EVIL);
		expect(screen.getAllByRole("button", { name: "Copy video link" }).length).toBeGreaterThan(0);
	});
});
