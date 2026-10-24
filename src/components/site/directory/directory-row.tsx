import { AskChip } from "@/components/site/ask-chip";
import type { DirectoryEntry } from "../../../../content/site/directory";
import { ASK_CONCIERGE_CONTENT } from "../../../../content/site/ask-concierge";
import { StatusBadge } from "./status-badge";
import { VersionLines } from "./version-lines";

/**
 * One index row: name, badge, summary, version line and a short Ask chip.
 * Below 640 the chip shares the version line's row; from 640 it takes its own
 * column, centred on the entry (docs/design/product-directory.md section 3.3).
 */
export function DirectoryRow({ entry }: { entry: DirectoryEntry }) {
	return (
		<li
			data-directory-entry={entry.id}
			className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 gap-y-1 py-3.5 sm:items-center sm:gap-x-6 sm:py-4"
		>
			<div className="col-span-2 min-w-0 sm:col-span-1">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
					<span className="font-ui text-[0.9375rem] font-semibold text-fg">{entry.name}</span>
					<StatusBadge status={entry.status} />
				</div>
				<p className="mt-1 max-w-[60ch] font-body text-sm leading-[1.6] text-fg-secondary">{entry.summary}</p>
			</div>
			<p className="col-start-1 row-start-2 pb-2 sm:pb-0">
				<VersionLines lines={entry.versionLines} />
			</p>
			<AskChip
				prompt={entry.prompt}
				label={ASK_CONCIERGE_CONTENT.chipLabel}
				className="col-start-2 row-start-2 px-3 sm:row-span-2 sm:row-start-1"
			/>
		</li>
	);
}
