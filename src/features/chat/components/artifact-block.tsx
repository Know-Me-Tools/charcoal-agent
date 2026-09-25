import type { FC } from "react";
import { useState } from "react";
import {
  BoxIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  FileTextIcon,
  HourglassIcon,
  ImageIcon,
  MessageSquarePlusIcon,
} from "lucide-react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { MermaidBlock } from "@/features/artifacts/mermaid-block";
import { ShikiCodeBlock } from "@/features/artifacts/shiki-code-block";
import { cn } from "@/lib/utils";

// ─── Artifact Type Icon ────────────────────────────────────────────────────────

const artifactTypeIcon: Record<string, typeof BoxIcon> = {
  ui: BoxIcon,
  logo: ImageIcon,
  image: ImageIcon,
  content: FileTextIcon,
  code: FileTextIcon,
  a2ui: BoxIcon,
  "meta-prompt": MessageSquarePlusIcon,
};

function ArtifactTypeIcon({
  artifactType,
  className,
}: {
  artifactType: string;
  className?: string;
}) {
  const Icon = artifactTypeIcon[artifactType] ?? FileTextIcon;
  return <Icon className={className} aria-hidden="true" />;
}

/** Metadata pill (design spec §5): a scope/type label, no icon, no status meaning. */
function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-pill bg-muted-surface px-2 py-0.5 font-mono text-xs text-fg-secondary">
      {children}
    </span>
  );
}

// ─── Code-like Artifact ────────────────────────────────────────────────────────

const CODE_ARTIFACT_TYPES = new Set(["code", "ui", "a2ui", "logo"]);
const CODE_LANGUAGES: Record<string, string> = {
  ui: "tsx",
  a2ui: "json",
  logo: "svg",
  code: "text",
};

// ─── Artifact Block ────────────────────────────────────────────────────────────

interface ArtifactBlockProps {
  artifactId: string;
  artifactType: string;
  title: string;
  content: string;
  language?: string;
  isInputRequest: boolean;
}

export const ArtifactBlock: FC<ArtifactBlockProps> = ({
  artifactType,
  title,
  content,
  language,
  isInputRequest,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const resolvedLang = language ?? CODE_LANGUAGES[artifactType] ?? "text";
  // A Mermaid diagram is routed by language, independent of artifactType (the
  // fixture's "Week flow" artifact carries artifactType "diagram"); previously
  // only CODE_ARTIFACT_TYPES were checked, so a diagram-typed Mermaid artifact
  // fell through to the plain-text preview and rendered its source verbatim.
  const isMermaidArtifact = language === "mermaid";
  const isCodeArtifact = CODE_ARTIFACT_TYPES.has(artifactType);
  const preview = content.slice(0, 300);
  const isTruncated = content.length > 300;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="my-3 first:mt-0 last:mb-0 min-w-0 overflow-hidden rounded-lg bg-surface">
      {/* Header */}
      <div className="flex items-start gap-2 bg-raised px-3 py-2">
        <ArtifactTypeIcon
          artifactType={artifactType}
          className="mt-1 size-3.5 shrink-0 text-fg-secondary"
        />

        <div className="min-w-0 flex-1">
          <span className="block font-display text-base font-semibold text-fg wrap-anywhere">
            {title || "Artifact"}
          </span>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <MetaPill>{artifactType}</MetaPill>
            {isInputRequest && (
              <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill bg-warning-soft px-2.5 py-1 font-ui text-xs font-semibold leading-none text-warning-text">
                <HourglassIcon className="size-3.5 shrink-0" aria-hidden="true" />
                <span>Awaiting input</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <TooltipIconButton tooltip="Copy content" onClick={handleCopy}>
            <CopyGlyph copied={copied} />
          </TooltipIconButton>

          {/*
            A Mermaid artifact renders its diagram in full below (no preview
            state to expand out of) — MermaidBlock supplies its own Source
            toggle, so this card has nothing left to expand or collapse.
          */}
          {!isMermaidArtifact && (
            <TooltipIconButton
              tooltip={isExpanded ? "Collapse" : "Expand"}
              aria-expanded={isExpanded}
              onClick={() => setIsExpanded((e) => !e)}
            >
              <ChevronGlyph expanded={isExpanded} />
            </TooltipIconButton>
          )}
        </div>
      </div>

      {/* Content: a Mermaid artifact always shows its rendered diagram (never
          the raw source as a text preview); other artifact types keep the
          collapsed-preview / expanded-detail toggle. */}
      {isMermaidArtifact ? (
        <div className="p-3">
          <MermaidBlock source={content} />
        </div>
      ) : isExpanded ? (
        <div className="p-3">
          {isCodeArtifact ? (
            <ShikiCodeBlock code={content} language={resolvedLang} />
          ) : (
            <p className="whitespace-pre-wrap font-body text-sm leading-relaxed text-fg-secondary wrap-break-word">
              {content}
            </p>
          )}
        </div>
      ) : (
        <div className="px-3 pt-2 pb-3">
          <p className="font-body text-sm leading-snug text-fg-secondary wrap-break-word">
            {preview}
            {isTruncated && (
              <button
                type="button"
                className="ml-1 font-ui text-xs font-semibold text-ember-text hover:underline focus-cue"
                onClick={() => setIsExpanded(true)}
              >
                Show more
              </button>
            )}
          </p>
        </div>
      )}

      {isInputRequest && (
        <div className="px-3 pb-3">
          <p className="font-body text-sm text-fg-secondary">
            The agent is waiting for your answer.
          </p>
        </div>
      )}
    </div>
  );
};

// Small inline glyphs kept local so the icon-only buttons above stay declarative.
function CopyGlyph({ copied }: { copied: boolean }) {
  return copied ? (
    <CheckIcon className="size-3.5 text-success-text" aria-hidden="true" />
  ) : (
    <CopyIcon className="size-3.5" aria-hidden="true" />
  );
}

function ChevronGlyph({ expanded }: { expanded: boolean }) {
  return (
    <ChevronDownIcon
      className={cn("size-3.5 transition-transform duration-150", expanded && "rotate-180")}
      aria-hidden="true"
    />
  );
}
