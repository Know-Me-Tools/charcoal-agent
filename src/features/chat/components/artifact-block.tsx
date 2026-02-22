import type { FC } from "react";
import { useState } from "react";
import {
  BoxIcon,
  ChevronDownIcon,
  CopyIcon,
  FileTextIcon,
  ImageIcon,
  MessageSquarePlusIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  return <Icon size={13} className={className} />;
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
  const isCodeArtifact = CODE_ARTIFACT_TYPES.has(artifactType);
  const preview = content.slice(0, 300);
  const isTruncated = content.length > 300;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className={cn(
        "my-2 overflow-hidden rounded-lg border bg-card",
        isInputRequest ? "border-primary/40" : "border-border/50",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/30 px-3 py-2">
        <ArtifactTypeIcon
          artifactType={artifactType}
          className={cn("shrink-0", isInputRequest ? "text-primary" : "text-muted-foreground")}
        />

        <div className="min-w-0 flex-1">
          <span className="block truncate font-mono text-[12px] font-medium text-foreground">
            {title || "Artifact"}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {isInputRequest ? "awaiting input · " : ""}{artifactType}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleCopy}
            title="Copy content"
          >
            <CopyIcon size={11} className={copied ? "text-success" : ""} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded((e) => !e)}
            aria-expanded={isExpanded}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <ChevronDownIcon
              size={13}
              className={cn("transition-transform duration-150", isExpanded && "rotate-180")}
            />
          </Button>
        </div>
      </div>

      {/* Content preview / expanded */}
      {isExpanded ? (
        <div className="p-3">
          {isCodeArtifact ? (
            <ShikiCodeBlock code={content} language={resolvedLang} className="text-[11px]" />
          ) : (
            <p className="whitespace-pre-wrap font-body text-[13px] leading-relaxed text-muted-foreground">
              {content}
            </p>
          )}
        </div>
      ) : (
        <div className="px-3 pb-3 pt-2">
          <p className="font-body text-[12px] leading-snug text-muted-foreground">
            {preview}
            {isTruncated && (
              <button
                type="button"
                className="ml-1 font-mono text-[11px] text-primary hover:underline"
                onClick={() => setIsExpanded(true)}
              >
                show more
              </button>
            )}
          </p>
        </div>
      )}

      {isInputRequest && (
        <div className="border-t border-primary/20 bg-primary/5 px-3 py-2">
          <p className="font-mono text-[11px] text-primary">
            {"// The agent is waiting for your input to continue."}
          </p>
        </div>
      )}
    </div>
  );
};
