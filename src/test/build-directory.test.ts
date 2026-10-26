/**
 * site-home-directory: the generator behind content/site/directory.ts.
 * Covers the status rule, the version lines, the drift check and the
 * copy-versus-facts check, and compares the committed output with the design
 * appendix row for row. Mutations of the script and the data these tests must
 * catch are listed in docs/content/reviews/site-home-directory.md.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDirectory, render, statusOf, validate, versionLines } from "../../scripts/site/build-directory.mjs";
import { DIRECTORY } from "../../content/site/directory";
import { DIRECTORY_COPY } from "../../content/site/directory-copy";
import { readStatusMap } from "./utils/status-map";

const ROOT = resolve(__dirname, "../..");
const SCRIPT = join(ROOT, "scripts/site/build-directory.mjs");
const FACTS_FILE = join(ROOT, "docs/knowledge-source/product-facts.json");
const COPY_FILE = join(ROOT, "content/site/directory-copy.ts");
const OUT_FILE = join(ROOT, "content/site/directory.ts");

interface Row {
	id: string;
	name: string;
	publication: string;
	portfolioStatus: string;
	version: { kind: string; [key: string]: unknown };
	[key: string]: unknown;
}
interface Facts {
	checked: string;
	withheldTerms: string[];
	rows: Row[];
}

const facts = JSON.parse(readFileSync(FACTS_FILE, "utf8")) as Facts;
const publicRows = facts.rows.filter((r) => r.publication === "public");
const hiddenRows = facts.rows.filter((r) => r.publication !== "public");
function clone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value)) as T;
}

/** Runs the script with temp inputs. `copy` and `out` default to the committed files. */
function run(args: string[]) {
	const r = spawnSync(process.execPath, [SCRIPT, ...args], { encoding: "utf8", cwd: ROOT });
	return { status: r.status, output: `${r.stdout}${r.stderr}` };
}
function tempFile(name: string, text: string): string {
	const dir = mkdtempSync(join(tmpdir(), "directory-"));
	const file = join(dir, name);
	writeFileSync(file, text);
	return file;
}

describe("status rule (first match wins)", () => {
	const row = (kind: string, portfolioStatus: string) =>
		({ version: { kind }, portfolioStatus }) as unknown as Row;

	it.each([
		["stable", "Work stopped", "released"],
		["registry", "Design proposal", "released"],
		["manifest", "Existing source", "prerelease"],
		["untagged", "Existing source; status unresolved", "assessment"],
		["none", "Existing implementation (needs confirmation)", "assessment"],
		["none", "Existing prototype of a tool", "development"],
		["none", "Existing implementation", "development"],
		["none", "70-screen synthetic prototype", "prototype"],
		["none", "MVP specification", "prototype"],
		["none", "Design amendment", "design"],
		["none", "Pre-implementation", "design"],
		["untagged", "Source or fork work", "development"],
	])("%s + %j is %s", (kind, text, expected) => {
		expect(statusOf(row(kind, text))).toBe(expected);
	});
});

describe("version lines", () => {
	const line = (version: Record<string, unknown>) => versionLines({ version } as unknown as Row);

	it("renders each kind as the brief says and never invents a version", () => {
		expect(line({ kind: "stable", value: "v2.2.41", date: "2026-10-23" })).toEqual(["v2.2.41 · 23 Oct 2026"]);
		expect(
			line({ kind: "stable", value: "v1.2.3", date: "2026-10-23", preRelease: { value: "v1.3.0", date: "2026-10-24" } }),
		).toEqual(["v1.2.3 · 23 Oct 2026", "v1.3.0 pre-release · 24 Oct 2026"]);
		expect(line({ kind: "registry", value: "v0.3.0", date: "2026-10-24" })).toEqual(["v0.3.0 on crates.io · 24 Oct 2026"]);
		expect(line({ kind: "tag", value: "v1.10.2", date: "2026-10-13" })).toEqual(["Tag v1.10.2 · no release"]);
		expect(line({ kind: "tag", value: "bossfang-sidecar-0899e4993", date: "2026-10-08" })).toEqual([
			"Build tag, no version · 8 Oct 2026",
		]);
		expect(line({ kind: "manifest", value: "v0.2.0" })).toEqual(["v0.2.0 pre-release"]);
		expect(line({ kind: "untagged", lastCommit: "2026-10-20" })).toEqual(["No tagged release · last commit 20 Oct 2026"]);
		expect(line({ kind: "none" })).toEqual(["No release recorded"]);
	});
});

