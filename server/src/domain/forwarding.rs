// TJ-ARCH-MOB-001 compliant
//! Which headers cross the proxy in each direction.
//!
//! Allowlists, not denylists: client credentials (`Authorization`,
//! `X-API-Key`, `Cookie`) and anything else not listed never reach UAR. The
//! proxy's own credential (API key or gate bearer) is the only one it sends,
//! added by `infrastructure::upstream`, and the session header it sends is
//! always the derived one (`session_binding`), never the client's
//! `X-UAR-Session-ID`.

use axum::http::header::{ACCEPT, CACHE_CONTROL, CONTENT_TYPE};
use axum::http::{HeaderMap, HeaderName, HeaderValue};

pub const SESSION_HEADER: HeaderName = HeaderName::from_static("x-uar-session-id");
pub const API_KEY_HEADER: HeaderName = HeaderName::from_static("x-api-key");

const REQUEST_HEADERS: [HeaderName; 2] = [CONTENT_TYPE, ACCEPT];
const RESPONSE_HEADERS: [HeaderName; 2] = [CONTENT_TYPE, CACHE_CONTROL];

/// Headers sent upstream: the allowlisted client headers and the derived
/// upstream session id. The UAR client adds the proxy's credential.
pub fn upstream_request_headers(client: &HeaderMap, upstream_session: HeaderValue) -> HeaderMap {
    let mut headers = copy_allowed(client, &REQUEST_HEADERS);
    headers.insert(SESSION_HEADER, upstream_session);
    headers
}

/// Headers returned to the browser from an upstream response.
pub fn client_response_headers(upstream: &HeaderMap) -> HeaderMap {
    copy_allowed(upstream, &RESPONSE_HEADERS)
}

fn copy_allowed(source: &HeaderMap, allowed: &[HeaderName]) -> HeaderMap {
    let mut out = HeaderMap::new();
    for name in allowed {
        for value in source.get_all(name) {
            out.append(name.clone(), value.clone());
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::http::header::{AUTHORIZATION, COOKIE};

    #[test]
    fn upstream_headers_should_drop_client_credentials_and_session() {
        let mut client = HeaderMap::new();
        client.insert(AUTHORIZATION, HeaderValue::from_static("Bearer stolen"));
        client.insert(API_KEY_HEADER, HeaderValue::from_static("client-key"));
        client.insert(COOKIE, HeaderValue::from_static("sid=1"));
        client.insert(SESSION_HEADER, HeaderValue::from_static("client-thread"));
        client.insert("last-event-id", HeaderValue::from_static("9"));

        let out = upstream_request_headers(&client, HeaderValue::from_static("derived-session"));

        assert!(out.get(AUTHORIZATION).is_none());
        assert!(out.get(COOKIE).is_none());
        assert!(out.get("last-event-id").is_none());
        assert!(out.get(API_KEY_HEADER).is_none());
        let sessions: Vec<_> = out.get_all(SESSION_HEADER).iter().collect();
        assert_eq!(sessions, vec!["derived-session"]);
    }
}
