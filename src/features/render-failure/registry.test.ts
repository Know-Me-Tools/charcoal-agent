import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_SOURCE_CHARS } from "./fix-turn";
import {
	blockKey,
	getRenderFailure,
	markFixUsed,
	recordRenderFailure,
	resetRenderFailures,
	subscribeRenderFailures,
} from "./registry";

describe("render failure registry", () => {
	beforeEach(() => {
		resetRenderFailures();
		vi.spyOn(console, "warn").mockImplementation(() => {});
	});
	afterEach(() => vi.restoreAllMocks());

	it("records kind, lang, truncated source, redacted error and time under message id + block index", () => {
		const key = blockKey("m1", 2);
		recordRenderFailure({
			key,
			kind: "mermaid-parse",
			lang: "mermaid",
			source: "s".repeat(MAX_SOURCE_CHARS + 10),
			error: new Error("bad https://secret.example/x"),
			now: 42,
		});
		const record = getRenderFailure(key);
		expect(key).toBe("m1#2");
		expect(record).toMatchObject({ kind: "mermaid-parse", lang: "mermaid", wasTruncated: true, at: 42, fixUsed: false });
		expect(record?.sourceTruncated).toHaveLength(MAX_SOURCE_CHARS);
		expect(record?.redactedError).toBe("bad [redacted]");
	});

	it("logs only the fixed field list", () => {
		recordRenderFailure({ key: "m#0", kind: "render-exception", lang: "svg", source: "<svg/>", error: new Error("boom") });
		expect(console.warn).toHaveBeenCalledWith("[render-failure]", { kind: "render-exception", lang: "svg", messageLength: 4 });
	});

	it("notifies subscribers, and not for an identical repeat", () => {
		const listener = vi.fn();
		const off = subscribeRenderFailures(listener);
		const input = { key: "m#0", kind: "mermaid-parse" as const, lang: "mermaid", source: "a", error: "e" };
		recordRenderFailure(input);
		recordRenderFailure(input);
		expect(listener).toHaveBeenCalledTimes(1);
		off();
		recordRenderFailure({ ...input, source: "b" });
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it("keeps fixUsed for the same source and resets it for a new source on the same key", () => {
		const input = { key: "m#0", kind: "mermaid-parse" as const, lang: "mermaid", source: "a", error: "e" };
		recordRenderFailure(input);
		markFixUsed("m#0");
		recordRenderFailure({ ...input, error: "other" });
		expect(getRenderFailure("m#0")?.fixUsed).toBe(true);
		recordRenderFailure({ ...input, source: "different" });
		expect(getRenderFailure("m#0")?.fixUsed).toBe(false);
	});

	it("markFixUsed ignores unknown keys", () => {
		expect(() => markFixUsed("nope#0")).not.toThrow();
	});
});
