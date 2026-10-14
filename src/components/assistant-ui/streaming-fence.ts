import { createContext } from "react";

/**
 * Fence-state detection for streamed markdown (task 1.4).
 *
 * A line-based CommonMark fence scan: a fence opens on a line whose content,
 * after at most three leading spaces, begins with a run of three or more
 * backticks (whose info string may not contain a backtick) or three or more
 * tildes, and closes on a later line that is only a same-length-or-longer run
 * of the same marker. While a fence is open, every later line is content —
 * including lines that look like fences ("nested" fences and lines with the
 * other marker), which is why a state machine is needed instead of a count of
 * fence-looking lines.
 *
 * Fences nested in blockquotes or list items are deliberately not tracked:
 * model output rarely streams them, and missing one only means that block
 * keeps the old behaviour (re-highlight per delta), never a wrong render.
 */

export interface OpenFence {
  /** Offset of the first marker character of the opening fence line in the source text. */
  markerStart: number;
  marker: "`" | "~";
  /** Run length of the opening marker; a closer needs at least this many. */
  fenceLength: number;
  /** Trimmed info string (the language tag, possibly empty). */
  language: string;
  /**
   * Everything after the opening fence line, with one trailing newline
   * stripped — the same value the markdown parser puts on the code node, so
   * `EnhancedCodeBlock` recognizes the open block by content equality. (The
   * memoized component pipeline strips the mdast/hast node before it reaches
   * the component, so matching by source offset is not available. An earlier
   * closed block with byte-identical content would match too and render plain
   * until the stream ends — a transient, self-healing cosmetic case accepted
   * over tracking block identity.)
   */
  content: string;
}

const MAX_FENCE_INDENT = 3;

function markerRun(line: string, marker: "`" | "~"): number {
  let run = 0;
  while (line[run] === marker) run += 1;
  return run;
}

/**
 * The last unterminated fenced code block in `text`, or null when every fence
 * is closed. An open fence is always the final block of the document: it
 * swallows everything after its opener until a closing line arrives.
 */
export function findOpenFence(text: string): OpenFence | null {
  let open: OpenFence | null = null;
  let lineStart = 0;

  while (lineStart <= text.length) {
    const newline = text.indexOf("\n", lineStart);
    const lineEnd = newline === -1 ? text.length : newline;
    const line = text.slice(lineStart, lineEnd);

    let indent = 0;
    while (indent < line.length && line[indent] === " ") indent += 1;
    const body = line.slice(indent);

    if (open === null) {
      if (indent <= MAX_FENCE_INDENT && (body.startsWith("```") || body.startsWith("~~~"))) {
        const marker = body[0] as "`" | "~";
        const run = markerRun(body, marker);
        const info = body.slice(run);
        // CommonMark: a backtick info string containing a backtick is not a fence.
        if (marker === "~" || !info.includes("`")) {
          const contentNewline = text.indexOf("\n", lineStart + indent);
          const raw = contentNewline === -1 ? "" : text.slice(contentNewline + 1);
          open = {
            markerStart: lineStart + indent,
            marker,
            fenceLength: run,
            language: info.trim(),
            content: raw.endsWith("\n") ? raw.slice(0, -1) : raw,
          };
        }
      }
    } else if (indent <= MAX_FENCE_INDENT && body[0] === open.marker) {
      const run = markerRun(body, open.marker);
      if (run >= open.fenceLength && body.slice(run).trim() === "") {
        open = null;
      }
    }

    if (newline === -1) break;
    lineStart = newline + 1;
  }

  return open;
}

/**
 * The content of the streaming message's open fence, or null. Provided by
 * `EnhancedMarkdownText` (only while the message is streaming) so
 * `EnhancedCodeBlock` can render that one block as plain preformatted text
 * instead of invoking Shiki or Mermaid on every delta.
 */
export const StreamingFenceContext = createContext<string | null>(null);
