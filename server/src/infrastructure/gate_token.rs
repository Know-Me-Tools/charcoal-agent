// TJ-ARCH-MOB-001 compliant
//! Short-lived UAR bearer tokens from flint-gate (gate-site-credentials 1.4).
//!
//! The site authenticates to gate with OAuth 2.0 client credentials
//! (`POST {SITE_GATE_TOKEN_URL}`, form-encoded `grant_type`, `client_id`,
//! `client_secret`) and receives an ES256 JWT with `sub` = the client id and
//! `aud` = `uar`. The token is cached until `expires_in` minus a 30 s margin.
//!
//! Single flight: one async mutex guards the cache and is held across the
//! gate call, so concurrent turns that find no valid token wait for the one
//! fetch in progress instead of each calling gate. A fetch that fails is
//! remembered too: callers that were already waiting when it failed get the
//! failure without calling gate again, so an outage does not turn N queued
//! turns into N sequential 3 s gate timeouts.
//!
//! Neither the client secret nor a token is ever logged or formatted with
//! `Debug`. Errors carry statuses and kinds, never bodies.

use std::fmt;
use std::time::{Duration, Instant};

use axum::http::HeaderValue;
use serde_json::Value;
use tokio::sync::Mutex;

/// Bound on one gate call, connect included.
pub const GATE_TIMEOUT: Duration = Duration::from_secs(3);
/// A token is replaced this long before gate says it expires.
pub const REFRESH_MARGIN: Duration = Duration::from_secs(30);

/// Gate client-credentials settings; see `config.rs` for the env names.
#[derive(Clone, PartialEq, Eq)]
pub struct GateConfig {
    /// `http://` token endpoint, e.g. `http://flint-gate.flint-core.svc:4456/oauth/token`.
    pub token_url: String,
    pub client_id: String,
    pub client_secret: String,
}

impl fmt::Debug for GateConfig {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("GateConfig")
            .field("token_url", &self.token_url)
            .field("client_id", &self.client_id)
            .field("client_secret", &"<redacted>")
            .finish()
    }
}

#[derive(Debug, thiserror::Error)]
pub enum GateTokenError {
    #[error("gate token endpoint unreachable: {0}")]
    Unreachable(#[source] reqwest::Error),
    #[error("gate token endpoint timed out")]
    Timeout,
    #[error("gate token endpoint returned {0}")]
    Status(u16),
    #[error("gate token response is malformed: {0}")]
    Malformed(&'static str),
    /// A fetch that this caller was waiting on failed.
    #[error("a concurrent gate token fetch failed")]
    RecentFailure,
}

/// A token as gate issued it: the ready `Authorization` value and lifetime.
pub struct IssuedToken {
    pub authorization: HeaderValue,
    pub expires_in: Duration,
}

/// Where tokens come from. The gate HTTP client in production; a counting
/// fake in the cache tests.
pub trait TokenFetcher: Send + Sync {
    fn fetch(&self) -> impl Future<Output = Result<IssuedToken, GateTokenError>> + Send;
}

struct CachedToken {
    authorization: HeaderValue,
    refresh_at: Instant,
}

#[derive(Default)]
struct CacheState {
    token: Option<CachedToken>,
    last_failure: Option<Instant>,
}

/// The single-flight token cache over a [`TokenFetcher`].
pub struct TokenCache<F> {
    fetcher: F,
    state: Mutex<CacheState>,
}

impl<F> fmt::Debug for TokenCache<F> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("TokenCache").finish_non_exhaustive()
    }
}

impl<F: TokenFetcher> TokenCache<F> {
    pub fn new(fetcher: F) -> Self {
        Self {
            fetcher,
            state: Mutex::new(CacheState::default()),
        }
    }

    /// The `Authorization: Bearer ...` value to send, fetching a token when
    /// none is cached or the cached one is within the refresh margin.
    pub async fn authorization(&self) -> Result<HeaderValue, GateTokenError> {
        self.authorization_at(Instant::now, Instant::now()).await
    }

    /// Drops the cached token if it is still `rejected` (UAR answered 401 to
    /// it). A token that a concurrent caller already replaced is kept, so
    /// several 401s for one token cause one refresh, not several.
    pub async fn invalidate(&self, rejected: &HeaderValue) {
        let mut state = self.state.lock().await;
        if state
            .token
            .as_ref()
            .is_some_and(|t| &t.authorization == rejected)
        {
            state.token = None;
        }
    }

    /// `requested` is when the caller asked; `now` reads the clock after the
    /// lock is held. Split out so the tests control time.
    async fn authorization_at(
        &self,
        now: impl Fn() -> Instant,
        requested: Instant,
    ) -> Result<HeaderValue, GateTokenError> {
        let mut state = self.state.lock().await;
        let at = now();
        if let Some(token) = state.token.as_ref().filter(|t| at < t.refresh_at) {
            return Ok(token.authorization.clone());
        }
        // A fetch failed while this caller waited for the lock.
        if state.last_failure.is_some_and(|failed| failed >= requested) {
            return Err(GateTokenError::RecentFailure);
        }
        match self.fetcher.fetch().await {
            Ok(issued) => {
                let fetched_at = now();
                state.last_failure = None;
                state.token = Some(CachedToken {
                    authorization: issued.authorization.clone(),
                    refresh_at: fetched_at + issued.expires_in.saturating_sub(REFRESH_MARGIN),
                });
                Ok(issued.authorization)
            }
            Err(err) => {
                state.token = None;
                state.last_failure = Some(now());
                Err(err)
            }
        }
    }
}

