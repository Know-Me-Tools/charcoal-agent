import { useCallback, useRef } from "react";
import { useChatMessageStore } from "@/stores/chat-message-store";
import { useChatConnectivityStore } from "@/stores/chat-connectivity-store";
import { useThreadRegistryStore } from "@/stores/thread-registry-store";
import { buildUrl, buildHeaders } from "@/lib/api-client";
import { getSiteAgentId, isSiteBuild } from "@/hooks/use-site-config";
import { webSearchRequestField } from "@/stores/web-search-preference-store";
import { dispatchAguiEvent } from "./agui-event-handlers";
import {
  createDeltaCoalescer,
  type DeltaCoalescer,
  type DeltaCoalescerSchedulers,
} from "./delta-coalescer";
import {
  buildStreamFailureLogEntry,
  buildVisibilityChangeLogEntry,
} from "./stream-failure-log";
import { startStallWatchdog, type StallWatchdog } from "./stream-stall-watchdog";

const UAR_PATH = "/api/chat/completion";

/**
 * Browser schedulers for the delta coalescer: one commit per animation frame
 * while visible; a 50 ms timer while hidden (rAF is suspended in a
 * backgrounded tab). The 16 ms timeout fallback covers environments without
 * requestAnimationFrame (e.g. jsdom without pretendToBeVisual).
 */
const deltaCoalescerSchedulers: DeltaCoalescerSchedulers = {
  requestFrame: (cb) =>
    typeof requestAnimationFrame === "function"
      ? requestAnimationFrame(cb)
      : (setTimeout(cb, 16) as unknown as number),
  cancelFrame: (handle) =>
    typeof cancelAnimationFrame === "function"
      ? cancelAnimationFrame(handle)
      : clearTimeout(handle),
  setTimer: (cb, ms) => setTimeout(cb, ms),
  clearTimer: (handle) => clearTimeout(handle as Parameters<typeof clearTimeout>[0]),
  isHidden: () => document.hidden,
};

export interface UarChatPayload {
  message: string;
  /** Optional UAR agent ID to route this conversation to a specific agent. */
  agent_id?: string;
  /**
   * Session-level prompt-caching override. When true/false, overrides user and
   * global settings for this request. When undefined, the server falls back to
   * user → agent → global hierarchy.
   */
  prompt_caching_enabled?: boolean;
}

export interface StreamCallbacks {
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export interface StartStreamOptions {
  /**
   * Skip appending a new optimistic user message — reuse the one already in
   * the store. Used by retry/regenerate (`onReload` in use-chat-runtime.ts),
   * which resends an existing user message rather than creating a duplicate
   * (the caller is expected to have already removed the superseded reply
   * via `deleteMessagesAfter`).
   */
  skipUserMessage?: boolean;
}

// ─── SSE block parser ─────────────────────────────────────────────────────────
// SSE blocks are separated by blank lines (\n\n).
// Each block contains lines of the form "field: value".
// The default event type when no "event:" line is present is "message".

interface SseBlock {
  event: string;
  data: string;
  id?: string;
}

function parseSseBlock(raw: string): SseBlock | null {
  let event = "message";
  let data = "";
  let id: string | undefined;

  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      data = line.slice(5).trim();
    } else if (line.startsWith("id:")) {
      id = line.slice(3).trim();
    }
    // Ignore comment lines (":") and retry lines
  }

  if (!data) return null;
  return { event, data, id };
}

// ─── Response-failure classification (site-chat-offline-states) ──────────────
//
// The generic `{ "error", "message" }` body from `server/src/error.rs`. The
// client keys on `error` (a stable code), never on `message` text, which can
// change independently of behaviour.
interface ErrorResponseBody {
  error?: string;
  message?: string;
}

/**
 * `error` codes that mean "the agent itself is unreachable right now" rather
 * than a request-specific failure: UAR down (`upstream_unavailable` 502,
 * `upstream_timeout` 504, `upstream_error` 502 — any other UAR non-2xx), the
 * spend meter's own store down — it fails closed (`meter_unavailable`), or
 * the operator's kill switch (`kill_switch_on`). All show the same static
 * offline notice (FR-27); none of them should ever reach the thread as a
 * per-message error. `budget_exhausted` is deliberately absent: the agent is
 * up, a spend limit was hit, and it has its own notice.
 */
