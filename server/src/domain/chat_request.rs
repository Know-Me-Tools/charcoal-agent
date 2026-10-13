// TJ-ARCH-MOB-001 compliant
//! Builds the chat request forwarded to UAR from an allowlist.
//!
//! Every visitor shares one UAR principal (the proxy key), so the forwarded
//! body is rebuilt, not patched: only `message` and the `web_search` toggle
//! are read from the client (`src/features/chat/use-message-stream.ts`,
//! `use-thread-naming.ts`), and `agent_id`, `stream`, `stream_mode` and
//! `memory_enabled` are set here. Everything else (model, run_policy, tools,
//! mcp_servers, tool_choice, attachments, messages, prompt_caching_enabled,
//! session_id, ...) is dropped.
//!
//! Agent choice (site-web-search, operator amendment 2026-10-13): two pinned
//! agents. `web_search` is never forwarded; it only picks the agent id, from
//! [`SiteAgents`], never from the visitor:
//! - exactly one top-level `web_search` key whose value is the JSON boolean
//!   `true` selects the web agent, when one is configured;
//! - anything else (absent, `false`, a string, number, null, array, object,
//!   or the key given twice) selects the default agent;
//! - with no web agent configured (disabled, or the same id as the default),
//!   the toggle has no effect and the default agent answers. That is the
//!   rollback: one config change, no client release.
//!
//! `memory_enabled: false` is sent on every turn (FR-41): UAR defaults the
//! per-request flag to true, and the agent's `memory.conversation.enabled`
//! does not gate capture, so an omitted field would capture every visitor's
//! turns under the shared site principal if memory were ever switched on.
//!
//! The stream shape is pinned (site-proxy-hardening): every run streams in
//! `dual` mode, so the run's usage always arrives in one dialect
//! (`agui.done`) for the spend meter, and the public-path artifact filter
//! sees one event vocabulary. The client's `stream` and `stream_mode` are
//! ignored, whatever their type or value.
//!
//! `presentation_mode` is set here on every turn and never omitted: UAR
//! treats an absent field as Legacy. It is always `"a2ui"` with the profile
//! the site client renders; A2UI is how the site presents answers. The
//! visitor's own value, if any, is dropped with every other field.

use serde_json::{Map, Value, json};

/// Longest accepted `message`, in characters. The site's own title prompt is
/// about 1.2k characters.
pub const MAX_MESSAGE_CHARS: usize = 4000;
/// The one client field that chooses between the two pinned agents.
pub const WEB_SEARCH_FIELD: &str = "web_search";

const STREAM_MODE: &str = "dual";

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum ChatRequestError {
    #[error("request body is not valid JSON")]
    InvalidJson,
    #[error("request body must be a JSON object")]
    NotAnObject,
    #[error("`message` must be a string")]
    InvalidMessage,
    #[error("`message` is longer than {MAX_MESSAGE_CHARS} characters")]
    MessageTooLong,
}

/// The A2UI profile the site client renders (UAR's nine-component catalog).
const A2UI_PROFILE: &str = "uar.a2ui/1";

/// The agent ids the proxy may send, both from server configuration.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SiteAgents {
    default: String,
    web: Option<String>,
}

impl SiteAgents {
    /// `web` is dropped when empty or equal to `default`: the toggle then has
    /// no effect.
    pub fn new(default: impl Into<String>, web: Option<String>) -> Self {
        let default = default.into();
        let web = web.filter(|id| !id.is_empty() && *id != default);
        Self { default, web }
    }

    pub fn default_agent(&self) -> &str {
        &self.default
    }

    /// `None` when web search is switched off.
    pub fn web_agent(&self) -> Option<&str> {
        self.web.as_deref()
    }

    fn select(&self, web_search: bool) -> &str {
        match (web_search, self.web_agent()) {
            (true, Some(web)) => web,
            _ => &self.default,
        }
    }
}

/// Returns the serialized upstream body: `agent_id`, `message`,
/// `stream: true`, `stream_mode: "dual"`, `memory_enabled: false`,
/// `presentation_mode: "a2ui"` and `client_rendering`.
pub fn build_site_chat_request(
    body: &[u8],
    agents: &SiteAgents,
) -> Result<Vec<u8>, ChatRequestError> {
    let value: Value = serde_json::from_slice(body).map_err(|_| ChatRequestError::InvalidJson)?;
    let input = value.as_object().ok_or(ChatRequestError::NotAnObject)?;

    let message = input
        .get("message")
        .and_then(Value::as_str)
        .ok_or(ChatRequestError::InvalidMessage)?;
    if message.chars().count() > MAX_MESSAGE_CHARS {
        return Err(ChatRequestError::MessageTooLong);
    }
    let agent_id = agents.select(web_search_requested(body, input));

    let forwarded = Map::from_iter([
        ("agent_id".to_owned(), Value::from(agent_id)),
        ("message".to_owned(), Value::from(message)),
        ("stream".to_owned(), Value::from(true)),
        ("stream_mode".to_owned(), Value::from(STREAM_MODE)),
        ("memory_enabled".to_owned(), Value::from(false)),
        ("presentation_mode".to_owned(), Value::from("a2ui")),
        (
            "client_rendering".to_owned(),
            json!({ "a2ui_profiles": [A2UI_PROFILE] }),
        ),
    ]);
    // Serializing a map of strings and booleans cannot fail.
    serde_json::to_vec(&forwarded).map_err(|_| ChatRequestError::InvalidJson)
}

