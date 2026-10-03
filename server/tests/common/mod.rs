// TJ-ARCH-MOB-001 compliant
//! Shared harness for the end-to-end tests: the site server (built with
//! `KNOWME_WEB_DIST_DIR=tests/fixtures/web`) over real loopback sockets, in
//! front of an in-process stub UAR and a stub meter store (SurrealDB's
//! `/signin` and `/sql`). Offline and fast; no npm, no real UAR or
//! SurrealDB. Built with the `test-harness` feature (dev-dependency), which
//! adds the upstream tap.
#![allow(dead_code)]

use std::net::SocketAddr;
use std::path::PathBuf;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;

use axum::Router;
use axum::body::{Body, Bytes};
use axum::http::{HeaderMap, Method, StatusCode, Uri};
use axum::response::Response;
use axum::routing::any;
use knowme_site_server::config::{Config, MeterConfig, RateLimits};
use knowme_site_server::domain::meter::Budgets;
use knowme_site_server::domain::session_binding::SessionSecret;
use knowme_site_server::infrastructure::meter_store::MeterStoreConfig;
use knowme_site_server::{build_app, build_app_with_upstream_tap};
use tokio::net::TcpListener;
use tokio::sync::{Notify, mpsc};

pub const PROXY_KEY: &str = "proxy-secret-key";
pub const SESSION_SECRET: &[u8] = b"test-session-secret-0123456789abcdef";
pub const THREAD: &str = "0b7e3c1a-5f0e-4a8e-9c3b-2d1f4e5a6b7c";
pub const OTHER_THREAD: &str = "6f1d2e3c-4b5a-4c6d-8e7f-9a0b1c2d3e4f";
/// UAR's guardrail body (`src/server.rs`), with text that must not leak.
pub const GUARDRAIL_BODY: &str = r#"{"error":{"message":"Input rejected by guardrail policy","type":"guardrail_blocked","code":"guardrail_injection_blocked"}}"#;
pub const LEAKY_500: &str = r#"{"error":"surreal at 10.0.0.3:8000 refused: table sessions"}"#;
pub const LEAKY_400: &str =
    r#"{"error":{"message":"unknown agent knowme-internal","type":"invalid_request_error"}}"#;
pub const ARTIFACT_STREAM: &str = concat!(
    "event: agui.stream.start\nid: 1\ndata: {\"request_id\":\"r1\"}\n\n",
    "event: agui.artifact\nid: 2\ndata: {\"artifact_type\":\"effective_run_policy\",\"content\":\"{}\"}\n\n",
    "event: agui.message.delta\nid: 3\ndata: {\"delta\":{\"text\":\"hi\"}}\n\n",
    "event: agui.artifact\nid: 4\ndata: {\"artifact_type\":\"turn_manifest\"}\n\n",
    "event: agui.artifact\nid: 5\ndata: {\"artifact_type\":\"code\"}\n\n",
    "event: agui.done\nid: 6\ndata: {\"usage\":{\"input_tokens\":1}}\n\n",
);
/// A completed run: one delta, then `agui.done` with usage.
pub const USAGE_STREAM: &str = concat!(
    "event: agui.stream.start\nid: 1\ndata: {\"request_id\":\"r2\"}\n\n",
    "event: agui.message.delta\nid: 2\ndata: {\"delta\":{\"text\":\"hi\"}}\n\n",
    "event: agui.done\nid: 3\ndata: {\"kind\":\"done\",\"usage\":{\"input_tokens\":1430,",
    "\"output_tokens\":210,\"total_tokens\":1640,\"model\":\"qwen3.8-max\"}}\n\n",
);
/// The reservation `n` the harness configures.
pub const RESERVATION: u64 = 5_000;
pub const STEP: Duration = Duration::from_secs(5);

#[derive(Debug, Clone)]
pub struct Seen {
    pub method: Method,
    pub uri: String,
    pub headers: HeaderMap,
    pub body: Bytes,
}

#[derive(Clone, Default)]
pub struct Stub {
    pub seen: Arc<Mutex<Vec<Seen>>>,
    /// Released by the test to let the SSE stub emit its second event.
    pub release: Arc<Notify>,
}

impl Stub {
    pub fn last(&self) -> Seen {
        self.seen
            .lock()
            .unwrap()
            .last()
            .cloned()
            .expect("upstream saw no request")
    }
    pub fn count(&self) -> usize {
        self.seen.lock().unwrap().len()
    }
}

