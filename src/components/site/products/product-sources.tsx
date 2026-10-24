import { PRODUCTS_COPY } from "../../../../content/site/products-copy";
import type { ProductSource } from "../../../../content/site/products";

/** "github.com/Prometheus-AGS/the-boss/releases": the link shown as text. */
function shown(url: string): string {
	return url.replace(/^https:\/\//, "").replace(/\/$/, "");
}

/**
 * The sources of a product page: public links only. A page whose only
 * sources are private repositories has none, and shows no empty section.
 */
export function ProductSources({ sources }: { sources: ProductSource[] }) {
	if (sources.length === 0) return null;
	return (
		<section aria-labelledby="sources-heading" className="bg-band">
			<div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:px-8 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:px-12 lg:py-16">
				<h2 id="sources-heading" className="font-display text-xl font-semibold tracking-[-0.015em] text-fg">
					{PRODUCTS_COPY.sourcesHeading}
				</h2>
				<ul className="mt-4 flex flex-col gap-1 lg:mt-0">
					{sources.map((source) => (
						<li key={source.url}>
							<a
								href={source.url}
								target="_blank"
								rel="noopener noreferrer"
								className="-ml-2 inline-flex min-h-11 flex-wrap items-center gap-x-3 gap-y-0.5 rounded-lg px-2 py-1 transition-hover hover:bg-hover focus-cue"
							>
								<span className="font-ui text-[0.9375rem] font-semibold text-fg">{source.label}</span>
								<span className="break-all font-mono text-xs text-fg-secondary">{shown(source.url)}</span>
								<span className="sr-only">{PRODUCTS_COPY.opensInNewTab}</span>
							</a>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
