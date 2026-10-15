import { CONCEPT_KEYS, ISO_DATETIME, parseConceptFile, parseScalar } from "../../../scripts/kb/lib/frontmatter.mjs";
import { OKF_STRINGS } from "./okf-strings";
import { quote, writeFrontmatter } from "./okf-frontmatter";
import { serializeConversation } from "./okf-serialize";
import { ask, convo, reply } from "./test-fixtures";

const NASTY_TITLES = [
	"Plain title",
	"Has: colon and # hash",
	'Quote " and \\ backslash',
	"- leading dash",
	"Line one\nLine two\r\n---\ntype: Evil",
	"'single' and \"double\"",
	"[flow, list]",
	"null",
	"true",
	"12345",
	"ends with colon:",
	"emoji 🎉 and 日本語",
	"tab\tseparated",
	"  padded  ",
];

function parse(markdown: string) {
	return parseConceptFile(markdown, CONCEPT_KEYS);
}

describe("OKF frontmatter round trip through scripts/kb/lib/frontmatter.mjs", () => {
	it("a full conversation with web and KB sources parses with no errors", () => {
		const out = serializeConversation(
			convo([
				ask(),
				reply([
					{ type: "text", text: "Answer [W1] and [1]." },
					{ type: "citation", source: "Announcing Rust 1.99.0", content: "", url: "https://blog.rust-lang.org/releases/latest/", index: 1, origin: "web", host: "blog.rust-lang.org" },
					{ type: "citation", source: "faq.0123456789ab.md", content: "", index: 1 },
				]),
			]),
		);
		const parsed = parse(out?.markdown ?? "");
		expect(parsed.errors).toEqual([]);
		expect(parsed.data.type).toBe(OKF_STRINGS.conceptType);
		expect(parsed.data.status).toBe("stable");
		expect(parsed.data.tags).toEqual(["conversation", "knowme"]);
		expect(parsed.data.generated).toEqual({ by: "knowme-site/1", at: "2026-10-14T05:12:03+00:00" });
		expect(ISO_DATETIME.test(parsed.data.generated.at)).toBe(true);
		expect(parsed.data.sources).toEqual([
			{ id: "W1", resource: "https://blog.rust-lang.org/releases/latest/", title: "Announcing Rust 1.99.0" },
			{ id: "K1", resource: "KnowMe knowledge base: FAQ", title: "FAQ" },
		]);
		expect(parsed.body).toContain("[^W1]: Announcing Rust 1.99.0");
	});

	it("a conversation without sources has no sources key and still parses", () => {
		const parsed = parse(serializeConversation(convo([ask(), reply([{ type: "text", text: "Hi." }])]))?.markdown ?? "");
		expect(parsed.errors).toEqual([]);
		expect(parsed.data.sources).toBeUndefined();
	});

	it.each(NASTY_TITLES)("title %j reads back as one line, with no extra keys", (title) => {
		const out = serializeConversation(convo([ask(), reply([{ type: "text", text: "Hi." }])], title));
		const parsed = parse(out?.markdown ?? "");
		expect(parsed.errors).toEqual([]);
		expect(Object.keys(parsed.data).sort()).toEqual(["description", "generated", "status", "tags", "title", "type"]);
		const expected = title.replace(/\s+/g, " ").trim();
		expect(parsed.data.title).toBe(expected);
	});

	it.each(NASTY_TITLES)("quote(%j) is a scalar the strict parser reads back", (value) => {
		expect(parseScalar(quote(value)).value).toBe(value.replace(/\s+/g, " ").trim());
	});

	it("hostile source titles and URLs cannot add keys", () => {
		const text = writeFrontmatter({
			type: "Conversation",
			title: "t",
			description: "d",
			status: "stable",
			generatedBy: "knowme-site/1",
			generatedAt: "2026-10-14T05:12:03+00:00",
			tags: ["conversation", "Bad Tag", "null", "x: y"],
			sources: [{ id: "W1", resource: "https://x.test/?a=b\n  - id: Z", title: 'x"\n    resource: evil' }],
		});
		const parsed = parse(`${text}\nbody`);
		expect(parsed.errors).toEqual([]);
		expect(parsed.data.tags).toEqual(["conversation"]);
		expect(parsed.data.sources).toHaveLength(1);
		expect(Object.keys(parsed.data.sources[0]).sort()).toEqual(["id", "resource", "title"]);
	});

	it("a long first question gives a description of at most 160 characters", () => {
		const out = serializeConversation(convo([ask(`${"word ".repeat(80)}and more.`), reply([{ type: "text", text: "Hi." }])]));
		expect(parse(out?.markdown ?? "").data.description.length).toBeLessThanOrEqual(160);
	});

	it("the description is the first sentence of the first question", () => {
		const out = serializeConversation(convo([ask("What is Rust? And why?"), reply([{ type: "text", text: "Hi." }])]));
		expect(parse(out?.markdown ?? "").data.description).toBe("What is Rust?");
	});
});
