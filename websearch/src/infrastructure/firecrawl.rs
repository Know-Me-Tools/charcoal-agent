// TJ-ARCH-MOB-001 compliant
//! Firecrawl search client: `POST {base}/v2/search`.
//!
//! The request body is exactly `{"query": q, "limit": 5, "sources": ["web"]}`
//! ([`SearchRequest`] has those three fields and no others), per
//! https://docs.firecrawl.dev/api-reference/endpoint/search (checked
//! 2026-10-13): `query` is required (at most 500 characters upstream; this
//! wrapper allows 200), `limit` defaults to 10, `sources` defaults to
//! `["web"]` and accepts the plain string form. No `scrapeOptions` is sent,
//! so the documented response items carry `title`, `description` and `url`
//! under `data.web`; [`WebHit`] reads only those three, so `markdown`,
//! `html`, `links`, `metadata` and every other field are never deserialized.
//!
//! The key goes only into the `Authorization: Bearer` header of this one
//! request. It is never logged, and no error text from this module carries
//! it, the upstream body, or the request URL.

use std::fmt;
use std::time::Duration;

use reqwest::header::{AUTHORIZATION, CONTENT_TYPE, HeaderValue, USER_AGENT};
use serde::{Deserialize, Serialize};

use crate::application::search::{SearchFuture, SearchPort, UpstreamError};
use crate::domain::query::SearchQuery;
use crate::domain::results::{MAX_RESULTS, RawHit};

/// Production endpoint origin. Not configurable from the environment, so a
/// misconfiguration cannot send the key elsewhere; tests pass a fake origin
/// through [`FirecrawlClient::new`].
pub const FIRECRAWL_ORIGIN: &str = "https://api.firecrawl.dev";
pub const SEARCH_PATH: &str = "/v2/search";
/// Whole-request bound: connect, send, and read the full body.
pub const UPSTREAM_TIMEOUT: Duration = Duration::from_secs(10);
/// Bound on the upstream body. Five results without scraping are a few KB;
/// anything this large is not the documented response.
pub const MAX_RESPONSE_BYTES: usize = 512 * 1024;

const SEARCH_LIMIT: u8 = 5;
const SOURCE_WEB: &str = "web";
const USER_AGENT_VALUE: &str = concat!("site-websearch/", env!("CARGO_PKG_VERSION"));

// The fixed request limit and the projection cap must agree.
const _: () = assert!(SEARCH_LIMIT as usize == MAX_RESULTS);

/// The Firecrawl API key. `Debug` is redacted; there is no `Display`.
#[derive(Clone)]
pub struct FirecrawlKey(String);

impl FirecrawlKey {
    /// `None` when the value is empty after trimming.
    pub fn new(raw: &str) -> Option<Self> {
        let trimmed = raw.trim();
        (!trimmed.is_empty()).then(|| Self(trimmed.to_owned()))
    }
}

impl fmt::Debug for FirecrawlKey {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("FirecrawlKey([REDACTED])")
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ClientError {
    #[error("cannot build the upstream HTTP client")]
    Build,
    #[error("the Firecrawl API key is not a valid header value")]
    KeyHeader,
}

/// The exact upstream request body. Adding a field here changes what is
/// sent; the wrapper tests pin the serialized form.
#[derive(Debug, Serialize)]
struct SearchRequest<'a> {
    query: &'a str,
    limit: u8,
    sources: [&'static str; 1],
}

#[derive(Debug, Deserialize)]
struct SearchResponse {
    success: bool,
    #[serde(default)]
    data: Option<SearchData>,
}

#[derive(Debug, Deserialize)]
struct SearchData {
    #[serde(default)]
    web: Vec<WebHit>,
}

#[derive(Debug, Deserialize)]
struct WebHit {
    #[serde(default)]
    title: Option<String>,
    #[serde(default)]
    description: Option<String>,
    #[serde(default)]
    url: Option<String>,
}

pub struct FirecrawlClient {
    http: reqwest::Client,
    endpoint: String,
    authorization: HeaderValue,
}

impl FirecrawlClient {
    /// `origin` is [`FIRECRAWL_ORIGIN`] in production.
    pub fn new(origin: &str, key: &FirecrawlKey, timeout: Duration) -> Result<Self, ClientError> {
        let mut authorization = HeaderValue::from_str(&format!("Bearer {}", key.0))
            .map_err(|_| ClientError::KeyHeader)?;
        authorization.set_sensitive(true);
        let http = reqwest::Client::builder()
            .timeout(timeout)
            // A redirect is not the documented response; never follow one
            // with the key attached.
            .redirect(reqwest::redirect::Policy::none())
            .no_proxy()
            .build()
            .map_err(|_| ClientError::Build)?;
        Ok(Self {
            http,
            endpoint: format!("{}{SEARCH_PATH}", origin.trim_end_matches('/')),
            authorization,
        })
    }