const OFFLINE_ERROR_CODES: ReadonlySet<string> = new Set([
  "upstream_unavailable",
  "upstream_timeout",
  "upstream_error",
  "meter_unavailable",
  "kill_switch_on",
]);

type ChatRequestFailure =
  | { kind: "offline" }
  | { kind: "budget-exhausted" }
  /** The message is over the server's length cap (413 `payload_too_large`). */
  | { kind: "too-long" }
  | { kind: "rate-limited"; retryAfterSeconds?: number }
  /** Anything else — a generic, per-message failure (existing behaviour). */
  | { kind: "generic" };

function parseRetryAfterSeconds(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

function classifyResponseFailure(
  status: number,
  body: ErrorResponseBody | null,
  retryAfterHeader: string | null,
): ChatRequestFailure {
  if (status === 429) {
    return { kind: "rate-limited", retryAfterSeconds: parseRetryAfterSeconds(retryAfterHeader) };
  }
  if (status === 413 || body?.error === "payload_too_large") {
    return { kind: "too-long" };
  }
  if (body?.error === "budget_exhausted") {
    return { kind: "budget-exhausted" };
  }
  if (body?.error && OFFLINE_ERROR_CODES.has(body.error)) {
    return { kind: "offline" };
  }
  // A gateway or proxy answer with no usable code (empty or non-JSON body,
  // an nginx error page) still means the agent cannot be reached.
  if (status === 502 || status === 503 || status === 504) {
    return { kind: "offline" };
  }
  return { kind: "generic" };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMessageStream() {
  const abortRef = useRef<AbortController | null>(null);
  const deltasRef = useRef<DeltaCoalescer | null>(null);

  const cancelStream = useCallback(() => {
    // Flush BEFORE aborting, while the run is still the active one: the
    // caller's follow-up (onCancel's cancelled block + finishStream, or a
    // retry's new stream) must see every token already received.
    deltasRef.current?.flush();
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const startStream = useCallback(
    async (
      threadId: string,
      payload: UarChatPayload,
      callbacks?: StreamCallbacks,
      options?: StartStreamOptions,
    ): Promise<void> => {
      cancelStream();

      // Set only when this call adds the optimistic user message, so a
      // too-long rejection can take that message back out again.
      let optimisticUserMsgId: string | null = null;
      if (!options?.skipUserMessage) {
        // Optimistically add the user message to the store
        const userMsgId = `user-${Date.now()}`;
        optimisticUserMsgId = userMsgId;
        useChatMessageStore.getState().initThread(threadId, [
          ...(useChatMessageStore.getState().messagesByThread[threadId] ?? []),
          {
            id: userMsgId,
            role: "user",
            content: [{ type: "text", text: payload.message }],
            createdAt: new Date(),
            status: "complete",
          },
        ]);
      }

      const controller = new AbortController();
      abortRef.current = controller;

      // Stable run ID for this assistant turn
      const runId = `run-${Date.now()}`;

      // Mark that we're waiting for the first token (loading state). A new
      // attempt clears any prior offline/rate-limited notice for this
      // thread — the visitor is retrying, so the stale notice shouldn't
      // linger if this attempt gets further than the last one.
      useChatMessageStore.getState().beginStream(threadId, runId);
      useChatConnectivityStore.getState().clear(threadId);

      // Accumulate streaming tool-call arguments keyed by tool_call_id
      const pendingArgs = new Map<string, string>();

      // Resolve the agent associated with this thread (if any). On the
      // public site build every request is pinned to the site agent,
      // regardless of what the caller or thread registry requested — the
      // agent picker is hidden in that build, but this is the actual
      // enforcement point (the site's nginx proxy also enforces it server
      // side; this keeps behaviour consistent when running against a
      // non-proxied UAR in dev/tests).
      const threadAgent = useThreadRegistryStore.getState().threads[threadId];
      const agentId = getSiteAgentId() ?? payload.agent_id ?? threadAgent?.agentId;

      // Console-only diagnostics for stream deaths (observed on iOS Safari;
      // no telemetry, no network). The field set is fixed in
      // stream-failure-log.ts — never message text, prompts, URLs or ids.
      // The visibility listener lives exactly as long as this stream.
      const streamStartedAtMs = Date.now();
      let receivedBytes = 0;

      // Text/thinking deltas are buffered and committed in batches (at most
      // one store commit per frame; one per 50 ms while hidden). The
      // dispatcher flushes the buffer before any non-text event, and the
      // terminal paths below flush before done/error/abort handling, so
      // order and content are preserved exactly.
      const coalescer = createDeltaCoalescer((segments) => {
        const state = useChatMessageStore.getState();
        const streaming = state.streamingByThread[threadId];
        // Drop leftovers of a superseded run: the active run id has moved
        // on, or the message these deltas belonged to was deleted
        // (retry/regenerate removes the old reply before restarting).
        // Committing here would resurrect a zombie streaming message.
        if (!streaming?.isStreaming || streaming.runId !== runId) return;
        if (
          streaming.streamingMessageId &&
          !state.messagesByThread[threadId]?.some(
            (m) => m.id === streaming.streamingMessageId,
          )
        ) {
          return;
        }
        for (const segment of segments) {
          if (segment.kind === "text") state.appendTextDelta(threadId, runId, segment.text);
          else state.appendThinkingDelta(threadId, runId, segment.text);
        }
      }, deltaCoalescerSchedulers);
      deltasRef.current = coalescer;

      // A connection that silently stops delivering bytes would leave the page
      // "streaming" forever. The site's server beats every 10 s, so a long
      // silence there is a dead connection: abort and show the error with Try
      // again. Not used against a direct UAR, which sends no keep-alives.
      let stalled = false;
      const watchdog: StallWatchdog | null = isSiteBuild()
        ? startStallWatchdog(() => {
            stalled = true;
            controller.abort();
          })
        : null;

      const onVisibilityChange = () => {
        // A page that just came back from the background gets a fresh window.
        if (document.visibilityState === "visible") watchdog?.touch();
        // rAF does not run while hidden: move a pending flush to the timer
        // path (and back) so backgrounded streams still commit bounded-rate.
        coalescer.reschedule();
        console.warn(
          buildVisibilityChangeLogEntry({
            state: document.visibilityState,
            startedAtMs: streamStartedAtMs,
            nowMs: Date.now(),
          }),
        );
      };
      document.addEventListener("visibilitychange", onVisibilityChange);

      try {
        const res = await fetch(buildUrl(UAR_PATH), {
          method: "POST",
          headers: buildHeaders({ "X-UAR-Session-ID": threadId }),
          body: JSON.stringify({
            message: payload.message,
            stream: true,
            stream_mode: "dual",
            ...(agentId ? { agent_id: agentId } : {}),
            ...(payload.prompt_caching_enabled !== undefined
              ? { prompt_caching_enabled: payload.prompt_caching_enabled }
              : {}),
            // Site build only, and only while the visitor's toggle is on;
            // read here, at send time, so earlier requests are never changed.
            ...webSearchRequestField(),
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          let body: ErrorResponseBody | null = null;
          try {
            body = (await res.json()) as ErrorResponseBody;
          } catch {
            body = null;
          }
          const failure = classifyResponseFailure(
            res.status,
            body,
            res.headers.get("Retry-After"),
          );

          if (failure.kind === "offline") {
            useChatConnectivityStore.getState().setOffline(threadId);
            useChatMessageStore.getState().clearStreaming(threadId);
            callbacks?.onError?.(new Error("offline"));
            return;
          }
          if (failure.kind === "budget-exhausted") {
            useChatConnectivityStore.getState().setBudgetExhausted(threadId);
            useChatMessageStore.getState().clearStreaming(threadId);
            callbacks?.onError?.(new Error("budget_exhausted"));
            return;
          }
          if (failure.kind === "too-long") {
            // Nothing was sent, so the visitor's message is not part of the
            // conversation: drop the optimistic copy. The caller hands the
            // text back to the composer (see `onNew` in use-chat-runtime.ts).
            if (optimisticUserMsgId) {
              const messages = useChatMessageStore.getState().messagesByThread[threadId] ?? [];
              useChatMessageStore.getState().initThread(
                threadId,
                messages.filter((m) => m.id !== optimisticUserMsgId),
              );
            }
            useChatConnectivityStore.getState().setTooLong(threadId);
            useChatMessageStore.getState().clearStreaming(threadId);
            callbacks?.onError?.(new Error("payload_too_large"));
            return;
          }
          if (failure.kind === "rate-limited") {
            useChatConnectivityStore
              .getState()
              .setRateLimited(threadId, failure.retryAfterSeconds);
            useChatMessageStore.getState().clearStreaming(threadId);
            callbacks?.onError?.(new Error("rate_limited"));
            return;
          }

          // Generic failure — unchanged behaviour: surfaces as a failed
          // assistant message via the catch block below (setStreamError
          // never echoes this text to the user; see MessageError).
          throw new Error(`POST /api/chat/completion ${res.status}`);
        }

        if (!res.body) {
          throw new Error("Response body is null — cannot read SSE stream");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          receivedBytes += value.byteLength;
          watchdog?.touch();
          buffer += decoder.decode(value, { stream: true });

          // SSE blocks are delimited by double newlines
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() ?? "";

          for (const raw of blocks) {
            if (!raw.trim()) continue;

            const block = parseSseBlock(raw);
            if (!block) continue;

            const { event, data } = block;

            // ── Named events (AG-UI is the primary channel in dual mode) ───────
            // Every named event goes through the render registry: render and
            // adapt reach their handler; hidden and unknown events are dropped.
            if (event !== "message") {
              const outcome = dispatchAguiEvent(event, data, {
                threadId,
                runId,
                pendingArgs,
                callbacks,
                deltas: coalescer,
              });
              if (outcome === "stop") return;
              continue;
            }

            // ── Anonymous data events (OpenAI chunks) ─────────────────────────
            // In dual mode, text is already covered by agui.message.delta.
            // Only watch for [DONE] as a safety-net terminator.
            if (event === "message") {
              if (data === "[DONE]") {
                coalescer.flush();
                useChatMessageStore.getState().finishStream(threadId);
                callbacks?.onComplete?.();
                return;
              }
              // OpenAI text chunks intentionally skipped — agui handles content
            }
          }
        }

        // Reader exhausted without agui.done / [DONE]. Flush first: with
        // buffered deltas, text received so far has not necessarily reached
        // the store yet, and the graceful-finish check below keys on the
        // streaming message the first committed delta creates.
        coalescer.flush();
        //
        // `streamingMessageId`
        // is set only once a block that actually creates the assistant
        // message has been handled — a text/thinking delta, tool call,
        // citation, skill activation, etc. (getOrCreateStreamingMessage /
        // activeStreamingMessage in chat-message-store.ts). A bare
        // agui.stream.start does not create one, so it still counts as "no
        // events" below. When the id is set, treat this as a graceful
        // finish — unchanged behavior. When it is still null, the
        // connection closed before anything was ever shown: a pre-delta
        // failure like an HTTP error or a rejected fetch, so it must
        // surface the same way (docs/qa/chat-surfaces-flat2.md §6.6).
        if (useChatMessageStore.getState().streamingByThread[threadId]?.streamingMessageId) {
          useChatMessageStore.getState().finishStream(threadId);
          callbacks?.onComplete?.();
        } else {
          const error = new Error("The connection closed before the agent replied.");
          console.warn(
            buildStreamFailureLogEntry({
              error,
              visibilityState: document.visibilityState,
              startedAtMs: streamStartedAtMs,
              nowMs: Date.now(),
              receivedBytes,
            }),
          );
          useChatMessageStore.getState().setStreamError(threadId, error.message);
          callbacks?.onError?.(error);
        }
      } catch (err) {
        // Flush before error handling so the error block lands after any
        // buffered text. On abort the buffer is normally empty already —
        // cancelStream flushes before aborting; this is the safeguard.
        coalescer.flush();
        if ((err as Error).name === "AbortError" && !stalled) return;
        const error = stalled
          ? new Error("The connection stopped delivering data.")
          : err instanceof Error
            ? err
            : new Error("Stream failed");
        console.warn(
          buildStreamFailureLogEntry({
            error,
            visibilityState: document.visibilityState,
            startedAtMs: streamStartedAtMs,
            nowMs: Date.now(),
            receivedBytes,
          }),
        );
        useChatMessageStore.getState().setStreamError(threadId, error.message);
        callbacks?.onError?.(error);
      } finally {
        // No flush may fire after the stream has ended — a late commit would
        // hit the next run (or a finished one) for this thread.
        watchdog?.stop();
        coalescer.cancelPending();
        if (deltasRef.current === coalescer) deltasRef.current = null;
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
    },
    [cancelStream],
  );

  return { startStream, cancelStream };
}
