import { useId, useMemo, useRef, useState, type FC } from "react";
import {
  CheckIcon,
  Code2Icon,
  CopyIcon,
  EyeIcon,
  Maximize2Icon,
  Minimize2Icon,
} from "lucide-react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { isSiteBuild } from "@/hooks/use-site-config";
import { cn } from "@/lib/utils";
import { PREVIEW_NOTE_CONTENT } from "../../../content/site/preview-note";
import { toPreviewDocument } from "./preview-document";
import { hasPreviewScripts } from "./preview-scripts";
import { ShikiCodeBlock } from "./shiki-code-block";

interface HtmlArtifactCardProps {
  code: string;
  language?: "html" | "tsx" | "jsx" | "svg";
  title?: string;
  className?: string;
}

type ViewMode = "preview" | "code";

export const HtmlArtifactCard: FC<HtmlArtifactCardProps> = ({
  code,
  language = "html",
  title,
  className,
}) => {
  const [view, setView] = useState<ViewMode>("preview");
  const [isCopied, setIsCopied] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const fullScreenButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  // The isolating CSP meta goes into the document both frames load.
  const previewDocument = useMemo(() => toPreviewDocument(code), [code]);
  // The site's CSP blocks scripts inside the preview frame (task 3.5); say so
  // rather than show a page that silently does nothing. The app build sends
  // no such header, so its previews run scripts and need no note.
  const showScriptNote = useMemo(() => isSiteBuild() && hasPreviewScripts(code), [code]);
  const noteId = useId();
  const dialogNoteId = useId();

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    });
  };

  const displayTitle = title ?? `${language} artifact`;

  const segmentedToggle = (
    <div
      role="group"
      aria-label="Preview or code view"
      className="inline-flex shrink-0 rounded-md bg-muted-surface p-0.5"
    >
      <button
        type="button"
        onClick={() => setView("preview")}
        aria-pressed={view === "preview"}
        className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-ui text-xs font-semibold text-fg-secondary transition-hover hover:text-fg focus-cue aria-pressed:bg-ember-soft aria-pressed:text-fg"
      >
        <EyeIcon className="size-3.5" aria-hidden="true" />
        <span>Preview</span>
      </button>
      <button
        type="button"
        onClick={() => setView("code")}
        aria-pressed={view === "code"}
        className="inline-flex items-center gap-1 rounded-sm px-2 py-1 font-ui text-xs font-semibold text-fg-secondary transition-hover hover:text-fg focus-cue aria-pressed:bg-ember-soft aria-pressed:text-fg"
      >
        <Code2Icon className="size-3.5" aria-hidden="true" />
        <span>Code</span>
      </button>
    </div>
  );

  function scriptNote(id: string) {
    if (!showScriptNote) return null;
    return (
      <p id={id} className="bg-muted-surface px-3 py-1.5 font-ui text-xs text-fg-secondary">
        {PREVIEW_NOTE_CONTENT.scriptsBlocked}
      </p>
    );
  }

  function toolbar(inDialog: boolean) {
    return (
      <div className="flex flex-wrap items-center gap-2 bg-raised px-3 py-1.5">
        <span className="min-w-0 flex-1 font-mono text-xs text-fg wrap-anywhere">
          {displayTitle}
        </span>

        {segmentedToggle}

        <TooltipIconButton tooltip={isCopied ? "Copied" : "Copy code"} onClick={handleCopy}>
          {isCopied ? (
            <CheckIcon className="size-3.5 text-success-text" aria-hidden="true" />
          ) : (
            <CopyIcon className="size-3.5" aria-hidden="true" />
          )}
        </TooltipIconButton>

        <TooltipIconButton
          ref={inDialog ? undefined : fullScreenButtonRef}
          tooltip={inDialog ? "Exit full screen" : "Full screen"}
          onClick={() => setIsFullScreen((expanded) => !expanded)}
        >
          {inDialog ? (
            <Minimize2Icon className="size-3.5" aria-hidden="true" />
          ) : (
            <Maximize2Icon className="size-3.5" aria-hidden="true" />
          )}
        </TooltipIconButton>
      </div>
    );
  }

  return (
    <div className={cn("min-w-0 overflow-hidden rounded-lg bg-surface", className)}>
      {toolbar(false)}

      {view === "preview" && scriptNote(noteId)}
      {view === "preview" ? (
        <div className="h-80 bg-artifact-canvas">
          {/* Blanked while the full-screen dialog is open — otherwise the
              model-authored page would keep running in two frames at once. */}
          {!isFullScreen && (
            <iframe
              srcDoc={previewDocument}
              sandbox="allow-scripts"
              className="block h-full w-full border-0 scheme-light"
              title={displayTitle}
              aria-describedby={showScriptNote ? noteId : undefined}
            />
          )}
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <ShikiCodeBlock code={code} language={language} />
        </div>
      )}

      <Dialog
        open={isFullScreen}
        onOpenChange={(open) => {
          setIsFullScreen(open);
          if (!open) fullScreenButtonRef.current?.focus();
        }}
      >
        <DialogContent
          className="flex h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl bg-surface p-0 sm:max-w-[calc(100vw-2rem)]"
          aria-labelledby={titleId}
          showCloseButton={false}
        >
          <DialogTitle id={titleId} className="sr-only">
            {displayTitle}
          </DialogTitle>
          {toolbar(true)}
          {view === "preview" && scriptNote(dialogNoteId)}
          {view === "preview" ? (
            <div className="min-h-0 flex-1 bg-artifact-canvas">
              <iframe
                srcDoc={previewDocument}
                sandbox="allow-scripts"
                className="block h-full w-full border-0 scheme-light"
                title={displayTitle}
                aria-describedby={showScriptNote ? dialogNoteId : undefined}
              />
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ShikiCodeBlock code={code} language={language} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
