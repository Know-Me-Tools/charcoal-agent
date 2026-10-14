// Console-only diagnostics for stream failures (observed problem: replies
// stop on iOS Safari with no signal about why — see the
// chat-export-and-block-copy plan, iOS findings). These entries are written
// with console.warn, never sent anywhere. The field set is fixed here so no
// caller can accidentally log message text, prompts, URLs or ids: only the
// error's own name and message, the page visibility state, the elapsed time
// and the byte count received before the failure.

export interface StreamFailureLogEntry {
  event: "stream-failure";
  errorName: string;
  errorMessage: string;
  visibilityState: DocumentVisibilityState;
  elapsedMs: number;
  receivedBytes: number;
}

export interface VisibilityChangeLogEntry {
  event: "visibility-change";
  state: DocumentVisibilityState;
  elapsedMs: number;
}

export function buildStreamFailureLogEntry(input: {
  error: Error;
  visibilityState: DocumentVisibilityState;
  startedAtMs: number;
  nowMs: number;
  receivedBytes: number;
}): StreamFailureLogEntry {
  return {
    event: "stream-failure",
    errorName: input.error.name,
    errorMessage: input.error.message,
    visibilityState: input.visibilityState,
    elapsedMs: input.nowMs - input.startedAtMs,
    receivedBytes: input.receivedBytes,
  };
}

export function buildVisibilityChangeLogEntry(input: {
  state: DocumentVisibilityState;
  startedAtMs: number;
  nowMs: number;
}): VisibilityChangeLogEntry {
  return {
    event: "visibility-change",
    state: input.state,
    elapsedMs: input.nowMs - input.startedAtMs,
  };
}
