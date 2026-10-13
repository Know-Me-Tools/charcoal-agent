// TJ-ARCH-MOB-001 compliant
//! Wrapper test harness: the real router on a loopback port, a fake
//! Firecrawl (wiremock), a movable clock, and a log capture.

#![allow(dead_code)]

use std::io;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, PoisonError};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use serde_json::{Value, json};
use site_websearch::infrastructure::counter::Clock;
use site_websearch::infrastructure::firecrawl::FirecrawlKey;
use site_websearch::interface::auth::McpAuth;
use site_websearch::{AppParts, build_app};
use wiremock::MockServer;

pub const FAKE_KEY: &str = "fc-fake-key-for-tests-0000";
pub const TOKEN: &str = "uar-to-wrapper-token-0123456789abcdef0123";

pub fn bearer() -> String {
    format!("Bearer {TOKEN}")
}

/// A clock the test moves by hand.
pub struct ManualClock(Mutex<SystemTime>);

impl ManualClock {
    pub fn at(seconds: u64) -> Arc<Self> {
        Arc::new(Self(Mutex::new(UNIX_EPOCH + Duration::from_secs(seconds))))
    }

    pub fn set(&self, seconds: u64) {
        *self.0.lock().unwrap_or_else(PoisonError::into_inner) =
            UNIX_EPOCH + Duration::from_secs(seconds);
    }
}

impl Clock for ManualClock {
    fn now(&self) -> SystemTime {
        *self.0.lock().unwrap_or_else(PoisonError::into_inner)
    }
}

pub struct Options {
    pub daily_cap: u32,
    pub timeout: Duration,
    pub clock: Arc<ManualClock>,
    pub state_file: Option<PathBuf>,
}

impl Default for Options {
    fn default() -> Self {
        Self {
            daily_cap: 300,
            timeout: Duration::from_secs(10),
            // 2026-10-13 12:00:00 UTC.
            clock: ManualClock::at(1_791_892_800),
            state_file: None,
        }
    }
}

pub struct Harness {
    pub base: String,
    pub upstream: MockServer,
    pub http: reqwest::Client,
}

pub async fn start(options: Options) -> Harness {
    let upstream = MockServer::start().await;
    let parts = AppParts {
        firecrawl_key: FirecrawlKey::new(FAKE_KEY).expect("test key"),
        mcp_auth: McpAuth::parse(&bearer()).expect("test bearer"),
        daily_cap: options.daily_cap,
        cap_state_file: options.state_file,
        firecrawl_origin: upstream.uri(),
        upstream_timeout: options.timeout,
        clock: options.clock,
    };
    let app = build_app(parts).expect("app");
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("bind");
    let addr = listener.local_addr().expect("addr");
    tokio::spawn(async move {
        let _ = axum::serve(listener, app).await;
    });
    Harness {
        base: format!("http://{addr}"),
        upstream,
        http: reqwest::Client::builder()
            .no_proxy()
            .build()
            .expect("client"),
    }
}

impl Harness {
    /// POSTs one JSON-RPC message to `/mcp` with the given Authorization.
    pub async fn post(&self, auth: Option<&str>, message: &Value) -> (u16, String) {
        let mut request = self
            .http
            .post(format!("{}/mcp", self.base))
            .header("content-type", "application/json")
            .header("accept", "application/json, text/event-stream")
            .body(message.to_string());
        if let Some(auth) = auth {
            request = request.header("authorization", auth);
        }
        let response = request.send().await.expect("send");
        let status = response.status().as_u16();
        (status, response.text().await.expect("body"))
    }

    /// Calls the `search` tool with an authorized request; returns the
    /// JSON-RPC `result`.
    pub async fn search(&self, query: &str) -> Value {
        self.call_tool(json!({ "query": query })).await
    }

    pub async fn call_tool(&self, arguments: Value) -> Value {
        let message = json!({
            "jsonrpc": "2.0",
            "id": 7,
            "method": "tools/call",
            "params": { "name": "search", "arguments": arguments },
        });
        let (status, body) = self.post(Some(&bearer()), &message).await;
        assert_eq!(status, 200, "tools/call status; body: {body}");
        let parsed: Value = serde_json::from_str(&body).expect("json-rpc body");
        parsed["result"].clone()
    }

    pub async fn upstream_requests(&self) -> Vec<wiremock::Request> {
        self.upstream.received_requests().await.unwrap_or_default()
    }
}

/// The tool output text parsed as JSON.
pub fn output_of(result: &Value) -> Value {
    let text = result["content"][0]["text"].as_str().expect("text block");
    serde_json::from_str(text).expect("output json")
}

/// A documented-shape Firecrawl v2 search response whose items also carry
/// every field the wrapper must strip.
pub fn firecrawl_response(items: &[(&str, &str, &str)]) -> Value {
    let web: Vec<Value> = items
        .iter()
        .map(|(title, url, description)| {
            json!({
                "title": title,
                "description": description,
                "url": url,
                "markdown": "LEAK-MARKDOWN full page body",
                "html": "<p>LEAK-HTML</p>",
                "rawHtml": "<html>LEAK-RAWHTML</html>",
                "links": ["https://leak.example/LEAK-LINK"],
                "screenshot": "LEAK-SCREENSHOT",
                "metadata": { "title": "LEAK-METADATA", "sourceURL": "https://leak.example/" },
                "position": 1,
                "category": "LEAK-CATEGORY",
            })
        })
        .collect();
    json!({
        "success": true,
        "data": { "web": web },
        "warning": null,
        "id": "LEAK-JOB-ID",
        "creditsUsed": 2,
    })
}

/// Collects formatted log output from the current thread's subscriber.
#[derive(Clone, Default)]
pub struct LogCapture(Arc<Mutex<Vec<u8>>>);

impl LogCapture {
    pub fn contents(&self) -> String {
        String::from_utf8_lossy(&self.0.lock().unwrap_or_else(PoisonError::into_inner)).into_owned()
    }
}

impl io::Write for LogCapture {
    fn write(&mut self, buf: &[u8]) -> io::Result<usize> {
        self.0
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .extend_from_slice(buf);
        Ok(buf.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}
