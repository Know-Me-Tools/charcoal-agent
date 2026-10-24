import { AskChip } from "@/components/site/ask-chip";
import type { DirectoryLead } from "../../../../content/site/directory";
import { StatusBadge } from "./status-badge";
import { VersionLines } from "./version-lines";

/**
 * A tile for something that has (or will have) a product page. Single-row
 * tiles show the badge and version line; multi-row tiles list each row with
 * its own badge and never a roll-up (docs/design/product-directory.md 2.1).
 *
 * The title is plain text for now: `lead.slug` is the future page, kept in
 * the data, and the link ships with the product pages.
 */
export function DirectoryTile({ lead }: { lead: DirectoryLead }) {
	const titleId = `tile-${lead.slug}`;
	const single = lead.entries.length === 1 ? lead.entries[0] : null;

	return (
		<article
			aria-labelledby={titleId}
			data-directory-lead={lead.slug}
			data-directory-entry={single?.id}
			className="flex min-w-0 flex-col gap-3 rounded-lg bg-tile p-5 md:p-6"
		>
			<h4 id={titleId} className="font-display text-xl font-bold tracking-[-0.02em] text-fg">
				{lead.title}
			</h4>
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