/// The production fetcher: client credentials against gate's token endpoint.
pub struct GateFetcher {
    http: reqwest::Client,
    config: GateConfig,
}

impl GateFetcher {
    /// `http` must not follow redirects or use an ambient proxy (the UAR
    /// client is built that way); every call gets [`GATE_TIMEOUT`].
    pub fn new(http: reqwest::Client, config: GateConfig) -> Self {
        Self { http, config }
    }
}

impl TokenFetcher for GateFetcher {
    async fn fetch(&self) -> Result<IssuedToken, GateTokenError> {
        let response = self
            .http
            .post(&self.config.token_url)
            .timeout(GATE_TIMEOUT)
            .header(
                reqwest::header::CONTENT_TYPE,
                "application/x-www-form-urlencoded",
            )
            .header(reqwest::header::ACCEPT, "application/json")
            .body(client_credentials_form(
                &self.config.client_id,
                &self.config.client_secret,
            ))
            .send()
            .await
            .map_err(transport_error)?;
        let status = response.status();
        if !status.is_success() {
            return Err(GateTokenError::Status(status.as_u16()));
        }
        let body = response.bytes().await.map_err(transport_error)?;
        parse_token_response(&body)
    }
}

fn transport_error(err: reqwest::Error) -> GateTokenError {
    if err.is_timeout() {
        GateTokenError::Timeout
    } else {
        // Without the URL: the error is logged, and the URL adds nothing.
        GateTokenError::Unreachable(err.without_url())
    }
}

/// `application/x-www-form-urlencoded` body for the client-credentials
/// grant. Encoded with the `url` serializer reqwest already carries, so no
/// form-encoding crate is added.
fn client_credentials_form(client_id: &str, client_secret: &str) -> String {
    let mut url = reqwest::Url::parse("http://form.invalid/").unwrap_or_else(|_| unreachable!());
    url.query_pairs_mut()
        .append_pair("grant_type", "client_credentials")
        .append_pair("client_id", client_id)
        .append_pair("client_secret", client_secret);
    url.query().unwrap_or_default().to_owned()
}

