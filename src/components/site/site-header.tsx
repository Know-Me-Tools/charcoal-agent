import { ArrowRight, History, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { KnowMeLockup } from "@/components/brand";
import { AskConciergeEntry } from "@/components/site/ask-concierge-entry";
import { isSiteBuild } from "@/hooks/use-site-config";
import { useHasSavedChats } from "@/hooks/use-has-saved-chats";
import { useUi } from "@/hooks/use-ui";
import { HISTORY_LINK_CONTENT } from "../../../content/site/history-link";
import { LANDING_CONTENT } from "../../../content/site/landing";
import { PRODUCTS_COPY } from "../../../content/site/products-copy";

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
	const hasSavedChats = useHasSavedChats();

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
						className="-mx-1 inline-flex min-h-11 items-center rounded-lg px-1 py-1 focus-cue"
					>
						<KnowMeLockup variant="nav" />
					</Link>
					<div className="flex items-center gap-1">
						{/* "Products" from 640 px; below that the directory link and the
						    breadcrumb carry it (docs/design/product-directory.md section 5.3).
						    NavLink sets aria-current="page" on /products only (`end`). */}
						{isSiteBuild() && (
							<NavLink
								to="/products"
								end
								className="hidden h-11 items-center rounded-lg px-3 font-ui text-sm font-semibold text-fg transition-hover hover:bg-hover focus-cue sm:inline-flex"
								activeClassName="bg-ember-soft"
							>
								{PRODUCTS_COPY.navLabel}
							</NavLink>
						)}
						{isSiteBuild() && <AskConciergeEntry />}
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
						{/* No "Open app" on the public site build: there is no app to open
						    there, and the front page composer starts the conversation
						    (integration gate 08, B1). A visitor who already has saved
						    conversations in this browser gets a link to them. */}
						{!isSiteBuild() && (
							<Link
								to="/threads"
								className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 font-ui text-sm font-semibold text-fg transition-hover hover:bg-hover focus-cue sm:px-4"
							>
								{LANDING_CONTENT.nav.openAppLabel}
								<ArrowRight className="hidden size-4 sm:block" aria-hidden="true" />
							</Link>
						)}
						{isSiteBuild() && hasSavedChats && (
							<Link
								to="/threads"
								className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-3 font-ui text-sm font-semibold text-fg transition-hover hover:bg-hover focus-cue sm:px-4"
							>
								{/* Icon-only below 640 px so the header keeps room for the Ask entry
								    at 320 (docs/design/product-directory.md section 5.3). */}
								<History className="size-[1.125rem] sm:hidden" aria-hidden="true" />
								<span className="max-sm:sr-only">{HISTORY_LINK_CONTENT.label}</span>
								<ArrowRight className="hidden size-4 sm:block" aria-hidden="true" />
							</Link>
						)}
					</div>
				</div>
			</header>
		</>
	);
}
