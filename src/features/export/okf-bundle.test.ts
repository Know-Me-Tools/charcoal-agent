import { unzipSync, strFromU8 } from "fflate";
import { CONCEPT_KEYS, ISO_DATETIME, ROOT_INDEX_KEYS, parseConceptFile } from "../../../scripts/kb/lib/frontmatter.mjs";
import type { RichMessage } from "@/types/chat-content";
import { buildBundle, type BundleThreadInput } from "./okf-bundle";
import { zipFiles } from "./okf-zip";
import { msg } from "./test-fixtures";

const EXPORTED_AT = new Date("2026-10-17T15:30:00Z");

function thread(title: string, id: string, asked: string, at = "2026-10-14T04:55:00Z"): BundleThreadInput {
	const messages: RichMessage[] = [
		msg(`${id}-u`, "user", [{ type: "text", text: asked }], at),
		msg(`${id}-a`, "assistant", [{ type: "text", text: `Answer to: ${asked}` }], at),
	];
	return { thread: { title, id, sessionId: id, agentId: "knowme-site" }, messages };
}

const HOSTILE_TITLES = [
	"Plain title",
	"Has: colon and # hash",
	'Quote " and \\ backslash',
	"- leading dash",
	"Line one\nLine two\r\n---\ntype: Evil",
	"[brackets](http://evil.example) in a title",
	"../../etc/passwd",
	"CON",
	"nul",
	"日本語のタイトル",
	"",
];