/// Gate's `{access_token, token_type: "Bearer", expires_in, scope}`.
fn parse_token_response(body: &[u8]) -> Result<IssuedToken, GateTokenError> {
    let json: Value =
        serde_json::from_slice(body).map_err(|_| GateTokenError::Malformed("not JSON"))?;
    let token = json
        .get("access_token")
        .and_then(Value::as_str)
        .filter(|t| !t.is_empty())
        .ok_or(GateTokenError::Malformed("no access_token"))?;
    let token_type = json.get("token_type").and_then(Value::as_str);
    if !token_type.is_some_and(|t| t.eq_ignore_ascii_case("bearer")) {
        return Err(GateTokenError::Malformed("token_type is not Bearer"));
    }
    let expires_in = json
        .get("expires_in")
        .and_then(Value::as_u64)
        .ok_or(GateTokenError::Malformed("no expires_in"))?;
    let mut authorization = HeaderValue::from_str(&format!("Bearer {token}"))
        .map_err(|_| GateTokenError::Malformed("access_token is not a header value"))?;
    authorization.set_sensitive(true);
    Ok(IssuedToken {
        authorization,
        expires_in: Duration::from_secs(expires_in),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::sync::atomic::{AtomicUsize, Ordering};

    /// Issues `Bearer t1`, `Bearer t2`, ... with a fixed lifetime, after
    /// `delay`; fails while `fail` is set. Counts calls.
    struct FakeGate {
        calls: AtomicUsize,
        expires_in: Duration,
        delay: Duration,
        fail: std::sync::atomic::AtomicBool,
    }

    impl FakeGate {
        fn new(expires_in: Duration) -> Self {
            Self {
                calls: AtomicUsize::new(0),
                expires_in,
                delay: Duration::ZERO,
                fail: false.into(),
            }
        }
        fn calls(&self) -> usize {
            self.calls.load(Ordering::SeqCst)
        }
    }

    impl TokenFetcher for Arc<FakeGate> {
        async fn fetch(&self) -> Result<IssuedToken, GateTokenError> {
            let n = self.calls.fetch_add(1, Ordering::SeqCst) + 1;
            tokio::time::sleep(self.delay).await;
            if self.fail.load(Ordering::SeqCst) {
                return Err(GateTokenError::Status(503));
            }
            Ok(IssuedToken {
                authorization: HeaderValue::from_str(&format!("Bearer t{n}")).unwrap(),
                expires_in: self.expires_in,
            })
        }
    }

    fn cache(gate: &Arc<FakeGate>) -> TokenCache<Arc<FakeGate>> {
        TokenCache::new(Arc::clone(gate))
    }

    #[tokio::test]
    async fn token_should_be_reused_until_expiry_minus_margin() {
        let gate = Arc::new(FakeGate::new(Duration::from_secs(300)));
        let cache = cache(&gate);
        let t0 = Instant::now();
        let at = |offset: u64| move || t0 + Duration::from_secs(offset);

        let first = cache.authorization_at(at(0), t0).await.unwrap();
        assert_eq!(first, "Bearer t1");
        // 300 - 30 = 270 s of reuse.
        let reused = cache.authorization_at(at(269), t0).await.unwrap();
        assert_eq!((reused, gate.calls()), (first, 1));
        let refreshed = cache.authorization_at(at(270), t0).await.unwrap();
        assert_eq!((refreshed, gate.calls()), ("Bearer t2".parse().unwrap(), 2));
    }

    #[tokio::test]
    async fn token_shorter_than_the_margin_should_serve_one_request_only() {
        let gate = Arc::new(FakeGate::new(Duration::from_secs(10)));
        let cache = cache(&gate);
        cache.authorization().await.unwrap();
        cache.authorization().await.unwrap();
        assert_eq!(gate.calls(), 2);
    }

    #[tokio::test]
    async fn concurrent_requests_should_share_one_gate_call() {
        let gate = Arc::new(FakeGate {
            delay: Duration::from_millis(50),
            ..FakeGate::new(Duration::from_secs(300))
        });
        let cache = Arc::new(cache(&gate));
        let tasks: Vec<_> = (0..16)
            .map(|_| {
                let cache = Arc::clone(&cache);
                tokio::spawn(async move { cache.authorization().await.unwrap() })
            })
            .collect();
        for task in tasks {
            assert_eq!(task.await.unwrap(), "Bearer t1");
        }
        assert_eq!(gate.calls(), 1);
    }

    #[tokio::test]
    async fn concurrent_requests_should_share_one_failed_gate_call() {
        let gate = Arc::new(FakeGate {
            delay: Duration::from_millis(50),
            ..FakeGate::new(Duration::from_secs(300))
        });
        gate.fail.store(true, Ordering::SeqCst);
        let cache = Arc::new(cache(&gate));
        let tasks: Vec<_> = (0..8)
            .map(|_| {
                let cache = Arc::clone(&cache);
                tokio::spawn(async move { cache.authorization().await })
            })
            .collect();
        for task in tasks {
            assert!(task.await.unwrap().is_err());
        }
        assert_eq!(gate.calls(), 1);

        // A request made after the failure tries gate again.
        gate.fail.store(false, Ordering::SeqCst);
        assert_eq!(cache.authorization().await.unwrap(), "Bearer t2");
    }

    #[tokio::test]
    async fn invalidating_the_rejected_token_should_fetch_a_new_one_once() {
        let gate = Arc::new(FakeGate::new(Duration::from_secs(300)));
        let cache = cache(&gate);
        let rejected = cache.authorization().await.unwrap();

        // Two turns both saw a 401 for t1: one refresh between them.
        cache.invalidate(&rejected).await;
        let fresh = cache.authorization().await.unwrap();
        cache.invalidate(&rejected).await;
        let again = cache.authorization().await.unwrap();

        assert_eq!(fresh, "Bearer t2");
        assert_eq!((again, gate.calls()), (fresh, 2));
    }

    #[test]
    fn form_body_should_encode_reserved_characters() {
        let body = client_credentials_form("knowme-site", "a b&c=d+e%");
        assert_eq!(
            body,
            "grant_type=client_credentials&client_id=knowme-site&client_secret=a+b%26c%3Dd%2Be%25"
        );
    }

    #[test]
    fn gate_token_response_should_parse() {
        let issued = parse_token_response(
            br#"{"access_token":"eyJ.a.b","token_type":"Bearer","expires_in":900,"scope":""}"#,
        )
        .unwrap();
        assert_eq!(issued.authorization, "Bearer eyJ.a.b");
        assert!(issued.authorization.is_sensitive());
        assert_eq!(issued.expires_in, Duration::from_secs(900));
    }

    #[test]
    fn malformed_token_responses_should_be_rejected() {
        for body in [
            &b"not json"[..],
            br#"{"token_type":"Bearer","expires_in":900}"#,
            br#"{"access_token":"","token_type":"Bearer","expires_in":900}"#,
            br#"{"access_token":"x","token_type":"mac","expires_in":900}"#,
            br#"{"access_token":"x","token_type":"Bearer"}"#,
            br#"{"access_token":"x\ny","token_type":"Bearer","expires_in":900}"#,
        ] {
            assert!(
                matches!(
                    parse_token_response(body),
                    Err(GateTokenError::Malformed(_))
                ),
                "{}",
                String::from_utf8_lossy(body)
            );
        }
    }

    #[test]
    fn debug_output_should_not_contain_the_secret() {
        let config = GateConfig {
            token_url: "http://gate/oauth/token".into(),
            client_id: "knowme-site".into(),
            client_secret: "s3cret-value".into(),
        };
        assert!(!format!("{config:?}").contains("s3cret-value"));
    }
}
