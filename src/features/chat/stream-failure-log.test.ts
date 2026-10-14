import { describe, expect, it } from "vitest";
import {
  buildStreamFailureLogEntry,
  buildVisibilityChangeLogEntry,
} from "./stream-failure-log";

describe("buildStreamFailureLogEntry", () => {
  it("builds the fixed stream-failure object from the error's own name and message", () => {
    const entry = buildStreamFailureLogEntry({
      error: new TypeError("Failed to fetch"),
      visibilityState: "hidden",
      startedAtMs: 1_000,
      nowMs: 2_500,
      receivedBytes: 128,
    });

    expect(entry).toEqual({
      event: "stream-failure",
      errorName: "TypeError",
      errorMessage: "Failed to fetch",
      visibilityState: "hidden",
      elapsedMs: 1_500,
      receivedBytes: 128,
    });
  });

  it("uses a fallback error's message verbatim, with no wrapping text added", () => {
    const error = new Error("POST /api/chat/completion 500");
    const entry = buildStreamFailureLogEntry({
      error,
      visibilityState: "visible",
      startedAtMs: 0,
      nowMs: 42,
      receivedBytes: 0,
    });

    expect(entry.errorMessage).toBe(error.message);
    expect(entry.errorName).toBe("Error");
  });

  it("has exactly the fixed field set — no message text, prompt, URL or id fields", () => {
    const entry = buildStreamFailureLogEntry({
      error: new Error("boom"),
      visibilityState: "visible",
      startedAtMs: 0,
      nowMs: 1,
      receivedBytes: 0,
    });

    expect(Object.keys(entry).sort()).toEqual([
      "elapsedMs",
      "errorMessage",
      "errorName",
      "event",
      "receivedBytes",
      "visibilityState",
    ]);
  });
});

describe("buildVisibilityChangeLogEntry", () => {
  it("builds the fixed visibility-change object with elapsed time", () => {
    const entry = buildVisibilityChangeLogEntry({
      state: "hidden",
      startedAtMs: 1_000,
      nowMs: 4_000,
    });

    expect(entry).toEqual({
      event: "visibility-change",
      state: "hidden",
      elapsedMs: 3_000,
    });
  });
});