/// True only for exactly one top-level `web_search` key holding `true`.
/// `serde_json` keeps the last of duplicate keys, so the raw body is counted
/// too: a duplicated toggle is ambiguous and means off.
fn web_search_requested(body: &[u8], input: &Map<String, Value>) -> bool {
    input.get(WEB_SEARCH_FIELD) == Some(&Value::Bool(true))
        && top_level_key_count(body, WEB_SEARCH_FIELD) == 1
}

/// How many times `wanted` is a key of the top-level object in `json`, which
/// must already have parsed as a JSON object (the request body is capped at
/// 32 KiB by the router). Keys are decoded, so an escaped spelling counts.
fn top_level_key_count(json: &[u8], wanted: &str) -> usize {
    let mut depth = 0usize;
    let mut count = 0;
    let mut i = 0;
    while i < json.len() {
        match json[i] {
            b'{' | b'[' => depth += 1,
            b'}' | b']' => depth = depth.saturating_sub(1),
            b'"' => {
                let start = i;
                i += 1;
                while i < json.len() && json[i] != b'"' {
                    // Skip the escaped byte, so `\"` does not end the string.
                    i += if json[i] == b'\\' { 2 } else { 1 };
                }
                let end = (i + 1).min(json.len());
                let is_key = depth == 1 && next_significant(json, end) == Some(b':');
                if is_key
                    && serde_json::from_slice::<String>(&json[start..end])
                        .is_ok_and(|key| key == wanted)
                {
                    count += 1;
                }
            }
            _ => {}
        }
        i += 1;
    }
    count
}

fn next_significant(json: &[u8], from: usize) -> Option<u8> {
    json.get(from..)?
        .iter()
        .copied()
        .find(|b| !b.is_ascii_whitespace())
}

#[cfg(test)]
mod tests {
    use super::*;

    const SITE: &str = "knowme-site";
    const WEB: &str = "knowme-site-web";

    fn agents() -> SiteAgents {
        SiteAgents::new(SITE, Some(WEB.to_owned()))
    }

    fn build_with(body: &str, agents: &SiteAgents) -> Result<Value, ChatRequestError> {
        build_site_chat_request(body.as_bytes(), agents)
            .map(|bytes| serde_json::from_slice(&bytes).unwrap())
    }

    fn build(body: &str) -> Result<Value, ChatRequestError> {
        build_with(body, &agents())
    }

    fn pinned_for(agent: &str, message: &str) -> Value {
        serde_json::json!({
            "agent_id": agent,
            "message": message,
            "stream": true,
            "stream_mode": "dual",
            "memory_enabled": false,
            "presentation_mode": "a2ui",
            "client_rendering": { "a2ui_profiles": ["uar.a2ui/1"] }
        })
    }

    fn pinned(message: &str) -> Value {
        pinned_for(SITE, message)
    }

    #[test]
    fn presentation_mode_should_be_a2ui_with_the_profile_and_never_omitted() {
        assert_eq!(build(r#"{"message":"hi"}"#).unwrap(), pinned("hi"));
    }

    #[test]
    fn visitor_supplied_presentation_fields_should_always_be_ignored() {
        let body = r#"{"message":"hi","presentation_mode":"text",
            "client_rendering":{"a2ui_profiles":["evil/9"]}}"#;
        assert_eq!(build(body).unwrap(), pinned("hi"));
        let legacy = r#"{"message":"hi","presentation_mode":"legacy"}"#;
        assert_eq!(build(legacy).unwrap(), pinned("hi"));
    }

    #[test]
    fn should_keep_only_allowlisted_fields_and_force_agent() {
        let out = build(
            r#"{"agent_id":"other","model":"x","run_policy":{},"memory_enabled":true,
                "attachments":[{"url":"http://x"}],"messages":[{"role":"system","content":"x"}],
                "prompt_caching_enabled":true,"session_id":"s","message":"hi","stream":true,
                "stream_mode":"agui"}"#,
        )
        .unwrap();
        assert_eq!(out, pinned("hi"));
    }