describe("committed directory against the design appendix", () => {
	const appendix = readStatusMap();
	const entries = DIRECTORY.families.flatMap((f) => [...f.leads.flatMap((l) => l.entries), ...f.rest]);

	it("reads the appendix table", () => {
		expect(appendix).toHaveLength(52);
	});

	it("holds exactly the public rows of the facts file, no more and no less", () => {
		expect(entries.map((e) => e.id).sort()).toEqual(publicRows.map((r) => r.id).sort());
		expect(DIRECTORY.total).toBe(publicRows.length);
		for (const hidden of hiddenRows) {
			expect(entries.some((e) => e.id === hidden.id)).toBe(false);
			expect(JSON.stringify(DIRECTORY).toLowerCase()).not.toContain(hidden.name.toLowerCase());
		}
	});

	it.each(appendix)("$id: label, family, version line and page match the appendix", (expected) => {
		const family = DIRECTORY.families.find((f) =>
			[...f.leads.flatMap((l) => l.entries), ...f.rest].some((e) => e.id === expected.id),
		)!;
		const entry = entries.find((e) => e.id === expected.id)!;
		expect(DIRECTORY_COPY.statuses[entry.status]).toBe(expected.label);
		expect(family.name).toBe(expected.family);
		expect(entry.versionLines.join(" / ")).toBe(expected.versionLine);
		expect(entry.productSlug).toBe(expected.page);
	});

	it("orders index rows by label rank, then name", () => {
		const rank = ["released", "prerelease", "development", "prototype", "design", "assessment"];
		for (const family of DIRECTORY.families) {
			const keys = family.rest.map((e) => [rank.indexOf(e.status), e.name] as const);
			const sorted = [...keys].sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1], "en"));
			expect(keys).toEqual(sorted);
		}
	});

	it("matches what the generator produces from the facts file now", () => {
		expect(render(buildDirectory(facts, DIRECTORY_COPY))).toBe(readFileSync(OUT_FILE, "utf8"));
	});
});

describe("--check", () => {
	it("passes on the committed files", () => {
		const r = run(["--check"]);
		expect(r.output).toMatch(/OK directory is current \(52 public rows\)/);
		expect(r.status).toBe(0);
	});

	it("fails when the generated file differs from what the facts file would produce", () => {
		const stale = tempFile("directory.ts", `${readFileSync(OUT_FILE, "utf8")}// stale\n`);
		const r = run(["--check", "--out", stale]);
		expect(r.status).toBe(1);
		expect(r.output).toMatch(/out of date/);
	});

	it("fails when the facts file changes and the directory is not regenerated", () => {
		const changed = clone(facts);
		const boss = changed.rows.find((r) => r.id === "boss")!;
		boss.version = { ...boss.version, value: "v9.9.9" };
		const r = run(["--check", "--facts", tempFile("facts.json", JSON.stringify(changed))]);
		expect(r.status).toBe(1);
		expect(r.output).toMatch(/out of date/);
	});

	it("fails when a status-changing edit to portfolioStatus is not regenerated", () => {
		const changed = clone(facts);
		changed.rows.find((r) => r.id === "tune")!.portfolioStatus = "Existing source for the skills";
		const r = run(["--check", "--facts", tempFile("facts.json", JSON.stringify(changed))]);
		expect(r.status).toBe(1);
	});

	it("fails when a public row has no copy", () => {
		const text = readFileSync(COPY_FILE, "utf8").replace(/\t\tlogos: \{[^}]*\},\n/, "");
		expect(text).not.toBe(readFileSync(COPY_FILE, "utf8"));
		const r = run(["--check", "--copy", tempFile("copy.ts", text)]);
		expect(r.status).toBe(1);
		expect(r.output).toMatch(/public row "logos" has no entry/);
	});

	it("fails when the copy names an id that is not in the facts file", () => {
		const text = readFileSync(COPY_FILE, "utf8").replace(
			"\t\tlogos: {",
			'\t\t"not-a-row": {\n\t\t\tname: "X",\n\t\t\tfamily: "integrations",\n\t\t\tsummary: "A summary.",\n\t\t},\n\t\tlogos: {',
		);
		const r = run(["--check", "--copy", tempFile("copy.ts", text)]);
		expect(r.status).toBe(1);
		expect(r.output).toMatch(/"not-a-row" names an id that is not in the facts file/);
	});

	it("writes the file when run without --check, and then --check passes", () => {
		const out = tempFile("directory.ts", "stale");
		expect(run(["--out", out]).status).toBe(0);
		expect(readFileSync(out, "utf8")).toBe(readFileSync(OUT_FILE, "utf8"));
		expect(run(["--check", "--out", out]).status).toBe(0);
	});
});

