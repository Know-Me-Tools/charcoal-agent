// TJ-ARCH-MOB-001 compliant
//! Builds the chat request forwarded to UAR from an allowlist.
//!
//! Every visitor shares one UAR principal (the proxy key), so the forwarded
//! body is rebuilt, not patched: only the fields the site client sends for a
//! chat turn or a title request survive (`src/features/chat/
//! use-message-stream.ts`, `use-thread-naming.ts`), and `agent_id` is forced.
//! Everything else (model, run_policy, memory_enabled, attachments,
//! messages, prompt_caching_enabled, session_id, ...) is dropped.

use serde_json::{Map, Value};

/// Longest accepted `message`, in characters. The site's own title prompt is
/// about 1.2k characters.
pub const MAX_MESSAGE_CHARS: usize = 4000;

/// UAR stream modes the site client can render; `dual` is what it sends.
const STREAM_MODES: &[&str] = &["dual", "agui", "agui_spec"];
const DEFAULT_STREAM_MODE: &str = "dual";

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
    #[error("`stream` must be a boolean")]
    InvalidStream,
    #[error("`stream_mode` must be one of dual, agui, agui_spec")]
    InvalidStreamMode,
}

/// Returns the serialized upstream body: `agent_id`, `message`, `stream`
/// (default false) and `stream_mode` (default `dual`).
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
    let stream = match input.get("stream") {
        None => false,
        Some(v) => v.as_bool().ok_or(ChatRequestError::InvalidStream)?,
    };
    let stream_mode = match input.get("stream_mode") {
        None => DEFAULT_STREAM_MODE,
        Some(v) => v
            .as_str()
            .filter(|mode| STREAM_MODES.contains(mode))
            .ok_or(ChatRequestError::InvalidStreamMode)?,
    };

    let forwarded = Map::from_iter([
        ("agent_id".to_owned(), Value::from(agent_id)),
        ("message".to_owned(), Value::from(message)),
        ("stream".to_owned(), Value::from(stream)),
        ("stream_mode".to_owned(), Value::from(stream_mode)),
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

    #[test]
    fn should_keep_only_allowlisted_fields_and_force_agent() {
        let out = build(
            r#"{"agent_id":"other","model":"x","run_policy":{},"memory_enabled":true,
                "attachments":[{"url":"http://x"}],"messages":[{"role":"system","content":"x"}],
                "prompt_caching_enabled":true,"session_id":"s","message":"hi","stream":true,
                "stream_mode":"agui"}"#,
        )
        .unwrap();
        assert_eq!(
            out,
            serde_json::json!({"agent_id":"knowme-site","message":"hi","stream":true,"stream_mode":"agui"})
        );
    }

    #[test]
    fn title_request_should_default_stream_mode_to_dual() {
        let out = build(r#"{"message":"title please","stream":false}"#).unwrap();
        assert_eq!(out["stream_mode"], "dual");
        assert_eq!(out["stream"], false);
    }

    #[test]
    fn message_at_limit_should_pass_and_over_limit_should_fail() {
        let at = format!(r#"{{"message":"{}"}}"#, "é".repeat(MAX_MESSAGE_CHARS));
        assert!(build(&at).is_ok());
        let over = format!(r#"{{"message":"{}"}}"#, "a".repeat(MAX_MESSAGE_CHARS + 1));
        assert_eq!(build(&over), Err(ChatRequestError::MessageTooLong));
    }

    #[test]
    fn invalid_field_types_should_be_rejected() {
        assert_eq!(
            build(r#"{"stream":true}"#),
            Err(ChatRequestError::InvalidMessage)
        );
        assert_eq!(
            build(r#"{"message":1}"#),
            Err(ChatRequestError::InvalidMessage)
        );
        assert_eq!(
            build(r#"{"message":"a","stream":"yes"}"#),
            Err(ChatRequestError::InvalidStream)
        );
        assert_eq!(
            build(r#"{"message":"a","stream_mode":"openai"}"#),
            Err(ChatRequestError::InvalidStreamMode)
        );
        assert_eq!(build("[1]"), Err(ChatRequestError::NotAnObject));
        assert_eq!(build("{nope"), Err(ChatRequestError::InvalidJson));
    }
}
