/**
 * Long-stream fixture (phase chat-export-and-block-copy, task 1.7): one
 * assistant reply streamed as exactly 400 `agui.message.delta` events — 396
 * plain text lines plus 3 fenced TypeScript code blocks and 1 Mermaid fence,
 * each fence delivered as a single delta so no partial fence ever reaches the
 * parser. Every delta carries a unique marker that survives rendering (the
 * line text itself, the code line for fences, a node label for Mermaid), so
 * `e2e/stream-load.spec.ts` can prove order and completeness from the final
 * DOM alone. Serialisation reuses `toSseBody`/`SseEvent` from `./sse`.
 */
import { toSseBody, type SseEvent } from "./sse";

export const LONG_STREAM_REQUEST_ID = "req-stream-load-001";
export const LONG_STREAM_DELTA_COUNT = 400;
export const LONG_STREAM_CODE_FENCES = 3;
export const LONG_STREAM_MERMAID_FENCES = 1;

/** 1-based delta indices that carry a fenced code block instead of a text line. */
export const CODE_FENCE_DELTAS: readonly number[] = [100, 200, 300];
/** 1-based delta index that carries the Mermaid fence. */
export const MERMAID_FENCE_DELTA = 350;

const pad = (n: number): string => String(n).padStart(4, "0");

function deltaText(index: number): string {
  if (CODE_FENCE_DELTAS.includes(index)) {
    return "```ts\n" + `export const segment${pad(index)} = ${index};\n` + "```\n\n";
  }
  if (index === MERMAID_FENCE_DELTA) {
    return "```mermaid\ngraph LR\n  StreamStart" + pad(index) + " --> StreamEnd" + pad(index) + "\n```\n\n";
  }
  return `Line ${pad(index)} of four hundred, streamed one delta at a time.\n\n`;
}

/**
 * The substring of each delta that must appear in the rendered DOM, in delta
 * order. The fence syntax itself (``` lines) is not rendered, so fence deltas
 * map to their content line; the Mermaid delta maps to its end-node label,
 * which the rendered SVG carries as text.
 */
export const LONG_STREAM_MARKERS: readonly string[] = Array.from(
  { length: LONG_STREAM_DELTA_COUNT },
  (_, k) => {
    const i = k + 1;
    if (CODE_FENCE_DELTAS.includes(i)) return `segment${pad(i)} = ${i};`;
    if (i === MERMAID_FENCE_DELTA) return `StreamEnd${pad(i)}`;
    return `Line ${pad(i)} of four hundred`;
  },
);

/** aria-label of each rendered code block (`${language} code` in ShikiCodeBlock). */
export const LONG_STREAM_CODE_REGION_LABEL = "ts code";

export const LONG_STREAM_EVENTS: SseEvent[] = [
  {
    event: "agui.stream.start",
    data: { kind: "stream", phase: "start", request_id: LONG_STREAM_REQUEST_ID },
  },
  ...Array.from({ length: LONG_STREAM_DELTA_COUNT }, (_, k) => ({
    event: "agui.message.delta",
    data: {
      kind: "message",
      phase: "delta",
      request_id: LONG_STREAM_REQUEST_ID,
      delta: { text: deltaText(k + 1) },
    },
  })),
  { event: "agui.done", data: { kind: "done", request_id: LONG_STREAM_REQUEST_ID } },
];

export const LONG_STREAM_SSE_BODY = toSseBody(LONG_STREAM_EVENTS);
