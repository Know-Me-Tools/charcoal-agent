// TJ-ARCH-MOB-001 compliant
//! Allowlist filter for the public SSE stream (FR-45).
//!
//! UAR emits many `agui.*` and `runtime.*` events and several artifact types
//! that expose the agent's policy, tool set, provider and model names
//! (`effective_run_policy`, `turn_manifest`, `provider_event`,
//! `attempt_manifest`, and whatever UAR adds next). A denylist leaks every new
//! diagnostic until someone names it, so this filter forwards only what the
//! public client renders or the meter needs, and drops everything else.
//!
//! The stream is split at SSE event boundaries (a blank line, with `\n`,
//! `\r\n` or `\r` line endings). Kept events are returned as their original
//! bytes, in order. A complete event is released as soon as its terminating
//! blank line arrives; only an incomplete event is held.
//!
//! What is kept:
//! - the events in [`ALLOWED_EVENTS`];
//! - `agui.artifact` only when `artifact_type` is in [`ALLOWED_ARTIFACT_TYPES`];
//! - `agui.state.patch` only when every op's path is under `/a2ui/`;
//! - an event-less frame only when its data is `[DONE]`;
//! - comment-only frames (keep-alives), which carry no data.
//!
//! An `agui.artifact` or `agui.state.patch` whose payload cannot be read (bad
//! JSON, missing field) is dropped, but reported as [`Verdict::DropMalformed`]
//! so the caller logs it rather than counting it as internal.
//!
//! The same pass reports the run signals the meter needs ([`Signal`]): the
//! first `agui.message.delta` (time to first token), `agui.done` with its
//! usage, `agui.cancelled` and `agui.error`. Signals are read from the
//! upstream event whether or not it is forwarded.

use serde_json::Value;

use crate::domain::meter::{Usage, parse_done_usage};

pub const ARTIFACT_EVENT: &str = "agui.artifact";
pub const STATE_PATCH_EVENT: &str = "agui.state.patch";
/// Artifact types a visitor may receive. Everything else is diagnostic.
pub const ALLOWED_ARTIFACT_TYPES: [&str; 1] = ["a2ui"];
/// Events a visitor may receive. `agui.done` carries the usage the meter reads.
pub const ALLOWED_EVENTS: [&str; 8] = [
    "agui.stream.start",
    "agui.message.delta",
    "agui.done",
    "agui.error",
    "agui.cancelled",
    "agui.citation.added",
    "agui.rag_citations",
    "agui.tool_call.denied",
];
/// A state patch is public only when every op writes under this prefix.
pub const A2UI_PATH_PREFIX: &str = "/a2ui/";
/// The client's safety-net terminator, the one event-less frame that is kept.
const DONE_SENTINEL: &str = "[DONE]";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Verdict {
    Forward,
    DropInternal,
    DropMalformed,
}

/// A run event the meter acts on, read from the upstream (unfiltered) event.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Signal {
    /// `agui.message.delta`.
    Output,
    /// `agui.done`; `None` when it carries no usage.
    Done(Option<Usage>),
    /// `agui.cancelled`.
    Cancelled,
    /// `agui.error`.
    Error,
}

/// The bytes to forward from one push, what was dropped, and the signals
/// seen, in order.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct Filtered {
    pub forward: Vec<u8>,
    pub dropped_internal: usize,
    pub dropped_malformed: usize,
    pub signals: Vec<Signal>,
}

impl Filtered {
    fn take(&mut self, event: &[u8]) {
        let parsed = ParsedEvent::parse(event);
        if let Some(signal) = parsed.signal() {
            self.signals.push(signal);
        }
        match parsed.verdict() {
            Verdict::Forward => self.forward.extend_from_slice(event),
            Verdict::DropInternal => self.dropped_internal += 1,
            Verdict::DropMalformed => self.dropped_malformed += 1,
        }
    }
}

/// Incremental filter over one SSE response body.
#[derive(Debug, Default)]
pub struct InternalArtifactFilter {
    pending: Vec<u8>,
}

