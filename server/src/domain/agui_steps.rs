// TJ-ARCH-MOB-001 compliant
//! Derived public step events (`agui.step`) for one response stream.
//!
//! UAR's tool and reasoning events name tools, carry arguments, results,
//! policy reasons and reasoning text, so none of them is forwarded. Instead
//! the filter derives one content-free frame per step:
//!
//! ```text
//! event: agui.step
//! data: {"kind":"step","phase":"started"|"finished"|"failed"|"denied","index":<n>,"label":"<fixed>"}
//! ```
//!
//! - `index` is minted here, per response, in the order steps are first seen.
//!   It is never the upstream tool id or `call_index`.
//! - `label` is one of the fixed strings below, chosen by exact match on the
//!   upstream tool name. Upstream text never becomes a label.
//!
//! Derivation:
//! - `agui.tool_call.complete` (despite its name, UAR emits it when the call
//!   starts) mints an index for the upstream `id` (or `call_index` when `id`
//!   is missing) and emits `started`. A second start for a known key is ignored.
//! - `agui.tool_result` for a started, unsettled key emits `finished` when
//!   `success` is `true`, else `failed`. A result with no mapped key is dropped.
//! - `agui.tool_call.denied` emits `denied`, reusing the index of a started,
//!   unsettled key, or minting one.
//! - The first `agui.thinking.delta` or `agui.reasoning.delta` emits
//!   `started` with the label "Thinking"; it is `finished` by the first message
//!   delta, emitted tool start, or terminal event. Later reasoning deltas and
//!   all reasoning text are dropped.
//!
//! At most [`MAX_TRACKED_STEPS`] tool keys are tracked per response; a step
//! past the cap is dropped, and so is its result (fail closed).
//!
//! Web search (site-web-search): a call to a [`WEB_SEARCH_TOOLS`] name is
//! labelled [`LABEL_WEB_SEARCH`]. The first web-search result of a response
//! that settles a started call with `success: true` also yields one
//! `agui.web_citations` frame, right after its `finished` step, minted by
//! `crate::domain::web_citations` from the sanitized result. Any later
//! web-search result in the same response yields no citations (one search
//! per reply). The query, arguments, raw result, tool id and name are never
//! forwarded.

use std::collections::HashMap;

use serde_json::{Value, json};

use crate::domain::web_citations;

/// The derived public event name. An upstream frame with this name is never
/// forwarded: only the filter emits it.
pub const STEP_EVENT: &str = "agui.step";
/// Tool keys tracked per response; a step past this is not shown.
pub const MAX_TRACKED_STEPS: usize = 64;

/// Tool names that search the knowledge base.
///
/// UNVERIFIED and deliberately empty. The site agent
/// (`uar/agents/knowme-site.json`) allows only `presentation_render`, and UAR
/// retrieves knowledge-base chunks before the turn and injects them into the
/// prompt (`src/uar/rag/citation_stream.rs`), surfacing them as
/// `agui.rag_citations`, not as a tool call. No knowledge-search tool name was
/// found in UAR source or this repository. Add the exact name here once a real
/// capture shows one.
pub const KNOWLEDGE_SEARCH_TOOLS: [&str; 0] = [];
/// Tool names that render an answer card.
pub const ANSWER_CARD_TOOLS: [&str; 2] = ["presentation_render", "a2ui_render"];
/// The provider-visible name of the site's web-search tool, as UAR sends it in
/// `agui.tool_call.complete`: `sanitize_tool_name("{server}__{tool}")` with
/// server key `websearch` and tool `search` (UAR `src/mcp/registry.rs:958`,
/// `:1498-1528`, at `b4244aea`). Derived from source, not yet observed on a
/// real run (task 16.6.1); if the capture differs, change it here only.
pub const WEB_SEARCH_TOOLS: [&str; 1] = ["websearch__search"];

pub const LABEL_KNOWLEDGE_SEARCH: &str = "Searching the knowledge base";
pub const LABEL_WEB_SEARCH: &str = "Searching the web";
pub const LABEL_ANSWER_CARD: &str = "Preparing an answer card";
pub const LABEL_WORKING: &str = "Working";
pub const LABEL_THINKING: &str = "Thinking";

