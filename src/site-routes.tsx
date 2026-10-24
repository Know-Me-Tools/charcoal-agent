import type { ComponentType } from "react";
import type { RouteObject } from "react-router-dom";
import { isSiteBuild } from "@/hooks/use-site-config";

/** Shown while a route chunk loads on a direct visit; the canvas, so the page does not flash. */
const fallback = <div className="min-h-dvh bg-canvas" />;

const page = (load: () => Promise<{ default: ComponentType }>) => ({
	lazy: async () => ({ Component: (await load()).default }),
});

/**
 * The product pages exist on the public site build only. The app build
 * (`/threads`, `/agents`, `/settings`) has no `/products` routes, so a link to
 * one there falls through to the catch-all not-found route. Read per call, not
 * at import, so a test can switch the flag.
 *
 * Both routes are lazy: the front page stays in the entry chunk, and the
 * product data loads only for a visitor who opens a product. An unknown slug
 * renders the not-found page inside `/products/:slug`.
 */
export function siteRoutes(): RouteObject[] {
	if (!isSiteBuild()) return [];
	return [
		{ path: "/products", ...page(() => import("@/pages/products-page")), hydrateFallbackElement: fallback },
		{ path: "/products/:slug", ...page(() => import("@/pages/product-page")), hydrateFallbackElement: fallback },
	];
}