pub async fn stub_handler(
    axum::extract::State(stub): axum::extract::State<Stub>,
    method: Method,
    uri: Uri,
    headers: HeaderMap,
    body: Bytes,
) -> Response {
    stub.seen.lock().unwrap().push(Seen {
        method,
        uri: uri.to_string(),
        headers,
        body,
    });
    match uri.path() {
        "/readyz" => Response::new(Body::empty()),
        "/api/chat/completion" if body_has(&stub.last(), "upstream-500") => {
            json_response(StatusCode::INTERNAL_SERVER_ERROR, LEAKY_500)
        }
        "/api/chat/completion" if body_has(&stub.last(), "upstream-400") => {
            json_response(StatusCode::BAD_REQUEST, LEAKY_400)
        }
        "/api/chat/completion" if body_has(&stub.last(), "guardrail") => {
            json_response(StatusCode::BAD_REQUEST, GUARDRAIL_BODY)
        }
        "/api/chat/completion" if body_has(&stub.last(), "usage") => Response::builder()
            .header("content-type", "text/event-stream")
            .body(Body::from(USAGE_STREAM))
            .unwrap(),
        "/api/chat/completion" if body_has(&stub.last(), "artifacts") => {
            // Two bytes per upstream chunk: every event spans chunks.
            let chunks: Vec<Result<Bytes, std::io::Error>> = ARTIFACT_STREAM
                .as_bytes()
                .chunks(2)
                .map(|c| Ok(Bytes::copy_from_slice(c)))
                .collect();
            Response::builder()
                .header("content-type", "text/event-stream")
                .body(Body::from_stream(futures_util::stream::iter(chunks)))
                .unwrap()
        }
        "/api/chat/completion" => {
            let (tx, rx) = mpsc::channel::<Result<Bytes, std::io::Error>>(4);
            let release = stub.release.clone();
            tokio::spawn(async move {
                let _ = tx
                    .send(Ok(Bytes::from_static(b"data: {\"type\":\"first\"}\n\n")))
                    .await;
                release.notified().await;
                let _ = tx
                    .send(Ok(Bytes::from_static(b"data: {\"type\":\"second\"}\n\n")))
                    .await;
            });
            let stream = futures_util::stream::unfold(rx, |mut rx| async move {
                rx.recv().await.map(|item| (item, rx))
            });
            Response::builder()
                .header("content-type", "text/event-stream")
                .header("set-cookie", "upstream=leak")
                .body(Body::from_stream(stream))
                .unwrap()
        }
        _ => Response::builder()
            .header("content-type", "application/json")
            .body(Body::from(r#"{"ok":true}"#))
            .unwrap(),
    }
}

pub fn body_has(seen: &Seen, needle: &str) -> bool {
    std::str::from_utf8(&seen.body).is_ok_and(|b| b.contains(needle))
}

pub fn json_response(status: StatusCode, body: &'static str) -> Response {
    Response::builder()
        .status(status)
        .header("content-type", "application/json")
        .body(Body::from(body))
        .unwrap()
}

pub async fn serve(app: Router) -> SocketAddr {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    tokio::spawn(async move {
        axum::serve(
            listener,
            app.into_make_service_with_connect_info::<SocketAddr>(),
        )
        .await
        .unwrap();
    });
    addr
}

pub struct Harness {
    pub base: String,
    pub stub: Stub,
    pub meter: MeterStub,
    pub http: reqwest::Client,
    pub kill_switch: PathBuf,
}

pub async fn start(upstream: Option<&str>) -> Harness {
    start_with(Options {
        upstream,
        ..Options::default()
    })
    .await
}

pub async fn start_with_tap(
    upstream: Option<&str>,
    tap: Option<knowme_site_server::UpstreamTap>,
) -> Harness {
    start_with(Options {
        upstream,
        tap,
        ..Options::default()
    })
    .await
}

#[derive(Default)]
pub struct Options<'a> {
    pub upstream: Option<&'a str>,
    pub tap: Option<knowme_site_server::UpstreamTap>,
    /// Kill switch file content; `None` writes `off`.
    pub kill_switch: Option<&'a str>,
    pub meter_mode: MeterMode,
    /// Points the meter elsewhere than the stub (e.g. a closed port).
    pub meter_url: Option<&'a str>,
}

pub async fn start_with(options: Options<'_>) -> Harness {
    let stub = Stub::default();
    let upstream_url = match options.upstream {
        Some(url) => url.to_owned(),
        None => {
            let addr = serve(
                Router::new()
                    .fallback(any(stub_handler))
                    .with_state(stub.clone()),
            )
            .await;
            format!("http://{addr}")
        }
    };
    let meter = MeterStub::new(options.meter_mode);
    let meter_addr = serve(
        Router::new()
            .fallback(any(meter_handler))
            .with_state(meter.clone()),
    )
    .await;
    let kill_switch = temp_path("kill-switch");
    std::fs::write(&kill_switch, options.kill_switch.unwrap_or("off")).unwrap();
    let config = Config {
        port: 0,
        uar_upstream: upstream_url,
        site_proxy_api_key: Some(PROXY_KEY.to_owned()),
        site_agent_id: "knowme-site".to_owned(),
        trusted_proxy_hops: 0,
        web_root: None,
        rate_limits: RateLimits::default(),
        session_secret: SessionSecret::new(SESSION_SECRET).unwrap(),
        meter: MeterConfig {
            store: MeterStoreConfig {
                url: options
                    .meter_url
                    .map_or_else(|| format!("http://{meter_addr}"), str::to_owned),
                namespace: "site".to_owned(),
                database: "meter".to_owned(),
                user: METER_USER.to_owned(),
                password: METER_PASS.to_owned(),
            },
            budgets: Budgets {
                daily: 1_000_000,
                monthly: 20_000_000,
            },
            reservation_tokens: RESERVATION,
        },
        kill_switch_file: kill_switch.clone(),
    };
    let app = match options.tap {
        Some(tap) => build_app_with_upstream_tap(&config, tap),
        None => build_app(&config),
    };
    let addr = serve(app.unwrap()).await;
    Harness {
        base: format!("http://{addr}"),
        stub,
        meter,
        http: reqwest::Client::new(),
        kill_switch,
    }
}

pub fn temp_path(name: &str) -> PathBuf {
    static NEXT: AtomicUsize = AtomicUsize::new(0);
    std::env::temp_dir().join(format!(
        "knowme-site-test-{}-{}-{name}",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::Relaxed)
    ))
}

