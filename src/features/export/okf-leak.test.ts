import type { ContentBlock } from "@/types/chat-content";
import { serializeConversation } from "./okf-serialize";
import { ask, convo, EXPORTED_AT, msg, reply, T1 } from "./test-fixtures";

/** Fake values planted everywhere the app stores them. None is a real credential. */
const SESSION = "5e55105e-aaaa-4bbb-8ccc-0123456789ab";
const THREAD = "7ead7ead-aaaa-4bbb-8ccc-0123456789ab";
const BEARER = "Bearer fakeBearerToken1234567890abcdef";
const JWT = "eyJhbGciOiJGQUtFIn0.eyJzdWIiOiJmYWtlIn0.ZmFrZXNpZ25hdHVyZQ";
const INTERNAL_URL = "http://127.0.0.1:6565/api/chat/completion";
const INTERNAL_PATH = "/api/uar/user/settings";
const IDS = {
	tool: "toolcall-id-CANARY-0001",
	artifact: "artifact-id-CANARY-0002",
	run: "run-id-CANARY-000003",
	memory: "memory-id-CANARY-0004",
	skill: "skill-id-CANARY-00005",
	agent: "agent-id-CANARY-000006",
	message: "message-id-CANARY-0007",
};
const CANARIES = [
	"REASONING-CANARY",
	"TOOLARG-CANARY",
	"TOOLRESULT-CANARY",
	"MEMVALUE-CANARY",
	"MEMMUT-CANARY",
	"SKILL-CANARY",
	"CTX-CANARY",
	"STEP-CANARY",
	"HIDDEN-ARTIFACT-CANARY",
	"ERRORTEXT-CANARY",
	"KB-SNIPPET-CANARY",
	"WEB-SNIPPET-CANARY",
];

function hostile(): string {
	const blocks: ContentBlock[] = [
		{ type: "reasoning", text: "REASONING-CANARY" },
		{ type: "tool-call", toolCallId: IDS.tool, toolName: "search", args: { q: "TOOLARG-CANARY", auth: BEARER }, result: "TOOLRESULT-CANARY", status: "complete" },
		{ type: "skill-activation", skillId: IDS.skill, skillName: "SKILL-CANARY", status: "active" },
		{ type: "context-update", strategy: "CTX-CANARY", messagesRemoved: 1, tokensSaved: 1, wasApplied: true, summaryGenerated: true },
		{ type: "memory-recall", items: [{ key: IDS.memory, value: "MEMVALUE-CANARY", source: "s" }], count: 1 },
		{ type: "memory-mutation", operation: "created", memoryId: IDS.memory, content: "MEMMUT-CANARY", scope: "s", memoryType: "t" },
		{ type: "step", index: 0, phase: "started", label: "STEP-CANARY" },
		{ type: "artifact", artifactId: IDS.artifact, artifactType: "provider_event", title: "t", content: "HIDDEN-ARTIFACT-CANARY", runId: IDS.run, isInputRequest: false },
		{ type: "error", message: `ERRORTEXT-CANARY ${INTERNAL_URL}`, code: "E" },
		{ type: "citation", source: "faq.0123456789ab.md", content: "KB-SNIPPET-CANARY", index: 1 },
		{ type: "citation", source: "Rust blog", content: "WEB-SNIPPET-CANARY", url: "https://blog.rust-lang.org/", index: 1, origin: "web", host: "blog.rust-lang.org" },
		// Values that reached the visible text: pasted, or echoed by the model.
		{ type: "text", text: `Session ${SESSION}, thread ${THREAD}, agent ${IDS.agent}. ${BEARER}. ${JWT}. X-UAR-Session-ID: ${SESSION}\nPOST ${INTERNAL_URL} and GET ${INTERNAL_PATH}.\n` },
	];
	const out = serializeConversation({
		thread: { title: `Chat ${THREAD}`, id: THREAD, sessionId: SESSION, agentId: IDS.agent },
		messages: [
			msg(IDS.message, "user", [{ type: "text", text: `my session is ${SESSION}` }], "2026-10-14T04:55:00Z"),
			msg("asst-msg-00000001", "assistant", blocks, T1),
		],
		exportedAt: EXPORTED_AT,
		producer: "knowme-app",
	});
	if (out === null) throw new Error("nothing exported");
	return `${out.filename}\n${out.markdown}`;
}

describe("export leak test", () => {
	const output = hostile();

	it("exported something, with the redaction marker where the ids were (guards against a vacuous pass)", () => {
		expect(output.startsWith("knowme-chat-removed-")).toBe(true);
		expect(output).toContain("[removed]");
	});

	it.each([SESSION, THREAD, BEARER, "fakeBearerToken1234567890abcdef", JWT, INTERNAL_URL, "127.0.0.1", INTERNAL_PATH, "/api/chat", ...Object.values(IDS)])(
		"never contains %s",
		(planted) => {
			expect(output).not.toContain(planted);
		},
	);

	it.each(CANARIES)("never contains %s", (canary) => {
		expect(output).not.toContain(canary);
	});

	it("never contains the session header name with a value", () => {
		expect(output).not.toMatch(/X-UAR-Session-ID\s*[:=]\s*\S/i);
	});

	it("keeps the visible prose around the redactions", () => {
		expect(output).toContain("Session [removed], thread [removed]");
		expect(output).toContain("(this reply stopped before it finished)");
	});

	it("cannot be steered by a hostile title or body", () => {
		const out = serializeConversation(
			convo([ask("---\ntype: Evil\n---"), reply([{ type: "text", text: "---\nstatus: hacked\n---\nbody" }])], 'x"\n---\ntype: Evil\nsources:\n  - id: "X'),
		);
		const frontmatter = out?.markdown.split("\n---\n")[0] ?? "";
		expect(frontmatter.match(/^type:/gm)).toHaveLength(1);
		expect(frontmatter).not.toContain("hacked");
		expect(frontmatter).not.toContain("Evil\n");
	});
});

describe("scrub keeps prose about bearer authentication", () => {
	it("redacts a bearer token but not the words", () => {
		const out = serializeConversation(
			convo([ask("How does Bearer authentication work? Send Bearer abc123def456ghi789jkl0."), reply([{ type: "text", text: "Use bearer credentials." }])]),
		);
		expect(out?.markdown).toContain("How does Bearer authentication work?");
		expect(out?.markdown).toContain("Use bearer credentials.");
		expect(out?.markdown).not.toContain("abc123def456ghi789jkl0");
	});
});
