import { useAuiState } from "@assistant-ui/react";
import { COMPOSER_LIMIT_CONTENT } from "../../../content/site/composer-limit";

const { limit, showFrom } = COMPOSER_LIMIT_CONTENT;

/**
 * Length in characters, counted the way the server counts them (Unicode code
 * points, not UTF-16 units, so an emoji is one). Text at or below `showFrom`
 * UTF-16 units cannot reach it, so the spread is skipped for ordinary messages.
 */
export function countComposerChars(text: string): number {
  return text.length <= showFrom ? text.length : [...text].length;
}

/** True once the composer text is longer than the server accepts. */
export function useComposerOverLimit(): boolean {
  return useAuiState((s) => countComposerChars(s.composer.text) > limit);
}
