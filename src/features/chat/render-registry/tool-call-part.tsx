import type { ToolCallMessagePartProps } from "@assistant-ui/react";
import type { FC } from "react";
import { ArtifactBlock } from "@/features/chat/components/artifact-block";
import { LazyA2uiSurfaceBlock } from "@/features/a2ui/lazy-a2ui-surface-block";
import { A2uiDisplayBlock, A2uiInputBlock } from "@/features/chat/components/a2ui-artifact-block";
import { CitationBlock } from "@/features/chat/components/citation-block";
import { ContextUpdateBlock } from "@/features/chat/components/context-update-block";
import { MemoryMutationBlock, MemoryRecallBlock } from "@/features/chat/components/memory-block";
import { RunCancelledBlock } from "@/features/chat/components/run-cancelled-block";
import { SkillActivationBlock } from "@/features/chat/components/skill-activation-block";
import { ToolCallBlock, ToolCallBlockWrapper } from "@/features/chat/components/tool-call-block";
import type { MemoryItem } from "@/types/chat-content";
import { defaultRenderRegistry } from "./default-entries";
import {
  APPROVAL_PART,
  CANCELLED_PART,
  SUBAGENT_PART,
  type CancelledUsage,
  type SubagentStatus,
} from "./pseudo-parts";

type PartRenderer = FC<ToolCallMessagePartProps>;

interface ArtifactArgs {
  runId?: string;
  artifactId: string;
  artifactType: string;
  title: string;
  content: string;
  language?: string;
  isInputRequest: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Artifacts are routed by type at render time too, so internal artifacts
 * already persisted in PGlite (e.g. `provider_event`) stop showing.
 */
const isArtifactHidden = (artifactType: string): boolean =>
  defaultRenderRegistry.resolve({ kind: "artifact", name: artifactType }).disposition === "hide";

const SkillPart: PartRenderer = ({ args }) => {
  const a = args as {
    skillId: string;
    skillName: string;
    selectionMethod?: string;
    status: "active" | "complete";
  };
  return (
    <SkillActivationBlock
      skillId={a.skillId}
      skillName={a.skillName}
      selectionMethod={a.selectionMethod}
      status={a.status}
    />
  );
};

const ContextPart: PartRenderer = ({ args }) => {
  const a = args as {
    strategy: string;
    messagesRemoved: number;
    tokensSaved: number;
    wasApplied: boolean;
    summaryGenerated: boolean;
  };
  return (
    <ContextUpdateBlock
      strategy={a.strategy}
      messagesRemoved={a.messagesRemoved}
      tokensSaved={a.tokensSaved}
      wasApplied={a.wasApplied}
      summaryGenerated={a.summaryGenerated}
    />
  );
};

const CitationPart: PartRenderer = ({ args }) => {
  const a = args as { source: string; content: string; url?: string };
  return <CitationBlock source={a.source} content={a.content} url={a.url} />;
};

// agui.tool_call.denied (FR-11 client case, site-chat-offline-states): the
// launch run policy refused this call. Always "Blocked by policy" — never
// "running" and never silently dropped.
const DeniedPart: PartRenderer = ({ args }) => {
  const a = args as { toolName: string; reason?: string };
  return <ToolCallBlock toolName={a.toolName} args={{}} result={a.reason} status="denied" />;
};

// agui.tool_call.approval_required: read-only, approvals are deferred (D-26).
const ApprovalPart: PartRenderer = ({ args }) => {
  const a = args as { toolName: string; reason?: string };
  return <ToolCallBlock toolName={a.toolName} args={{}} result={a.reason} status="approval" />;
};

const SubagentPart: PartRenderer = ({ args }) => {
  const a = args as { path: string; status: SubagentStatus };
  return <ToolCallBlock toolName={`Subagent ${a.path}`} args={{}} status={a.status} />;
};

const CancelledPart: PartRenderer = ({ args }) => {
  const a = args as { usage?: CancelledUsage };
  return <RunCancelledBlock usage={a.usage} />;
};

const MemoryRecallPart: PartRenderer = ({ args }) => {
  const a = args as { items: MemoryItem[]; count: number };
  return <MemoryRecallBlock items={a.items} count={a.count} />;
};

const MemoryMutationPart: PartRenderer = ({ args }) => {
  const a = args as {
    operation: string;
    memoryId: string;
    content: string;
    scope: string;
    memoryType: string;
  };
  return (
    <MemoryMutationBlock
      operation={a.operation}
      memoryId={a.memoryId}
      content={a.content}
      scope={a.scope}
      memoryType={a.memoryType}
    />
  );
};

const ArtifactInputPart: PartRenderer = ({ args, status }) => {
  const a = args as unknown as ArtifactArgs;
  if (isArtifactHidden(a.artifactType)) return null;
  const artifactStatus =
    status.type === "running" ? "running" : status.type === "incomplete" ? "failed" : "complete";
  return (
    <A2uiInputBlock
      runId={a.runId ?? ""}
      artifactId={a.artifactId}
      artifactType={a.artifactType}
      title={a.title}
      content={a.content}
      metadata={a.metadata ?? {}}
      status={artifactStatus}
    />
  );
};

const ArtifactPart: PartRenderer = ({ args }) => {
  const a = args as unknown as ArtifactArgs;
  if (isArtifactHidden(a.artifactType)) return null;
  // `adapt`: the `a2ui` carrier is NDJSON A2UI v0.9.1, rendered as a surface.
  if (a.artifactType === "a2ui" && !a.isInputRequest) {
    return <LazyA2uiSurfaceBlock content={a.content} title={a.title} />;
  }
  // Display-only: use A2uiDisplayBlock for proper rendering, fall back to
  // ArtifactBlock for legacy persisted records that lack the new fields.
  if (!a.isInputRequest) {
    return (
      <A2uiDisplayBlock
        artifactType={a.artifactType}
        title={a.title}
        content={a.content}
        language={a.language}
      />
    );
  }
  return (
    <ArtifactBlock
      artifactId={a.artifactId}
      artifactType={a.artifactType}
      title={a.title}
      content={a.content}
      language={a.language}
      isInputRequest={a.isInputRequest}
    />
  );
};

const GenericToolPart: PartRenderer = ({ toolName, args, result, status, isError }) => (
  <ToolCallBlockWrapper
    toolName={toolName}
    args={args as Record<string, unknown>}
    result={result}
    status={status}
    isError={isError}
  />
);

/**
 * KnowMe rich blocks are encoded as tool calls with reserved names (see
 * `richMessageToThreadMessageLike` and `pseudo-parts.ts`); every other name
 * is a real tool call.
 */
const PART_RENDERERS: Readonly<Record<string, PartRenderer>> = {
  __skill__: SkillPart,
  __context__: ContextPart,
  __citation__: CitationPart,
  __denied__: DeniedPart,
  __memory_recall__: MemoryRecallPart,
  __memory_mutation__: MemoryMutationPart,
  __artifact_input__: ArtifactInputPart,
  __artifact__: ArtifactPart,
  [APPROVAL_PART]: ApprovalPart,
  [SUBAGENT_PART]: SubagentPart,
  [CANCELLED_PART]: CancelledPart,
};

export const ToolCallPart: FC<ToolCallMessagePartProps> = (props) => {
  const Renderer = PART_RENDERERS[props.toolName] ?? GenericToolPart;
  return <Renderer {...props} />;
};
