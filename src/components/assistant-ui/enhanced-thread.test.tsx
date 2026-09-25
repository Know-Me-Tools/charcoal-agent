import { render, screen } from "@testing-library/react";
import { type ReactElement, type ReactNode, cloneElement, isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

// The raw error text a UAR transport/runtime failure actually produces. The
// KnowMe brand standard (§7.3/§12) and docs/design/chat-surfaces.md (§3.8)
// require the assistant surface to never echo this back to the user — only a
// controlled, plain-language recovery message may reach the DOM.
const RAW_TECHNICAL_ERROR =
	"TypeError: Failed to fetch at https://uar.internal/api/chat/completion:42:17";

type AsChildProps = { asChild?: boolean; children?: ReactNode } & Record<string, unknown>;

const mergeAsChild = (children: ReactNode, props: Record<string, unknown>): ReactElement =>
	isValidElement(children) ? cloneElement(children, props) : <div {...props}>{children}</div>;

/**
 * `MessageError` composes three @assistant-ui/react primitives that normally
 * read live message/thread state from an AssistantRuntimeProvider. Rather
 * than standing up a full runtime, this suite stubs those three primitives
 * with faithful stand-ins for their documented contracts (verified against
 * @assistant-ui/react's own source in node_modules/@assistant-ui/react/src):
 *
 *   - MessagePrimitive.Error renders its children only in the error state
 *     (here always, since this suite only exercises the error state).
 *   - ErrorPrimitive.Message renders its children, falling back to
 *     `String(error)` only when no children are supplied — that fallback is
 *     exactly what used to leak the raw runtime error into the DOM.
 *   - ErrorPrimitive.Root / ActionBarPrimitive.Reload support `asChild`,
 *     merging onto their single child, matching real assistant-ui usage
 *     elsewhere in this file (e.g. the existing "Regenerate" button).
 *
 * Everything else MessageError renders (Alert, AlertDescription, icons,
 * Button) is the real production code — unmocked.
 */
vi.mock("@assistant-ui/react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@assistant-ui/react")>();

	return {
		...actual,
		MessagePrimitive: {
			...actual.MessagePrimitive,
			Error: ({ children }: { children?: ReactNode }) => <>{children}</>,
		},
		ErrorPrimitive: {
			Root: ({ asChild, children, ...props }: AsChildProps) =>
				asChild ? (
					mergeAsChild(children, { role: "alert", ...props })
				) : (
					<div role="alert" {...props}>
						{children}
					</div>
				),
			Message: ({ children, ...props }: { children?: ReactNode } & Record<string, unknown>) => (
				<span {...props}>{children ?? RAW_TECHNICAL_ERROR}</span>
			),
		},
		ActionBarPrimitive: {
			...actual.ActionBarPrimitive,
			Reload: ({ asChild, children, ...props }: AsChildProps) =>
				asChild ? (
					mergeAsChild(children, props)
				) : (
					<button type="button" {...props}>
						{children}
					</button>
				),
		},
	};
});

import { MessageError, MESSAGE_ERROR_TEXT } from "./enhanced-thread";

describe("MessageError", () => {
	it("never renders the raw runtime error text, only the plain-language recovery copy", () => {
		render(<MessageError />);

		expect(screen.queryByText(RAW_TECHNICAL_ERROR, { exact: false })).not.toBeInTheDocument();
		expect(document.body.textContent).not.toContain(RAW_TECHNICAL_ERROR);
		expect(screen.getByText(MESSAGE_ERROR_TEXT)).toBeInTheDocument();
	});

	it("keeps the error announced accessibly via role=alert", () => {
		render(<MessageError />);

		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent(MESSAGE_ERROR_TEXT);
	});

	it("offers a clear retry path", () => {
		render(<MessageError />);

		expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
	});
});
