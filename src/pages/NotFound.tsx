import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { EMBER_CTA } from "@/components/site/ember-cta";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { cn } from "@/lib/utils";
import { NOT_FOUND_CONTENT } from "../../content/site/not-found";

const NotFound = () => {
	const location = useLocation();

	useEffect(() => {
		console.error("404 Error: User attempted to access non-existent route:", location.pathname);
	}, [location.pathname]);

	return (
		<div className="flex min-h-dvh flex-col bg-canvas">
			<SiteHeader />

			<main id="main" tabIndex={-1} className="flex-1 outline-none">
				<div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 md:px-8 md:py-28 lg:px-12">
					<div className="max-w-2xl">
						<p className="break-all font-mono text-xs text-faint">{location.pathname}</p>
						<h1 className="mt-3 font-display text-[2rem] font-bold leading-[1.1] tracking-[-0.03em] text-fg md:text-[2.75rem]">
							{NOT_FOUND_CONTENT.heading}
						</h1>
						<p className="mt-4 max-w-[58ch] font-body text-base leading-[1.7] text-fg-secondary">
							{NOT_FOUND_CONTENT.body}
						</p>
						<Link to="/" className={cn(EMBER_CTA, "mt-8 h-11 px-5")}>
							{NOT_FOUND_CONTENT.ctaLabel}
						</Link>
					</div>
				</div>
			</main>

			<SiteFooter />
		</div>
	);
};

export default NotFound;