impl InternalArtifactFilter {
    pub fn new() -> Self {
        Self::default()
    }

    /// Feeds one upstream chunk and returns every event it completed.
    pub fn push(&mut self, chunk: &[u8]) -> Filtered {
        self.pending.extend_from_slice(chunk);
        let mut out = Filtered::default();
        let mut start = 0;
        while let Some(len) = event_len(&self.pending[start..]) {
            out.take(&self.pending[start..start + len]);
            start += len;
        }
        self.pending.drain(..start);
        out
    }

    /// End of stream: the unterminated remainder, filtered like an event.
    pub fn finish(&mut self) -> Filtered {
        let rest = std::mem::take(&mut self.pending);
        let mut out = Filtered::default();
        if !rest.is_empty() {
            out.take(&rest);
        }
        out
    }
}

/// Length of the first complete event in `buf`, through the line terminator
/// of its blank line. A `\r` at the very end is undecided (`\r` or `\r\n`),
/// so the event waits for the next byte.
fn event_len(buf: &[u8]) -> Option<usize> {
    let mut i = 0;
    let mut line_start = 0;
    while i < buf.len() {
        let terminator = match buf[i] {
            b'\n' => 1,
            b'\r' => match buf.get(i + 1) {
                None => return None,
                Some(b'\n') => 2,
                Some(_) => 1,
            },
            _ => {
                i += 1;
                continue;
            }
        };
        let blank = i == line_start;
        i += terminator;
        if blank {
            return Some(i);
        }
        line_start = i;
    }
    None
}

/// Classifies one event block (its bytes, with or without the terminator).
pub fn classify(event: &[u8]) -> Verdict {
    ParsedEvent::parse(event).verdict()
}

/// The `event` and joined `data` fields of one SSE event block.
struct ParsedEvent {
    event_type: Option<String>,
    data: String,
}

impl ParsedEvent {
    fn parse(event: &[u8]) -> Self {
        let text = String::from_utf8_lossy(event);
        let mut event_type: Option<String> = None;
        let mut data: Vec<&str> = Vec::new();
        for line in text.split(['\n', '\r']) {
            if line.is_empty() || line.starts_with(':') {
                continue;
            }
            let (field, value) = line.split_once(':').unwrap_or((line, ""));
            let value = value.strip_prefix(' ').unwrap_or(value);
            match field {
                "event" => event_type = Some(value.to_owned()),
                "data" => data.push(value),
                _ => {}
            }
        }
        Self {
            event_type,
            data: data.join("\n"),
        }
    }

    fn verdict(&self) -> Verdict {
        match self.event_type.as_deref() {
            None => {
                let data = self.data.trim();
                if data.is_empty() || data == DONE_SENTINEL {
                    Verdict::Forward
                } else {
                    Verdict::DropInternal
                }
            }
            Some(ARTIFACT_EVENT) => self.artifact_verdict(),
            Some(STATE_PATCH_EVENT) => self.state_patch_verdict(),
            Some(name) if ALLOWED_EVENTS.contains(&name) => Verdict::Forward,
            Some(_) => Verdict::DropInternal,
        }
    }

    fn artifact_verdict(&self) -> Verdict {
        let payload: Option<Value> = serde_json::from_str(&self.data).ok();
        match payload
            .as_ref()
            .and_then(|v| v.get("artifact_type"))
            .and_then(Value::as_str)
        {
            Some(kind) if ALLOWED_ARTIFACT_TYPES.contains(&kind) => Verdict::Forward,
            Some(_) => Verdict::DropInternal,
            None => Verdict::DropMalformed,
        }
    }

    /// Fail closed: one op outside `/a2ui/` drops the whole patch.
    fn state_patch_verdict(&self) -> Verdict {
        let payload: Option<Value> = serde_json::from_str(&self.data).ok();
        let Some(ops) = payload
            .as_ref()
            .and_then(|v| v.get("patch"))
            .and_then(Value::as_array)
        else {
            return Verdict::DropMalformed;
        };
        let all_public = !ops.is_empty()
            && ops.iter().all(|op| {
                op.get("path")
                    .and_then(Value::as_str)
                    .is_some_and(|path| path.starts_with(A2UI_PATH_PREFIX))
            });
        if all_public {
            Verdict::Forward
        } else {
            Verdict::DropInternal
        }
    }

