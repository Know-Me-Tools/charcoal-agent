import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ContentBlock } from "@/types/chat-content";
import { serializeConversation } from "./okf-serialize";
import { ask, convo, reply } from "./test-fixtures";

const GOLDEN_DIR = path.join(__dirname, "__golden__");

/** Compares with a checked-in golden file; `UPDATE_GOLDEN=1` rewrites it for review. */
function expectGolden(name: string, actual: string): void {
	const file = path.join(GOLDEN_DIR, `${name}.md`);
	if (process.env.UPDATE_GOLDEN === "1") {
		mkdirSync(GOLDEN_DIR, { recursive: true });
		writeFileSync(file, actual);
	}
	expect(existsSync(file), `missing golden file ${name}.md (run with UPDATE_GOLDEN=1)`).toBe(true);
	expect(actual).toBe(readFileSync(file, "utf8"));
}

function render(blocks: ContentBlock[], status?: "complete" | "failed" | "in_progress"): string {
	const out = serializeConversation(convo([ask(), reply(blocks, status)]));
	if (out === null) throw new Error("nothing exported");
	return out.markdown;
}

const text = (t: string): ContentBlock => ({ type: "text", text: t });

describe("serializeConversation goldens, one per block type", () => {
	it("text, with mermaid, svg, a table and math kept as stored", () => {
		expectGolden(
			"text",
			render([
				text(
					"Here is the flow.\n\n```mermaid\nflowchart LR\n  A --> B\n```\n\n```svg\n<svg xmlns=\"http://www.w3.org/2000/svg\"/>\n```\n\n| a | b |\n| --- | --- |\n| 1 | 2 |\n\n$$x^2$$",
				),
			]),
		);
	});

	it("web citation: markers become footnotes, definition at the end, web search line", () => {
		expectGolden(
			"citation-web",
			render([
				text("The latest stable Rust release is 1.99.0.[W2]"),
				{ type: "citation", source: "Announcing Rust 1.99.0", content: "snippet must not appear", url: "https://blog.rust-lang.org/releases/latest/", index: 2, origin: "web", host: "blog.rust-lang.org" },
			]),
		);
	});

	it("knowledge-base citation: scope descriptor as the resource, no URL", () => {
		expectGolden(
			"citation-kb",
			render([
				text("KnowMe runs on the Universal Agent Runtime [1]."),
				{ type: "citation", source: "faq.0123456789ab.md", content: "snippet must not appear", index: 1 },
			]),
		);
	});

	it("image: own-host kept as an absolute URL, other hosts omitted", () => {
		expectGolden(
			"image",
			render([
				text("Two images."),
				{ type: "image", url: "/assets/diagram.png", alt: "A diagram" },
				{ type: "image", url: "https://tracker.example.com/pixel.png", alt: "pixel" },
			]),
		);
	});

	it("artifact: code, svg, mermaid and html fences; input requests and other types dropped", () => {
		expectGolden(
			"artifact",
			render([
				{ type: "artifact", artifactId: "art-0000000001", artifactType: "code", title: "x", content: "const a = 1;\n", language: "ts", isInputRequest: false },
				{ type: "artifact", artifactId: "art-0000000002", artifactType: "svg", title: "x", content: "<svg/>", isInputRequest: false },
				{ type: "artifact", artifactId: "art-0000000003", artifactType: "mermaid", title: "x", content: "graph TD\n A-->B\n", isInputRequest: false },
				{ type: "artifact", artifactId: "art-0000000004", artifactType: "html", title: "x", content: "<p>hi</p>", isInputRequest: false },
				{ type: "artifact", artifactId: "art-0000000005", artifactType: "form", title: "x", content: "{\"secret\":1}", isInputRequest: true },
				{ type: "artifact", artifactId: "art-0000000006", artifactType: "provider_event", title: "x", content: "HIDDEN", isInputRequest: false },
			]),
		);
	});

	it("code that contains a triple backtick gets a longer fence", () => {
		const md = render([
			{ type: "artifact", artifactId: "art-0000000007", artifactType: "code", title: "x", content: "```\ninner\n```", language: "md", isInputRequest: false },
		]);
		expect(md).toContain("````md\n```\ninner\n```\n````");
	});

	it("error block: the fixed line, never the message", () => {
		expectGolden("error", render([text("Partial answer"), { type: "error", message: "upstream 500 at http://127.0.0.1:6565/api/chat", code: "E1" }]));
	});

	it("incomplete reply is marked", () => {
		expectGolden("incomplete", render([text("Half an ans")], "in_progress"));
	});

	it("omitted block types leave only the visible text", () => {
		const omitted: ContentBlock[] = [
			{ type: "reasoning", text: "REASONING-CANARY" },
			{ type: "tool-call", toolCallId: "tc-0000000001", toolName: "search", args: { q: "TOOLARG-CANARY" }, result: "TOOLRESULT-CANARY", status: "complete" },
			{ type: "skill-activation", skillId: "sk-0000000001", skillName: "SKILL-CANARY", status: "active" },
			{ type: "context-update", strategy: "CTX-CANARY", messagesRemoved: 1, tokensSaved: 1, wasApplied: true, summaryGenerated: true },
			{ type: "memory-recall", items: [{ key: "k", value: "MEMVALUE-CANARY", source: "s" }], count: 1 },
			{ type: "memory-mutation", operation: "created", memoryId: "mem-0000000001", content: "MEMMUT-CANARY", scope: "s", memoryType: "t" },
			{ type: "step", index: 0, phase: "started", label: "STEP-CANARY" },
			text("Visible."),
		];
		expectGolden("omitted-types", render(omitted));
	});

	it("web citations in a second message reuse the source and define the footnote once", () => {
		const web = (marker: number): ContentBlock => ({ type: "citation", source: "Rust blog", content: "", url: "https://blog.rust-lang.org/", index: marker, origin: "web", host: "blog.rust-lang.org" });
		const out = serializeConversation(
			convo([ask(), reply([text("One [W1]."), web(1)]), { ...ask("Again?"), id: "user-msg-00000002" }, { ...reply([text("Two [W3]."), web(3)]), id: "asst-msg-00000002" }]),
		);
		const md = out?.markdown ?? "";
		expect(md.match(/^\[\^W1\]:/gm)).toHaveLength(1);
		expect(md).toContain("Two [^W1].");
		expect(md.match(/id: "W1"/g)).toHaveLength(1);
	});

	it("returns null when no message has exportable content", () => {
		expect(serializeConversation(convo([reply([{ type: "reasoning", text: "x" }])]))).toBeNull();
	});

	it("leaves markers inside code and unresolved markers alone", () => {
		const md = render([text("See `a[1]` and [9] and [1](https://x.test).\n\n```\n[1]\n```\n[1]"), { type: "citation", source: "faq", content: "", index: 1 }]);
		expect(md).toContain("`a[1]`");
		expect(md).toContain("[9]");
		expect(md).toContain("[1](https://x.test)");
		expect(md).toContain("```\n[1]\n```\n[^K1]");
	});
});
