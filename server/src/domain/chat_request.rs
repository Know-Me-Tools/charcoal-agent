// TJ-ARCH-MOB-001 compliant
//! Builds the chat request forwarded to UAR from an allowlist.
//!
//! Every visitor shares one UAR principal (the proxy key), so the forwarded
//! body is rebuilt, not patched: only `message` survives from the client
//! (`src/features/chat/use-message-stream.ts`, `use-thread-naming.ts`), and
//! `agent_id`, `stream`, `stream_mode` and `memory_enabled` are set here.
//! Everything else (model, run_policy, attachments, messages,
//! prompt_caching_enabled, session_id, ...) is dropped.
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

/// Returns the serialized upstream body: `agent_id`, `message`,
/// `stream: true`, `stream_mode: "dual"`, `memory_enabled: false`,
/// `presentation_mode: "a2ui"` and `client_rendering`.
pub fn build_site_chat_request(body: &[u8], agent_id: &str) -> Result<Vec<u8>, ChatRequestError> {
    let value: Value = serde_json::from_slice(body).map_err(|_| ChatRequestError::InvalidJson)?;
    let input = value.as_object().ok_or(ChatRequestError::NotAnObject)?;

    let message = input
        .get("message")
        .and_then(Value::as_str)
        .ok_or(ChatRequestError::InvalidMessage)?;
    if message.chars().count() > MAX_MESSAGE_CHARS {
        return Err(ChatRequestError::MessageTooLong);
    }

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

#[cfg(test)]
mod tests {
    use super::*;

    fn build(body: &str) -> Result<Value, ChatRequestError> {
        build_site_chat_request(body.as_bytes(), "knowme-site")
            .map(|bytes| serde_json::from_slice(&bytes).unwrap())
    }

    fn pinned(message: &str) -> Value {
        serde_json::json!({
            "agent_id": "knowme-site",
            "message": message,
            "stream": true,
            "stream_mode": "dual",
            "memory_enabled": false,
            "presentation_mode": "a2ui",
            "client_rendering": { "a2ui_profiles": ["uar.a2ui/1"] }
        })
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