    fn signal(&self) -> Option<Signal> {
        match self.event_type.as_deref()? {
            "agui.message.delta" => Some(Signal::Output),
            "agui.done" => Some(Signal::Done(parse_done_usage(&self.data))),
            "agui.cancelled" => Some(Signal::Cancelled),
            "agui.error" => Some(Signal::Error),
            _ => None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const POLICY: &str = "event: agui.artifact\nid: 3\ndata: {\"kind\":\"artifact\",\"artifact_type\":\"effective_run_policy\",\"content\":\"{}\"}\n\n";
    const MANIFEST: &str =
        "event: agui.artifact\nid: 4\ndata: {\"artifact_type\":\"turn_manifest\"}\n\n";
    const CODE: &str =
        "event: agui.artifact\nid: 5\ndata: {\"artifact_type\":\"code\",\"content\":\"x\"}\n\n";
    const START: &str = "event: agui.stream.start\nid: 1\ndata: {\"request_id\":\"r\"}\n\n";
    const DELTA: &str = "event: agui.message.delta\nid: 2\ndata: {\"delta\":{\"text\":\"hi\"}}\n\n";
    const OPENAI: &str = "data: {\"choices\":[{\"delta\":{\"content\":\"hi\"}}]}\n\n";
    const KEEPALIVE: &str = ":\n\n";
    const DONE: &str = "event: agui.done\nid: 6\ndata: {\"usage\":{\"input_tokens\":1}}\n\n";

    fn run(chunks: &[&[u8]]) -> Filtered {
        let mut filter = InternalArtifactFilter::new();
        let mut total = Filtered::default();
        for chunk in chunks {
            let out = filter.push(chunk);
            total.forward.extend(out.forward);
            total.dropped_internal += out.dropped_internal;
            total.dropped_malformed += out.dropped_malformed;
            total.signals.extend(out.signals);
        }
        let out = filter.finish();
        total.forward.extend(out.forward);
        total.dropped_internal += out.dropped_internal;
        total.dropped_malformed += out.dropped_malformed;
        total.signals.extend(out.signals);
        total
    }

    #[test]
    fn run_signals_should_be_reported_in_order_including_from_dropped_events() {
        let cancelled = "event: agui.cancelled\ndata: {}\n\n";
        let error = "event: agui.error\ndata: {\"message\":\"x\"}\n\n";
        let stream = [START, POLICY, DELTA, DELTA, cancelled, error, DONE].concat();
        let out = run(&[stream.as_bytes()]);
        let expected_usage = Usage {
            input_tokens: Some(1),
            ..Usage::default()
        };
        assert_eq!(
            out.signals,
            vec![
                Signal::Output,
                Signal::Output,
                Signal::Cancelled,
                Signal::Error,
                Signal::Done(Some(expected_usage)),
            ]
        );
        let plain_done = "event: agui.done\ndata: {\"kind\":\"done\"}\n\n";
        assert_eq!(
            run(&[plain_done.as_bytes()]).signals,
            vec![Signal::Done(None)]
        );
    }

    const PROVIDER: &str =
        "event: agui.artifact\nid: 7\ndata: {\"artifact_type\":\"provider_event\"}\n\n";
    const ATTEMPT: &str =
        "event: agui.artifact\nid: 8\ndata: {\"artifact_type\":\"attempt_manifest\"}\n\n";
    const A2UI: &str =
        "event: agui.artifact\nid: 9\ndata: {\"artifact_type\":\"a2ui\",\"content\":\"{}\"}\n\n";
    const DONE_SENTINEL_FRAME: &str = "data: [DONE]\n\n";

    #[test]
    fn should_forward_only_allowlisted_frames_and_keep_order_and_bytes() {
        let stream = [
            START,
            POLICY,
            DELTA,
            MANIFEST,
            PROVIDER,
            ATTEMPT,
            OPENAI,
            CODE,
            A2UI,
            KEEPALIVE,
            DONE_SENTINEL_FRAME,
            DONE,
        ]
        .concat();
        let out = run(&[stream.as_bytes()]);
        assert_eq!(
            String::from_utf8(out.forward).unwrap(),
            [START, DELTA, A2UI, KEEPALIVE, DONE_SENTINEL_FRAME, DONE].concat()
        );
        assert_eq!((out.dropped_internal, out.dropped_malformed), (6, 0));
    }

    #[test]
    fn every_allowed_event_name_should_be_forwarded() {
        for name in ALLOWED_EVENTS {
            let frame = format!("event: {name}\ndata: {{}}\n\n");
            assert_eq!(classify(frame.as_bytes()), Verdict::Forward, "{name}");
        }
    }

    #[test]
    fn every_other_event_name_should_be_dropped() {
        for name in [
            "agui.thinking.delta",
            "agui.reasoning.delta",
            "agui.tool_call.delta",
            "agui.tool_call.complete",
            "agui.tool_result",
            "agui.memory.recall",
            "agui.memory.mutation",
            "agui.memory.update",
            "agui.skill.activated",
            "agui.context.update",
            "agui.budget.alert",
            "agui.guardrail",
            "agui.mcp.state",
            "agui.quality.score",
            "agui.subagent.started",
            "agui.artifact_input_request",
            "agui.custom",
            "agui.raw",
            "runtime.run",
            "runtime.step",
            "agui.some.future.event",
        ] {
            let frame = format!("event: {name}\ndata: {{}}\n\n");
            assert_eq!(classify(frame.as_bytes()), Verdict::DropInternal, "{name}");
        }
    }

    #[test]
    fn unlisted_and_diagnostic_artifact_types_should_be_dropped_and_a2ui_kept() {
        for kind in [
            "effective_run_policy",
            "turn_manifest",
            "provider_event",
            "attempt_manifest",
            "code",
            "a2ui_extra",
            "",
        ] {
            let frame = format!("event: agui.artifact\ndata: {{\"artifact_type\":\"{kind}\"}}\n\n");
            assert_eq!(classify(frame.as_bytes()), Verdict::DropInternal, "{kind}");
        }
        assert_eq!(classify(A2UI.as_bytes()), Verdict::Forward);
    }

    fn patch(ops: &str) -> String {
        format!("event: agui.state.patch\ndata: {{\"kind\":\"state\",\"patch\":{ops}}}\n\n")
    }

    #[test]
    fn a_state_patch_should_be_kept_only_when_every_op_is_under_a2ui() {
        let public = patch(r#"[{"op":"add","path":"/a2ui/surface1","value":{}}]"#);
        assert_eq!(classify(public.as_bytes()), Verdict::Forward);

        let two_public = patch(
            r#"[{"op":"add","path":"/a2ui/a","value":1},{"op":"replace","path":"/a2ui/b/c","value":2}]"#,
        );
        assert_eq!(classify(two_public.as_bytes()), Verdict::Forward);

        for private in [
            patch(r#"[{"op":"add","path":"/presentation","value":{}}]"#),
            patch(r#"[{"op":"add","path":"/a2uix/y","value":{}}]"#),
            patch(r#"[{"op":"add","path":"/a2ui","value":{}}]"#),
            patch(
                r#"[{"op":"add","path":"/a2ui/ok","value":1},{"op":"add","path":"/presentation","value":2}]"#,
            ),
            patch(r#"[{"op":"add","value":1}]"#),
            patch(r#"[{"op":"add","path":7}]"#),
            patch("[]"),
        ] {
            assert_eq!(
                classify(private.as_bytes()),
                Verdict::DropInternal,
                "{private}"
            );
        }
    }

    #[test]
    fn an_unreadable_state_patch_should_fail_closed_as_malformed() {
        for bad in [
            "event: agui.state.patch\ndata: {not json\n\n",
            "event: agui.state.patch\ndata: {\"kind\":\"state\"}\n\n",
            "event: agui.state.patch\ndata: {\"patch\":\"x\"}\n\n",
        ] {
            assert_eq!(classify(bad.as_bytes()), Verdict::DropMalformed, "{bad}");
        }
    }

    #[test]
    fn event_less_frames_should_be_kept_only_for_done_and_comments() {
        assert_eq!(classify(b"data: [DONE]\n\n"), Verdict::Forward);
        assert_eq!(classify(b"data:[DONE]\r\n\r\n"), Verdict::Forward);
        assert_eq!(classify(b": keep-alive\n\n"), Verdict::Forward);
        assert_eq!(classify(OPENAI.as_bytes()), Verdict::DropInternal);
        assert_eq!(classify(b"data: {not json\n\n"), Verdict::DropInternal);
        assert_eq!(
            classify(b"id: 4\ndata: [DONE] x\n\n"),
            Verdict::DropInternal
        );
    }

    #[test]
    fn events_split_across_chunks_should_be_handled_at_every_split_point() {
        let stream = [START, POLICY, DELTA, MANIFEST, DONE].concat();
        let expected = [START, DELTA, DONE].concat();
        let bytes = stream.as_bytes();
        for split in 0..=bytes.len() {
            let out = run(&[&bytes[..split], &bytes[split..]]);
            assert_eq!(
                String::from_utf8(out.forward).unwrap(),
                expected,
                "split at {split}"
            );
            assert_eq!(out.dropped_internal, 2, "split at {split}");
        }
    }

    #[test]
    fn crlf_and_cr_line_endings_should_split_events() {
        let crlf = POLICY.replace('\n', "\r\n");
        let cr = DELTA.replace('\n', "\r");
        let stream = [crlf.as_str(), cr.as_str()].concat();
        let bytes = stream.as_bytes();
        // Split between the `\r` and `\n` of the policy's blank line.
        let split = crlf.len() - 1;
        let out = run(&[&bytes[..split], &bytes[split..]]);
        assert_eq!(String::from_utf8(out.forward).unwrap(), cr);
        assert_eq!(out.dropped_internal, 1);
    }

    #[test]
    fn a_complete_event_should_be_released_without_waiting_for_the_next() {
        let mut filter = InternalArtifactFilter::new();
        let out = filter.push(format!("{DELTA}event: agui.mes").as_bytes());
        assert_eq!(String::from_utf8(out.forward).unwrap(), DELTA);
    }

    #[test]
    fn malformed_artifact_should_be_reported_as_malformed_not_internal() {
        for bad in [
            "event: agui.artifact\ndata: {not json\n\n",
            "event: agui.artifact\ndata: {\"title\":\"no type\"}\n\n",
            "event: agui.artifact\ndata: {\"artifact_type\":7}\n\n",
        ] {
            assert_eq!(classify(bad.as_bytes()), Verdict::DropMalformed, "{bad}");
            let out = run(&[bad.as_bytes(), DELTA.as_bytes()]);
            assert_eq!((out.dropped_internal, out.dropped_malformed), (0, 1));
            assert_eq!(String::from_utf8(out.forward).unwrap(), DELTA);
        }
    }

    #[test]
    fn multi_line_data_should_be_joined_before_parsing() {
        let split = "event: agui.artifact\ndata: {\"artifact_type\":\ndata: \"turn_manifest\"}\n\n";
        assert_eq!(classify(split.as_bytes()), Verdict::DropInternal);
    }

    #[test]
    fn unterminated_tail_should_be_filtered_at_end_of_stream() {
        let tail = POLICY.trim_end();
        let out = run(&[DELTA.as_bytes(), tail.as_bytes()]);
        assert_eq!(String::from_utf8(out.forward).unwrap(), DELTA);
        assert_eq!(out.dropped_internal, 1);

        let tail = DELTA.trim_end();
        let out = run(&[tail.as_bytes()]);
        assert_eq!(String::from_utf8(out.forward).unwrap(), tail);
    }
}
