import { Link } from "react-router-dom";
import { AskChip } from "@/components/site/ask-chip";
import { AskComposer } from "@/components/site/ask-composer";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { AI_DISCLOSURE_CONTENT } from "../../../../content/site/ai-disclosure";
import { PRODUCTS_COPY } from "../../../../content/site/products-copy";
import { ProductPlate } from "./product-plate";
import { ProductSources } from "./product-sources";
import type { ProductView } from "./product-data";

function Breadcrumb({ name }: { name: string }) {
	return (
		<nav aria-label={PRODUCTS_COPY.breadcrumbLabel}>
			<ol className="flex flex-wrap items-center font-ui text-sm font-semibold text-fg-secondary">
				<li>
					<Link
						to="/products"
						className="-ml-2 inline-flex min-h-11 items-center rounded-lg px-2 text-fg transition-hover hover:bg-hover focus-cue"
					>
						{PRODUCTS_COPY.breadcrumbRoot}
					</Link>
				</li>
				<li aria-hidden="true" className="mx-1.5 text-faint">
					/
				</li>
				<li aria-current="page">{name}</li>
			</ol>
		</nav>
	);
}

/**
 * The product page template (docs/design/product-directory.md section 4.1).
 * Status, version and the checked date come from the generated directory via
 * `view.entries`; the words come from `view.copy`.
 *
 * DOM order is visual order at every width: name, lead and plate; then the
 * conversation (questions, composer, disclosure); then the facts; then the
 * sources. From 1024 the conversation sits in the right column and stays in
 * view; the facts fill the left column under the plate.
 */
export function ProductPageView({ view }: { view: ProductView }) {
	const { copy, entries } = view;

	return (
		<div className="flex min-h-dvh flex-col bg-canvas">
			<SiteHeader />

			<main id="main" tabIndex={-1} className="flex-1 outline-none">
				<section aria-labelledby="product-heading" className="bg-canvas">
					<div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-16 sm:px-6 md:px-8 md:pt-8 md:pb-20 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-12 lg:px-12 lg:pt-10 lg:pb-24">
						<div className="lg:col-start-1 lg:row-start-1">
							<Breadcrumb name={copy.name} />
							<h1
								id="product-heading"
								className="mt-2 text-balance font-display text-[2.25rem] font-bold leading-[1.05] tracking-[-0.035em] text-fg md:text-[3.25rem] xl:text-[4rem]"
							>
								{copy.name}
							</h1>
							<p className="mt-4 max-w-[52ch] font-body text-[1.0625rem] leading-[1.65] text-fg-secondary md:text-[1.1875rem]">
								{copy.lead}
							</p>
							<ProductPlate entries={entries} partsLabel={PRODUCTS_COPY.componentsHeading} />
						</div>

						<section
							id="ask"
							aria-labelledby="ask-heading"
							className="mt-10 lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-start"
						>
							<h2
								id="ask-heading"
								className="font-display text-xl font-semibold tracking-[-0.015em] text-fg"
							>
								{PRODUCTS_COPY.questionsHeading}
							</h2>
							<ul className="mt-4 flex flex-col items-start gap-2">
								{copy.questions.map((question) => (
									<li key={question}>
										<AskChip prompt={question} />
									</li>
								))}
							</ul>
							<AskComposer
								className="mt-5"
								placeholder={PRODUCTS_COPY.composerPlaceholder.replace("{name}", copy.name)}
							/>
							<div className="mt-3 flex flex-col gap-0.5 px-1">
								<p className="font-mono text-xs text-faint">{AI_DISCLOSURE_CONTENT.label}</p>
								<p className="font-mono text-xs text-faint">{AI_DISCLOSURE_CONTENT.sensitiveDataHint}</p>
							</div>
						</section>

						<section
							aria-labelledby="facts-heading"
							className="mt-10 lg:col-start-1 lg:row-start-2 lg:mt-10"
						>
							<h2
								id="facts-heading"
								className="font-display text-xl font-semibold tracking-[-0.015em] text-fg"
							>
								{PRODUCTS_COPY.factsHeading}
							</h2>
							<dl className="mt-4 flex flex-col gap-2">
								{copy.facts.map((fact) => (
									<div
										key={fact.label}
										className="grid gap-1 rounded-lg bg-band px-4 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-baseline sm:gap-4"
									>
										<dt className="font-ui text-sm text-fg-secondary">{fact.label}</dt>
										<dd className="font-body text-[0.9375rem] leading-[1.6] text-fg">{fact.value}</dd>
									</div>
								))}
							</dl>
						</section>
					</div>
				</section>

				<ProductSources sources={copy.sources} />
			</main>

			<SiteFooter />
		</div>
	);
}
