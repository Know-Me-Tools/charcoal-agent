import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { DirectoryFamily } from "@/components/site/directory/directory-family";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { DIRECTORY, type DirectoryFamily as DirectoryFamilyData } from "../../../../content/site/directory";
import { PRODUCTS_COPY } from "../../../../content/site/products-copy";
import { FamilyFilter, type FilterOption } from "./family-filter";
import { LabelsKey } from "./labels-key";

/** The URL parameter that carries the selected family. */
export const FAMILY_PARAM = "family";

function countOf(family: DirectoryFamilyData): number {
	return family.leads.reduce((n, lead) => n + lead.entries.length, 0) + family.rest.length;
}

/**
 * `/products`: all public entries, filterable by family. The selection lives
 * in `?family=<slug>` (written with replace, so it adds no history entries);
 * an unknown value reads as "All". Every family stays in the HTML and the
 * filter hides the others (docs/design/product-directory.md section 4.2).
 */
export function ProductsView() {
	const [params, setParams] = useSearchParams();
	const location = useLocation();
	const requested = params.get(FAMILY_PARAM);
	const selected = DIRECTORY.families.some((f) => f.slug === requested) ? requested : null;

	const options: FilterOption[] = [
		{ slug: null, name: PRODUCTS_COPY.filterAll, count: DIRECTORY.total },
		...DIRECTORY.families.map((family) => ({ slug: family.slug, name: family.name, count: countOf(family) })),
	];
	const shown = DIRECTORY.families
		.filter((family) => selected === null || family.slug === selected)
		.reduce((n, family) => n + countOf(family), 0);

	const select = (slug: string | null) => {
		setParams(
			(current) => {
				const next = new URLSearchParams(current);
				if (slug) next.set(FAMILY_PARAM, slug);
				else next.delete(FAMILY_PARAM);
				return next;
			},
			{ replace: true },
		);
	};

	// A link to /products#labels lands on the key even though the route
	// mounts after the browser's own hash scroll would have run.
	useEffect(() => {
		if (!location.hash) return;
		document.getElementById(location.hash.slice(1))?.scrollIntoView();
	}, [location.hash]);

	return (
		<div className="flex min-h-dvh flex-col bg-canvas">
			<SiteHeader />

			<main id="main" tabIndex={-1} className="flex-1 outline-none">
				<section aria-labelledby="products-heading" className="bg-canvas">
					<div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-16 sm:px-6 md:px-8 md:pt-16 md:pb-20 lg:px-12 lg:pb-24">
						<h1
							id="products-heading"
							className="text-balance font-display text-[2.25rem] font-bold leading-[1.05] tracking-[-0.035em] text-fg md:text-[3.25rem] xl:text-[3.5rem]"
						>
							{PRODUCTS_COPY.listHeading}
						</h1>
						<p className="mt-4 max-w-[58ch] font-body text-base leading-[1.7] text-fg-secondary md:text-[1.0625rem]">
							{PRODUCTS_COPY.listLead}
						</p>
						<FamilyFilter options={options} selected={selected} onSelect={select} />
						<p role="status" className="mt-4 font-mono text-xs text-faint">
							{PRODUCTS_COPY.resultTemplate.replace("{n}", String(shown)).replace("{total}", String(DIRECTORY.total))}
						</p>
						{DIRECTORY.families.map((family) => (
							<DirectoryFamily
								key={family.slug}
								family={family}
								headingLevel={2}
								collapse={false}
								hidden={selected !== null && selected !== family.slug}
							/>
						))}
					</div>
				</section>

				<LabelsKey />
			</main>

			<SiteFooter />
		</div>
	);
}
