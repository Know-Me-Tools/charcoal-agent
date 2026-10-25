import { describe, expect, it } from "vitest";
import { errorText, MAX_ERROR_CHARS, redactError } from "./redact";

describe("redactError", () => {
	it("returns one line without stack frames", () => {
		const error = new Error("Parse error on line 2:\nExpecting 'EOF'\n    at foo (bundle.js:1:2)\n    at bar (bundle.js:3:4)");
		expect(redactError(error)).toBe("Parse error on line 2: Expecting 'EOF'");
	});

	it("strips URLs, bearer values and key=value secrets", () => {
		const out = redactError("failed https://api.example.com/x?y=1 and www.example.org plus Bearer abc123 and token=zzz and api_key: qqq");
		expect(out).not.toMatch(/example|abc123|zzz|qqq/);
		expect(out).toContain("[redacted]");
	});

	it("strips long token-like strings and JWTs", () => {
		const out = redactError("bad eyJhbGciOi.eyJzdWIiOjE.sig_nature and sk-abcdefghijklmnopqrstuvwxyz0123");
		expect(out).not.toMatch(/eyJ|abcdefghijkl/);
	});

	it("caps the line at the limit", () => {
		const out = redactError("word ".repeat(200));
		expect(out.length).toBeLessThanOrEqual(MAX_ERROR_CHARS);
		expect(out.endsWith("…")).toBe(true);
	});

	it("is total for odd input", () => {
		expect(redactError(undefined)).toBe("Unknown error");
		expect(redactError("")).toBe("Unknown error");
		expect(errorText({ str: "mermaid style" })).toBe("mermaid style");
	});
});
