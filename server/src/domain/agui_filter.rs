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
//! `\r\n` or `\r` line endings). Kept events are returned in order, each as a
//! rebuilt frame; no upstream bytes are forwarded as they arrived. A complete event is released as soon as its terminating
//! blank line arrives; only an incomplete event is held.
//!
//! What is kept:
//! - the events in [`ALLOWED_EVENTS`], each rebuilt from the fields the client
//!   reads (`public_payload`), so provider and model names, cost, raw error
//!   text, policy reasons and any field UAR adds later stay off the wire;
//! - `agui.artifact` only when `artifact_type` is in [`ALLOWED_ARTIFACT_TYPES`]
//!   and, for `a2ui`, `content` is a string of at most [`MAX_A2UI_CONTENT_BYTES`]
//!   whose components are all in [`PASSIVE_A2UI_COMPONENTS`] (see
//!   [`is_passive_surface`]);
//! - `agui.state.patch` only when every op's `path` and `from` are under `/a2ui/`;
//! - an event-less frame only when its data is `[DONE]`;
//! - comment-only frames (keep-alives), which carry no data.
//!
//! What is derived: `agui.step` ([`STEP_EVENT`]), a content-free progress frame
//! built from UAR's tool and reasoning events by a per-response
//! [`StepTracker`] (see `crate::domain::agui_steps`). It carries only a phase,
//! a server-minted index and a fixed label, never a tool id, name, arguments,
//! result, policy reason or reasoning text. A tool denial reaches a visitor
//! only as an `agui.step` with phase `denied`; `agui.tool_call.denied` itself
//! is not forwarded. An upstream frame named `agui.step` is dropped.
//!
//! The outbound set is therefore [`ALLOWED_EVENTS`], [`ARTIFACT_EVENT`],
//! [`STATE_PATCH_EVENT`], [`STEP_EVENT`], `[DONE]` and keep-alives. Memory
//! events (`agui.memory.*`) are never forwarded (decision D-P3).
//!
//! An `agui.artifact` or `agui.state.patch` whose payload cannot be read (bad
//! JSON, missing field) is dropped, but reported as [`Verdict::DropMalformed`]
//! so the caller logs it rather than counting it as internal.
//!
//! The same pass reports the run signals the meter needs ([`Signal`]): the
//! first `agui.message.delta` (time to first token), `agui.done` with its
//! usage, `agui.cancelled` and `agui.error`. Signals are read from the
//! upstream event whether or not it is forwarded.

use serde_json::{Map, Value, json};

pub use crate::domain::agui_steps::STEP_EVENT;
use crate::domain::agui_steps::{StepOutcome, StepTracker};
use crate::domain::meter::{Usage, parse_done_usage};

pub const ARTIFACT_EVENT: &str = "agui.artifact";
pub const STATE_PATCH_EVENT: &str = "agui.state.patch";
/// Artifact types a visitor may receive. Everything else is diagnostic.
pub const ALLOWED_ARTIFACT_TYPES: [&str; 1] = ["a2ui"];
/// Upstream events a visitor may receive, rebuilt. `agui.done` carries the
/// usage the meter reads. Tool and reasoning events are not here: they become
/// [`STEP_EVENT`] frames.
pub const ALLOWED_EVENTS: [&str; 7] = [
    "agui.stream.start",
    "agui.message.delta",
    "agui.done",
    "agui.error",
    "agui.cancelled",
    "agui.citation.added",
    "agui.rag_citations",
];
/// The only A2UI components a visitor may be sent: layout and text, nothing
/// that takes input. The client enforces the same set on the public build.
pub const PASSIVE_A2UI_COMPONENTS: [&str; 5] = ["Card", "Column", "Row", "Text", "Divider"];
/// Keys an A2UI server-to-client message may carry.
const A2UI_MESSAGE_KEYS: [&str; 6] = [
    "version",
    "profile",
    "createSurface",
    "updateComponents",
    "updateDataModel",
    "deleteSurface",
];
/// Replaces UAR's error text, which can name hosts, providers or tables.
pub const PUBLIC_ERROR_MESSAGE: &str = "The reply stopped before it finished.";
/// Largest `a2ui` artifact `content` forwarded, in bytes. The site client
/// refuses anything larger than this too.
pub const MAX_A2UI_CONTENT_BYTES: usize = 256 * 1024;
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
    fn take(&mut self, event: &[u8], steps: &mut StepTracker) {
        let parsed = ParsedEvent::parse(event);
        if let Some(signal) = parsed.signal() {
            self.signals.push(signal);
        }
        let (frames, dropped) = evaluate(&parsed, steps);
        self.forward.extend_from_slice(&frames);
        match dropped {
            None => {}
            Some(Verdict::DropMalformed) => self.dropped_malformed += 1,
            Some(_) => self.dropped_internal += 1,
        }
    }
}

/// The frames to send for one upstream event, and the drop verdict when the
/// event itself was not forwarded. A drop can still send frames: a malformed
/// message delta still ends an active thinking step.
fn evaluate(parsed: &ParsedEvent, steps: &mut StepTracker) -> (Vec<u8>, Option<Verdict>) {
    let step = match parsed.event_type.as_deref() {
        Some(name) => steps.observe(name, &parsed.data),
        None => StepOutcome::Pass { prefix: Vec::new() },
    };
    match step {
        StepOutcome::Replaced { frames } if frames.is_empty() => {
            (frames, Some(Verdict::DropInternal))
        }
        StepOutcome::Replaced { frames } => (frames, None),
        StepOutcome::Malformed => (Vec::new(), Some(Verdict::DropMalformed)),
        StepOutcome::Pass { mut prefix } => match parsed.outcome() {
            Outcome::Rewritten(frame) => {
                prefix.extend_from_slice(&frame);
                (prefix, None)
            }
            Outcome::Drop(verdict) => (prefix, Some(verdict)),
        },
    }
}

