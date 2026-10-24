import { useEffect } from "react";

export interface PageHead {
	title: string;
	description: string;
	/** Absolute canonical URL. */
	canonical: string;
}

const META_KEYS = [
	'meta[name="description"]',
	'meta[property="og:title"]',
	'meta[property="og:description"]',
	'meta[property="og:url"]',
	'meta[name="twitter:title"]',
	'meta[name="twitter:description"]',
] as const;

function metaFor(selector: string): HTMLMetaElement {
	let element = document.head.querySelector<HTMLMetaElement>(selector);
	if (!element) {
		element = document.createElement("meta");
		const match = /\[(name|property)="([^"]+)"\]/.exec(selector);
		if (match) element.setAttribute(match[1], match[2]);
		document.head.appendChild(element);
	}
	return element;
}

/**
 * Sets the document title, description, canonical link and Open Graph / Twitter
 * text for a page while it is mounted, and puts back what was there when it
 * unmounts. This runs in the browser after the app mounts; crawlers that do
 * not run scripts read the static head from `index.html` until the routes are
 * prerendered (change site-seo-prerender).
 */
export function usePageHead({ title, description, canonical }: PageHead): void {
	useEffect(() => {
		const previousTitle = document.title;
		const previous = new Map<string, string | null>();
		for (const selector of META_KEYS) {
			previous.set(selector, document.head.querySelector<HTMLMetaElement>(selector)?.getAttribute("content") ?? null);
		}
		let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
		const createdLink = !link;
		const previousHref = link?.getAttribute("href") ?? null;
		if (!link) {
			link = document.createElement("link");
			link.setAttribute("rel", "canonical");
			document.head.appendChild(link);
		}

		document.title = title;
		metaFor('meta[name="description"]').setAttribute("content", description);
		metaFor('meta[property="og:title"]').setAttribute("content", title);
		metaFor('meta[property="og:description"]').setAttribute("content", description);
		metaFor('meta[property="og:url"]').setAttribute("content", canonical);
		metaFor('meta[name="twitter:title"]').setAttribute("content", title);
		metaFor('meta[name="twitter:description"]').setAttribute("content", description);
		link.setAttribute("href", canonical);

		return () => {
			document.title = previousTitle;
			for (const selector of META_KEYS) {
				const element = document.head.querySelector<HTMLMetaElement>(selector);
				const before = previous.get(selector) ?? null;
				if (!element) continue;
				if (before === null) element.remove();
				else element.setAttribute("content", before);
			}
			if (createdLink) link?.remove();
			else if (previousHref !== null) link?.setAttribute("href", previousHref);
		};
	}, [title, description, canonical]);
}
