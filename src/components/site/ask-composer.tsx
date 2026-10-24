import { ArrowRight } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useStartChat } from "@/hooks/use-start-chat";
import { prefetchThreadRoutes } from "@/lib/route-chunks";
import { cn } from "@/lib/utils";
import { ASK_COMPOSER_ATTRIBUTE } from "@/components/site/ask-composer-attribute";
import { EMBER_CTA } from "@/components/site/ember-cta";
import { ASK_CONCIERGE_CONTENT } from "../../../content/site/ask-concierge";

export interface AskComposerProps {
	/** Placeholder text, written by the page (for example "Ask about {name}"). */
	placeholder: string;
	/** Accessible name of the field. Defaults to the placeholder. */
	label?: string;
	className?: string;
}

/**
 * An inline one-line composer for product pages: submitting opens a new
 * concierge thread whose first message is the typed text. An empty submit
 * moves focus back to the field and starts nothing.
 */
export function AskComposer({ placeholder, label, className }: AskComposerProps) {
	const startChat = useStartChat();
	const [value, setValue] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = value.trim();
		if (!trimmed) {
			inputRef.current?.focus();
			return;
		}
		startChat(trimmed);
	};

	return (
		<form
			onSubmit={handleSubmit}
			className={cn(
				"flex items-center gap-2 rounded-xl bg-composer p-2 transition-hover focus-within:bg-raised has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring",
				className,
			)}
		>
			<Input
				ref={inputRef}
				{...{ [ASK_COMPOSER_ATTRIBUTE]: "" }}
				value={value}
				onChange={(event) => setValue(event.target.value)}
				onFocus={prefetchThreadRoutes}
				placeholder={placeholder}
				aria-label={label ?? placeholder}
				className="h-11 min-w-0 flex-1 border-0 bg-transparent px-3 font-body text-base text-fg caret-ember placeholder:text-faint focus-visible:ring-0 dark:bg-transparent"
			/>
			<button type="submit" className={cn(EMBER_CTA, "h-11 shrink-0 px-4")}>
				{ASK_CONCIERGE_CONTENT.composerSubmitLabel}
				<ArrowRight className="size-4" aria-hidden="true" />
			</button>
		</form>
	);
}