/// Incremental filter over one SSE response body. Holds the step state, so
/// use one instance per response.
#[derive(Debug, Default)]
pub struct InternalArtifactFilter {
    pending: Vec<u8>,
    steps: StepTracker,
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
            out.take(&self.pending[start..start + len], &mut self.steps);
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
            out.take(&rest, &mut self.steps);
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

/// Classifies one event block (its bytes, with or without the terminator), as
/// the first event of a response.
pub fn classify(event: &[u8]) -> Verdict {
    let (_, dropped) = evaluate(&ParsedEvent::parse(event), &mut StepTracker::default());
    dropped.unwrap_or(Verdict::Forward)
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

    /// What to send for this event: a frame rebuilt from whitelisted fields,
    /// or nothing.
    fn outcome(&self) -> Outcome {
        match self.event_type.as_deref() {
            // Rebuilt too: a comment or an `id:`-only frame can carry UAR text.
            None => match self.data.trim() {
                "" => Outcome::Rewritten(b":\n\n".to_vec()),
                DONE_SENTINEL => Outcome::Rewritten(b"data: [DONE]\n\n".to_vec()),
                _ => Outcome::Drop(Verdict::DropInternal),
            },
            Some(ARTIFACT_EVENT) => self.artifact_outcome(),
            Some(STATE_PATCH_EVENT) => self.state_patch_outcome(),
            Some(name) if ALLOWED_EVENTS.contains(&name) => self.named_outcome(name),
            Some(_) => Outcome::Drop(Verdict::DropInternal),
        }
    }

    /// An allowed event, rebuilt from the fields the public client reads. A
    /// field UAR adds later never reaches a visitor until it is named here.
    fn named_outcome(&self, name: &str) -> Outcome {
        let payload = if self.data.trim().is_empty() {
            Value::Null
        } else {
            match serde_json::from_str::<Value>(&self.data) {
                Ok(value) => value,
                Err(_) => return Outcome::Drop(Verdict::DropMalformed),
            }
        };
        match public_payload(name, &payload) {
            Some(public) => Outcome::Rewritten(frame(name, &public)),
            None => Outcome::Drop(Verdict::DropMalformed),
        }
    }

    fn artifact_outcome(&self) -> Outcome {
        let payload: Option<Value> = serde_json::from_str(&self.data).ok();
        let Some(kind) = payload
            .as_ref()
            .and_then(|v| v.get("artifact_type"))
            .and_then(Value::as_str)
        else {
            return Outcome::Drop(Verdict::DropMalformed);
        };
        if !ALLOWED_ARTIFACT_TYPES.contains(&kind) {
            return Outcome::Drop(Verdict::DropInternal);
        }
        // A public `a2ui` artifact is a string the client parses and caps, so
        // anything else, larger, or using a component that takes input never
        // reaches a visitor.
        let Some(content) = payload
            .as_ref()
            .and_then(|v| v.get("content"))
            .and_then(Value::as_str)
        else {
            return Outcome::Drop(Verdict::DropMalformed);
        };
        if content.len() > MAX_A2UI_CONTENT_BYTES || !is_passive_surface(content) {
            return Outcome::Drop(Verdict::DropMalformed);
        }
        let mut public = Map::new();
        public.insert("artifact_type".into(), json!(kind));
        public.insert("content".into(), json!(content));
        for key in ["artifact_id", "title"] {
            if let Some(text) = payload
                .as_ref()
                .and_then(|v| v.get(key))
                .filter(|v| v.is_string())
            {
                public.insert(key.into(), text.clone());
            }
        }
        Outcome::Rewritten(frame(ARTIFACT_EVENT, &Value::Object(public)))
    }

    /// Fail closed: one op outside `/a2ui/`, in `path` or `from`, drops the
    /// whole patch. Only `op`, `path`, `from` and `value` survive.
    fn state_patch_outcome(&self) -> Outcome {
        let payload: Option<Value> = serde_json::from_str(&self.data).ok();
        let Some(ops) = payload
            .as_ref()
            .and_then(|v| v.get("patch"))
            .and_then(Value::as_array)
        else {
            return Outcome::Drop(Verdict::DropMalformed);
        };
        let public_ops: Option<Vec<Value>> = ops
            .iter()
            .map(|op| {
                let path = op.get("path").and_then(Value::as_str)?;
                if !path.starts_with(A2UI_PATH_PREFIX) {
                    return None;
                }
                if let Some(from) = op.get("from") {
                    if !from
                        .as_str()
                        .is_some_and(|f| f.starts_with(A2UI_PATH_PREFIX))
                    {
                        return None;
                    }
                }
                let mut public = Map::new();
                for key in ["op", "path", "from", "value"] {
                    if let Some(v) = op.get(key) {
                        public.insert(key.into(), v.clone());
                    }
                }
                Some(Value::Object(public))
            })
            .collect();
        let Some(public_ops) = public_ops.filter(|ops| !ops.is_empty()) else {
            return Outcome::Drop(Verdict::DropInternal);
        };
        let body = json!({ "kind": "state", "patch": public_ops });
        if body.to_string().len() > MAX_A2UI_CONTENT_BYTES {
            return Outcome::Drop(Verdict::DropMalformed);
        }
        Outcome::Rewritten(frame(STATE_PATCH_EVENT, &body))
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

/// What the filter does with one event.
enum Outcome {
    /// Forward this rebuilt frame.
    Rewritten(Vec<u8>),
    Drop(Verdict),
}

/// One SSE frame. `serde_json` escapes newlines, so `data` is a single line.
fn frame(name: &str, payload: &Value) -> Vec<u8> {
    format!("event: {name}\ndata: {payload}\n\n").into_bytes()
}

/// A string field, only if it is a string.
fn text_field(obj: &Value, key: &str) -> Option<Value> {
    obj.get(key).filter(|v| v.is_string()).cloned()
}

/// A numeric field, only if it is a number.
fn number_field(obj: &Value, key: &str) -> Option<Value> {
    obj.get(key).filter(|v| v.is_number()).cloned()
}

/// Copies the named fields that are present and of the right kind.
fn pick(obj: &Value, texts: &[&str], numbers: &[&str]) -> Map<String, Value> {
    let mut out = Map::new();
    for key in texts {
        if let Some(v) = text_field(obj, key) {
            out.insert((*key).into(), v);
        }
    }
    for key in numbers {
        if let Some(v) = number_field(obj, key) {
            out.insert((*key).into(), v);
        }
    }
    out
}

/// The public form of an allowed event, or `None` when a field the client
/// needs is missing.
fn public_payload(name: &str, v: &Value) -> Option<Value> {
    match name {
        "agui.stream.start" => Some(json!({})),
        "agui.message.delta" => Some(match v.pointer("/delta/text").and_then(Value::as_str) {
            Some(text) => json!({ "delta": { "text": text } }),
            None => json!({ "delta": {} }),
        }),
        // The meter reads usage from the upstream event; a visitor needs none,
        // and `usage.model` and cost name the provider.
        "agui.done" => Some(json!({ "kind": "done" })),
        "agui.error" => Some(json!({ "kind": "error", "message": PUBLIC_ERROR_MESSAGE })),
        "agui.cancelled" => {
            let mut out = json!({ "kind": "cancelled" });
            if let Some(usage) = v.get("usage") {
                let tokens = pick(
                    usage,
                    &[],
                    &["input_tokens", "output_tokens", "total_tokens"],
                );
                if !tokens.is_empty() {
                    out["usage"] = Value::Object(tokens);
                }
            }
            Some(out)
        }
        "agui.citation.added" => {
            let citation = v.get("citation").filter(|c| c.is_object())?;
            Some(json!({
                "kind": "citation",
                "phase": "added",
                "citation": pick(citation, &["url", "title", "snippet"], &["index"]),
            }))
        }
        "agui.rag_citations" => {
            let citations: Vec<Value> = v
                .get("citations")
                .and_then(Value::as_array)?
                .iter()
                .filter(|c| c.is_object())
                .map(|c| Value::Object(pick(c, &["document_name", "snippet"], &["marker"])))
                .collect();
            Some(json!({ "kind": "rag_citations", "phase": "added", "citations": citations }))
        }
        _ => None,
    }
}

/// True when every line is an A2UI message whose components are all in
/// [`PASSIVE_A2UI_COMPONENTS`] and none carries an `action` or a function
/// `call`. An empty surface is not passive: there is nothing to show.
pub fn is_passive_surface(content: &str) -> bool {
    let mut messages = 0;
    for line in content.lines().filter(|l| !l.trim().is_empty()) {
        let Ok(Value::Object(message)) = serde_json::from_str::<Value>(line) else {
            return false;
        };
        if !message
            .keys()
            .all(|k| A2UI_MESSAGE_KEYS.contains(&k.as_str()))
        {
            return false;
        }
        if let Some(update) = message.get("updateComponents") {
            let Some(components) = update.get("components").and_then(Value::as_array) else {
                return false;
            };
            let all_passive = components.iter().all(|c| {
                c.get("component")
                    .and_then(Value::as_str)
                    .is_some_and(|name| PASSIVE_A2UI_COMPONENTS.contains(&name))
            });
            if !all_passive || has_interactive_key(update) {
                return false;
            }
        }
        messages += 1;
    }
    messages > 0
}

/// An `action` (event or function) or a function `call` anywhere inside.
fn has_interactive_key(value: &Value) -> bool {
    match value {
        Value::Object(map) => map
            .iter()
            .any(|(k, v)| k == "action" || k == "call" || has_interactive_key(v)),
        Value::Array(items) => items.iter().any(has_interactive_key),
        _ => false,
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
    // What a visitor receives for the frames above.
    const PUB_START: &str = "event: agui.stream.start\ndata: {}\n\n";
    const PUB_DELTA: &str = "event: agui.message.delta\ndata: {\"delta\":{\"text\":\"hi\"}}\n\n";
    const PUB_DONE: &str = "event: agui.done\ndata: {\"kind\":\"done\"}\n\n";

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
    const PUB_A2UI: &str =
        "event: agui.artifact\ndata: {\"artifact_type\":\"a2ui\",\"content\":\"{}\"}\n\n";
    const DONE_SENTINEL_FRAME: &str = "data: [DONE]\n\n";

    const THINK: &str =
        "event: agui.thinking.delta\nid: 10\ndata: {\"delta\":{\"text\":\"t\"}}\n\n";
    const TOOL_START: &str = "event: agui.tool_call.complete\nid: 11\ndata: {\"call_index\":0,\"id\":\"c\",\"name\":\"presentation_render\",\"arguments_json\":\"{}\"}\n\n";
    const TOOL_DELTA: &str = "event: agui.tool_call.delta\nid: 12\ndata: {\"call_index\":0,\"id\":\"c\",\"delta\":{\"arguments\":\"{}\"}}\n\n";
    const TOOL_RESULT: &str = "event: agui.tool_result\nid: 13\ndata: {\"call_index\":0,\"id\":\"c\",\"name\":\"presentation_render\",\"content\":\"x\",\"success\":true}\n\n";
    const MEMORY: &str = "event: agui.memory.recall\nid: 14\ndata: {\"items\":[]}\n\n";

    /// The `agui.step` frame a visitor receives.
    fn step(phase: &str, index: u64, label: &str) -> String {
        let data = json!({ "kind": "step", "phase": phase, "index": index, "label": label });
        format!("event: agui.step\ndata: {data}\n\n")
    }

    #[test]
    fn should_forward_only_allowlisted_frames_in_order_rebuilt_from_public_fields() {
        let stream = [
            START,
            POLICY,
            THINK,
            THINK,
            DELTA,
            MANIFEST,
            TOOL_START,
            TOOL_DELTA,
            TOOL_RESULT,
            MEMORY,
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
            [
                PUB_START,
                &step("started", 0, "Thinking"),
                &step("finished", 0, "Thinking"),
                PUB_DELTA,
                &step("started", 1, "Preparing an answer card"),
                &step("finished", 1, "Preparing an answer card"),
                PUB_A2UI,
                KEEPALIVE,
                DONE_SENTINEL_FRAME,
                PUB_DONE
            ]
            .concat()
        );
        // POLICY, the second THINK, MANIFEST, TOOL_DELTA, MEMORY, PROVIDER,
        // ATTEMPT, OPENAI and CODE.
        assert_eq!((out.dropped_internal, out.dropped_malformed), (9, 0));
    }

    #[test]
    fn every_allowed_event_name_should_be_forwarded() {
        for name in ALLOWED_EVENTS {
            let data = match name {
                "agui.citation.added" => r#"{"citation":{"index":1}}"#,
                "agui.rag_citations" => r#"{"citations":[]}"#,
                _ => "{}",
            };
            let frame = format!("event: {name}\ndata: {data}\n\n");
            assert_eq!(classify(frame.as_bytes()), Verdict::Forward, "{name}");
        }
    }

    #[test]
    fn step_source_events_should_be_forwarded_only_as_derived_steps() {
        for (name, data, verdict) in [
            ("agui.thinking.delta", "{}", Verdict::Forward),
            ("agui.reasoning.delta", "{}", Verdict::Forward),
            ("agui.tool_call.complete", r#"{"id":"c"}"#, Verdict::Forward),
            ("agui.tool_call.denied", r#"{"id":"c"}"#, Verdict::Forward),
            // Nothing started, so nothing to finish.
            ("agui.tool_result", r#"{"id":"c"}"#, Verdict::DropInternal),
            // No id and no call_index: no step can be keyed.
            ("agui.tool_call.complete", "{}", Verdict::DropMalformed),
            ("agui.tool_result", "{}", Verdict::DropMalformed),
            ("agui.tool_call.denied", "{}", Verdict::DropMalformed),
            (
                "agui.tool_call.complete",
                "{not json",
                Verdict::DropMalformed,
            ),
        ] {
            let frame = format!("event: {name}\ndata: {data}\n\n");
            assert_eq!(classify(frame.as_bytes()), verdict, "{name} {data}");
            let out = String::from_utf8(run(&[frame.as_bytes()]).forward).unwrap();
            assert!(
                out.is_empty() || out.starts_with("event: agui.step\n"),
                "{name}: {out}"
            );
        }
    }

    #[test]
    fn every_other_event_name_should_be_dropped() {
        for name in [
            "agui.step",
            "agui.tool_call.delta",
            "agui.tool_call.approval_required",
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
            "runtime.tool_call",
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

    fn a2ui_with(content: &str) -> String {
        format!("event: agui.artifact\ndata: {{\"artifact_type\":\"a2ui\"{content}}}\n\n")
    }

    /// A valid, passive A2UI message line padded to exactly `len` bytes.
    fn surface_of_len(len: usize) -> String {
        let head =
            r#"{"version":"v0.9.1","updateDataModel":{"surfaceId":"s","path":"/a","value":""#;
        let tail = r#""}}"#;
        let pad = len - head.len() - tail.len();
        format!("{head}{}{tail}", "a".repeat(pad))
    }

    fn a2ui_frame(content: &str) -> String {
        let data = json!({ "artifact_type": "a2ui", "content": content });
        format!("event: agui.artifact\ndata: {data}\n\n")
    }

    #[test]
    fn an_a2ui_artifact_should_be_kept_only_with_string_content_within_the_cap() {
        let at_cap = surface_of_len(MAX_A2UI_CONTENT_BYTES);
        assert_eq!(at_cap.len(), MAX_A2UI_CONTENT_BYTES);
        assert_eq!(classify(a2ui_frame(&at_cap).as_bytes()), Verdict::Forward);

        let over = surface_of_len(MAX_A2UI_CONTENT_BYTES + 1);
        assert_eq!(
            classify(a2ui_frame(&over).as_bytes()),
            Verdict::DropMalformed,
            "oversized"
        );
        for (name, content) in [
            ("missing content", ""),
            ("object content", r#","content":{"x":1}"#),
            ("null content", r#","content":null"#),
            ("number content", r#","content":7"#),
        ] {
            assert_eq!(
                classify(a2ui_with(content).as_bytes()),
                Verdict::DropMalformed,
                "{name}"
            );
        }
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
    fn event_less_frames_should_be_rebuilt_so_ids_and_comment_text_stay_internal() {
        let tail = "data: [DONE]\nid: 59:3:2\n\nid: 59:3:3";
        let out = run(&[tail.as_bytes()]);
        let text = String::from_utf8(out.forward).unwrap();
        assert_eq!(text, "data: [DONE]\n\n:\n\n");
        for frame in [
            ": run 8dab8434 on host surreal-0\n\n",
            "id: 7\nretry: 5000\n\n",
            "data: [DONE]\nid: 9\nretry: 1\n\n",
        ] {
            let text = String::from_utf8(run(&[frame.as_bytes()]).forward).unwrap();
            assert!(
                text == ":\n\n" || text == "data: [DONE]\n\n",
                "{frame:?} -> {text:?}"
            );
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
        let expected = [PUB_START, PUB_DELTA, PUB_DONE].concat();
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
        assert_eq!(String::from_utf8(out.forward).unwrap(), PUB_DELTA);
        assert_eq!(out.dropped_internal, 1);
    }

    #[test]
    fn a_complete_event_should_be_released_without_waiting_for_the_next() {
        let mut filter = InternalArtifactFilter::new();
        let out = filter.push(format!("{DELTA}event: agui.mes").as_bytes());
        assert_eq!(String::from_utf8(out.forward).unwrap(), PUB_DELTA);
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
            assert_eq!(String::from_utf8(out.forward).unwrap(), PUB_DELTA);
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
        assert_eq!(String::from_utf8(out.forward).unwrap(), PUB_DELTA);
        assert_eq!(out.dropped_internal, 1);

        let tail = DELTA.trim_end();
        let out = run(&[tail.as_bytes()]);
        assert_eq!(String::from_utf8(out.forward).unwrap(), PUB_DELTA);
    }

    /// What a visitor receives for one upstream frame: the event name and the
    /// parsed `data`, or `None` when it is dropped.
    fn public(frame: &str) -> Option<(String, Value)> {
        let out = run(&[frame.as_bytes()]);
        if out.forward.is_empty() {
            return None;
        }
        let text = String::from_utf8(out.forward).unwrap();
        let mut lines = text.lines();
        let name = lines.next()?.strip_prefix("event: ")?.to_owned();
        let data = lines.next()?.strip_prefix("data: ")?;
        assert_eq!(lines.next(), Some(""), "one frame, one blank line: {text}");
        assert_eq!(lines.next(), None, "{text}");
        Some((name, serde_json::from_str(data).unwrap()))
    }

    fn named(name: &str, data: &str) -> String {
        format!("event: {name}\nid: 42\nretry: 1000\ndata: {data}\n\n")
    }

    #[test]
    fn done_should_not_carry_usage_model_or_cost_to_a_visitor() {
        let upstream = r#"{"kind":"done","request_id":"r1","usage":{"input_tokens":1430,"output_tokens":210,"total_tokens":1640,"model":"qwen3.8-max","cost_usd_estimate":0.0123},"provider":"openai"}"#;
        let (name, data) = public(&named("agui.done", upstream)).unwrap();
        assert_eq!(name, "agui.done");
        assert_eq!(data, json!({ "kind": "done" }));
        // The meter still sees the usage on the unfiltered event.
        let out = run(&[named("agui.done", upstream).as_bytes()]);
        assert!(matches!(out.signals[..], [Signal::Done(Some(_))]));
    }

    #[test]
    fn error_text_should_be_replaced_so_hosts_and_providers_stay_internal() {
        let upstream = r#"{"kind":"error","request_id":"r","message":"surreal at 10.0.0.3:8000 refused: table sessions (provider openai)","code":"surreal_unavailable"}"#;
        let (_, data) = public(&named("agui.error", upstream)).unwrap();
        assert_eq!(
            data,
            json!({ "kind": "error", "message": PUBLIC_ERROR_MESSAGE })
        );
        let text = data.to_string();
        for leak in ["surreal", "10.0.0.3", "openai", "unavailable"] {
            assert!(!text.contains(leak), "{leak}");
        }
    }

    #[test]
    fn cancelled_should_keep_token_counts_and_drop_the_model_and_cost() {
        let upstream = r#"{"kind":"cancelled","request_id":"r","usage":{"input_tokens":10,"output_tokens":2,"total_tokens":12,"cost_usd_estimate":0.5,"model":"qwen3.8-max"}}"#;
        let (_, data) = public(&named("agui.cancelled", upstream)).unwrap();
        assert_eq!(
            data,
            json!({ "kind": "cancelled", "usage": { "input_tokens": 10, "output_tokens": 2, "total_tokens": 12 } })
        );
        let (_, bare) = public(&named("agui.cancelled", "{}")).unwrap();
        assert_eq!(bare, json!({ "kind": "cancelled" }));
        let (_, junk) = public(&named(
            "agui.cancelled",
            r#"{"usage":{"input_tokens":"many","model":"m"}}"#,
        ))
        .unwrap();
        assert_eq!(junk, json!({ "kind": "cancelled" }));
    }

    #[test]
    fn a_denied_tool_call_should_reach_a_visitor_only_as_a_step_with_a_fixed_label() {
        let upstream = r#"{"kind":"tool_call","phase":"denied","request_id":"run-9","call_index":0,"id":"call_1","name":"activate_skill","reason":"tools.mode=selected excludes activate_skill (effective_run_policy)","arguments_json":"{\"x\":1}"}"#;
        let (name, data) = public(&named("agui.tool_call.denied", upstream)).unwrap();
        assert_eq!(name, "agui.step");
        assert_eq!(
            data,
            json!({ "kind": "step", "phase": "denied", "index": 0, "label": "Working" })
        );
        for unkeyed in [r#"{"name":"t"}"#, r#"{"id":1,"name":"t"}"#] {
            assert_eq!(
                classify(named("agui.tool_call.denied", unkeyed).as_bytes()),
                Verdict::DropMalformed,
                "{unkeyed}"
            );
        }
    }

    // ── derived steps ───────────────────────────────────────────────────────

    /// Every frame a visitor receives, as (event name, parsed data).
    fn frames(out: &Filtered) -> Vec<(String, Value)> {
        let text = String::from_utf8(out.forward.clone()).unwrap();
        text.split_terminator("\n\n")
            .map(|block| {
                let mut lines = block.lines();
                let name = lines.next().unwrap().strip_prefix("event: ").unwrap();
                let data = lines.next().unwrap().strip_prefix("data: ").unwrap();
                (name.to_owned(), serde_json::from_str(data).unwrap())
            })
            .collect()
    }

    /// The `agui.step` payloads only, in order.
    fn steps_of(stream: &[String]) -> Vec<Value> {
        let joined = stream.concat();
        frames(&run(&[joined.as_bytes()]))
            .into_iter()
            .filter(|(name, _)| name == "agui.step")
            .map(|(_, data)| data)
            .collect()
    }

    fn st(phase: &str, index: u64, label: &str) -> Value {
        json!({ "kind": "step", "phase": phase, "index": index, "label": label })
    }

    fn start(id: &str, name: &str) -> String {
        named(
            "agui.tool_call.complete",
            &json!({ "id": id, "name": name, "call_index": 7, "arguments_json": "{}" }).to_string(),
        )
    }

    fn result(id: &str, success: Option<bool>) -> String {
        let mut data = json!({ "id": id, "name": "presentation_render", "content": "x" });
        if let Some(ok) = success {
            data["success"] = json!(ok);
        }
        named("agui.tool_result", &data.to_string())
    }

    fn denied(id: &str, name: &str) -> String {
        named(
            "agui.tool_call.denied",
            &json!({ "id": id, "name": name, "reason": "r" }).to_string(),
        )
    }

    #[test]
    fn a_tool_start_and_result_should_pair_on_a_minted_index_with_a_fixed_label() {
        let steps = steps_of(&[
            start("call_abc", "presentation_render"),
            result("call_abc", Some(true)),
        ]);
        // `call_index` upstream is 7; the public index is minted from 0.
        assert_eq!(
            steps,
            vec![
                st("started", 0, "Preparing an answer card"),
                st("finished", 0, "Preparing an answer card"),
            ]
        );
    }

    #[test]
    fn a_result_without_success_true_should_fail_the_step() {
        for success in [Some(false), None] {
            let steps = steps_of(&[start("c", "a2ui_render"), result("c", success)]);
            assert_eq!(
                steps,
                vec![
                    st("started", 0, "Preparing an answer card"),
                    st("failed", 0, "Preparing an answer card"),
                ],
                "{success:?}"
            );
        }
    }

    #[test]
    fn a_denial_should_reuse_the_index_of_a_started_call() {
        let steps = steps_of(&[
            start("a", "presentation_render"),
            start("b", "other_tool"),
            denied("b", "other_tool"),
            result("a", Some(true)),
        ]);
        assert_eq!(
            steps,
            vec![
                st("started", 0, "Preparing an answer card"),
                st("started", 1, "Working"),
                st("denied", 1, "Working"),
                st("finished", 0, "Preparing an answer card"),
            ]
        );
    }

    #[test]
    fn a_denial_without_a_start_should_mint_an_index_and_settle_the_call() {
        let steps = steps_of(&[
            start("a", "x"),
            denied("d", "presentation_render"),
            // UAR may still announce the denied call; it is already settled.
            start("d", "presentation_render"),
            result("d", Some(true)),
            denied("d", "presentation_render"),
        ]);
        assert_eq!(
            steps,
            vec![
                st("started", 0, "Working"),
                st("denied", 1, "Preparing an answer card"),
            ]
        );
    }

    #[test]
    fn a_duplicate_start_should_be_ignored() {
        let stream = [
            start("a", "x"),
            start("a", "presentation_render"),
            result("a", Some(true)),
        ];
        assert_eq!(
            steps_of(&stream),
            vec![st("started", 0, "Working"), st("finished", 0, "Working")]
        );
        let out = run(&[stream.concat().as_bytes()]);
        assert_eq!(out.dropped_internal, 1);
    }

    #[test]
    fn a_result_without_a_mapped_id_should_be_dropped() {
        let stream = [
            result("never_started", Some(true)),
            start("a", "x"),
            result("a", Some(true)),
            result("a", Some(true)),
        ];
        assert_eq!(
            steps_of(&stream),
            vec![st("started", 0, "Working"), st("finished", 0, "Working")]
        );
        let out = run(&[stream.concat().as_bytes()]);
        assert_eq!((out.dropped_internal, out.dropped_malformed), (2, 0));
    }

    #[test]
    fn call_index_should_key_a_step_only_when_the_id_is_missing() {
        let steps = steps_of(&[
            named("agui.tool_call.complete", r#"{"call_index":3,"name":"x"}"#),
            named("agui.tool_result", r#"{"call_index":3,"success":true}"#),
            named("agui.tool_result", r#"{"id":"3","success":true}"#),
        ]);
        assert_eq!(
            steps,
            vec![st("started", 0, "Working"), st("finished", 0, "Working")]
        );
    }

    #[test]
    fn steps_past_the_cap_should_be_dropped_with_their_results() {
        use crate::domain::agui_steps::MAX_TRACKED_STEPS;
        let mut stream: Vec<String> = (0..MAX_TRACKED_STEPS)
            .map(|i| start(&format!("c{i}"), "x"))
            .collect();
        stream.push(start("over", "x"));
        stream.push(result("over", Some(true)));
        stream.push(denied("over_denied", "x"));
        stream.push(result("c0", Some(true)));
        let steps = steps_of(&stream);
        assert_eq!(steps.len(), MAX_TRACKED_STEPS + 1);
        assert_eq!(
            steps[MAX_TRACKED_STEPS - 1],
            st("started", MAX_TRACKED_STEPS as u64 - 1, "Working")
        );
        assert_eq!(steps[MAX_TRACKED_STEPS], st("finished", 0, "Working"));
    }

    #[test]
    fn an_unknown_tool_name_should_be_labelled_working() {
        for name in [
            "web_fetch",
            "Presentation_Render",
            "presentation_render_v2",
            "",
        ] {
            assert_eq!(
                steps_of(&[start("c", name)]),
                vec![st("started", 0, "Working")],
                "{name}"
            );
        }
        assert_eq!(
            steps_of(&[named("agui.tool_call.complete", r#"{"id":"c"}"#)]),
            vec![st("started", 0, "Working")]
        );
    }

    fn reasoning(event: &str, text: &str) -> String {
        named(event, &json!({ "delta": { "text": text } }).to_string())
    }

    #[test]
    fn the_first_reasoning_delta_should_start_one_thinking_step_ended_by_a_message_delta() {
        for event in ["agui.thinking.delta", "agui.reasoning.delta"] {
            let stream = [
                reasoning(event, "a"),
                reasoning(event, "b"),
                reasoning("agui.reasoning.delta", "c"),
                named("agui.message.delta", r#"{"delta":{"text":"hi"}}"#),
                reasoning(event, "after"),
                named("agui.message.delta", r#"{"delta":{"text":"more"}}"#),
            ];
            let out = run(&[stream.concat().as_bytes()]);
            let names: Vec<String> = frames(&out).into_iter().map(|(n, _)| n).collect();
            assert_eq!(
                names,
                [
                    "agui.step",
                    "agui.step",
                    "agui.message.delta",
                    "agui.message.delta"
                ],
                "{event}"
            );
            assert_eq!(
                steps_of(&stream),
                vec![st("started", 0, "Thinking"), st("finished", 0, "Thinking")],
                "{event}"
            );
        }
    }

    #[test]
    fn a_thinking_step_should_finish_before_a_tool_starts() {
        let steps = steps_of(&[
            reasoning("agui.thinking.delta", "t"),
            start("c", "presentation_render"),
            result("c", Some(true)),
        ]);
        assert_eq!(
            steps,
            vec![
                st("started", 0, "Thinking"),
                st("finished", 0, "Thinking"),
                st("started", 1, "Preparing an answer card"),
                st("finished", 1, "Preparing an answer card"),
            ]
        );
    }

    #[test]
    fn a_thinking_step_should_finish_on_a_terminal_event_before_it() {
        for (terminal, data) in [
            ("agui.done", r#"{"usage":{"input_tokens":1}}"#),
            ("agui.error", r#"{"message":"m"}"#),
            ("agui.cancelled", "{}"),
            // Unreadable, so not forwarded; the run still ended.
            ("agui.done", "{not json"),
        ] {
            let stream = [reasoning("agui.thinking.delta", "t"), named(terminal, data)];
            let out = run(&[stream.concat().as_bytes()]);
            let got = frames(&out);
            assert_eq!(got[0].1, st("started", 0, "Thinking"), "{terminal}");
            assert_eq!(got[1].1, st("finished", 0, "Thinking"), "{terminal}");
            assert!(got.len() == 3 || data.starts_with("{not"), "{terminal}");
        }
    }

    #[test]
    fn a_thinking_step_should_not_be_ended_by_other_events_or_shown_without_reasoning() {
        let steps = steps_of(&[
            reasoning("agui.thinking.delta", "t"),
            MEMORY.to_owned(),
            A2UI.to_owned(),
            named("agui.tool_call.delta", r#"{"id":"c"}"#),
        ]);
        assert_eq!(steps, vec![st("started", 0, "Thinking")]);
        let none = steps_of(&[DELTA.to_owned(), DONE.to_owned()]);
        assert!(none.is_empty(), "{none:?}");
    }

    // Distinctive upstream values that must never reach a visitor.
    const LEAK_ID: &str = "call_SENTINEL_id_7f3k";
    const LEAK_NAME: &str = "SENTINEL_tool_name_q2";
    const LEAK_ARGS: &str = "SENTINEL_arguments_x8";
    const LEAK_RESULT: &str = "SENTINEL_result_content_m4";
    const LEAK_REASON: &str = "SENTINEL_policy_reason_p1";
    const LEAK_REASONING: &str = "SENTINEL_reasoning_text_r6";
    const LEAK_REQUEST: &str = "SENTINEL_request_id_z0";
    const LEAK_MEMORY: &str = "SENTINEL_memory_value_k5";

    fn leaky_stream() -> String {
        let tool = |event: &str, extra: Value| {
            let mut data = json!({
                "kind": "tool_call", "request_id": LEAK_REQUEST,
                "call_index": 0, "id": LEAK_ID, "name": LEAK_NAME,
            });
            data.as_object_mut()
                .unwrap()
                .extend(extra.as_object().unwrap().clone());
            named(event, &data.to_string())
        };
        let memory = |event: &str| {
            named(
                event,
                &json!({ "request_id": LEAK_REQUEST, "items": [{ "id": LEAK_ID, "value": LEAK_MEMORY }] })
                    .to_string(),
            )
        };
        [
            named(
                "agui.stream.start",
                &json!({ "request_id": LEAK_REQUEST }).to_string(),
            ),
            named(
                "agui.thinking.delta",
                &json!({ "request_id": LEAK_REQUEST, "delta": { "text": LEAK_REASONING } })
                    .to_string(),
            ),
            named(
                "agui.reasoning.delta",
                &json!({ "delta": { "text": LEAK_REASONING } }).to_string(),
            ),
            tool(
                "agui.tool_call.delta",
                json!({ "delta": { "arguments": LEAK_ARGS } }),
            ),
            tool(
                "agui.tool_call.complete",
                json!({ "arguments_json": LEAK_ARGS }),
            ),
            tool(
                "agui.tool_call.approval_required",
                json!({ "arguments_json": LEAK_ARGS, "risk_reason": LEAK_REASON }),
            ),
            tool(
                "agui.tool_result",
                json!({ "content": LEAK_RESULT, "success": true }),
            ),
            tool("agui.tool_call.denied", json!({ "reason": LEAK_REASON })),
            named(
                "agui.tool_call.denied",
                &json!({ "id": format!("{LEAK_ID}_2"), "name": LEAK_NAME, "reason": LEAK_REASON })
                    .to_string(),
            ),
            memory("agui.memory.recall"),
            memory("agui.memory.update"),
            memory("agui.memory.mutation"),
            named("agui.message.delta", r#"{"delta":{"text":"hi"}}"#),
            named(
                "agui.done",
                &json!({ "request_id": LEAK_REQUEST }).to_string(),
            ),
        ]
        .concat()
    }

    #[test]
    fn no_tool_reasoning_or_memory_internals_should_reach_a_visitor() {
        let stream = leaky_stream();
        // Every split point, so a sentinel cut across chunks is caught too.
        let bytes = stream.as_bytes();
        for split in (0..=bytes.len()).step_by(7) {
            let out = run(&[&bytes[..split], &bytes[split..]]);
            let text = String::from_utf8(out.forward).unwrap();
            for leak in [
                LEAK_ID,
                LEAK_NAME,
                LEAK_ARGS,
                LEAK_RESULT,
                LEAK_REASON,
                LEAK_REASONING,
                LEAK_REQUEST,
                LEAK_MEMORY,
                "SENTINEL",
                "agui.tool_call",
                "agui.tool_result",
                "agui.thinking",
                "agui.reasoning",
                "agui.memory",
                "call_index",
            ] {
                assert!(!text.contains(leak), "{leak} leaked at {split}: {text}");
            }
        }
        let steps = steps_of(&[stream]);
        assert_eq!(
            steps,
            vec![
                st("started", 0, "Thinking"),
                st("finished", 0, "Thinking"),
                st("started", 1, "Working"),
                st("finished", 1, "Working"),
                st("denied", 2, "Working"),
            ]
        );
    }

    #[test]
    fn memory_events_should_always_be_dropped() {
        for name in [
            "agui.memory.recall",
            "agui.memory.update",
            "agui.memory.mutation",
        ] {
            let frame = named(
                name,
                &json!({ "items": [{ "value": LEAK_MEMORY }] }).to_string(),
            );
            assert_eq!(classify(frame.as_bytes()), Verdict::DropInternal, "{name}");
            let out = run(&[frame.as_bytes()]);
            assert!(out.forward.is_empty(), "{name}");
            assert_eq!(out.dropped_internal, 1, "{name}");
        }
    }

    #[test]
    fn deltas_and_citations_should_keep_only_the_fields_the_client_reads() {
        let (_, delta) = public(&named(
            "agui.message.delta",
            r#"{"kind":"message","delta":{"text":"hi","model":"m"},"model":"m","request_id":"r"}"#,
        ))
        .unwrap();
        assert_eq!(delta, json!({ "delta": { "text": "hi" } }));

        let (_, cite) = public(&named(
            "agui.citation.added",
            r#"{"request_id":"r","citation":{"index":2,"url":"https://a.example","title":"T","snippet":"S","score":0.9,"internal_id":"x"}}"#,
        ))
        .unwrap();
        assert_eq!(
            cite,
            json!({"kind":"citation","phase":"added","citation":{"index":2,"url":"https://a.example","title":"T","snippet":"S"}})
        );

        let (_, rag) = public(&named(
            "agui.rag_citations",
            r#"{"request_id":"r","citations":[{"marker":1,"document_name":"faq.md","snippet":"s","document_id":"d","kb_id":"k","score":0.8},"junk"]}"#,
        ))
        .unwrap();
        assert_eq!(
            rag,
            json!({"kind":"rag_citations","phase":"added","citations":[{"marker":1,"document_name":"faq.md","snippet":"s"}]})
        );
    }

    #[test]
    fn an_allowed_event_with_unreadable_json_should_be_dropped_as_malformed() {
        for name in ALLOWED_EVENTS {
            assert_eq!(
                classify(named(name, "{not json").as_bytes()),
                Verdict::DropMalformed,
                "{name}"
            );
        }
    }

    #[test]
    fn id_and_retry_lines_should_not_reach_a_visitor() {
        let out = run(&[named("agui.message.delta", r#"{"delta":{"text":"hi"}}"#).as_bytes()]);
        let text = String::from_utf8(out.forward).unwrap();
        assert!(!text.contains("id:") && !text.contains("retry:"), "{text}");
    }

    #[test]
    fn an_a2ui_artifact_should_keep_only_id_title_type_and_content() {
        let data = json!({
            "artifact_type": "a2ui", "artifact_id": "a1", "title": "Card",
            "content": r#"{"version":"v0.9.1","deleteSurface":{"surfaceId":"s"}}"#,
            "language": "json", "sourceTool": "presentation_render",
            "metadata": { "template": "Answer card", "owner": "knowme-site" }
        });
        let frame = format!("event: agui.artifact\nid: 5\ndata: {data}\n\n");
        let (_, out) = public(&frame).unwrap();
        assert_eq!(
            out,
            json!({
                "artifact_type": "a2ui", "artifact_id": "a1", "title": "Card",
                "content": r#"{"version":"v0.9.1","deleteSurface":{"surfaceId":"s"}}"#
            })
        );
    }

    #[test]
    fn a_state_patch_should_keep_only_op_path_from_and_value_and_check_from() {
        let ok = patch(r#"[{"op":"copy","from":"/a2ui/a","path":"/a2ui/b","value":1,"meta":"x"}]"#);
        let (_, out) = public(&ok).unwrap();
        assert_eq!(
            out,
            json!({"kind":"state","patch":[{"op":"copy","from":"/a2ui/a","path":"/a2ui/b","value":1}]})
        );
        for hostile in [
            patch(r#"[{"op":"copy","from":"/presentation/secret","path":"/a2ui/b"}]"#),
            patch(r#"[{"op":"move","from":"/a2ui/a","path":"/internal"}]"#),
            patch(r#"[{"op":"copy","from":7,"path":"/a2ui/b"}]"#),
        ] {
            assert_eq!(
                classify(hostile.as_bytes()),
                Verdict::DropInternal,
                "{hostile}"
            );
        }
    }

    // ── passive surfaces ────────────────────────────────────────────────────

    const CREATE: &str = r#"{"version":"v0.9.1","createSurface":{"surfaceId":"s","catalogId":"urn:uar:a2ui:catalog:1"}}"#;

    fn surface(components: &str) -> String {
        format!(
            "{CREATE}\n{{\"version\":\"v0.9.1\",\"updateComponents\":{{\"surfaceId\":\"s\",\"components\":{components}}}}}"
        )
    }

    #[test]
    fn the_answer_card_and_inferred_row_surfaces_should_pass() {
        let card = surface(
            r#"[{"id":"root","component":"Card","child":"body"},{"id":"body","component":"Column","children":["title","rule","answer","source"]},{"id":"title","component":"Text","variant":"h3","text":{"path":"/title"}},{"id":"rule","component":"Divider"},{"id":"answer","component":"Text","variant":"body","text":{"path":"/answer"}},{"id":"source","component":"Text","variant":"caption","text":{"path":"/source"}}]"#,
        );
        let card = format!(
            "{card}\n{}",
            r#"{"version":"v0.9.1","updateDataModel":{"surfaceId":"s","path":"/","value":{"title":"T","answer":"A","source":"S","action":"data keys are inert"}}}"#
        );
        assert!(is_passive_surface(&card));
        let row = surface(
            r#"[{"id":"r","component":"Row","children":["a"],"justify":"spaceBetween"},{"id":"a","component":"Text","text":"x"},{"id":"root","component":"Card","child":"r"}]"#,
        );
        assert!(is_passive_surface(&row));
    }

    #[test]
    fn components_that_take_input_or_load_media_should_make_a_surface_non_passive() {
        for component in [
            "Button",
            "TextField",
            "CheckBox",
            "ChoicePicker",
            "DateTimeInput",
            "Slider",
            "Image",
            "Video",
            "AudioPlayer",
            "Icon",
            "List",
            "Modal",
            "Tabs",
            "card",
            "Unknown",
        ] {
            let content = surface(&format!(
                r#"[{{"id":"root","component":"Card","child":"x"}},{{"id":"x","component":"{component}"}}]"#
            ));
            assert!(!is_passive_surface(&content), "{component}");
            let frame = a2ui_frame(&content);
            assert_eq!(
                classify(frame.as_bytes()),
                Verdict::DropMalformed,
                "{component}"
            );
        }
    }

    #[test]
    fn an_action_or_function_call_should_make_a_surface_non_passive() {
        for components in [
            r#"[{"id":"root","component":"Text","text":"x","action":{"event":{"name":"go"}}}]"#,
            r#"[{"id":"root","component":"Text","text":{"call":"openUrl","args":{"url":"https://evil.example"}}}]"#,
            r#"[{"id":"root","component":"Card","child":"c","x":[{"deep":{"action":1}}]},{"id":"c","component":"Text","text":"y"}]"#,
            r#"[{"id":"root","component":"Text","text":"x","checks":[{"call":"required"}]}]"#,
        ] {
            assert!(!is_passive_surface(&surface(components)), "{components}");
        }
    }

    #[test]
    fn malformed_or_unknown_a2ui_messages_should_make_a_surface_non_passive() {
        let ok = surface(r#"[{"id":"root","component":"Text","text":"x"}]"#);
        assert!(is_passive_surface(&ok));
        for bad in [
            "",
            "   \n  ",
            "{not json",
            "[1,2]",
            "\"text\"",
            r#"{"version":"v0.9.1","callFunction":{"name":"openUrl"}}"#,
            r#"{"version":"v0.9.1","updateComponents":{"surfaceId":"s"}}"#,
            r#"{"version":"v0.9.1","updateComponents":{"surfaceId":"s","components":[{"id":"r"}]}}"#,
            r#"{"version":"v0.9.1","updateComponents":{"surfaceId":"s","components":[{"id":"r","component":7}]}}"#,
        ] {
            assert!(!is_passive_surface(bad), "{bad}");
            assert!(
                !is_passive_surface(&format!("{ok}\n{bad}")) || bad.trim().is_empty(),
                "second line {bad}"
            );
        }
    }
}
