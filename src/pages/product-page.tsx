import { useParams } from "react-router-dom";
import { findProductView } from "@/components/site/products/product-data";
import { ProductPageView } from "@/components/site/products/product-view";
import { usePageHead } from "@/hooks/use-page-head";
import NotFound from "@/pages/NotFound";
import { PRODUCTS_COPY } from "../../content/site/products-copy";

/** `/products/:slug`: one of the ten product pages, or the not-found page. */
export default function ProductPage() {
	const { slug } = useParams();
	const view = findProductView(slug);
	return view ? <KnownProduct view={view} /> : <NotFound />;
}

function KnownProduct({ view }: { view: NonNullable<ReturnType<typeof findProductView>> }) {
	usePageHead({
		title: PRODUCTS_COPY.titleTemplate.replace("{name}", view.copy.name),
		description: view.copy.lead,
		canonical: `${PRODUCTS_COPY.siteOrigin}/products/${view.copy.slug}`,
	});
	return <ProductPageView view={view} />;
}
