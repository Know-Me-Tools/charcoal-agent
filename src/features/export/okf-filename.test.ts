import { conversationFilename, slugFromTitle, yyyymmdd } from "./okf-filename";

const AT = new Date("2026-10-14T23:59:59Z");

describe("okf filenames", () => {
	it("builds knowme-<slug>-<yyyymmdd>.md in UTC", () => {
		expect(conversationFilename("Rust release question", AT)).toBe("knowme-rust-release-question-20261014.md");
		expect(yyyymmdd(new Date("2026-01-02T00:00:00Z"))).toBe("20260102");
	});

	it("is deterministic", () => {
		expect(conversationFilename("Same title", AT)).toBe(conversationFilename("Same title", AT));
	});

	it("keeps only [a-z0-9-] and removes accents", () => {
		expect(slugFromTitle("Café ünïcode — 日本語 & more!")).toBe("cafe-unicode-more");
	});

	it("removes path separators, dot segments and control characters", () => {
		const slug = slugFromTitle("../../etc/passwd\u0000\n..\\win");
		expect(slug).toMatch(/^[a-z0-9-]+$/);
		expect(slug).not.toContain("..");
		expect(slug).toBe("etc-passwd-win");
	});

	it("limits the slug to 48 characters without a trailing hyphen", () => {
		const slug = slugFromTitle(`${"a".repeat(47)} bbbbbbbb`);
		expect(slug.length).toBeLessThanOrEqual(48);
		expect(slug.endsWith("-")).toBe(false);
	});

	it("never returns an empty slug", () => {
		expect(slugFromTitle("")).toBe("conversation");
		expect(slugFromTitle("日本語")).toBe("conversation");
		expect(slugFromTitle("---")).toBe("conversation");
	});

	it.each(["CON", "nul", "Com1", "LPT9", "aux", "prn"])("never returns the reserved name %s", (name) => {
		const slug = slugFromTitle(name);
		expect(slug).not.toBe(name.toLowerCase());
		expect(slug).toMatch(/^[a-z0-9-]+$/);
	});
});
