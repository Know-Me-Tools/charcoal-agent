/**
 * The design appendix `docs/design/product-directory-status-map.md` as data:
 * the label, family, version line and product page of every public row, as the
 * creative director derived them. The directory generator and the home page
 * are checked against it, so the visitor-facing truth of 52 labels does not
 * rest on the generator agreeing with itself.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export interface StatusMapRow {
	id: string;
	/** Display family name, without the facts family in brackets. */
	family: string;
	label: string;
	/** Version line(s) joined by " / ". */
	versionLine: string;
	/** Product page slug, or null. */
	page: string | null;
}

const FILE = resolve(__dirname, "../../../docs/design/product-directory-status-map.md");

export function readStatusMap(): StatusMapRow[] {
	const rows: StatusMapRow[] = [];
	for (const line of readFileSync(FILE, "utf8").split("\n")) {
		const cells = line.split(/(?<!\\)\|/).map((c) => c.trim());
		// | id | name | family (facts) | kind | portfolio | step | label | version | page |
		const id = /^`([a-z0-9-]+)`$/.exec(cells[1] ?? "")?.[1];
		if (!id || cells.length < 10) continue;
		rows.push({
			id,
			family: cells[3].replace(/\s*\([^)]*\)$/, ""),
			label: cells[7].replace(/\*/g, ""),
			versionLine: cells[8].replace(/\\\|/g, "|"),
			page: cells[9] ? cells[9].replace("/products/", "") : null,
		});
	}
	return rows;
}
