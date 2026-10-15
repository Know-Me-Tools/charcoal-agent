import { readFileSync } from "node:fs";
import path from "node:path";
import { BLOCK_DISPOSITION, OMITTED_BLOCK_TYPES, SERIALIZED_BLOCK_TYPES } from "./okf-blocks";

/** Every `type: "<name>";` discriminant declared in the ContentBlock source file. */
function contentBlockTypesFromSource(): string[] {
	const source = readFileSync(path.resolve(__dirname, "../../types/chat-content.ts"), "utf8");
	const unionStart = source.indexOf("export type ContentBlock =");
	const members = [...source.slice(unionStart).matchAll(/\|\s+(\w+ContentBlock)\b/g)].map((m) => m[1]);
	expect(members.length).toBeGreaterThan(0);
	return members.map((member) => {
		const body = new RegExp(`export interface ${member} \\{([^}]*)\\}`).exec(source)?.[1] ?? "";
		const type = /type:\s*"([\w-]+)"/.exec(body)?.[1];
		if (!type) throw new Error(`no type discriminant found for ${member}`);
		return type;
	});
}

describe("block allowlist completeness", () => {
	const sourceTypes = contentBlockTypesFromSource();

	it("finds the block types in the source (guards the test itself)", () => {
		expect(sourceTypes).toEqual(expect.arrayContaining(["text", "citation", "artifact", "image", "error", "reasoning", "tool-call", "step"]));
	});

	it("every ContentBlock type is either serialized or explicitly omitted", () => {
		const unlisted = sourceTypes.filter((t) => !(t in BLOCK_DISPOSITION));
		expect(unlisted, `ContentBlock types with no export decision: ${unlisted.join(", ")}`).toEqual([]);
	});

	it("lists no type that does not exist in the source", () => {
		const stale = Object.keys(BLOCK_DISPOSITION).filter((t) => !sourceTypes.includes(t));
		expect(stale).toEqual([]);
	});

	it("serialized and omitted are disjoint and together cover the source", () => {
		expect(SERIALIZED_BLOCK_TYPES.filter((t) => OMITTED_BLOCK_TYPES.includes(t))).toEqual([]);
		expect([...SERIALIZED_BLOCK_TYPES, ...OMITTED_BLOCK_TYPES].sort()).toEqual([...sourceTypes].sort());
	});

	it("never serializes the types spec 6.1 excludes", () => {
		for (const type of ["reasoning", "tool-call", "memory-recall", "memory-mutation", "skill-activation", "context-update", "step"]) {
			expect(BLOCK_DISPOSITION[type as keyof typeof BLOCK_DISPOSITION]).toBe("omitted");
		}
	});

	it("drops a block type that has no mapping instead of dumping it", async () => {
		const { serializeConversation } = await import("./okf-serialize");
		const { ask, convo, reply } = await import("./test-fixtures");
		const unknown = { type: "future-block", payload: "UNKNOWN-CANARY" } as never;
		const out = serializeConversation(convo([ask(), reply([unknown, { type: "text", text: "Visible." }])]));
		expect(out?.markdown).toContain("Visible.");
		expect(out?.markdown).not.toContain("UNKNOWN-CANARY");
	});
});
