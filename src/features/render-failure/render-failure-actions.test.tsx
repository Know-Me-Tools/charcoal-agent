import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MermaidBlock } from "@/features/artifacts/mermaid-block";
import { RenderGuard } from "@/features/artifacts/render-guard";
import { BLOCK_COPY_CONTENT } from "../../../content/site/block-copy";
import { fenceIndexOf, RenderBlockContext, type RenderBlockContextValue } from "./block-context";
import { buildFixTurnText } from "./fix-turn";
import { getRenderFailure, resetRenderFailures } from "./registry";

const mermaidParse = vi.fn();
vi.mock("mermaid", () => ({
	default: { parse: (...a: unknown[]) => mermaidParse(...a), initialize: vi.fn(), render: vi.fn() },
}));
vi.mock("@/features/artifacts/shiki-code-block", () => ({
	ShikiCodeBlock: ({ code }: { code: string }) => <pre data-testid="src">{code}</pre>,
}));

const SOURCE = "graph LR\n  A --> \n  B -->> ((( C";

function contextValue(overrides: Partial<RenderBlockContextValue> = {}): RenderBlockContextValue {
	return {
		messageId: "msg-1",
		isStreaming: false,
		isReplyToFixTurn: false,
		fixTurnsText: "",
		getBlockIndex: () => 0,
		sendTurn: vi.fn(),
		...overrides,
	};
}

function inContext(value: RenderBlockContextValue, children: ReactNode) {
	return <RenderBlockContext.Provider value={value}>{children}</RenderBlockContext.Provider>;
}

const fixButton = () => screen.queryByRole("button", { name: BLOCK_COPY_CONTENT.fixWithAssistant });

describe("failed mermaid block actions", () => {
	beforeEach(() => {
		resetRenderFailures();
		mermaidParse.mockReset();
		mermaidParse.mockRejectedValue(new Error("Parse error on line 2: see https://x.example/a"));
		vi.spyOn(console, "warn").mockImplementation(() => {});
	});
	afterEach(() => vi.restoreAllMocks());

	it("records the failure under message id + block index and offers both actions", async () => {
		render(inContext(contextValue({ getBlockIndex: () => 3 }), <MermaidBlock source={SOURCE} />));
		await waitFor(() => expect(fixButton()).toBeInTheDocument());
		expect(getRenderFailure("msg-1#3")).toMatchObject({
			kind: "mermaid-parse",
			lang: "mermaid",
			redactedError: "Parse error on line 2: see [redacted]",
		});
		expect(screen.getByRole("button", { name: BLOCK_COPY_CONTENT.copyErrorReport })).toBeInTheDocument();
	});

	it("sends exactly one fix turn containing the source, then hides the button", async () => {
		const value = contextValue();
		render(inContext(value, <MermaidBlock source={SOURCE} />));
		await waitFor(() => expect(fixButton()).toBeInTheDocument());
		fireEvent.click(fixButton() as HTMLElement);
		expect(value.sendTurn).toHaveBeenCalledTimes(1);
		const sent = (value.sendTurn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
		expect(sent).toBe(
			buildFixTurnText({ lang: "mermaid", redactedError: "Parse error on line 2: see [redacted]", source: SOURCE }),
		);
		expect(sent).toContain(SOURCE);
		await waitFor(() => expect(fixButton()).toBeNull());
		// The plain fallback stays.
		expect(screen.getByText(/diagram could not be rendered/i)).toBeInTheDocument();
		expect(screen.getByRole("button", { name: BLOCK_COPY_CONTENT.copyErrorReport })).toBeInTheDocument();
	});

	it("is disabled while a reply is streaming", async () => {
		const value = contextValue({ isStreaming: true });
		render(inContext(value, <MermaidBlock source={SOURCE} />));
		await waitFor(() => expect(fixButton()).toBeInTheDocument());
		expect(fixButton()).toBeDisabled();
		fireEvent.click(fixButton() as HTMLElement);
		expect(value.sendTurn).not.toHaveBeenCalled();
	});

	it("is not offered when the block is a reply to a fix turn", async () => {
		render(inContext(contextValue({ isReplyToFixTurn: true }), <MermaidBlock source={SOURCE} />));
		await waitFor(() => expect(getRenderFailure("msg-1#0")).toBeDefined());
		expect(fixButton()).toBeNull();
		expect(screen.getByRole("button", { name: BLOCK_COPY_CONTENT.copyErrorReport })).toBeInTheDocument();
	});

	it("is not offered again when an earlier fix turn for the same source is in the thread", async () => {
		const earlier = buildFixTurnText({ lang: "mermaid", redactedError: "e", source: SOURCE });
		render(inContext(contextValue({ fixTurnsText: earlier }), <MermaidBlock source={SOURCE} />));
		await waitFor(() => expect(getRenderFailure("msg-1#0")).toBeDefined());
		expect(fixButton()).toBeNull();
	});

	it("offers no fix action outside a thread, only the report copy", async () => {
		render(<MermaidBlock source={SOURCE} />);
		await waitFor(() =>
			expect(screen.getByRole("button", { name: BLOCK_COPY_CONTENT.copyErrorReport })).toBeInTheDocument(),
		);
		expect(fixButton()).toBeNull();
	});

	it("copies a structured report", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
		render(inContext(contextValue(), <MermaidBlock source={SOURCE} />));
		const copy = await screen.findByRole("button", { name: BLOCK_COPY_CONTENT.copyErrorReport });
		fireEvent.click(copy);
		await waitFor(() => expect(writeText).toHaveBeenCalled());
		const report = writeText.mock.calls[0]?.[0] as string;
		expect(report).toContain(BLOCK_COPY_CONTENT.reportTitle);
		expect(report).toContain("Kind: mermaid-parse");
		expect(report).toContain("Language: mermaid");
		expect(report).toContain("Build: v0.0.0-test");
		expect(report).toContain(SOURCE);
	});
});

describe("RenderGuard fallback actions", () => {
	beforeEach(() => {
		resetRenderFailures();
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(console, "warn").mockImplementation(() => {});
	});
	afterEach(() => vi.restoreAllMocks());

	it("offers the fix button for a thrown render and sends one turn", async () => {
		const Boom = () => {
			throw new Error("kaboom");
		};
		const value = contextValue();
		render(
			inContext(
				value,
				<RenderGuard lang="svg" source="<svg/>">
					<Boom />
				</RenderGuard>,
			),
		);
		await waitFor(() => expect(fixButton()).toBeInTheDocument());
		expect(getRenderFailure("msg-1#0")).toMatchObject({
			kind: "render-exception",
			lang: "svg",
			redactedError: "kaboom",
		});
		fireEvent.click(fixButton() as HTMLElement);
		expect(value.sendTurn).toHaveBeenCalledTimes(1);
		expect((value.sendTurn as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]).toContain("<svg/>");
		await waitFor(() => expect(fixButton()).toBeNull());
	});
});

describe("fenceIndexOf", () => {
	const text = "a\n\n```mermaid\ngraph LR\nA-->B\n```\n\nb\n\n```svg\n<svg/>\n```\n";
	it("finds the position of a fence body among the message fences", () => {
		expect(fenceIndexOf(text, "graph LR\nA-->B")).toBe(0);
		expect(fenceIndexOf(text, "<svg/>")).toBe(1);
		expect(fenceIndexOf(text, "missing")).toBe(0);
	});
});