describe("copy checks", () => {
	const problems = (mutate: (copy: typeof DIRECTORY_COPY, doc: Facts) => void) => {
		const copy = clone(DIRECTORY_COPY);
		const doc = clone(facts);
		mutate(copy, doc);
		return validate(doc, copy) as string[];
	};

	it("accepts the committed copy", () => {
		expect(problems(() => {})).toEqual([]);
	});

	it("rejects copy for a row that is not public, so withheld rows cannot gain a card", () => {
		const hidden = hiddenRows[0];
		const errors = problems((copy) => {
			copy.entries[hidden.id] = { name: "Hidden", family: "applications", summary: "A summary." };
		});
		expect(errors.join("\n")).toContain(`copy entry "${hidden.id}" is for a row that is not public`);
	});

	it("rejects a summary over 90 characters", () => {
		const errors = problems((copy) => {
			copy.entries.boss.summary = "x".repeat(91);
		});
		expect(errors.join("\n")).toMatch(/entry "boss": summary is 91 characters/);
	});

	it("rejects banned words, price and certification claims", () => {
		for (const text of ["A seamless desktop workspace.", "Leverage agents.", "Free, then $20 a month.", "A SOC 2 certified runtime."]) {
			const errors = problems((copy) => {
				copy.entries.boss.summary = text;
			});
			expect(errors.length, text).toBeGreaterThan(0);
		}
	});

	it("rejects a withheld term and the name of a non-public row", () => {
		const term = facts.withheldTerms[0];
		const hiddenName = hiddenRows[0].name;
		expect(
			problems((copy) => {
				copy.entries.boss.summary = `Runs on ${term}.`;
			}).join("\n"),
		).toContain(`withheld term "${term.toLowerCase()}"`);
		expect(
			problems((copy) => {
				copy.entries.boss.summary = `Works with ${hiddenName}.`;
			}).join("\n"),
		).toContain("names a row that is not public");
	});

	it("rejects a lead question that does not end in a question mark or is over 70 characters", () => {
		expect(
			problems((copy) => {
				copy.leads[0].question = "Tell me about The Boss";
			}).join("\n"),
		).toMatch(/must end with "\?"/);
		expect(
			problems((copy) => {
				copy.leads[0].question = `${"x".repeat(70)}?`;
			}).join("\n"),
		).toMatch(/over 70 characters/);
	});

	it("rejects a multi-row tile without a summary and a row claimed by two tiles", () => {
		expect(
			problems((copy) => {
				delete copy.leads.find((l) => l.rows.length > 1)!.summary;
			}).join("\n"),
		).toMatch(/needs a summary/);
		expect(
			problems((copy) => {
				copy.leads[0].rows.push("knowme");
			}).join("\n"),
		).toMatch(/already in lead/);
	});

	it("keeps every committed question and summary inside the limits", () => {
		for (const lead of DIRECTORY.families.flatMap((f) => f.leads)) {
			expect(lead.question.length).toBeLessThanOrEqual(70);
			expect(lead.question.endsWith("?")).toBe(true);
		}
		for (const entry of DIRECTORY.families.flatMap((f) => [...f.leads.flatMap((l) => l.entries), ...f.rest])) {
			expect(entry.summary.length).toBeLessThanOrEqual(90);
			expect(entry.prompt.length).toBeLessThanOrEqual(70);
		}
	});
});
