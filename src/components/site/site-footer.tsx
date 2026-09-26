import { KnowMeLockup } from "@/components/brand";

/**
 * The public site footer: the footer lockup and the legal line, with the
 * build version. Shared by the landing and not-found pages
 * (docs/design/brand-pages.md section 5.2). No links, per operator
 * decision Q5.
 */
export function SiteFooter() {
	return (
		<footer className="bg-chrome">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between md:px-8 md:py-12 lg:px-12">
				<KnowMeLockup variant="footer" />
				<p className="font-mono text-xs text-faint">
					© 2026 KnowMe AI, LLC · v{__APP_VERSION__}
				</p>
			</div>
		</footer>
	);
}
