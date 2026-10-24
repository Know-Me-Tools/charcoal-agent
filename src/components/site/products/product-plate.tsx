import { StatusBadge } from "@/components/site/directory/status-badge";
import { VersionLines } from "@/components/site/directory/version-lines";
import { cn } from "@/lib/utils";
import type { DirectoryEntry } from "../../../../content/site/directory";
import { checkedLine } from "./product-data";

/**
 * The status plate: the badge and version line(s) the directory generates,
 * with the line saying what they were checked against. A filled badge only
 * ever sits on `bg-tile` (docs/design/product-directory.md section 2.3).
 *
 * One row: badge, version, "Checked ...". Several rows (Flint platform,
 * Prometheus Skill Pack): each row's own name, badge, version and summary,
 * never one badge for the group (section 2.1).
 */
export function ProductPlate({ entries, partsLabel }: { entries: DirectoryEntry[]; partsLabel: string }) {
	const single = entries.length === 1 ? entries[0] : null;

	return (
		<div
			data-product-plate
			className={cn(
				"mt-6 flex max-w-full flex-col gap-3 rounded-lg bg-tile px-5 py-4",
				single ? "w-fit" : "w-full md:w-fit md:min-w-[28rem]",
			)}
		>
			{single ? (
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
					<StatusBadge status={single.status} />
					<div>
						<VersionLines lines={single.versionLines} />
					</div>
				</div>
			) : (
				<ul aria-label={partsLabel} className="flex flex-col gap-4">
					{entries.map((entry) => (
						<li key={entry.id} data-directory-entry={entry.id} className="flex flex-col gap-1">
							<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
								<span className="font-ui text-sm font-semibold text-fg">{entry.name}</span>
								<StatusBadge status={entry.status} />
								<div>
									<VersionLines lines={entry.versionLines} />
								</div>
							</div>
							<p className="max-w-[60ch] font-body text-sm leading-[1.6] text-fg-secondary">{entry.summary}</p>
						</li>
					))}
				</ul>
			)}
			<p className="font-mono text-xs text-faint">{checkedLine(entries)}</p>
		</div>
	);
}
