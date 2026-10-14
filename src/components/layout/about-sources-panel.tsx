import { useEffect, useId, useRef } from "react";
import { useParams } from "react-router-dom";
import { BookOpenIcon, ExternalLinkIcon, GlobeIcon, XIcon } from "lucide-react";
import { useCloseWithLayout } from "@/hooks/use-close-with-layout";
import { useThreadCitations, type ThreadCitation } from "@/hooks/use-thread-citations";
import { useUi } from "@/hooks/use-ui";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { citationDisplayName, citationMarkerLabel } from "@/features/chat/citation-text";
import { isAllowedLink } from "@/lib/link-policy/is-allowed-link";
import { EXTERNAL_LINK_PROPS, normalizeHttpsUrl } from "@/lib/link-policy/cited-web-url";
import { ABOUT_PANEL_CONTENT } from "../../../content/site/about-panel";
import { WEB_SEARCH_CONTENT } from "../../../content/site/web-search";

/**
 * The public site's right-hand panel (site-shell-about-panel-and-empty-state,
 * task 6.2). It replaces the app's agent Context panel on the site build:
 * the sources the open conversation has cited, and what this assistant is.
 * Closed by default; the top-bar toggle opens it inline on wide screens and
 * as a sheet below the wide breakpoint.
 */

/** Ids shared with the top-bar toggle for `aria-controls` and focus return. */
export const ABOUT_PANEL_ID = "about-sources-panel";
export const ABOUT_TOGGLE_ID = "about-sources-toggle";

const SECTION_HEADING = "font-display text-sm font-semibold text-fg";

