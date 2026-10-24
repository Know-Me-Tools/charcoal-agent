import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { AskChip } from "@/components/site/ask-chip";
import { cn } from "@/lib/utils";
import { DIRECTORY_COPY, type DirectoryStatus } from "../../../../content/site/directory-copy";
import type { DirectoryFamily as DirectoryFamilyData } from "../../../../content/site/directory";
import { DirectoryRow } from "./directory-row";
import { DirectoryTile } from "./directory-tile";
import { StatusIcon } from "./status-badge";

/** More than this many index rows collapse to `VISIBLE_ROWS` behind a button (brief 3.3). */
const COLLAPSE_ABOVE = 3;
const VISIBLE_ROWS = 2;
const STATUS_ORDER: DirectoryStatus[] = ["released", "prerelease", "development", "prototype", "design", "assessment"];

function leadsLayout(count: number): string {
	if (count <= 1) return "grid gap-3";
	// Two or three tiles: two columns from 768; with three, the first spans both.
	return cn("grid gap-3 md:grid-cols-2", count === 3 && "md:[&>*:first-child]:col-span-2");
}

/** The family's status mix: icon, label and count, no fill. The scan line before any tile. */
function StatusMix({ family, count }: { family: DirectoryFamilyData; count: number }) {
	const entries = [...family.leads.flatMap((l) => l.entries), ...family.rest];
	return (
		<ul
			aria-label={DIRECTORY_COPY.statusMixLabel.replace("{n}", String(count))}
			className="mt-3 flex flex-wrap gap-x-4 gap-y-1 lg:flex-col lg:gap-y-1.5"
		>
			{STATUS_ORDER.map((status) => {
				const n = entries.filter((e) => e.status === status).length;
				if (n === 0) return null;
				return (
					<li
						key={status}
						className="inline-flex items-center gap-1.5 font-ui text-xs font-semibold text-fg-secondary"
					>
						<StatusIcon status={status} />
						{DIRECTORY_COPY.statuses[status]}
						<span className="font-mono font-medium text-faint">{n}</span>
					</li>
				);
			})}
		</ul>
	);
}

/**
 * One family: the head (name, count, line, status mix) beside its tiles and
 * index rows. From 1024 the head is sticky so the name stays with its entries.
 * Rows past the first two are rendered but `hidden`, so the HTML holds every
 * entry (docs/design/product-directory.md section 3.3).
 */
export function DirectoryFamily({ family }: { family: DirectoryFamilyData }) {
	const [open, setOpen] = useState(false);
	const headingId = `directory-${family.slug}-heading`;
	const moreId = `directory-${family.slug}-more`;
	const count = family.leads.reduce((n, l) => n + l.entries.length, 0) + family.rest.length;
	const collapsible = family.rest.length > COLLAPSE_ABOVE;
	const shown = collapsible ? family.rest.slice(0, VISIBLE_ROWS) : family.rest;
	const more = collapsible ? family.rest.slice(VISIBLE_ROWS) : [];

	return (
		<section
			id={family.slug}
			aria-labelledby={headingId}
			className="mt-12 lg:mt-16 lg:grid lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:items-start lg:gap-12"
		>
			<div className="lg:sticky lg:top-6">
				<h3
					id={headingId}
					className="font-display text-xl font-semibold leading-[1.2] tracking-[-0.015em] text-fg md:text-[1.375rem]"
				>
					{family.name}{" "}
					<span className="ml-1 font-mono text-sm font-medium tracking-normal text-faint">{count}</span>
				</h3>
				<p className="mt-1.5 max-w-[40ch] font-body text-[0.9375rem] leading-[1.6] text-fg-secondary">
					{family.line}
				</p>
				<StatusMix family={family} count={count} />
			</div>

			<div className="mt-5 flex min-w-0 flex-col gap-3 lg:mt-0">
				{family.leads.length > 0 && (
					<div className={leadsLayout(family.leads.length)}>
						{family.leads.map((lead) => (
							<DirectoryTile key={lead.slug} lead={lead} />
						))}
					</div>
				)}
				{family.rest.length > 0 && (
					<div className="rounded-lg bg-tile px-5 py-1 md:px-6">
						<ul>
							{shown.map((entry) => (
								<DirectoryRow key={entry.id} entry={entry} />
							))}
						</ul>
						{more.length > 0 && (
							<>
								<div id={moreId} hidden={!open}>
									<ul>
										{more.map((entry) => (
											<DirectoryRow key={entry.id} entry={entry} />
										))}
									</ul>
								</div>
								<button
									type="button"
									aria-expanded={open}
									aria-controls={moreId}
									onClick={() => setOpen((v) => !v)}
									className="-ml-3 mb-2 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-left font-ui text-sm font-semibold text-fg transition-hover hover:bg-hover focus-cue"
								>
									<ChevronDown
										className={cn("size-4 shrink-0 motion-safe:transition-transform motion-safe:duration-150", open && "rotate-180")}
										aria-hidden="true"
									/>
									{open
										? DIRECTORY_COPY.showFewer
										: DIRECTORY_COPY.showMoreTemplate
												.replace("{n}", String(more.length))
												.replace("{family}", family.name)}
								</button>
							</>
						)}
					</div>
				)}
			</div>
		</section>
	);
}
