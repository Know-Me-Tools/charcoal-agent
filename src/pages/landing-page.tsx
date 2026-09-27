import { ArrowRight } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KnowMeLockup } from "@/components/brand";
import { EMBER_CTA } from "@/components/site/ember-cta";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { cn } from "@/lib/utils";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { LANDING_CONTENT } from "../../content/site/landing";

/**
 * Splits the approved headline into the two-line, one-ember-word shape the
 * hero always renders: the first two words on line one, the last word in
 * ember on line two, with any remaining words plain. Derived from content
 * rather than hard-coded so the h1's `textContent` stays exactly the
 * approved tagline string (docs/design/brand-pages.md section 6.1).
 */
function splitHeadline(headline: string) {
	const words = headline.split(" ");
	const emberWord = words[words.length - 1];
	// Everything before the ember word — never includes it, so a two-word
	// (or one-word) tagline doesn't have its last word appear on both lines.
	const leadWords = words.slice(0, -1);
	const line1 = `${leadWords.slice(0, 2).join(" ")} `;
	const line2Lead = leadWords.slice(2).join(" ");
	return { line1, line2Lead: line2Lead ? `${line2Lead} ` : "", emberWord };
}

function sectionBackground(position: number): "bg-band" | "bg-canvas" {
	return position % 2 === 1 ? "bg-band" : "bg-canvas";
}

export default function LandingPage() {
	const [message, setMessage] = useState("");
	const navigate = useNavigate();
	const setPendingPrompt = useChatIntentStore((s) => s.setPendingPrompt);
	const registerThread = useThreadRegistryStore((s) => s.registerThread);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const { line1, line2Lead, emberWord } = splitHeadline(LANDING_CONTENT.headline);

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmed = message.trim();
		if (!trimmed) {
			textareaRef.current?.focus();
			return;
		}

		// Register the thread in the local registry as ephemeral before navigating.
		// It will be promoted to persisted once the first message reply arrives.
		const sessionId = crypto.randomUUID();
		registerThread(sessionId);

		// Write the prompt to the intent store BEFORE navigating so the thread
		// page can read it synchronously on first render without any race.
		setPendingPrompt(trimmed);
		navigate(`/threads/${sessionId}`);
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
			event.preventDefault();
			event.currentTarget.form?.requestSubmit();
		}
	};

	return (
		<div className="flex min-h-dvh flex-col bg-canvas">
			<SiteHeader />

			<main id="main" tabIndex={-1} className="flex-1 outline-none">
				<section aria-labelledby="hero-heading" className="bg-canvas">
					<div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-12 sm:px-6 md:px-8 md:pt-16 md:pb-20 lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-12 lg:px-12 lg:pt-24 lg:pb-24">
						<div className="md:max-w-2xl lg:max-w-none">
							<KnowMeLockup variant="hero" />
							<p className="section-label mt-8 md:mt-12">{LANDING_CONTENT.eyebrow}</p>
							<h1
								id="hero-heading"
								className="mt-3 font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.035em] text-fg md:text-[3.25rem] lg:text-[3.5rem] xl:text-[4rem]"
							>
								{line1}
								<span className="block">
									{line2Lead}
									<span className="text-ember-text">{emberWord}</span>
								</span>
							</h1>
							<p className="mt-4 max-w-[58ch] font-body text-base font-normal leading-[1.7] text-fg-secondary md:mt-6 md:text-[1.0625rem]">
								{LANDING_CONTENT.valueLine}
							</p>
						</div>

						<div className="mt-8 w-full md:max-w-xl lg:mt-0 lg:max-w-none">
							<form
								onSubmit={handleSubmit}
								className="rounded-xl bg-composer p-2 transition-hover focus-within:bg-raised has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-ring"
							>
								<textarea
									ref={textareaRef}
									value={message}
									onChange={(event) => setMessage(event.target.value)}
									onKeyDown={handleKeyDown}
									placeholder={LANDING_CONTENT.composer.placeholder}
									aria-label={LANDING_CONTENT.composer.placeholder}
									className="block max-h-[7.5rem] min-h-14 w-full field-sizing-content resize-none bg-transparent px-3 py-2.5 font-body text-base leading-relaxed text-fg caret-ember outline-none placeholder:text-faint lg:min-h-24"
								/>
								<div className="mt-1 flex items-center justify-end">
									<button type="submit" className={cn(EMBER_CTA, "h-10 px-4")}>
										{LANDING_CONTENT.composer.sendLabel}
										<ArrowRight className="size-4" aria-hidden="true" />
									</button>
								</div>
							</form>
						</div>
					</div>
				</section>

				{LANDING_CONTENT.sections.map((section, index) => (
					<section
						key={section.id}
						aria-labelledby={`${section.id}-heading`}
						className={sectionBackground(index + 1)}
					>
						<div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:px-8 md:py-20 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:px-12 lg:py-24">
							<div>
								<p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary">
									{section.label}
								</p>
								<h2
									id={`${section.id}-heading`}
									className="mt-3 text-balance font-display text-2xl font-bold leading-[1.15] tracking-[-0.02em] text-fg md:text-3xl"
								>
									{section.heading}
								</h2>
							</div>
							<div className="mt-6 lg:mt-0">
								<div className="space-y-4">
									{section.body.map((paragraph) => (
										<p
											key={paragraph}
											className="max-w-[62ch] font-body text-base leading-[1.7] text-fg"
										>
											{paragraph}
										</p>
									))}
								</div>
								{section.faq && section.faq.length > 0 && (
									<div className="mt-10 space-y-8">
										{section.faq.map((item) => (
											<div key={item.question}>
												<h3 className="font-display text-lg font-semibold tracking-[-0.01em] text-fg">
													{item.question}
												</h3>
												<p className="mt-2 max-w-[62ch] font-body text-base leading-[1.7] text-fg-secondary">
													{item.answer}
												</p>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</section>
				))}
			</main>

			<SiteFooter />
		</div>
	);
}