    /// The serialized request body for `query`.
    pub fn request_body(query: &SearchQuery) -> Result<Vec<u8>, UpstreamError> {
        serde_json::to_vec(&SearchRequest {
            query: query.as_str(),
            limit: SEARCH_LIMIT,
            sources: [SOURCE_WEB],
        })
        .map_err(|_| UpstreamError::Malformed)
    }

    async fn call(&self, query: &SearchQuery) -> Result<Vec<RawHit>, UpstreamError> {
        let body = Self::request_body(query)?;
        let mut response = self
            .http
            .post(&self.endpoint)
            .header(AUTHORIZATION, self.authorization.clone())
            .header(CONTENT_TYPE, HeaderValue::from_static("application/json"))
            .header(USER_AGENT, HeaderValue::from_static(USER_AGENT_VALUE))
            .body(body)
            .send()
            .await
            .map_err(map_transport)?;
        if !response.status().is_success() {
            return Err(UpstreamError::Status);
        }
        let mut body = Vec::new();
        while let Some(chunk) = response.chunk().await.map_err(map_transport)? {
            if body.len() + chunk.len() > MAX_RESPONSE_BYTES {
                return Err(UpstreamError::TooLarge);
            }
            body.extend_from_slice(&chunk);
        }
        parse_response(&body)
    }
}

impl SearchPort for FirecrawlClient {
    fn search<'a>(&'a self, query: &'a SearchQuery) -> SearchFuture<'a> {
        Box::pin(self.call(query))
    }
}

fn map_transport(err: reqwest::Error) -> UpstreamError {
    if err.is_timeout() {
        UpstreamError::Timeout
    } else {
        UpstreamError::Transport
    }
}

fn parse_response(body: &[u8]) -> Result<Vec<RawHit>, UpstreamError> {
    let response: SearchResponse =
        serde_json::from_slice(body).map_err(|_| UpstreamError::Malformed)?;
    if !response.success {
        return Err(UpstreamError::Unsuccessful);
    }
    Ok(response
        .data
        .map(|data| data.web)
        .unwrap_or_default()
        .into_iter()
        .map(|hit| RawHit {
            title: hit.title,
            description: hit.description,
            url: hit.url,
        })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn key_debug_should_be_redacted() {
        let key = FirecrawlKey::new("fc-not-a-real-key").map(|k| format!("{k:?}"));
        assert_eq!(key.as_deref(), Some("FirecrawlKey([REDACTED])"));
    }

    #[test]
    fn key_should_reject_an_empty_value() {
        assert!(FirecrawlKey::new("  \n").is_none());
    }

    #[test]
    fn parse_response_should_read_only_title_description_and_url() {
        let body = br#"{"success":true,"data":{"web":[{"title":"T","description":"D","url":"https://e.org/","markdown":"M","html":"<p>H</p>","links":["https://x.org/"],"metadata":{"title":"MT"}}]},"creditsUsed":2}"#;
        let hits = parse_response(body);
        assert_eq!(
            hits,
            Ok(vec![RawHit {
                title: Some("T".to_owned()),
                description: Some("D".to_owned()),
                url: Some("https://e.org/".to_owned()),
            }])
        );
    }

    #[test]
    fn parse_response_should_fail_on_success_false() {
        let body = br#"{"success":false,"error":"Request timed out"}"#;
        assert_eq!(parse_response(body), Err(UpstreamError::Unsuccessful));
    }

    #[test]
    fn parse_response_should_fail_on_non_json() {
        assert_eq!(parse_response(b"<html>"), Err(UpstreamError::Malformed));
    }

    #[test]
    fn parse_response_should_treat_missing_data_as_no_hits() {
        assert_eq!(parse_response(br#"{"success":true}"#), Ok(Vec::new()));
    }
}