const TOOL_START_EVENT: &str = "agui.tool_call.complete";
const TOOL_RESULT_EVENT: &str = "agui.tool_result";
const TOOL_DENIED_EVENT: &str = "agui.tool_call.denied";
const REASONING_EVENTS: [&str; 2] = ["agui.thinking.delta", "agui.reasoning.delta"];
/// Upstream events that end an active thinking step.
const THINKING_ENDERS: [&str; 4] = [
    "agui.message.delta",
    "agui.done",
    "agui.error",
    "agui.cancelled",
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Phase {
    Started,
    Finished,
    Failed,
    Denied,
}

impl Phase {
    fn as_str(self) -> &'static str {
        match self {
            Phase::Started => "started",
            Phase::Finished => "finished",
            Phase::Failed => "failed",
            Phase::Denied => "denied",
        }
    }
}

/// How the upstream identifies one tool call.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
enum StepKey {
    Id(String),
    CallIndex(u64),
}

#[derive(Debug, Clone, Copy)]
struct ToolStep {
    index: u64,
    label: &'static str,
    settled: bool,
    web_search: bool,
}

#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
enum Thinking {
    #[default]
    NotSeen,
    Active(u64),
    Finished,
}

/// What the tracker made of one upstream event.
#[derive(Debug, PartialEq, Eq)]
pub enum StepOutcome {
    /// Not a step event; the filter handles it. `prefix` holds frames to send
    /// before it (a `finished` thinking step).
    Pass { prefix: Vec<u8> },
    /// A step event, replaced by these frames (possibly none).
    Replaced { frames: Vec<u8> },
    /// A step event the tracker cannot read (bad JSON, no key).
    Malformed,
}

/// Step state for one response stream.
#[derive(Debug, Default)]
pub struct StepTracker {
    next_index: u64,
    tools: HashMap<StepKey, ToolStep>,
    thinking: Thinking,
    /// A web-search result has been seen in this response.
    web_search_seen: bool,
}

impl StepTracker {
    /// Applies one upstream event, by name and raw `data`.
    pub fn observe(&mut self, event: &str, data: &str) -> StepOutcome {
        if REASONING_EVENTS.contains(&event) {
            return StepOutcome::Replaced {
                frames: self.on_reasoning(),
            };
        }
        if ![TOOL_START_EVENT, TOOL_RESULT_EVENT, TOOL_DENIED_EVENT].contains(&event) {
            let prefix = if THINKING_ENDERS.contains(&event) {
                self.end_thinking()
            } else {
                Vec::new()
            };
            return StepOutcome::Pass { prefix };
        }
        let Ok(payload) = serde_json::from_str::<Value>(data) else {
            return StepOutcome::Malformed;
        };
        let Some(key) = step_key(&payload) else {
            return StepOutcome::Malformed;
        };
        let frames = match event {
            TOOL_START_EVENT => self.on_tool_start(key, &payload),
            TOOL_RESULT_EVENT => self.on_tool_result(&key, &payload),
            _ => self.on_tool_denied(key, &payload),
        };
        StepOutcome::Replaced { frames }
    }

    fn mint(&mut self) -> u64 {
        let index = self.next_index;
        self.next_index += 1;
        index
    }

    fn on_reasoning(&mut self) -> Vec<u8> {
        if self.thinking != Thinking::NotSeen {
            return Vec::new();
        }
        let index = self.mint();
        self.thinking = Thinking::Active(index);
        step_frame(Phase::Started, index, LABEL_THINKING)
    }

    fn end_thinking(&mut self) -> Vec<u8> {
        let Thinking::Active(index) = self.thinking else {
            return Vec::new();
        };
        self.thinking = Thinking::Finished;
        step_frame(Phase::Finished, index, LABEL_THINKING)
    }

    fn on_tool_start(&mut self, key: StepKey, payload: &Value) -> Vec<u8> {
        if self.tools.contains_key(&key) || self.tools.len() >= MAX_TRACKED_STEPS {
            return Vec::new();
        }
        let name = tool_name(payload);
        let label = tool_label(name);
        let index = self.mint();
        self.tools.insert(
            key,
            ToolStep {
                index,
                label,
                settled: false,
                web_search: is_web_search(name),
            },
        );
        let mut frames = self.end_thinking();
        frames.extend(step_frame(Phase::Started, index, label));
        frames
    }

    fn on_tool_result(&mut self, key: &StepKey, payload: &Value) -> Vec<u8> {
        let Some(step) = self.tools.get_mut(key).filter(|s| !s.settled) else {
            return Vec::new();
        };
        step.settled = true;
        let step = *step;
        let succeeded = payload.get("success").and_then(Value::as_bool) == Some(true);
        let phase = if succeeded {
            Phase::Finished
        } else {
            Phase::Failed
        };
        let mut frames = step_frame(phase, step.index, step.label);
        if step.web_search && !self.web_search_seen {
            // One search per reply: only the first result can cite.
            self.web_search_seen = true;
            if succeeded {
                frames.extend(web_citations::frame_from_tool_result(payload));
            }
        }
        frames
    }

