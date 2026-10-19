import type { ContentBlock } from "@/types/chat-content";
import { buildBundle } from "./okf-bundle";
import { serializeConversation } from "./okf-serialize";
import { OKF_STRINGS, omissionLine } from "./okf-strings";
import { ask, convo, msg, reply, T0, T1 } from "./test-fixtures";

const text = (t: string): ContentBlock => ({ type: "text", text: t });
const artifact = (artifactType: string, content: string, isInputRequest = false): ContentBlock => ({
	type: "artifact",
	artifactId: "art-0000000099",
	artifactType,
	title: "CANARY-TITLE-OMIT",
	content,
	isInputRequest,
});

const CARDS = omissionLine({ cards: true, images: false });
const IMAGES = omissionLine({ cards: false, images: true });
const BOTH = omissionLine({ cards: true, images: true });

function render(blocks: ContentBlock[]): string {
	const out = serializeConversation(convo([ask(), reply(blocks)]));
	if (out === null) throw new Error("nothing exported");
	return out.markdown;
}

describe("omission line", () => {
	it("names the kinds from the strings file, and only the kinds that were dropped", () => {
		expect(CARDS).toContain(OKF_STRINGS.omittedCards);
		expect(CARDS).not.toContain(OKF_STRINGS.omittedImages);
		expect(IMAGES).toContain(OKF_STRINGS.omittedImages);
		expect(IMAGES).not.toContain(OKF_STRINGS.omittedCards);
		expect(BOTH).toContain(OKF_STRINGS.omittedCards);
		expect(BOTH).toContain(OKF_STRINGS.omittedImages);
	});

	it.each(["form", "confirm", "display", "select", "text_input", "a2ui"])("a dropped %s artifact adds the line and none of its content", (type) => {
		const md = render([text("Answer."), artifact(type, "CARD-CONTENT-CANARY", true)]);
		expect(md.trimEnd().endsWith(CARDS)).toBe(true);
		expect(md).not.toContain("CARD-CONTENT-CANARY");
		expect(md).not.toContain("CANARY-TITLE-OMIT");
	});

	it("a remote image adds the line and not its url or alt text", () => {
		const md = render([
			text("Picture."),
			{ type: "image", url: "https://tracker.example.com/IMG-URL-CANARY.png", alt: "IMG-ALT-CANARY" },
		]);
		expect(md.trimEnd().endsWith(IMAGES)).toBe(true);
		expect(md).not.toContain("IMG-URL-CANARY");
		expect(md).not.toContain("tracker.example.com");
		expect(md).not.toContain("IMG-ALT-CANARY");
	});

	it("a card and a remote image give one line naming both", () => {
		const md = render([text("Both."), artifact("form", "x", true), { type: "image", url: "https://a.example.com/p.png", alt: "a" }]);
		expect(md.match(/Left out of this file/g)).toHaveLength(1);
		expect(md.trimEnd().endsWith(BOTH)).toBe(true);
	});

	it("two dropped blocks in two messages still give one line, at the end of the body", () => {
		const out = serializeConversation(
			convo([
				ask(),
				reply([text("One."), artifact("form", "x", true)]),
				{ ...ask("Again?"), id: "user-msg-00000002" },
				{ ...reply([text("Two."), artifact("confirm", "y", true)]), id: "asst-msg-00000002" },
			]),
		);
		const md = out?.markdown ?? "";
		expect(md.match(/Left out of this file/g)).toHaveLength(1);
		expect(md.trimEnd().endsWith(CARDS)).toBe(true);
	});

	it("a plain text chat has no line", () => {
		expect(render([text("Just words.")])).not.toContain("Left out of this file");
	});

	it("exported source artifacts and own-host images have no line", () => {
		const md = render([
			text("Fine."),
			artifact("code", "const a = 1;"),
			artifact("svg", "<svg/>"),
			{ type: "image", url: "/assets/diagram.png", alt: "A diagram" },
		]);
		expect(md).not.toContain("Left out of this file");
	});

	it("hidden block types and hidden artifact types never add the line", () => {
		const md = render([
			{ type: "reasoning", text: "r" },
			{ type: "tool-call", toolCallId: "tc-0000000001", toolName: "search", args: {}, result: "x", status: "complete" },
			{ type: "skill-activation", skillId: "sk-0000000001", skillName: "s", status: "active" },
			{ type: "context-update", strategy: "c", messagesRemoved: 1, tokensSaved: 1, wasApplied: true, summaryGenerated: true },
			{ type: "memory-recall", items: [{ key: "k", value: "v", source: "s" }], count: 1 },
			{ type: "memory-mutation", operation: "created", memoryId: "mem-0000000001", content: "c", scope: "s", memoryType: "t" },
			{ type: "step", index: 0, phase: "started", label: "l" },
			artifact("provider_event", "p"),
			artifact("turn_manifest", "t"),
			text("Visible."),
		]);
		expect(md).not.toContain("Left out of this file");
	});
});

describe("omission line in the zip bundle", () => {
	it("is on the conversation that lost content and not on the one that did not", () => {
		const lost = {
			thread: { title: "Lost one", id: "lost-1" },
			messages: [
				msg("lost-u", "user", [text("Show me")], T0),
				msg("lost-a", "assistant", [text("Here."), artifact("form", "BUNDLE-CANARY", true)], T1),
			],
		};
		const kept = {
			thread: { title: "Kept one", id: "kept-1" },
			messages: [msg("kept-u", "user", [text("Hi")], T0), msg("kept-a", "assistant", [text("Hello.")], T1)],
		};
		const bundle = buildBundle([lost, kept], new Date("2026-10-17T15:30:00Z"), "knowme-site");
		const byName = (needle: string): string => bundle?.files.find((f) => f.path.includes(needle))?.content ?? "";
		expect(byName("lost-one").trimEnd().endsWith(CARDS)).toBe(true);
		expect(byName("lost-one")).not.toContain("BUNDLE-CANARY");
		expect(byName("kept-one")).not.toContain("Left out of this file");
		expect(byName("index.md")).not.toContain("Left out of this file");
	});
});
