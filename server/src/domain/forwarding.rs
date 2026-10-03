// TJ-ARCH-MOB-001 compliant
//! Which headers cross the proxy in each direction.
//!
//! Allowlists, not denylists: client credentials (`Authorization`,
//! `X-API-Key`, `Cookie`) and anything else not listed never reach UAR. The
//! proxy's own key is the only credential it sends, and the session header
//! it sends is always the derived one (`session_binding`), never the
//! client's `X-UAR-Session-ID`.

use axum::http::header::{ACCEPT, CACHE_CONTROL, CONTENT_TYPE};
use axum::http::{HeaderMap, HeaderName, HeaderValue};

pub const SESSION_HEADER: HeaderName = HeaderName::from_static("x-uar-session-id");
pub const API_KEY_HEADER: HeaderName = HeaderName::from_static("x-api-key");

const REQUEST_HEADERS: [HeaderName; 2] = [CONTENT_TYPE, ACCEPT];
const RESPONSE_HEADERS: [HeaderName; 2] = [CONTENT_TYPE, CACHE_CONTROL];

/// Headers sent upstream: the allowlisted client headers, the derived
/// upstream session id and the proxy key.
pub fn upstream_request_headers(
    client: &HeaderMap,
    proxy_key: Option<&HeaderValue>,
    upstream_session: HeaderValue,
) -> HeaderMap {
    let mut headers = copy_allowed(client, &REQUEST_HEADERS);
    headers.insert(SESSION_HEADER, upstream_session);
    if let Some(key) = proxy_key {
        headers.insert(API_KEY_HEADER, key.clone());
    }
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
    fn upstream_headers_should_drop_client_credentials_and_session_and_inject_ours() {
        let mut client = HeaderMap::new();
        client.insert(AUTHORIZATION, HeaderValue::from_static("Bearer stolen"));
        client.insert(API_KEY_HEADER, HeaderValue::from_static("client-key"));
        client.insert(COOKIE, HeaderValue::from_static("sid=1"));
        client.insert(SESSION_HEADER, HeaderValue::from_static("client-thread"));
        client.insert("last-event-id", HeaderValue::from_static("9"));
        let key = HeaderValue::from_static("proxy-key");

        let out = upstream_request_headers(
            &client,
            Some(&key),
            HeaderValue::from_static("derived-session"),
        );

        assert!(out.get(AUTHORIZATION).is_none());
        assert!(out.get(COOKIE).is_none());
        assert!(out.get("last-event-id").is_none());
        assert_eq!(out.get(API_KEY_HEADER), Some(&key));
        let sessions: Vec<_> = out.get_all(SESSION_HEADER).iter().collect();
        assert_eq!(sessions, vec!["derived-session"]);
    }
}