    fn on_tool_denied(&mut self, key: StepKey, payload: &Value) -> Vec<u8> {
        if let Some(step) = self.tools.get_mut(&key) {
            if step.settled {
                return Vec::new();
            }
            step.settled = true;
            return step_frame(Phase::Denied, step.index, step.label);
        }
        if self.tools.len() >= MAX_TRACKED_STEPS {
            return Vec::new();
        }
        let name = tool_name(payload);
        let label = tool_label(name);
        let index = self.mint();
        self.tools.insert(
            key,
            ToolStep {
                index,
                label,
                settled: true,
                web_search: is_web_search(name),
            },
        );
        step_frame(Phase::Denied, index, label)
    }
}

/// The upstream `id`, or `call_index` when `id` is missing.
fn step_key(payload: &Value) -> Option<StepKey> {
    match payload.get("id") {
        Some(Value::String(id)) if !id.is_empty() => Some(StepKey::Id(id.clone())),
        Some(_) => None,
        None => payload
            .get("call_index")
            .and_then(Value::as_u64)
            .map(StepKey::CallIndex),
    }
}

fn tool_name(payload: &Value) -> Option<&str> {
    payload.get("name").and_then(Value::as_str)
}

/// The fixed label for an upstream tool name.
fn tool_label(name: Option<&str>) -> &'static str {
    tool_label_from(name, &KNOWLEDGE_SEARCH_TOOLS)
}

/// Exact match, default last. Split out so the knowledge branch is testable
/// while [`KNOWLEDGE_SEARCH_TOOLS`] is empty.
fn tool_label_from(name: Option<&str>, knowledge: &[&str]) -> &'static str {
    match name {
        Some(n) if knowledge.contains(&n) => LABEL_KNOWLEDGE_SEARCH,
        Some(n) if is_web_search(Some(n)) => LABEL_WEB_SEARCH,
        Some(n) if ANSWER_CARD_TOOLS.contains(&n) => LABEL_ANSWER_CARD,
        _ => LABEL_WORKING,
    }
}

/// Exact match on [`WEB_SEARCH_TOOLS`].
fn is_web_search(name: Option<&str>) -> bool {
    name.is_some_and(|n| WEB_SEARCH_TOOLS.contains(&n))
}

fn step_frame(phase: Phase, index: u64, label: &'static str) -> Vec<u8> {
    let data = json!({
        "kind": "step",
        "phase": phase.as_str(),
        "index": index,
        "label": label,
    });
    format!("event: {STEP_EVENT}\ndata: {data}\n\n").into_bytes()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn labels_should_match_exactly_with_working_as_the_default() {
        assert_eq!(tool_label(Some("presentation_render")), LABEL_ANSWER_CARD);
        assert_eq!(tool_label(Some("a2ui_render")), LABEL_ANSWER_CARD);
        assert_eq!(tool_label(Some("websearch__search")), LABEL_WEB_SEARCH);
        assert_eq!(LABEL_WEB_SEARCH, "Searching the web");
        for other in [
            Some("Presentation_Render"),
            Some("presentation_render "),
            Some("kb_probe"),
            // Near misses and the raw Firecrawl surface are not the site tool.
            Some("websearch__Search"),
            Some("websearch::search"),
            Some("websearch__search_v2"),
            Some("firecrawl__firecrawl_search"),
            Some("firecrawl_search"),
            Some("web_fetch"),
            Some(""),
            None,
        ] {
            assert_eq!(tool_label(other), LABEL_WORKING, "{other:?}");
        }
        assert_eq!(
            tool_label_from(Some("kb_probe"), &["kb_probe"]),
            LABEL_KNOWLEDGE_SEARCH
        );
        assert_eq!(
            tool_label_from(Some("kb_probe_2"), &["kb_probe"]),
            LABEL_WORKING
        );
    }

    #[test]
    fn a_key_should_be_the_id_then_call_index_and_nothing_else() {
        assert_eq!(
            step_key(&json!({"id":"c","call_index":3})),
            Some(StepKey::Id("c".into()))
        );
        assert_eq!(
            step_key(&json!({"call_index":3})),
            Some(StepKey::CallIndex(3))
        );
        for bad in [
            json!({}),
            json!({"id":7,"call_index":3}),
            json!({"id":"","call_index":3}),
            json!({"call_index":-1}),
        ] {
            assert_eq!(step_key(&bad), None, "{bad}");
        }
    }
}
