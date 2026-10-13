// TJ-ARCH-MOB-001 compliant
//! Guard for `/mcp`: UAR's shared bearer, and no browser origin.
//!
//! UAR's MCP client (rmcp, `src/mcp/runtime.rs:113` in UAR) requires the
//! configured `Authorization` header to use the `Bearer ` scheme and sends
//! `Authorization: Bearer <token>`. `WEBSEARCH_MCP_AUTH` holds that exact
//! value (`Bearer <token>`), from the same Secret key UAR reads, so the
//! guard compares the whole header value in constant time.
//!
//! The MCP streamable HTTP transport requires servers to validate `Origin`
//! (DNS rebinding). UAR is a server-side client and sends none; any request
//! carrying `Origin` came through a browser and is refused.

use std::fmt;
use std::sync::Arc;

use axum::extract::{Request, State};
use axum::http::header::{AUTHORIZATION, ORIGIN, WWW_AUTHENTICATE};
use axum::http::{HeaderValue, StatusCode};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use subtle::ConstantTimeEq;

/// Shortest accepted token after `Bearer `. The operator generates it with
/// `openssl rand -hex 32` (64 characters); a shorter value is a mistake.
pub const MIN_TOKEN_CHARS: usize = 32;

#[derive(Debug, Clone, Copy, PartialEq, Eq, thiserror::Error)]
pub enum AuthConfigError {
    #[error("WEBSEARCH_MCP_AUTH must have the form `Bearer <token>`")]
    NotBearer,
    #[error("WEBSEARCH_MCP_AUTH token must be at least 32 characters with no whitespace")]
    WeakToken,
}

/// The expected `Authorization` header value. `Debug` is redacted.
pub struct McpAuth(Vec<u8>);

impl McpAuth {
    pub fn parse(raw: &str) -> Result<Self, AuthConfigError> {
        let value = raw.trim();
        let token = value
            .strip_prefix("Bearer ")
            .ok_or(AuthConfigError::NotBearer)?;
        if token.chars().count() < MIN_TOKEN_CHARS || token.chars().any(char::is_whitespace) {
            return Err(AuthConfigError::WeakToken);
        }
        Ok(Self(value.as_bytes().to_vec()))
    }

    /// Constant-time comparison of the presented header value.
    pub fn matches(&self, presented: &[u8]) -> bool {
        // Slices of different lengths compare unequal; only the length, not
        // the content, is observable through timing.
        self.0.as_slice().ct_eq(presented).into()
    }
}

impl fmt::Debug for McpAuth {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("McpAuth([REDACTED])")
    }
}

pub async fn guard(State(auth): State<Arc<McpAuth>>, request: Request, next: Next) -> Response {
    if request.headers().contains_key(ORIGIN) {
        tracing::warn!(outcome = "origin_refused", "mcp guard");
        return StatusCode::FORBIDDEN.into_response();
    }
    let presented = request
        .headers()
        .get(AUTHORIZATION)
        .map(HeaderValue::as_bytes)
        .unwrap_or_default();
    if !auth.matches(presented) {
        tracing::warn!(outcome = "unauthorized", "mcp guard");
        return (
            StatusCode::UNAUTHORIZED,
            [(WWW_AUTHENTICATE, HeaderValue::from_static("Bearer"))],
        )
            .into_response();
    }
    next.run(request).await
}

#[cfg(test)]
mod tests {
    use super::*;

    const TOKEN: &str = "0123456789abcdef0123456789abcdef";

    #[test]
    fn parse_should_require_the_bearer_scheme() {
        assert_eq!(
            McpAuth::parse(TOKEN).err(),
            Some(AuthConfigError::NotBearer)
        );
    }

    #[test]
    fn parse_should_reject_a_short_token() {
        assert_eq!(
            McpAuth::parse("Bearer short").err(),
            Some(AuthConfigError::WeakToken)
        );
    }

    #[test]
    fn matches_should_accept_the_exact_header_value() {
        let auth = McpAuth::parse(&format!("Bearer {TOKEN}"));
        assert_eq!(
            auth.map(|a| a.matches(format!("Bearer {TOKEN}").as_bytes())),
            Ok(true)
        );
    }

    #[test]
    fn matches_should_reject_a_different_token() {
        let auth = McpAuth::parse(&format!("Bearer {TOKEN}"));
        assert_eq!(
            auth.map(|a| a.matches(b"Bearer 0123456789abcdef0123456789abcdeX")),
            Ok(false)
        );
    }

    #[test]
    fn matches_should_reject_an_empty_header() {
        let auth = McpAuth::parse(&format!("Bearer {TOKEN}"));
        assert_eq!(auth.map(|a| a.matches(b"")), Ok(false));
    }

    #[test]
    fn errors_should_not_echo_the_value() {
        let secret = "Basic c2VjcmV0LXZhbHVlLXRoYXQtbXVzdC1ub3QtbGVhaw==";
        let message = McpAuth::parse(secret).err().map(|e| e.to_string());
        assert!(message.is_some_and(|m| !m.contains("c2VjcmV0")));
    }
}