pub const METER_USER: &str = "meter-user";
pub const METER_PASS: &str = "meter-pass";
const METER_TOKEN: &str = "meter-token";

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub enum MeterMode {
    /// Every reservation fits.
    #[default]
    Ok,
    /// Every reservation hits the daily budget (THROW).
    Exhausted,
    /// `/sql` answers 500.
    Down,
    /// The first `/sql` answers 401 (expired token), then `Ok`.
    ExpiredToken,
}

/// One `/sql` call the meter stub received.
#[derive(Debug, Clone)]
pub struct MeterCall {
    pub query: String,
    /// URL query variables (`$model`, `$outcome`).
    pub vars: Vec<(String, String)>,
    pub authorization: Option<String>,
    pub namespace: Option<String>,
    pub database: Option<String>,
}

/// SurrealDB's `/signin` and `/sql`, answering the meter's two query shapes
/// from a running total.
#[derive(Clone)]
pub struct MeterStub {
    mode: MeterMode,
    pub calls: Arc<Mutex<Vec<MeterCall>>>,
    pub signins: Arc<Mutex<Vec<serde_json::Value>>>,
    total: Arc<Mutex<i128>>,
    expired_once: Arc<Mutex<bool>>,
}

impl MeterStub {
    fn new(mode: MeterMode) -> Self {
        Self {
            mode,
            calls: Arc::default(),
            signins: Arc::default(),
            total: Arc::default(),
            expired_once: Arc::default(),
        }
    }

    pub fn calls(&self) -> Vec<MeterCall> {
        self.calls.lock().unwrap().clone()
    }

    pub fn reservations(&self) -> usize {
        self.calls()
            .iter()
            .filter(|c| c.query.contains("UPSERT"))
            .count()
    }

    /// Waits for the `n`-th settlement (a `CREATE turn` call).
    pub async fn settlement(&self, n: usize) -> MeterCall {
        tokio::time::timeout(STEP, async {
            loop {
                let settled: Vec<MeterCall> = self
                    .calls()
                    .into_iter()
                    .filter(|c| c.query.contains("CREATE turn"))
                    .collect();
                if let Some(call) = settled.get(n) {
                    return call.clone();
                }
                tokio::time::sleep(Duration::from_millis(10)).await;
            }
        })
        .await
        .expect("turn was never settled")
    }
}

impl MeterCall {
    pub fn var(&self, name: &str) -> Option<&str> {
        self.vars
            .iter()
            .find(|(k, _)| k == name)
            .map(|(_, v)| v.as_str())
    }
}