    /// 16.4.6: tool, MCP and policy fields from a visitor never reach UAR,
    /// with the toggle off or on, and memory stays off.
    #[test]
    fn visitor_tool_mcp_and_policy_fields_should_be_dropped_on_both_agents() {
        let hostile = r#""tools":[{"type":"function","function":{"name":"web_fetch"}}],
            "mcp_servers":{"mode":"all","ids":["firecrawl"]},"tool_choice":"required",
            "run_policy":{"tools":{"mode":"all"},"tool_approval":"auto"},
            "agent_id":"knowme-admin","memory_enabled":true,"message":"hi""#;
        for (toggle, agent) in [("", SITE), (r#""web_search":true,"#, WEB)] {
            let out = build(&format!("{{{toggle}{hostile}}}")).unwrap();
            assert_eq!(out, pinned_for(agent, "hi"), "{toggle}");
            assert_eq!(out["memory_enabled"], false);
            assert!(out.get(WEB_SEARCH_FIELD).is_none());
        }
    }

    #[test]
    fn web_search_true_should_select_the_web_agent() {
        assert_eq!(
            build(r#"{"message":"hi","web_search":true}"#).unwrap(),
            pinned_for(WEB, "hi")
        );
        // Order and whitespace do not matter; an escaped spelling is the same key.
        for body in [
            r#"{ "web_search" : true , "message":"hi"}"#,
            r#"{"message":"hi","web_search":true}"#,
        ] {
            assert_eq!(build(body).unwrap(), pinned_for(WEB, "hi"), "{body}");
        }
    }

    #[test]
    fn anything_but_one_real_true_should_select_the_default_agent() {
        for value in [
            "false",
            r#""true""#,
            "1",
            "0",
            "null",
            "[true]",
            r#"{"on":true}"#,
            r#""yes""#,
        ] {
            let body = format!(r#"{{"message":"hi","web_search":{value}}}"#);
            assert_eq!(build(&body).unwrap(), pinned("hi"), "{body}");
        }
        for body in [
            r#"{"message":"hi"}"#,
            // Duplicates are ambiguous, whatever serde_json keeps.
            r#"{"message":"hi","web_search":true,"web_search":true}"#,
            r#"{"message":"hi","web_search":false,"web_search":true}"#,
            r#"{"message":"hi","web_search":true,"web_search":true}"#,
            // Not top level, or not the same key.
            r#"{"message":"hi","x":{"web_search":true}}"#,
            r#"{"message":"hi","x":[{"web_search":true}]}"#,
            r#"{"message":"hi","Web_Search":true}"#,
            r#"{"message":"hi","web_search ":true}"#,
            r#"{"message":"web_search","note":"\"web_search\":true"}"#,
        ] {
            let out = build(body).unwrap();
            assert_eq!(out["agent_id"], SITE, "{body}");
        }
    }

    #[test]
    fn without_a_web_agent_the_toggle_should_have_no_effect() {
        for agents in [
            SiteAgents::new(SITE, None),
            SiteAgents::new(SITE, Some(String::new())),
            SiteAgents::new(SITE, Some(SITE.to_owned())),
        ] {
            assert_eq!(agents.web_agent(), None, "{agents:?}");
            let out = build_with(r#"{"message":"hi","web_search":true}"#, &agents).unwrap();
            assert_eq!(out, pinned("hi"), "{agents:?}");
        }
    }

    #[test]
    fn key_count_should_see_only_top_level_keys() {
        let body =
            br#"{"a":{"web_search":1},"web_search":true,"b":"\"web_search\":","c":["web_search"]}"#;
        assert_eq!(top_level_key_count(body, "web_search"), 1);
        let twice = br#"{"web_search":true , "web_search" :false}"#;
        assert_eq!(top_level_key_count(twice, "web_search"), 2);
        assert_eq!(top_level_key_count(br#"{}"#, "web_search"), 0);
    }

    #[test]
    fn stream_and_stream_mode_should_always_be_pinned_whatever_the_client_sent() {
        for body in [
            r#"{"message":"t","stream":false}"#,
            r#"{"message":"t","stream_mode":"agui_spec"}"#,
            r#"{"message":"t","stream_mode":"openai","stream":false}"#,
            r#"{"message":"t","stream":"yes","stream_mode":7}"#,
            r#"{"message":"t"}"#,
        ] {
            assert_eq!(build(body).unwrap(), pinned("t"), "{body}");
        }
    }

    #[test]
    fn message_at_limit_should_pass_and_over_limit_should_fail() {
        let at = format!(r#"{{"message":"{}"}}"#, "é".repeat(MAX_MESSAGE_CHARS));
        assert!(build(&at).is_ok());
        let over = format!(r#"{{"message":"{}"}}"#, "a".repeat(MAX_MESSAGE_CHARS + 1));
        assert_eq!(build(&over), Err(ChatRequestError::MessageTooLong));
    }

    #[test]
    fn invalid_bodies_should_be_rejected() {
        assert_eq!(
            build(r#"{"stream":true}"#),
            Err(ChatRequestError::InvalidMessage)
        );
        assert_eq!(
            build(r#"{"message":1}"#),
            Err(ChatRequestError::InvalidMessage)
        );
        assert_eq!(build("[1]"), Err(ChatRequestError::NotAnObject));
        assert_eq!(build("{nope"), Err(ChatRequestError::InvalidJson));
    }
}
