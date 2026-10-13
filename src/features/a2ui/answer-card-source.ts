import { citationDisplayName } from "@/features/chat/citation-text";

/** A knowledge-base upload name: ends `.md`, or ends in a 12-hex hash after `.`, `-` or `_`. */
const UPLOADED_FILE_NAME = /(\.md|[.\-_][0-9a-f]{12})$/i;

/**
 * The readable name for an answer card's `source`, using the same rule as the
 * Sources block (`citationDisplayName`). Only a value shaped like an uploaded
 * file name is changed; anything else, including a model-written title, is
 * returned as is.
 */
export function readableAnswerCardSource(value: string): string {
  const trimmed = value.trim();
  if (!UPLOADED_FILE_NAME.test(trimmed) || /\s/.test(trimmed)) return value;
  return citationDisplayName(trimmed);
}

type Message = Record<string, unknown>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textBoundTo(components: readonly unknown[], id: string, path: string): boolean {
  return components.some(
    (c) =>
      isRecord(c) &&
      c.id === id &&
      c.component === "Text" &&
      isRecord(c.text) &&
      c.text.path === path,
  );
}

/**
 * Surfaces shaped like uar/presentations/answer-card.json: Text components
 * with ids `title`, `summary` and `source`, bound to `/title`, `/summary` and
 * `/source`. The `source` binding is the only field this feature touches.
 */
function answerCardSurfaceIds(messages: readonly Message[]): Set<string> {
  const ids = new Set<string>();
  for (const m of messages) {
    const update = m.updateComponents;
    if (!isRecord(update) || typeof update.surfaceId !== "string") continue;
    if (!Array.isArray(update.components)) continue;
    const cs = update.components;
    if (
      textBoundTo(cs, "title", "/title") &&
      textBoundTo(cs, "summary", "/summary") &&
      textBoundTo(cs, "source", "/source")
    ) {
      ids.add(update.surfaceId);
    }
  }
  return ids;
}

function cleanUpdate(update: Record<string, unknown>): Record<string, unknown> {
  const path = typeof update.path === "string" ? update.path : "/";
  const value = update.value;
  if (path === "/source" && typeof value === "string") {
    return { ...update, value: readableAnswerCardSource(value) };
  }
  if (path === "/" && isRecord(value) && typeof value.source === "string") {
    return { ...update, value: { ...value, source: readableAnswerCardSource(value.source) } };
  }
  return update;
}

/**
 * Rewrites the `source` data of answer-card surfaces to a readable name.
 * Runs at render time on the parsed messages, so cards already stored in a
 * thread (which keep the model's raw data) display the same way as new ones.
 * Other surfaces and other fields are returned untouched.
 */
export function cleanAnswerCardSources(messages: Message[]): Message[] {
  const cards = answerCardSurfaceIds(messages);
  if (cards.size === 0) return messages;
  return messages.map((m) => {
    const update = m.updateDataModel;
    if (!isRecord(update) || typeof update.surfaceId !== "string" || !cards.has(update.surfaceId)) {
      return m;
    }
    return { ...m, updateDataModel: cleanUpdate(update) };
  });
}
