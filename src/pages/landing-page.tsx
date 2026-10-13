import { ArrowRight } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { KnowMeLockup } from "@/components/brand";
import { EMBER_CTA } from "@/components/site/ember-cta";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { isSiteBuild } from "@/hooks/use-site-config";
import { prefetchThreadRoutes } from "@/lib/route-chunks";
import { cn } from "@/lib/utils";
import { useChatIntentStore } from "@/stores/chat-intent-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { AI_DISCLOSURE_CONTENT } from "../../content/site/ai-disclosure";
import { LANDING_CONTENT } from "../../content/site/landing";
import { SITE_LANDING_CONTENT, type SiteLandingContent } from "../../content/site/landing-site";

/**
 * The public site build has its own front page copy: the app landing's
 * skills, "Open app" and desktop claims describe the app, not the site
 * (integration gate 08, B1). The app build keeps `LANDING_CONTENT`.
 */
function landingContent(): SiteLandingContent {
	return isSiteBuild() ? SITE_LANDING_CONTENT : LANDING_CONTENT;
}

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

	const siteBuild = isSiteBuild();
	const content = landingContent();
	const { line1, line2Lead, emberWord } = splitHeadline(content.headline);

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
							{/* The site header already carries the lockup; a second one 120px
							    below it is noise (design critique P2-4). The app landing keeps it. */}
							{!siteBuild && <KnowMeLockup variant="hero" />}
							<p className={cn("section-label", !siteBuild && "mt-8 md:mt-12")}>{content.eyebrow}</p>
							<h1
								id="hero-heading"
								className={cn(
									"mt-3 font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.035em] text-fg md:text-[3.25rem] lg:text-[3.5rem] xl:text-[4rem]",
									// 320px: keep "understands you." on one line instead of orphaning "you."
									siteBuild && "text-[1.75rem] sm:text-[2rem]",
								)}
							>
								{line1}
								<span className={cn("block", siteBuild && "whitespace-nowrap")}>
									{line2Lead}
									<span className="text-ember-text">{emberWord}</span>
								</span>
							</h1>
							<p className="mt-4 max-w-[58ch] font-body text-base font-normal leading-[1.7] text-fg-secondary md:mt-6 md:text-[1.0625rem]">
								{content.valueLine}
							</p>
						</div>

						<div className={cn("mt-8 w-full lg:mt-0 lg:max-w-none", !siteBuild && "md:max-w-xl")}>
							<form
								onSubmit={handleSubmit}
								className="rounded-xl bg-composer p-2 transition-hover focus-within:bg-raised has-[textarea:focus-visible]:outline-2 has-[textarea:focus-visible]:outline-offset-2 has-[textarea:focus-visible]:outline-ring"
							>
								<textarea
									ref={textareaRef}
									value={message}
									onChange={(event) => setMessage(event.target.value)}
									onKeyDown={handleKeyDown}
									onFocus={prefetchThreadRoutes}
									placeholder={content.composer.placeholder}
									aria-label={content.composer.placeholder}
									className="block max-h-[7.5rem] min-h-14 w-full field-sizing-content resize-none bg-transparent px-3 py-2.5 font-body text-base leading-relaxed text-fg caret-ember outline-none placeholder:text-faint lg:min-h-24"
								/>
								<div className="mt-1 flex items-center justify-end">
									<button type="submit" className={cn(EMBER_CTA, "h-10 px-4")}>
										{content.composer.sendLabel}
										<ArrowRight className="size-4" aria-hidden="true" />
									</button>
								</div>
							</form>
							{siteBuild && (
								<div className="mt-3 flex flex-col gap-0.5 px-1">
									<p className="font-mono text-xs text-faint">{AI_DISCLOSURE_CONTENT.label}</p>
									<p className="font-mono text-xs text-faint">{AI_DISCLOSURE_CONTENT.sensitiveDataHint}</p>
								</div>
							)}
						</div>
					</div>
				</section>

				{content.sections.map((section, index) => (
					<section
						key={section.id}
						aria-labelledby={`${section.id}-heading`}
						className={sectionBackground(index + 1)}
					>
						<div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:px-8 md:py-20 lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12 lg:px-12 lg:py-24">
							<div>
								{!siteBuild && (
									<p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary">
										{section.label}
									</p>
								)}
								<h2
									id={`${section.id}-heading`}
									className={cn(
										"text-balance font-display text-2xl font-bold leading-[1.15] tracking-[-0.02em] text-fg md:text-3xl",
										!siteBuild && "mt-3",
									)}
								>
									{section.heading}
								</h2>
							</div>
							<div className="mt-6 lg:mt-0">
								<div className="space-y-4">
									{section.link && (
										<p className="max-w-[62ch] font-body text-base leading-[1.7] text-fg">
											{section.link.lead}{" "}
											<a
												href={section.link.href}
												target="_blank"
												rel="noopener noreferrer"
												className="whitespace-nowrap rounded-sm font-semibold text-ember-text underline-offset-2 hover:underline focus-cue"
											>
												{section.link.label}
												<span className="sr-only"> {section.link.opensInNewTab}</span>
											</a>
											{section.link.trail}
										</p>
									)}
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