async fn meter_handler(
    axum::extract::State(meter): axum::extract::State<MeterStub>,
    uri: Uri,
    headers: HeaderMap,
    body: Bytes,
) -> Response {
    let header = |name: &str| {
        headers
            .get(name)
            .and_then(|v| v.to_str().ok())
            .map(str::to_owned)
    };
    if uri.path() == "/signin" {
        let value: serde_json::Value = serde_json::from_slice(&body).unwrap();
        let ok = value["user"] == METER_USER && value["pass"] == METER_PASS;
        meter.signins.lock().unwrap().push(value);
        return if ok {
            json_owned(
                StatusCode::OK,
                format!(r#"{{"code":200,"token":"{METER_TOKEN}"}}"#),
            )
        } else {
            json_owned(StatusCode::UNAUTHORIZED, "{}".to_owned())
        };
    }
    let query = String::from_utf8(body.to_vec()).unwrap();
    let vars = uri.query().map(|q| url_pairs(q)).unwrap_or_default();
    meter.calls.lock().unwrap().push(MeterCall {
        query: query.clone(),
        vars,
        authorization: header("authorization"),
        namespace: header("surreal-ns"),
        database: header("surreal-db"),
    });
    if meter.mode == MeterMode::ExpiredToken {
        let mut expired = meter.expired_once.lock().unwrap();
        if !*expired {
            *expired = true;
            return json_owned(StatusCode::UNAUTHORIZED, "{}".to_owned());
        }
    }
    if meter.mode == MeterMode::Down {
        return json_owned(StatusCode::INTERNAL_SERVER_ERROR, "{}".to_owned());
    }
    if query.contains("UPSERT") && meter.mode == MeterMode::Exhausted {
        return json_owned(
            StatusCode::OK,
            r#"[{"status":"ERR","result":"An error occurred: meter_budget_exceeded:day"}]"#
                .to_owned(),
        );
    }
    let delta = if query.contains("UPSERT") {
        i128::from(RESERVATION)
    } else {
        settle_delta(&query)
    };
    let total = {
        let mut total = meter.total.lock().unwrap();
        *total += delta;
        *total
    };
    json_owned(
        StatusCode::OK,
        format!(r#"[{{"status":"OK","result":{{"day":{total},"month":{total}}}}}]"#),
    )
}

/// The `total += <delta>` of a settlement query.
fn settle_delta(query: &str) -> i128 {
    query
        .split("SET total += ")
        .nth(1)
        .and_then(|rest| rest.split_whitespace().next())
        .and_then(|n| n.parse().ok())
        .unwrap_or(0)
}

fn url_pairs(query: &str) -> Vec<(String, String)> {
    reqwest::Url::parse(&format!("http://x/?{query}"))
        .unwrap()
        .query_pairs()
        .map(|(k, v)| (k.into_owned(), v.into_owned()))
        .collect()
}

fn json_owned(status: StatusCode, body: String) -> Response {
    Response::builder()
        .status(status)
        .header("content-type", "application/json")
        .body(Body::from(body))
        .unwrap()
}

impl Harness {
    /// A chat turn on `THREAD` with no cookie.
    pub fn chat(&self, body: &'static str) -> reqwest::RequestBuilder {
        self.chat_on(THREAD, body)
    }

    pub fn chat_on(&self, thread: &str, body: &'static str) -> reqwest::RequestBuilder {
        self.http
            .post(format!("{}/api/chat/completion", self.base))
            .header("content-type", "application/json")
            .header("x-uar-session-id", thread)
            .body(body)
    }

    /// Sends a turn and returns the upstream session id UAR saw.
    pub async fn upstream_session(&self, thread: &str, cookie: Option<&str>) -> String {
        let mut request = self.chat_on(thread, r#"{"message":"hi"}"#);
        if let Some(cookie) = cookie {
            request = request.header("cookie", cookie);
        }
        let res = request.send().await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        drop(res);
        self.stub.last().headers["x-uar-session-id"]
            .to_str()
            .unwrap()
            .to_owned()
    }
}

pub fn pinned_body(message: &str) -> serde_json::Value {
    serde_json::json!({
        "agent_id": "knowme-site",
        "message": message,
        "stream": true,
        "stream_mode": "dual",
        "memory_enabled": false
    })
}

/// `knowme_vid=<value>` from a response's Set-Cookie, as a Cookie header.
pub fn visitor_cookie(res: &reqwest::Response) -> Option<String> {
    res.headers()
        .get_all("set-cookie")
        .iter()
        .filter_map(|v| v.to_str().ok())
        .find(|v| v.starts_with("knowme_vid="))
        .and_then(|v| v.split(';').next())
        .map(str::to_owned)
}

pub async fn new_visitor(h: &Harness) -> String {
    let res = h.chat(r#"{"message":"hi"}"#).send().await.unwrap();
    let cookie = visitor_cookie(&res).expect("no visitor cookie issued");
    drop(res);
    cookie
}

pub fn json(bytes: &[u8]) -> serde_json::Value {
    serde_json::from_slice(bytes).unwrap()
}
