import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { DIRECTORY } from "../../../../content/site/directory";
import { DIRECTORY_COPY } from "../../../../content/site/directory-copy";
import { PRODUCTS_COPY } from "../../../../content/site/products-copy";
import { DirectoryFamily } from "./directory-family";

/**
 * The home page directory: every public portfolio entry, grouped in six
 * families, each with its status, version line, one-line summary and an ask
 * chip (docs/design/product-directory.md section 3). It sits on the canvas
 * straight after the hero; the hero's bottom padding does the separating.
 */
export function ProductDirectory() {
	return (
		<section aria-labelledby="directory-heading" className="bg-canvas">
			<div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-16 sm:px-6 md:px-8 md:pb-20 lg:px-12 lg:pt-0 lg:pb-24">
				<div className="max-w-2xl">
					<h2
						id="directory-heading"
						className="text-balance font-display text-2xl font-bold leading-[1.15] tracking-[-0.02em] text-fg md:text-3xl"
					>
						{DIRECTORY_COPY.heading}
					</h2>
					<p className="mt-3 max-w-[58ch] font-body text-base leading-[1.7] text-fg-secondary md:text-[1.0625rem]">
						{DIRECTORY_COPY.lead.replace("{total}", String(DIRECTORY.total))}
					</p>
					<Link
						to="/products"
						className="-ml-3 mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-ui text-sm font-semibold text-fg transition-hover hover:bg-hover focus-cue"
					>
						{PRODUCTS_COPY.seeAll}
						<ArrowRight className="size-4" aria-hidden="true" />
					</Link>
				</div>
				{DIRECTORY.families.map((family) => (
					<DirectoryFamily key={family.slug} family={family} />
				))}
			</div>
		</section>
	);
}
