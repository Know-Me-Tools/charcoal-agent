import { CheckCircle2Icon, Loader2Icon, PanelTopOpenIcon, SendIcon } from "lucide-react";
import { type FC, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MermaidBlock } from "@/features/artifacts/mermaid-block";
import { buildUrl, buildHeaders } from "@/lib/api-client";
import { cn } from "@/lib/utils";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function readString(obj: Record<string, unknown>, key: string): string | null {
  const value = obj[key];
  return typeof value === "string" ? value : null;
}

/**
 * Two distinct failure sources were sharing one "Your response was not
 * sent" message: a real send failure (the fetch to UAR failed) and a local
 * JSON-parse failure (the user's typed JSON in the form/raw-JSON textarea
 * doesn't parse — nothing was ever sent). Each gets its own accurate copy.
 */
type A2uiErrorKind = "send" | "parse";
const A2UI_ERROR_MESSAGES: Record<A2uiErrorKind, string> = {
  send: "Your response was not sent. Try again.",
  parse: "That response isn't valid JSON. Fix it and try again.",
};

/**
 * Base UI field primitives (Input/Textarea/SelectTrigger) still draw an
 * outline of their own (deferred to brand-fidelity-audit); override it here
 * per the design spec so A2UI fields read as filled, borderless controls.
 */
const FIELD_CLASSES =
  "border-0 bg-muted-surface text-fg placeholder:text-faint focus-visible:ring-0 focus-cue";

interface A2uiInputBlockProps {
  runId: string;
  artifactId: string;
  artifactType: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  status: "running" | "complete" | "failed";
  result?: string;
}

