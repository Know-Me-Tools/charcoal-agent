// TJ-ARCH-MOB-001 compliant
//! The visitor cookie on the wire: reading candidates from `Cookie` and
//! formatting `Set-Cookie`. Signing and verification live in
//! `domain::session_binding`.
//!
//! `HttpOnly` keeps the id out of page scripts, `Secure` off plain-HTTP
//! origins (browsers treat `http://localhost` as secure), `SameSite=Lax`
//! keeps it off cross-site POSTs, and no `Domain` keeps it on this host
//! only. It exists for session security, not measurement (§6.1, D-10).

use axum::http::header::COOKIE;
use axum::http::{HeaderMap, HeaderValue};

pub const VISITOR_COOKIE: &str = "knowme_vid";
/// 30 days. Revisit with the session retention period (D-5): a visitor whose
/// cookie expires keeps local thread history but gets new upstream sessions.
const MAX_AGE_SECS: u64 = 30 * 24 * 60 * 60;

/// Every `knowme_vid` value presented, across all `Cookie` headers.
pub fn presented_tokens(headers: &HeaderMap) -> Vec<&str> {
    headers
        .get_all(COOKIE)
        .iter()
        .filter_map(|value| value.to_str().ok())
        .flat_map(|value| value.split(';'))
        .filter_map(|pair| pair.trim().split_once('='))
        .filter(|(name, _)| *name == VISITOR_COOKIE)
        .map(|(_, value)| value)
        .collect()
}

pub fn set_cookie(token: &str) -> Option<HeaderValue> {
    HeaderValue::from_str(&format!(
        "{VISITOR_COOKIE}={token}; Path=/; Max-Age={MAX_AGE_SECS}; HttpOnly; Secure; SameSite=Lax"
    ))
    .ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn should_collect_the_visitor_cookie_from_every_cookie_header() {
        let mut headers = HeaderMap::new();
        headers.append(COOKIE, HeaderValue::from_static("a=1; knowme_vid=first"));
        headers.append(COOKIE, HeaderValue::from_static("knowme_vid=second;b=2"));
        headers.append(COOKIE, HeaderValue::from_static("xknowme_vid=no"));
        assert_eq!(presented_tokens(&headers), vec!["first", "second"]);
    }

    #[test]
    fn set_cookie_should_carry_the_security_attributes() {
        let value = set_cookie("abc.def").unwrap();
        let value = value.to_str().unwrap();
        assert!(value.starts_with("knowme_vid=abc.def; Path=/;"), "{value}");
        for attr in ["HttpOnly", "Secure", "SameSite=Lax", "Max-Age=2592000"] {
            assert!(value.contains(attr), "{attr} missing: {value}");
        }
        assert!(!value.contains("Domain"), "{value}");
    }
}
