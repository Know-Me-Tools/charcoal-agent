/**
 * Stream-time scroll behaviour (change app-mobile-stream-reliability-and-heat,
 * task 1.5). On iOS Safari a `scroll-smooth` viewport restarts its smooth
 * scroll animation on every auto-scroll during a streamed reply — one of the
 * per-token costs behind the heat/stuck-reply report. The viewport therefore
 * carries no `scroll-smooth` class (so automatic scrolling uses
 * `scroll-behavior: auto`), while the visitor's own scroll-to-bottom button
 * keeps a smooth animation by passing `behavior="smooth"` to
 * `ThreadPrimitive.ScrollToBottom`.
 *
 * jsdom cannot animate scrolling, so these assert the contract at the library
 * boundary, verified against @assistant-ui/react's own dist source:
 *
 *   - `ThreadPrimitive.Viewport` is the scrolling element and carries the
 *     classes we give it; the stand-in below is a plain div (`turnAnchor` is
 *     library-internal and is dropped, not forwarded to the DOM).
 *   - `ThreadPrimitive.ScrollToBottom` accepts `behavior?: ScrollBehavior`
 *     and on click calls
 *     `threadViewportStore.getState().scrollToBottom({ behavior })`
 *     (node_modules/@assistant-ui/react/dist/primitives/thread/ThreadScrollToBottom.js),
 *     so the stand-in forwards a click to a captured scrollToBottom spy with
 *     exactly the behaviour it was given.
 *
 * Everything else (`EnhancedThread`, `ThreadScrollToBottom`,
 * `TooltipIconButton`, the composer chrome) is the real production code.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { cloneElement, isValidElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Props = { children?: ReactNode } & Record<string, unknown>;

const captured = vi.hoisted(() => ({
	scrollToBottom: vi.fn(),
	scrollToBottomProps: [] as Array<Record<string, unknown>>,
}));

vi.mock("@assistant-ui/react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@assistant-ui/react")>();
	const passthrough = ({ children }: Props) => <>{children}</>;
	const box = ({ children, ...props }: Props) => <div {...props}>{children}</div>;
	const mergeAsChild = (children: ReactNode, props: Record<string, unknown>) =>
		isValidElement(children) ? cloneElement(children, props) : <div {...props}>{children}</div>;
	return {
		...actual,
		AuiIf: passthrough,
		useAuiState: (selector: (state: unknown) => unknown) =>
			selector({
				thread: { messages: [], isRunning: false, isEmpty: true },
				composer: { text: "" },
			}),
		useThreadViewportStore: () => ({
			getState: () => ({ scrollToBottom: captured.scrollToBottom }),
		}),
		ComposerPrimitive: {
			...actual.ComposerPrimitive,
			Root: ({ children, ...props }: Props) => <form {...props}>{children}</form>,
			AttachmentDropzone: box,
			Input: (props: Record<string, unknown>) => <textarea {...props} />,
			Send: passthrough,
			Cancel: passthrough,
		},
		ThreadPrimitive: {
			...actual.ThreadPrimitive,
			Root: box,
			Viewport: ({ children, turnAnchor: _turnAnchor, ...props }: Props) => (
				<div {...props}>{children}</div>
			),
			ViewportFooter: box,
			Messages: () => null,
			ScrollToBottom: ({ asChild, children, ...props }: Props & { asChild?: boolean }) => {
				captured.scrollToBottomProps.push(props);
				const onClick = () =>
					captured.scrollToBottom({
						behavior: (props as { behavior?: ScrollBehavior }).behavior,
					});
				return asChild ? (
					mergeAsChild(children, { onClick })
				) : (
					<button type="button" onClick={onClick}>
						{children}
					</button>
				);
			},
		},
	};
});
vi.mock("@/components/assistant-ui/attachment", () => ({
	ComposerAttachments: () => null,
	ComposerAddAttachment: () => null,
	UserMessageAttachments: () => null,
}));

import { EnhancedThread } from "./enhanced-thread";

const SITE_AGENT = "knowme-site";

beforeEach(() => {
	captured.scrollToBottom.mockClear();
	captured.scrollToBottomProps.length = 0;
});
afterEach(() => {
	vi.unstubAllEnvs();
});

describe("thread viewport scroll behaviour (task 1.5)", () => {
	it("site build: the viewport has no scroll-smooth class", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		const { container } = render(<EnhancedThread />);
		const viewport = container.querySelector(".aui-thread-viewport");
		expect(viewport).not.toBeNull();
		expect(viewport?.className).not.toMatch(/(^|\s)scroll-smooth(\s|$)/);
	});

	it("app build: the viewport has no scroll-smooth class", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", "");
		const { container } = render(<EnhancedThread />);
		const viewport = container.querySelector(".aui-thread-viewport");
		expect(viewport).not.toBeNull();
		expect(viewport?.className).not.toMatch(/(^|\s)scroll-smooth(\s|$)/);
	});

	it("the visitor's scroll-to-bottom still requests smooth behaviour", () => {
		vi.stubEnv("VITE_SITE_AGENT_ID", SITE_AGENT);
		render(<EnhancedThread />);
		expect(captured.scrollToBottomProps.at(-1)).toMatchObject({ behavior: "smooth" });
		fireEvent.click(screen.getByRole("button", { name: "Scroll to bottom" }));
		expect(captured.scrollToBottom).toHaveBeenCalledWith({ behavior: "smooth" });
	});
});