export const A2uiInputBlock: FC<A2uiInputBlockProps> = ({
  runId,
  artifactId,
  artifactType,
  title,
  content,
  metadata,
  status: _status,
  result,
}) => {
  const contentObj = useMemo(() => parseJsonObject(content), [content]);
  const inputObj = contentObj ?? metadata;

  const [textValue, setTextValue] = useState(readString(inputObj, "text") ?? "");
  const [selectValue, setSelectValue] = useState("");
  const [formJson, setFormJson] = useState("{}");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorKind, setErrorKind] = useState<A2uiErrorKind | null>(null);

  const baseId = useId();
  const selectFieldId = `${baseId}-select`;
  const textFieldId = `${baseId}-text`;

  const options = useMemo(() => {
    const raw = inputObj.options;
    if (!Array.isArray(raw)) return [] as Array<{ value: string; label: string }>;
    return raw
      .map((item) => (isRecord(item) ? item : null))
      .filter((item): item is Record<string, unknown> => item !== null)
      .map((item) => {
        const value = typeof item.value === "string" ? item.value : "";
        const label = typeof item.label === "string" ? item.label : value;
        return { value, label };
      })
      .filter((item) => item.value.length > 0);
  }, [inputObj]);

  const confirmMessage =
    readString(inputObj, "message") ?? readString(inputObj, "prompt") ?? "Please confirm";
  const acceptLabel = readString(inputObj, "accept_label") ?? "Accept";
  const cancelLabel = readString(inputObj, "cancel_label") ?? "Cancel";
  const prompt = readString(inputObj, "prompt") ?? "Provide input";
  const placeholder = readString(inputObj, "placeholder") ?? "";
  const multiline = inputObj.multiline === true;

  const submitResponse = async (response: Record<string, unknown>) => {
    setSubmitting(true);
    setErrorKind(null);
    try {
      const res = await fetch(
        buildUrl(`/api/uar/runs/${encodeURIComponent(runId)}/artifact-response`),
        {
          method: "POST",
          headers: buildHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ artifact_id: artifactId, response }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSubmitted(true);
    } catch {
      // Never surface the server body to the user (design spec §7.11).
      setErrorKind("send");
    } finally {
      setSubmitting(false);
    }
  };

  // "Response captured" and the disabled state reflect a real response, not
  // merely that the request finished streaming. The part's `status` becomes
  // "complete" once the stream ends even when the user has not answered yet
  // (the defect this replaces), so it is intentionally excluded here.
  const hasResponse = typeof result === "string" && result.trim().length > 0;
  const isCaptured = submitted || hasResponse;
  const inputsDisabled = submitting || isCaptured;

  return (
    <div className="my-3 first:mt-0 last:mb-0 min-w-0 rounded-lg bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <PanelTopOpenIcon className="size-3.5 shrink-0 text-cyan-text" aria-hidden="true" />
        <span className="font-ui text-xs font-semibold text-cyan-text">Input requested</span>
        <span className="ms-auto inline-flex shrink-0 items-center rounded-pill bg-muted-surface px-2 py-0.5 font-mono text-xs text-fg-secondary">
          {artifactType}
        </span>
      </div>

      <p className="font-display text-base font-semibold text-fg wrap-anywhere">
        {title || "User input required"}
      </p>

      {artifactType === "confirm" && (
        <div className="mt-2 flex flex-col gap-2">
          <p className="font-body text-sm text-fg-secondary">{confirmMessage}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={inputsDisabled}
              onClick={() => void submitResponse({ accepted: true })}
            >
              {acceptLabel}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={inputsDisabled}
              onClick={() => void submitResponse({ accepted: false })}
            >
              {cancelLabel}
            </Button>
          </div>
        </div>
      )}

      {artifactType === "select" && (
        <div className="mt-2 flex flex-col gap-2">
          <Label htmlFor={selectFieldId} className="font-body text-sm font-normal text-fg-secondary">
            {prompt}
          </Label>
          {options.length > 0 ? (
            <Select
              value={selectValue === "" ? null : selectValue}
              items={options}
              onValueChange={(v) => setSelectValue(v ?? "")}
              disabled={inputsDisabled}
            >
              <SelectTrigger id={selectFieldId} className={cn("h-9 w-full", FIELD_CLASSES)}>
                <SelectValue placeholder="Choose an option" />
              </SelectTrigger>
              <SelectContent>
                {options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="font-mono text-xs text-faint">No options defined for this select.</p>
          )}
          <Button
            type="button"
            size="sm"
            disabled={!selectValue || inputsDisabled}
            onClick={() => void submitResponse({ value: selectValue })}
          >
            <SendIcon className="me-1 size-3.5" aria-hidden="true" />
            Submit
          </Button>
        </div>
      )}

      {artifactType === "text_input" && (
        <div className="mt-2 flex flex-col gap-2">
          <Label htmlFor={textFieldId} className="font-body text-sm font-normal text-fg-secondary">
            {prompt}
          </Label>
          {multiline ? (
            <Textarea
              id={textFieldId}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={placeholder}
              disabled={inputsDisabled}
              rows={4}
              className={FIELD_CLASSES}
            />
          ) : (
            <Input
              id={textFieldId}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={placeholder}
              disabled={inputsDisabled}
              className={FIELD_CLASSES}
            />
          )}
          <Button
            type="button"
            size="sm"
            disabled={!textValue.trim() || inputsDisabled}
            onClick={() => void submitResponse({ text: textValue })}
          >
            <SendIcon className="me-1 size-3.5" aria-hidden="true" />
            Submit
          </Button>
        </div>
      )}

      {artifactType === "form" && (
        <div className="mt-2 flex flex-col gap-2">
          <p className="font-body text-sm text-fg-secondary">
            Structured form received. Submit JSON response:
          </p>
          <Textarea
            value={formJson}
            onChange={(e) => setFormJson(e.target.value)}
            disabled={inputsDisabled}
            rows={6}
            className={FIELD_CLASSES}
          />
          <Button
            type="button"
            size="sm"
            disabled={inputsDisabled}
            onClick={() => {
              const parsed = parseJsonObject(formJson);
              if (!parsed) {
                setErrorKind("parse");
                return;
              }
              void submitResponse(parsed);
            }}
          >
            <SendIcon className="me-1 size-3.5" aria-hidden="true" />
            Submit
          </Button>
        </div>
      )}

      {artifactType !== "confirm" &&
        artifactType !== "select" &&
        artifactType !== "text_input" &&
        artifactType !== "form" && (
          <div className="mt-2 flex flex-col gap-2">
            <p className="font-body text-sm text-fg-secondary">
              Unsupported artifact type `{artifactType}`. Submit raw JSON:
            </p>
            <Textarea
              value={formJson}
              onChange={(e) => setFormJson(e.target.value)}
              disabled={inputsDisabled}
              rows={6}
              className={FIELD_CLASSES}
            />
            <Button
              type="button"
              size="sm"
              disabled={inputsDisabled}
              onClick={() => {
                const parsed = parseJsonObject(formJson);
                if (!parsed) {
                  setErrorKind("parse");
                  return;
                }
                void submitResponse(parsed);
              }}
            >
              <SendIcon className="me-1 size-3.5" aria-hidden="true" />
              Submit
            </Button>
          </div>
        )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {/* Polite live region: Sending / Response captured are status
            updates, not urgent — `role="status"` announces them without
            interrupting. Kept mounted (via `contents`, so it takes no
            layout space when empty) rather than entering the DOM only once
            there's content, since some AT/browser combinations only pick up
            changes inside an already-present live region. */}
        <div role="status" aria-live="polite" className="contents">
          {submitting && (
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill bg-cyan-soft px-2.5 py-1 font-ui text-xs font-semibold leading-none text-cyan-text">
              <Loader2Icon className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
              <span>Sending</span>
            </span>
          )}
          {!submitting && isCaptured && (
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-pill bg-success-soft px-2.5 py-1 font-ui text-xs font-semibold leading-none text-success-text">
              <CheckCircle2Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Response captured</span>
            </span>
          )}
        </div>
        {errorKind && (
          <span role="alert" className="font-body text-sm text-danger-text">
            {A2UI_ERROR_MESSAGES[errorKind]}
          </span>
        )}
      </div>

      {result && (
        <pre
          tabIndex={0}
          className="mt-3 max-h-40 overflow-auto rounded-md bg-code p-3 font-mono text-xs whitespace-pre-wrap text-fg wrap-break-word focus-cue"
        >
          {result}
        </pre>
      )}
    </div>
  );
};

interface A2uiDisplayBlockProps {
  artifactType: string;
  title: string;
  content: string;
  language?: string;
}

export const A2uiDisplayBlock: FC<A2uiDisplayBlockProps> = ({
  artifactType,
  title,
  content,
  language,
}) => {
  // Plain `agui.artifact` events (isInputRequest: false — e.g. the fixture's
  // "Week flow" diagram) render through this component, not ArtifactBlock.
  // Route a Mermaid artifact to the diagram renderer by default, the same as
  // the code path used for Mermaid in markdown, rather than showing the raw
  // source in the pre-wrap content box.
  const isMermaidArtifact = language === "mermaid";

  return (
    <div className="my-3 first:mt-0 last:mb-0 min-w-0 rounded-lg bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <PanelTopOpenIcon className="size-3.5 shrink-0 text-fg-secondary" aria-hidden="true" />
        <span className="font-ui text-xs font-semibold text-fg-secondary">Artifact</span>
        <span className="ms-auto flex shrink-0 items-center gap-1.5">
          <span className="inline-flex items-center rounded-pill bg-muted-surface px-2 py-0.5 font-mono text-xs text-fg-secondary">
            {artifactType}
          </span>
          {language && (
            <span className="inline-flex items-center rounded-pill bg-muted-surface px-2 py-0.5 font-mono text-xs text-fg-secondary">
              {language}
            </span>
          )}
        </span>
      </div>
      <p className="font-display text-base font-semibold text-fg wrap-anywhere">
        {title || "Artifact"}
      </p>
      {isMermaidArtifact ? (
        <div className="mt-2">
          <MermaidBlock source={content} />
        </div>
      ) : (
        <div
          tabIndex={0}
          className="mt-2 max-h-64 overflow-y-auto rounded-md bg-raised p-3 font-body text-sm leading-relaxed whitespace-pre-wrap text-fg-secondary wrap-break-word focus-cue"
        >
          {content}
        </div>
      )}
    </div>
  );
};
