import { ProductsView } from "@/components/site/products/products-view";
import { usePageHead } from "@/hooks/use-page-head";
import { PRODUCTS_COPY } from "../../content/site/products-copy";

/** `/products`: the full directory with a family filter. */
export default function ProductsPage() {
	usePageHead({
		title: PRODUCTS_COPY.listTitle,
		description: PRODUCTS_COPY.listDescription,
		canonical: `${PRODUCTS_COPY.siteOrigin}/products`,
	});
	return <ProductsView />;
}
