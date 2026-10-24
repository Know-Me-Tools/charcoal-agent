import {
	DIRECTORY,
	type DirectoryEntry,
	type DirectoryFamily,
	type DirectoryLead,
} from "../../../../content/site/directory";
import { PRODUCT_PAGES, type ProductPageCopy } from "../../../../content/site/products";
import { PRODUCTS_COPY } from "../../../../content/site/products-copy";

/** A product page's copy joined with its directory tile: status, version and date come from the tile. */
export interface ProductView {
	copy: ProductPageCopy;
	lead: DirectoryLead;
	family: DirectoryFamily;
	entries: DirectoryEntry[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-24" -> "24 Oct 2026", the same form the version lines use. */
export function formatCheckedDate(iso: string): string {
	const [year, month, day] = iso.split("-").map(Number);
	return `${day} ${MONTHS[month - 1]} ${year}`;
}

type CheckedSource = keyof typeof PRODUCTS_COPY.checkedSources;

/** What a row's version was read from, by its facts-row version kind. */
export function checkedSourceOf(versionKind: string): CheckedSource {
	if (versionKind === "stable") return "release";
	if (versionKind === "registry") return "registry";
	if (versionKind === "none") return "portfolio";
	return "repository";
}

/** "Checked against the release page and the repository on 24 Oct 2026". */
export function checkedLine(entries: DirectoryEntry[]): string {
	const order: CheckedSource[] = ["release", "registry", "repository", "portfolio"];
	const used = new Set(entries.map((entry) => checkedSourceOf(entry.versionKind)));
	const source = order
		.filter((key) => used.has(key))
		.map((key) => PRODUCTS_COPY.checkedSources[key])
		.join(PRODUCTS_COPY.checkedJoin);
	const date = formatCheckedDate(entries.map((entry) => entry.checked).sort()[0]);
	return PRODUCTS_COPY.checkedTemplate.replace("{source}", source).replace("{date}", date);
}

/** The page for a slug, or null when the slug is not one of the ten. */
export function findProductView(slug: string | undefined): ProductView | null {
	if (!slug) return null;
	const copy = PRODUCT_PAGES.find((page) => page.slug === slug);
	if (!copy) return null;
	for (const family of DIRECTORY.families) {
		const lead = family.leads.find((l) => l.slug === slug);
		if (lead) return { copy, lead, family, entries: lead.entries };
	}
	return null;
}
