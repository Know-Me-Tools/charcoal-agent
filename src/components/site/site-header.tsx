import { ArrowRight, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { KnowMeLockup } from "@/components/brand";
import { useUi } from "@/hooks/use-ui";
import { LANDING_CONTENT } from "../../../content/site/landing";

/**
 * The public site header: skip link, brand lockup, theme toggle and the
 * "Open app" link. Shared by the landing and not-found pages
 * (docs/design/brand-pages.md section 5.1). The header controls are plain
 * elements with `focus-cue`, not the `Button` primitive — see the note in
 * `ember-cta.ts`.
 */
export function SiteHeader() {
	const { theme, setTheme } = useUi();
	const isDark = theme === "dark";

	return (
		<>
			<a
				href="#main"
				className="sr-only rounded-lg px-3 py-2 font-ui text-sm font-semibold text-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-100 focus-cue"
			>
				Skip to content
			</a>
			<header className="bg-chrome">
				<div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6 md:px-8 lg:px-12">
					<Link
						to="/"
						className="-mx-1 rounded-lg px-1 py-1 focus-cue"
					>
						<KnowMeLockup variant="nav" />
					</Link>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => setTheme(isDark ? "light" : "dark")}
							aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
							className="inline-flex size-11 items-center justify-center rounded-lg text-fg-secondary transition-hover hover:bg-hover hover:text-fg focus-cue"
						>
							{isDark ? (
								<Sun className="size-[1.125rem]" aria-hidden="true" />
							) : (
								<Moon className="size-[1.125rem]" aria-hidden="true" />
							)}
						</button>
						<Link
							to="/threads"
							className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 font-ui text-sm font-semibold text-fg transition-hover hover:bg-hover focus-cue sm:px-4"
						>
							{LANDING_CONTENT.nav.openAppLabel}
							<ArrowRight className="hidden size-4 sm:block" aria-hidden="true" />
						</Link>
					</div>
				</div>
			</header>
		</>
	);
}
