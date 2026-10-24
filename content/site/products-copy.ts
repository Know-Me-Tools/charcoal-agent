/**
 * DRAFT, pending operator approval (record in `docs/content/reviews/site-product-pages.md`).
 *
 * The page-level strings of `/products` and `/products/<slug>`: headings,
 * labels, the filter, the result line, the six label definitions and the
 * head metadata templates. The ten pages' own copy is `products.ts`; the
 * strings the home directory already carries are `directory-copy.ts`
 * (approved with site-home-directory); the AI disclosure lines are
 * `ai-disclosure.ts` and are reused unchanged.
 *
 * Wording rules: docs/design/product-directory.md sections 4 and 5.6. No
 * price, no compliance or certification claim, no hype adjective.
 */
import type { DirectoryStatus } from "./directory-copy";

export interface ProductsCopy {
	/** The site's public origin, for canonical and Open Graph URLs. */
	siteOrigin: string;
	/** The `/` directory link to the full list. */
	seeAll: string;
	/** Header nav link. */
	navLabel: string;

	// /products
	listHeading: string;
	listLead: string;
	filterGroupLabel: string;
	filterAll: string;
	/** `{n}` shown, `{total}` all public entries. */
	resultTemplate: string;
	labelsHeading: string;
	labelDefinitions: Record<DirectoryStatus, string>;
	listTitle: string;
	listDescription: string;

	// /products/<slug>
	breadcrumbLabel: string;
	breadcrumbRoot: string;
	factsHeading: string;
	componentsHeading: string;
	questionsHeading: string;
	sourcesHeading: string;
	/** Screen-reader suffix on a source link, which opens a new tab. */
	opensInNewTab: string;
	/** `{name}` is the display name. */
	composerPlaceholder: string;
	/** `{source}` and `{date}`. */
	checkedTemplate: string;
	/** What a version kind was checked against. */
	checkedSources: { release: string; registry: string; repository: string; portfolio: string };
	/** Joins two or more checked sources. */
	checkedJoin: string;
	/** `{name}`; the page `<title>`. */
	titleTemplate: string;
}

export const PRODUCTS_COPY: ProductsCopy = {
	siteOrigin: "https://know-me.tools",
	seeAll: "See all products",
	navLabel: "Products",

	listHeading: "Products",
	listLead:
		"Every product and project from KnowMe AI, LLC, with the status its own source gives. Ask the concierge about any of them.",
	filterGroupLabel: "Show family",
	filterAll: "All",
	resultTemplate: "Showing {n} of {total}",
	labelsHeading: "What the labels mean",
	labelDefinitions: {
		released: "A version has been published as a release or a package.",
		prerelease: "A version has been published and marked as a pre-release.",
		development: "Working source exists. No version has been released.",
		prototype: "A prototype or demonstration, not a finished product.",
		design: "Written designs or specifications. No implementation yet.",
		assessment: "Its scope or status is still being confirmed.",
	},
	listTitle: "Products · KnowMe AI, LLC",
	listDescription:
		"Every product and project from KnowMe AI, LLC, with the status its own source gives. Ask the concierge about any of them.",

	breadcrumbLabel: "Breadcrumb",
	breadcrumbRoot: "Products",
	factsHeading: "Key facts",
	componentsHeading: "Parts",
	questionsHeading: "Questions worth asking",
	sourcesHeading: "Sources",
	opensInNewTab: "(opens in a new tab)",
	composerPlaceholder: "Ask about {name}",
	checkedTemplate: "Checked against {source} on {date}",
	checkedSources: {
		release: "the release page",
		registry: "the registry",
		repository: "the repository",
		portfolio: "the portfolio",
	},
	checkedJoin: " and ",
	titleTemplate: "{name} · KnowMe AI, LLC",
};
