// TJ-ARCH-MOB-001 compliant
//! Drops UAR's internal run artifacts from the public SSE stream (FR-45).
//!
//! UAR emits `event: agui.artifact` frames whose JSON `artifact_type` is
//! `effective_run_policy` or `turn_manifest` on every run (UAR
//! `src/uar/api/sse.rs`, `to_agui_event`). They expose the agent's policy and
//! tool set. The filter splits the stream at SSE event boundaries (a blank
//! line, with `\n`, `\r\n` or `\r` line endings), drops those two artifact
//! types, and returns every other event's original bytes, in order. A
//! complete event is released as soon as its terminating blank line arrives;
//! only an incomplete event is held.
//!
//! An `agui.artifact` whose `artifact_type` cannot be read (bad JSON, missing
//! field) is dropped too, because it could be an internal one, but it is
//! reported as [`Verdict::DropMalformed`] so the caller logs it rather than
//! counting it as an internal artifact.
//!
//! The same pass reports the run signals the meter needs ([`Signal`]): the
//! first `agui.message.delta` (time to first token), `agui.done` with its
//! usage, `agui.cancelled` and `agui.error`.

use serde_json::Value;

use crate::domain::meter::{Usage, parse_done_usage};

pub const ARTIFACT_EVENT: &str = "agui.artifact";
pub const INTERNAL_ARTIFACT_TYPES: [&str; 2] = ["effective_run_policy", "turn_manifest"];

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
        if self.event_type.as_deref() != Some(ARTIFACT_EVENT) {
            return Verdict::Forward;
        }
        let payload: Option<Value> = serde_json::from_str(&self.data).ok();
        match payload
            .as_ref()
            .and_then(|v| v.get("artifact_type"))
            .and_then(Value::as_str)
        {
            Some(kind) if INTERNAL_ARTIFACT_TYPES.contains(&kind) => Verdict::DropInternal,
            Some(_) => Verdict::Forward,
            None => Verdict::DropMalformed,
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

    #[test]
    fn should_drop_only_the_two_internal_artifacts_and_keep_order_and_bytes() {
        let stream = [
            START, POLICY, DELTA, MANIFEST, OPENAI, CODE, KEEPALIVE, DONE,
        ]
        .concat();
        let out = run(&[stream.as_bytes()]);
        assert_eq!(
            String::from_utf8(out.forward).unwrap(),
            [START, DELTA, OPENAI, CODE, KEEPALIVE, DONE].concat()
        );
        assert_eq!((out.dropped_internal, out.dropped_malformed), (2, 0));
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
        // Non-JSON data on any other event is not this filter's concern.
        assert_eq!(classify(b"data: [DONE]\n\n"), Verdict::Forward);
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
