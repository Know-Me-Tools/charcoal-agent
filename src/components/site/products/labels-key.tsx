import { StatusBadge } from "@/components/site/directory/status-badge";
import type { DirectoryStatus } from "../../../../content/site/directory-copy";
import { PRODUCTS_COPY } from "../../../../content/site/products-copy";

const ORDER: DirectoryStatus[] = ["released", "prerelease", "development", "prototype", "design", "assessment"];

/**
 * "What the labels mean": the six badges and their definitions. Linked from
 * the product list as `/products#labels`. The filled badges sit on a
 * `bg-tile` tile (docs/design/product-directory.md section 2.3).
 */
export function LabelsKey() {
	return (
		<section id="labels" aria-labelledby="labels-heading" className="bg-band">
			<div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 md:px-8 lg:grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-12 lg:px-12 lg:py-16">
				<h2 id="labels-heading" className="font-display text-xl font-semibold tracking-[-0.015em] text-fg">
					{PRODUCTS_COPY.labelsHeading}
				</h2>
				<dl className="mt-6 grid gap-3 md:grid-cols-2 lg:mt-0">
					{ORDER.map((status) => (
						<div key={status} className="rounded-lg bg-tile px-5 py-4">
							<dt>
								<StatusBadge status={status} />
							</dt>
							<dd className="mt-1.5 font-body text-[0.9375rem] leading-[1.6] text-fg-secondary">
								{PRODUCTS_COPY.labelDefinitions[status]}
							</dd>
						</div>
					))}
				</dl>
			</div>
		</section>
	);
}