function SourceItem({ citation }: { citation: ThreadCitation }) {
  const { url } = citation;
  const isWeb = citation.origin === "web";
  // Same rule as the citation cards (FR-16): a knowledge-base URL is clickable
  // only when allowlisted, otherwise its destination stays visible as text. A
  // web source's URL is minted by the server (https, no userinfo), so it is a
  // link, and its destination is shown inside the link.
  const webHref = isWeb && url ? normalizeHttpsUrl(url) : null;
  const href = webHref ?? (url && isAllowedLink(url) ? url : null);
  const isLinkAllowed = href !== null;

  const body = (
    <span className="flex min-w-0 items-start gap-2">
      {isWeb ? (
        <GlobeIcon className="mt-0.5 size-3.5 shrink-0 text-cyan-text" aria-hidden="true" />
      ) : (
        <BookOpenIcon className="mt-0.5 size-3.5 shrink-0 text-cyan-text" aria-hidden="true" />
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-1.5">
          {isWeb && (
            <span className="font-ui text-xs font-semibold text-cyan-text">{WEB_SEARCH_CONTENT.sourceLabel}</span>
          )}
          <span className="font-mono text-xs font-semibold text-cyan-text">
            {citation.indices.map((n) => citationMarkerLabel(n, citation.origin)).join(" ")}
          </span>
          <span className="min-w-0 font-ui text-sm font-semibold text-fg wrap-anywhere">
            {citationDisplayName(citation.source)}
          </span>
          {isLinkAllowed && <ExternalLinkIcon className="size-3.5 shrink-0 text-cyan-text" aria-hidden="true" />}
        </span>
        {isWeb && citation.host && (
          <span className="font-mono text-xs break-all text-fg-secondary wrap-anywhere">{citation.host}</span>
        )}
        {webHref !== null && (
          <span className="font-mono text-xs break-all text-cyan-text underline underline-offset-2 wrap-anywhere">
            {webHref}
          </span>
        )}
        {url && !isLinkAllowed && (
          <span className="font-mono text-xs break-all text-fg-secondary wrap-anywhere">{url}</span>
        )}
      </span>
    </span>
  );

  return (
    <li>
      {isLinkAllowed ? (
        <a
          href={href}
          {...EXTERNAL_LINK_PROPS}
          className="block rounded-lg bg-cyan-soft px-3 py-2 transition-hover hover:bg-hover focus-cue"
        >
          {body}
          <span className="sr-only"> {ABOUT_PANEL_CONTENT.sources.opensInNewTab}</span>
        </a>
      ) : (
        <div className="rounded-lg bg-cyan-soft px-3 py-2">{body}</div>
      )}
    </li>
  );
}

/** Sources and About sections; shared by the inline panel and the sheet. */
function AboutSourcesBody() {
  const { id } = useParams<{ id: string }>();
  const citations = useThreadCitations(id);
  const sourcesHeadingId = useId();
  const aboutHeadingId = useId();
  const { sources, about } = ABOUT_PANEL_CONTENT;

  return (
    <div className="flex flex-col gap-8 px-4 pt-2 pb-6">
      <section aria-labelledby={sourcesHeadingId}>
        <h3 id={sourcesHeadingId} className={SECTION_HEADING}>
          {sources.heading}
        </h3>
        {citations.length === 0 ? (
          <p className="mt-2 font-body text-sm leading-relaxed text-fg-secondary">{sources.empty}</p>
        ) : (
          <ol aria-labelledby={sourcesHeadingId} className="mt-3 flex flex-col gap-2">
            {citations.map((citation) => (
              <SourceItem key={`${citation.origin}-${citation.source}-${citation.url ?? ""}`} citation={citation} />
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby={aboutHeadingId}>
        <h3 id={aboutHeadingId} className={SECTION_HEADING}>
          {about.heading}
        </h3>
        <div className="mt-2 flex flex-col gap-3 font-body text-sm leading-relaxed text-fg-secondary">
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <p>
            {about.theBoss.lead}{" "}
            <a
              href={about.theBoss.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-sm font-semibold whitespace-nowrap text-ember-text underline-offset-2 hover:underline focus-cue"
            >
              {about.theBoss.label}
              <span className="sr-only"> {sources.opensInNewTab}</span>
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

/** Inline panel for wide screens (≥1280px); rendered only while open. */
export function AboutSourcesPanel() {
  const { aboutPanelOpen, setAboutPanelOpen } = useUi();
  if (!aboutPanelOpen) return null;
  return <OpenAboutSourcesPanel onClose={() => setAboutPanelOpen(false)} />;
}

function OpenAboutSourcesPanel({ onClose }: { onClose: () => void }) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Opened from the top-bar toggle: move keyboard focus into the panel. Not
  // on other mounts (e.g. the window widening), so focus is never stolen.
  useEffect(() => {
    if (document.activeElement?.id === ABOUT_TOGGLE_ID) titleRef.current?.focus();
  }, []);

  const close = () => {
    onClose();
    document.getElementById(ABOUT_TOGGLE_ID)?.focus();
  };

  return (
    <aside
      id={ABOUT_PANEL_ID}
      aria-label={ABOUT_PANEL_CONTENT.title}
      className="flex h-full w-[320px] shrink-0 flex-col bg-surface"
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-1">
        <h2
          ref={titleRef}
          tabIndex={-1}
          className="rounded-sm font-ui text-xs font-semibold uppercase tracking-[0.12em] text-fg-secondary outline-none focus-cue"
        >
          {ABOUT_PANEL_CONTENT.title}
        </h2>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={ABOUT_PANEL_CONTENT.closeLabel}
          onClick={close}
          className="text-muted-foreground hover:bg-hover hover:text-foreground focus-cue"
        >
          <XIcon aria-hidden="true" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <AboutSourcesBody />
      </div>
    </aside>
  );
}

/** The same panel as a right-hand sheet below 1280px. Base UI traps focus, closes on Esc and returns focus. */
export function AboutSourcesSheet() {
  const { contextSheetOpen, setContextSheetOpen } = useUi();
  useCloseWithLayout(setContextSheetOpen);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // P1-4: the sheet opened scrolled to a later link. Start at the title (the
  // inline panel already focuses its title) and at the top of the scroller.
  const resetScroll = (node: HTMLDivElement | null) => {
    if (node) node.scrollTop = 0;
  };

  return (
    <Sheet open={contextSheetOpen} onOpenChange={setContextSheetOpen}>
      <SheetContent
        side="right"
        closeLabel={ABOUT_PANEL_CONTENT.closeLabel}
        className="w-[320px] bg-surface"
        initialFocus={titleRef}
      >
        <SheetHeader>
          <SheetTitle ref={titleRef} tabIndex={-1} className="rounded-sm outline-none focus-cue">
            {ABOUT_PANEL_CONTENT.title}
          </SheetTitle>
        </SheetHeader>
        <div ref={resetScroll} className="flex-1 overflow-y-auto">
          <AboutSourcesBody />
        </div>
      </SheetContent>
    </Sheet>
  );
}
