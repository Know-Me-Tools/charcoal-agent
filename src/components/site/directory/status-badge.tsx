import { CircleCheck, CircleQuestionMark, FlaskConical, Hammer, PencilRuler, Tag, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectoryStatus } from "../../../../content/site/directory-copy";
import { DIRECTORY_COPY } from "../../../../content/site/directory-copy";

const STATUS_ICON: Record<DirectoryStatus, LucideIcon> = {
	released: CircleCheck,
	prerelease: Tag,
	development: Hammer,
	prototype: FlaskConical,
	design: PencilRuler,
	assessment: CircleQuestionMark,
};

/**
 * Only Released and Pre-release get a fill; the rest are plain text so green
 * stands out (docs/design/product-directory.md section 2.1). A filled badge
 * only ever sits on `bg-tile` (section 2.3).
 */
const STATUS_TONE: Record<DirectoryStatus, string> = {
	released: "bg-success-soft px-2 text-success-text",
	prerelease: "bg-warning-soft px-2 text-warning-text",
	development: "px-0 text-fg-secondary",
	prototype: "px-0 text-fg-secondary",
	design: "px-0 text-fg-secondary",
	assessment: "px-0 text-fg-secondary",
};

export function StatusIcon({ status, className }: { status: DirectoryStatus; className?: string }) {
	const Icon = STATUS_ICON[status];
	return <Icon className={cn("size-3", className)} strokeWidth={2.25} aria-hidden="true" />;
}

/** Status as an icon and a text label, never colour alone. The label is the accessible name. */
export function StatusBadge({ status }: { status: DirectoryStatus }) {
	return (
		<span
			data-status={status}
			className={cn(
				"inline-flex h-6 items-center gap-1.5 rounded-pill font-ui text-xs font-semibold whitespace-nowrap",
				STATUS_TONE[status],
			)}
		>
			<StatusIcon status={status} />
			{DIRECTORY_COPY.statuses[status]}
		</span>
	);
}
