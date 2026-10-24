// Version placeholders for the knowledge-base build (kb-currency-fixes task 1.1).
//
// A source page writes {{v:<product-id>}} where a version belongs, and the build replaces it with the
// value in docs/knowledge-source/product-facts.json, so a refresh touches one file.
//
//   {{v:uar}}           the version line for the product: the stable/tag/registry/manifest value, or
//                       "no tagged release (last commit YYYY-MM-DD)" for an untagged product
//   {{v:uar:pre}}       the newest pre-release version, when the row has one
//   {{v:uar:deployed}}  the version deployed in production, when the row records one
//   {{v:uar:date}}      the date of the recorded release

import { existsSync, readFileSync } from "node:fs";

const PLACEHOLDER = /\{\{v:([a-z0-9-]+)(?::(pre|deployed|date))?\}\}/g;
const ANY_PLACEHOLDER = /\{\{v:[^}]*\}\}/g;

export function loadFacts(path) {
	if (!existsSync(path)) return null;
	const doc = JSON.parse(readFileSync(path, "utf8"));
	return new Map((doc.rows ?? []).map((r) => [r.id, r]));
}

function versionLine(row) {
	const v = row.version;
	if (v.kind === "untagged") return `no tagged release (last commit ${v.lastCommit})`;
	if (v.kind === "none" || v.kind === "unresolved") return null;
	return v.value;
}

function lookup(row, variant) {
	if (variant === "pre") return row.version.preRelease?.value ?? null;
	if (variant === "deployed") return row.deployed?.value ?? null;
	if (variant === "date") return row.version.date ?? null;
	return versionLine(row);
}

/** True when the text contains any {{v:...}} token. */
export function hasPlaceholders(text) {
	return text.includes("{{v:");
}

/**
 * Replaces every placeholder. Returns { text, errors }; an unknown product, an unknown form, a
 * variant the row does not have, or a missing facts file is an error and the token is left in place.
 */
export function resolvePlaceholders(text, facts, where) {
	const errors = [];
	if (!hasPlaceholders(text)) return { text, errors };
	if (!facts) {
		return { text, errors: [`${where}: uses {{v:...}} placeholders but docs/knowledge-source/product-facts.json was not found`] };
	}
	const resolved = text.replace(PLACEHOLDER, (token, id, variant) => {
		const row = facts.get(id);
		if (!row) {
			errors.push(`${where}: ${token} names an unknown product id`);
			return token;
		}
		const value = lookup(row, variant);
		if (value === null || value === undefined) {
			errors.push(`${where}: ${token} has no value in the facts file`);
			return token;
		}
		return value;
	});
	// Anything that still looks like a placeholder after resolution is malformed.
	for (const leftover of resolved.match(ANY_PLACEHOLDER) ?? []) {
		if (!errors.some((e) => e.includes(leftover))) errors.push(`${where}: malformed placeholder ${leftover}`);
	}
	return { text: resolved, errors };
}