describe("buildBundle", () => {
	it("holds index.md, log.md and one concept per conversation, and nothing else", () => {
		const bundle = buildBundle(
			[thread("First chat", "id-1", "What is KnowMe?"), thread("Second chat", "id-2", "What is The Boss?", "2026-09-02T10:00:00Z")],
			EXPORTED_AT,
			"knowme-site",
		);
		expect(bundle?.zipName).toBe("knowme-conversations-20261017.zip");
		expect(bundle?.files.map((f) => f.path)).toEqual([
			"index.md",
			"log.md",
			"conversations/2026-10-14-first-chat.md",
			"conversations/2026-09-02-second-chat.md",
		]);
		expect(bundle?.count).toBe(2);
		expect(bundle?.skipped).toBe(0);
	});

	it("returns null when no conversation has anything to export", () => {
		const empty: BundleThreadInput = { thread: { title: "Empty", id: "e" }, messages: [] };
		expect(buildBundle([empty], EXPORTED_AT, "knowme-site")).toBeNull();
		expect(buildBundle([], EXPORTED_AT, "knowme-site")).toBeNull();
	});

	it("counts a conversation with nothing exportable as skipped and leaves it out of the index", () => {
		const empty: BundleThreadInput = { thread: { title: "Empty", id: "e" }, messages: [] };
		const bundle = buildBundle([empty, thread("Kept", "k", "Hello there")], EXPORTED_AT, "knowme-site");
		expect(bundle?.count).toBe(1);
		expect(bundle?.skipped).toBe(1);
		expect(bundle?.files.find((f) => f.path === "index.md")?.content).not.toContain("Empty");
	});

	it("numbers repeated filenames -2, -3 in the order given, and never reuses one", () => {
		const bundle = buildBundle(
			[thread("Same title", "a", "one"), thread("Same title", "b", "two"), thread("Same title", "c", "three")],
			EXPORTED_AT,
			"knowme-site",
		);
		const names = bundle?.files.filter((f) => f.path.startsWith("conversations/")).map((f) => f.path);
		expect(names).toEqual([
			"conversations/2026-10-14-same-title.md",
			"conversations/2026-10-14-same-title-2.md",
			"conversations/2026-10-14-same-title-3.md",
		]);
		expect(new Set(names).size).toBe(3);
	});

	it("keeps every filename to [a-z0-9-], no traversal and no reserved device name, for hostile titles", () => {
		const bundle = buildBundle(
			HOSTILE_TITLES.map((title, i) => thread(title, `h-${i}`, `question ${i}`)),
			EXPORTED_AT,
			"knowme-site",
		);
		const names = (bundle?.files ?? []).filter((f) => f.path.startsWith("conversations/")).map((f) => f.path);
		expect(names).toHaveLength(HOSTILE_TITLES.length);
		for (const name of names) {
			expect(name).toMatch(/^conversations\/\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/);
			expect(name).not.toMatch(/\.\.|\/\/|^\//);
			expect(name).not.toMatch(/\/\d{4}-\d{2}-\d{2}-(con|prn|aux|nul|com[1-9]|lpt[1-9])\.md$/);
		}
		expect(new Set(names).size).toBe(names.length);
	});

	it("lists newest first, grouped by month, with absolute bundle links", () => {
		const bundle = buildBundle(
			[thread("Old one", "o", "old", "2026-08-01T10:00:00Z"), thread("New one", "n", "new", "2026-10-14T10:00:00Z")],
			EXPORTED_AT,
			"knowme-site",
		);
		const index = bundle?.files.find((f) => f.path === "index.md")?.content ?? "";
		expect(index.indexOf("## 2026-10")).toBeLessThan(index.indexOf("## 2026-08"));
		expect(index).toContain("* [New one](/conversations/2026-10-14-new-one.md) - new");
		expect(index).toContain("* [Old one](/conversations/2026-08-01-old-one.md) - old");
	});

	it("a title with brackets or a markdown link cannot add a link to the index", () => {
		const bundle = buildBundle([thread("[x](http://evil.example)", "t", "hello")], EXPORTED_AT, "knowme-site");
		const index = bundle?.files.find((f) => f.path === "index.md")?.content ?? "";
		const lines = index.split("\n").filter((l) => l.startsWith("* "));
		expect(lines).toHaveLength(1);
		expect(lines[0]).toContain("\\[x\\]");
		// Only the real link close is an unescaped `](`; the one inside the title is escaped.
		expect(lines[0].match(/(?<!\\)\]\(/g)).toHaveLength(1);
	});

	it("a first question with a link, an image or HTML cannot add one to the index", () => {
		const bundle = buildBundle(
			[thread("Plain", "p", "[click](https://evil.example) ![](https://tracker.example/p.png) <img src=https://t/x> `code` *bold*")],
			EXPORTED_AT,
			"knowme-site",
		);
		const line = (bundle?.files.find((f) => f.path === "index.md")?.content ?? "").split("\n").find((l) => l.startsWith("* ")) ?? "";
		const description = line.slice(line.indexOf(" - ") + 3);
		// Every metacharacter is escaped, so no unescaped link, image, tag, code span or emphasis remains.
		expect(description).not.toMatch(/(?<!\\)[\][()<>`*!]/);
		expect(description).toContain("\\[click\\]\\(https://evil.example\\)");
		expect(line.match(/(?<!\\)\]\(/g)).toHaveLength(1);
	});

	it("is valid OKF: root index has only okf_version, every concept parses with its type and ISO times", () => {
		const bundle = buildBundle(
			HOSTILE_TITLES.map((title, i) => thread(title, `v-${i}`, `question ${i}`)),
			EXPORTED_AT,
			"knowme-site",
		);
		const files = bundle?.files ?? [];
		const index = parseConceptFile(files.find((f) => f.path === "index.md")?.content ?? "", ROOT_INDEX_KEYS);
		expect(index.errors).toEqual([]);
		expect(index.data).toEqual({ okf_version: "0.2" });

		const log = files.find((f) => f.path === "log.md")?.content ?? "";
		expect(log).toMatch(/^# Log\n\n## 2026-10-17\n\n\*\*Creation\*\* - Exported 11 conversations from KnowMe in the browser\./);
		expect(log.startsWith("---")).toBe(false);

		for (const file of files.filter((f) => f.path.startsWith("conversations/"))) {
			const parsed = parseConceptFile(file.content, CONCEPT_KEYS);
			expect(parsed.errors, file.path).toEqual([]);
			expect(parsed.data.type).toBe("Conversation");
			expect(ISO_DATETIME.test(parsed.data.generated.at)).toBe(true);
			expect(parsed.data.okf_version, file.path).toBeUndefined();
		}
	});

	it("puts no thread id, session id, agent id or message id in any file", () => {
		const ids = ["11111111-aaaa-4bbb-8ccc-222222222222", "33333333-aaaa-4bbb-8ccc-444444444444"];
		const bundle = buildBundle(
			ids.map((id, i) => thread(`Chat about ${id}`, id, `Please mention ${id} (${i})`)),
			EXPORTED_AT,
			"knowme-site",
		);
		const all = (bundle?.files ?? []).map((f) => f.content).join("\n");
		for (const id of ids) expect(all).not.toContain(id);
		expect(all).not.toContain("knowme-site\"");
		expect(all).not.toMatch(/-u\b|-a\b/);
	});

	it("says conversation, not conversations, for one", () => {
		const bundle = buildBundle([thread("Solo", "s", "hello")], EXPORTED_AT, "knowme-site");
		expect(bundle?.files.find((f) => f.path === "log.md")?.content).toContain("Exported 1 conversation from KnowMe");
	});
});

describe("zipFiles", () => {
	it("unzips to exactly the bundle's entries with identical contents", async () => {
		const bundle = buildBundle(
			HOSTILE_TITLES.map((title, i) => thread(title, `z-${i}`, `question ${i} 日本語 🎉`)),
			EXPORTED_AT,
			"knowme-site",
		);
		const files = bundle?.files ?? [];
		const progress: Array<[number, number]> = [];
		const bytes = await zipFiles(files, { mtime: EXPORTED_AT, onProgress: (d, t) => progress.push([d, t]) });

		expect([bytes[0], bytes[1]]).toEqual([0x50, 0x4b]); // "PK"
		const entries = unzipSync(bytes);
		expect(Object.keys(entries).sort()).toEqual(files.map((f) => f.path).sort());
		for (const file of files) expect(strFromU8(entries[file.path]), file.path).toBe(file.content);
		for (const name of Object.keys(entries)) {
			expect(name.startsWith("/")).toBe(false);
			expect(name).not.toContain("..");
		}
		expect(progress.map(([d]) => d)).toEqual(files.map((_, i) => i + 1));
		expect(progress.every(([, t]) => t === files.length)).toBe(true);
	});

	it("stops with ZipCancelled as soon as the run is abandoned, without finishing the rest", async () => {
		const many = Array.from({ length: 50 }, (_, i) => ({ path: `conversations/c-${i}.md`, content: `file ${i}` }));
		let seen = 0;
		const run = zipFiles(many, { mtime: EXPORTED_AT, onProgress: (d) => (seen = d), isCancelled: () => seen >= 3 });
		await expect(run).rejects.toMatchObject({ name: "ZipCancelled" });
		expect(seen).toBe(3);
	});

	it("gives the same bytes for the same input (the entry time is the export time)", async () => {
		const bundle = buildBundle([thread("Stable", "s", "hello")], EXPORTED_AT, "knowme-site");
		const a = await zipFiles(bundle?.files ?? [], { mtime: EXPORTED_AT });
		const b = await zipFiles(bundle?.files ?? [], { mtime: EXPORTED_AT });
		expect(Array.from(a)).toEqual(Array.from(b));
	});

	it("yields to the main thread between files when a slice runs long", async () => {
		const many = Array.from({ length: 300 }, (_, i) => ({ path: `conversations/f-${i}.md`, content: "x".repeat(20_000) + i }));
		let yields = 0;
		const original = globalThis.setTimeout;
		vi.spyOn(globalThis, "setTimeout").mockImplementation(((fn: () => void, ms?: number) => {
			yields += 1;
			return original(fn, ms);
		}) as typeof setTimeout);
		try {
			const bytes = await zipFiles(many, { mtime: EXPORTED_AT });
			expect(Object.keys(unzipSync(bytes))).toHaveLength(300);
		} finally {
			vi.restoreAllMocks();
		}
		expect(yields).toBeGreaterThan(0);
	});
});
