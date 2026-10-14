/**
 * The single definition of "the text of this block" — spec
 * `docs/specs/chat-export-okf-and-block-copy.md` sections 2.3 (B-3) and 7.
 *
 * The per-block Copy buttons call these functions, and the export serializer
 * (change `app-chat-export-okf-single`) calls the same ones, so copy and
 * export can never drift on what a block's text is.
 *
 * Every function is total: empty, nullish or odd input returns a string and
 * never throws. Functions that take source text return the block's data, not
 * rendered DOM text (a highlighted code block has spans; the copy is the raw
 * string).
 */
import { AI_SURFACE_CAPTION } from "../../../content/site/ai-disclosure";

/** Nullish input reads as empty; the functions stay total at runtime. */
function asText(value: string | null | undefined): string {
	return typeof value === "string" ? value : "";
}

/**
 * A fenced code block: the raw code with one trailing newline trimmed
 * (`\n` or a Windows `\r\n`), no language label, no line numbers.
 * Interior line endings and any further trailing newlines are the code's
 * own content and stay.
 */
export function codeBlockText(code: string | null | undefined): string {
	return asText(code).replace(/\r?\n$/, "");
}

/** A Mermaid diagram: the Mermaid source, which is its canonical form. */
export function mermaidBlockText(source: string | null | undefined): string {
	return asText(source);
}

/** An SVG block: the SVG source. */
export function svgBlockText(source: string | null | undefined): string {
	return asText(source);
}

/** A math block: the TeX source, without the `$`/`$$` delimiters. */
export function mathBlockText(tex: string | null | undefined): string {
	return asText(tex);
}

/** An image block: the image URL. */
export function imageBlockText(url: string | null | undefined): string {
	return asText(url);
}

/** A video block: the video URL (a video is never embedded in copy text). */
export function videoBlockText(url: string | null | undefined): string {
	return asText(url);
}

interface TableParts {
	header: string[];
	body: string[][];
}

/** Elements that are never rendered by construction, or whose text is not shown (ruby annotations). */
const NEVER_VISIBLE_TAGS = new Set(["script", "style", "template", "rp", "rt"]);

/** True when the visitor cannot see the element's content. */
function isHidden(el: Element): boolean {
	if (NEVER_VISIBLE_TAGS.has(el.tagName.toLowerCase())) return true;
	return el.hasAttribute("hidden") || el.getAttribute("aria-hidden") === "true";
}

/** The text a visitor sees in a node: no hidden content, no collapsed `<details>` body. */
function visibleText(node: Node): string {
	if (node.nodeType === 3) return node.textContent ?? "";
	if (node.nodeType !== 1) return "";
	const el = node as Element;
	if (isHidden(el)) return "";
	const children = Array.from(el.childNodes);
	if (el.tagName.toLowerCase() === "details" && !el.hasAttribute("open")) {
		return children
			.filter((child) => child.nodeType === 1 && (child as Element).tagName.toLowerCase() === "summary")
			.map(visibleText)
			.join("");
	}
	return children.map(visibleText).join("");
}

/** Cell text: only what is visibly rendered; whitespace runs (including newlines) collapse to one space. */
function cellText(cell: Element): string {
	return visibleText(cell).replace(/\s+/g, " ").trim();
}

function rowText(row: HTMLTableRowElement): string[] {
	return Array.from(row.cells).map(cellText);
}

/**
 * Reads a table element into a header row and body rows. The header is the
 * first row of the `thead`; a table with no `thead` promotes its first row.
 * Every other row — including extra `thead` rows — is a body row, so no cell
 * text is silently dropped. Merged-looking cells (colspan/rowspan, empty
 * cells) come through as the cells the DOM actually has; nothing is invented.
 */
function tableParts(table: HTMLTableElement | null | undefined): TableParts {
	if (!table || typeof table.querySelectorAll !== "function") {
		return { header: [], body: [] };
	}
	const rows = Array.from(table.querySelectorAll("tr"));
	if (rows.length === 0) return { header: [], body: [] };

	const headRows = rows.filter((row) => row.closest("thead") !== null);
	const bodyRows = rows.filter((row) => row.closest("thead") === null);

	if (headRows.length === 0) {
		const [first, ...rest] = bodyRows;
		return { header: rowText(first), body: rest.map(rowText) };
	}
	const [firstHead, ...restHead] = headRows;
	return {
		header: rowText(firstHead),
		body: [...restHead, ...bodyRows].map(rowText),
	};
}

/** Pads every row to the table's width so the markdown stays rectangular. */
function padRow(cells: string[], width: number): string[] {
	return cells.length >= width ? cells : [...cells, ...Array(width - cells.length).fill("")];
}

/**
 * A table element as GitHub-flavoured markdown: header row, delimiter row,
 * body rows. Cell text has pipes escaped (`\|`) and newlines collapsed.
 * An empty table (no rows, or rows with no cells) yields an empty string.
 */
export function tableBlockText(table: HTMLTableElement | null | undefined): string {
	const { header, body } = tableParts(table);
	const width = Math.max(header.length, ...body.map((row) => row.length));
	if (width === 0) return "";

	const row = (cells: string[]): string =>
		`| ${padRow(cells, width)
			.map((cell) => cell.replace(/\|/g, "\\|"))
			.join(" | ")} |`;
	const delimiter = `| ${Array(width).fill("---").join(" | ")} |`;

	return [row(header), delimiter, ...body.map(row)].join("\n");
}

/**
 * The same table as TSV: header row then body rows, tab-separated, one line
 * per row. Cell whitespace (tabs, newlines) is already collapsed by the
 * shared reader, so no field can break a row apart.
 */
export function tableBlockTsv(table: HTMLTableElement | null | undefined): string {
	const { header, body } = tableParts(table);
	if (header.length === 0 && body.length === 0) return "";
	return [header, ...body].map((row) => row.join("\t")).join("\n");
}

/** The text lines an A2UI card shows. All optional; empty lines are skipped. */
export interface CardTextLines {
	title?: string | null;
	summary?: string | null;
	source?: string | null;
}

/**
 * An A2UI card: its title, summary and source lines, followed by the fixed
 * AI caption from `content/site/ai-disclosure.ts`, so a model-written card is
 * still labelled once the text leaves the app (spec section 7). The caption
 * is always present, even for an empty card.
 */
export function cardBlockText(card: CardTextLines | null | undefined): string {
	const lines = [card?.title, card?.summary, card?.source]
		.map(asText)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
	lines.push(AI_SURFACE_CAPTION);
	return lines.join("\n");
}
