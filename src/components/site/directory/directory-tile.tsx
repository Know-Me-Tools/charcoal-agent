import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { AskChip } from "@/components/site/ask-chip";
import type { DirectoryLead } from "../../../../content/site/directory";
import { StatusBadge } from "./status-badge";
import { VersionLines } from "./version-lines";

export interface DirectoryTileProps {
	lead: DirectoryLead;
	/** `h4` under the home directory's `h3` family heading, `h3` under `/products`'s `h2`. */
	headingLevel?: 3 | 4;
}

/**
 * The title as a link to the product page. The arrow is bound to the last
 * word in a `whitespace-nowrap` span, so it is never stranded on its own line
 * (docs/design/product-directory.md section 3.3).
 */
function TitleLink({ lead }: { lead: DirectoryLead }) {
	const words = lead.title.split(" ");
	const last = words.pop() ?? "";
	return (
		<Link
			to={`/products/${lead.slug}`}
			className="-mx-1 -my-2.5 inline-block rounded-lg px-1 py-2.5 text-fg transition-hover hover:bg-hover focus-cue"
		>
			{words.length > 0 && `${words.join(" ")} `}
			<span className="whitespace-nowrap">
				{last}
				<ArrowRight className="ml-1.5 inline size-[0.8em] align-baseline" aria-hidden="true" />
			</span>
		</Link>
	);
}

/**
 * A tile for something that has a product page. Single-row tiles show the
 * badge and version line; multi-row tiles list each row with its own badge
 * and never a roll-up (docs/design/product-directory.md 2.1). The tile itself
 * is not a link: its title is, so there is no nested interactive content.
 */
export function DirectoryTile({ lead, headingLevel = 4 }: DirectoryTileProps) {
	const Heading = headingLevel === 3 ? "h3" : "h4";
	const titleId = `tile-${lead.slug}`;
	const single = lead.entries.length === 1 ? lead.entries[0] : null;

	return (
		<article
			aria-labelledby={titleId}
			data-directory-lead={lead.slug}
			data-directory-entry={single?.id}
			className="flex min-w-0 flex-col gap-3 rounded-lg bg-tile p-5 md:p-6"
		>
			<Heading id={titleId} className="font-display text-xl font-bold tracking-[-0.02em] text-fg">
				<TitleLink lead={lead} />
			</Heading>
			{single ? (
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
					<StatusBadge status={single.status} />
					<div>
						<VersionLines lines={single.versionLines} />
					</div>
				</div>
			) : (
				<ul className="flex flex-col gap-2.5">
					{lead.entries.map((entry) => (
						<li
							key={entry.id}
							data-directory-entry={entry.id}
							className="flex flex-wrap items-center gap-x-3 gap-y-1"
						>
							<span className="min-w-[9.5rem] font-ui text-sm font-semibold text-fg">{entry.name}</span>
							<StatusBadge status={entry.status} />
							<div>
								<VersionLines lines={entry.versionLines} />
							</div>
						</li>
					))}
				</ul>
			)}
			<p className="max-w-[60ch] font-body text-[0.9375rem] leading-[1.6] text-fg-secondary">{lead.summary}</p>
			<AskChip prompt={lead.question} className="mt-1 self-start" />
		</article>
	);
}
