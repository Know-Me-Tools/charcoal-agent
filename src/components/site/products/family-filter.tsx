import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRODUCTS_COPY } from "../../../../content/site/products-copy";

export interface FilterOption {
	/** `null` is "All". */
	slug: string | null;
	name: string;
	count: number;
}

export interface FamilyFilterProps {
	options: FilterOption[];
	selected: string | null;
	onSelect: (slug: string | null) => void;
}

/**
 * The family filter (docs/design/product-directory.md section 4.2): native
 * buttons in a labelled group, the pressed one marked by `aria-pressed`, a
 * check icon and the ember-soft fill. Below 640 px the group is one row that
 * scrolls inside itself, so the page never scrolls sideways; from 640 it wraps.
 */
export function FamilyFilter({ options, selected, onSelect }: FamilyFilterProps) {
	return (
		<div
			role="group"
			aria-label={PRODUCTS_COPY.filterGroupLabel}
			className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
		>
			{options.map((option) => {
				const pressed = option.slug === selected;
				return (
					<button
						key={option.slug ?? "all"}
						type="button"
						aria-pressed={pressed}
						onClick={() => onSelect(option.slug)}
						className={cn(
							"inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3.5 font-ui text-sm font-semibold transition-hover focus-cue",
							pressed ? "bg-ember-soft text-fg" : "bg-tile text-fg-secondary hover:bg-hover",
						)}
					>
						{pressed && <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />}
						{option.name}
						<span className={cn("font-mono text-xs font-medium", pressed ? "text-fg-secondary" : "text-faint")}>
							{option.count}
						</span>
					</button>
				);
			})}
		</div>
	);
}
