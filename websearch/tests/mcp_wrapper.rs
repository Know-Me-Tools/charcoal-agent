// TJ-ARCH-MOB-001 compliant
//! Task 16.2.1 / 16.2.3: the wrapper end to end over HTTP, against a fake
//! Firecrawl upstream (wiremock). Nothing here reaches the real Firecrawl
//! API.

mod common;

use std::collections::BTreeSet;
use std::time::Duration;

use common::{
    FAKE_KEY, Harness, LogCapture, ManualClock, Options, TOKEN, bearer, firecrawl_response,
    output_of, start,
};
use serde_json::{Value, json};
use wiremock::matchers::{body_json, header, method, path};
use wiremock::{Mock, ResponseTemplate};

// 2026-10-13 00:00:00 UTC and the last second before it.
const MIDNIGHT: u64 = 1_791_849_600;
const NEXT_MIDNIGHT: u64 = MIDNIGHT + 86_400;

async fn mount_ok(harness: &Harness, items: &[(&str, &str, &str)], expected_calls: u64) {
    Mock::given(method("POST"))
        .and(path("/v2/search"))
        .respond_with(ResponseTemplate::new(200).set_body_json(firecrawl_response(items)))
        .expect(expected_calls)
        .mount(&harness.upstream)
        .await;
}

fn keys(value: &Value) -> BTreeSet<String> {
    value
        .as_object()
        .map(|o| o.keys().cloned().collect())
        .unwrap_or_default()
}

// ── Query validation ────────────────────────────────────────────────────────

#[tokio::test]
async fn an_empty_query_should_be_rejected_without_calling_upstream() {
    let harness = start(Options::default()).await;
    mount_ok(&harness, &[], 0).await;

    let result = harness.search("   ").await;

    assert_eq!(result["isError"], json!(true));
    harness.upstream.verify().await;
}

#[tokio::test]
async fn a_query_over_200_characters_should_be_rejected_without_calling_upstream() {
    let harness = start(Options::default()).await;
    mount_ok(&harness, &[], 0).await;

    let result = harness.search(&"q".repeat(201)).await;

    assert_eq!(result["isError"], json!(true));
    harness.upstream.verify().await;
}

#[tokio::test]
async fn extra_arguments_should_be_rejected_without_calling_upstream() {
    let harness = start(Options::default()).await;
    mount_ok(&harness, &[], 0).await;

    let result = harness
        .call_tool(json!({ "query": "rust", "limit": 100, "scrapeOptions": {} }))
        .await;

    assert_eq!(result["isError"], json!(true));
    harness.upstream.verify().await;
}

// ── Exact upstream request ──────────────────────────────────────────────────

#[tokio::test]
async fn the_upstream_request_should_carry_exactly_query_limit_and_sources() {
    let harness = start(Options::default()).await;
    Mock::given(method("POST"))
        .and(path("/v2/search"))
        .and(header(
            "authorization",
            format!("Bearer {FAKE_KEY}").as_str(),
        ))
        .and(body_json(
            json!({ "query": "latest rust release", "limit": 5, "sources": ["web"] }),
        ))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(firecrawl_response(&[(
                "Rust 1.90",
                "https://blog.rust-lang.org/",
                "Release notes",
            )])),
        )
        .expect(1)
        .mount(&harness.upstream)
        .await;

    let result = harness.search("  latest rust release ").await;
    let requests = harness.upstream_requests().await;
    let sent: Value = serde_json::from_slice(&requests[0].body).expect("request json");

    assert_eq!(
        (
            output_of(&result)["results"].as_array().map(Vec::len),
            keys(&sent),
        ),
        (
            Some(1),
            ["limit", "query", "sources"]
                .iter()
                .map(|s| (*s).to_owned())
                .collect()
        )
    );
}

// ── Projection ──────────────────────────────────────────────────────────────

#[tokio::test]
async fn the_output_should_carry_only_title_url_and_snippet_per_hit() {
    let harness = start(Options::default()).await;
    mount_ok(
        &harness,
        &[
            ("First", "https://example.org/one", "One description"),
            ("Second", "https://example.com/two?x=1", "Two description"),
        ],
        1,
    )
    .await;

    let result = harness.search("anything").await;
    let output = output_of(&result);
    let text = result["content"][0]["text"].as_str().unwrap_or_default();
    let item_keys: Vec<BTreeSet<String>> = output["results"]
        .as_array()
        .map(|items| items.iter().map(keys).collect())
        .unwrap_or_default();

    let expected: BTreeSet<String> = ["snippet", "title", "url"]
        .iter()
        .map(|s| (*s).to_owned())
        .collect();
    assert_eq!(item_keys, vec![expected.clone(), expected]);
    assert!(!text.contains("LEAK"), "stripped field leaked: {text}");
    assert_eq!(
        keys(&output),
        ["note", "results"]
            .iter()
            .map(|s| (*s).to_owned())
            .collect()
    );
}

#[tokio::test]
async fn non_https_userinfo_and_fragment_urls_should_be_dropped() {
    let harness = start(Options::default()).await;
    mount_ok(
        &harness,
        &[
            ("plain http", "http://example.org/", "x"),
            ("userinfo", "https://user:pw@example.org/", "x"),
            ("fragment", "https://example.org/page#top", "x"),
            ("script", "javascript:alert(1)", "x"),
            ("data", "data:text/html,hi", "x"),
            ("kept", "https://example.org/kept", "x"),
        ],
        1,
    )
    .await;

    let output = output_of(&harness.search("urls").await);

    assert_eq!(
        output["results"],
        json!([{ "title": "kept", "url": "https://example.org/kept", "snippet": "x" }])
    );
}

#[tokio::test]
async fn titles_snippets_and_the_whole_output_should_be_capped() {
    let harness = start(Options::default()).await;
    let long_title = "T".repeat(400);
    let long_desc = "<b>bold</b> ".to_owned() + &"d".repeat(1000);
    let long_url = format!("https://example.org/{}", "p".repeat(1500));
    let items: Vec<(&str, &str, &str)> = (0..5)
        .map(|_| (long_title.as_str(), long_url.as_str(), long_desc.as_str()))
        .collect();
    mount_ok(&harness, &items, 1).await;

    let result = harness.search("caps").await;
    let text = result["content"][0]["text"].as_str().unwrap_or_default();
    let output = output_of(&result);
    let first = &output["results"][0];

    assert!(text.len() <= 4096, "output is {} bytes", text.len());
    assert_eq!(
        (
            first["title"].as_str().map(|t| t.chars().count()),
            first["snippet"].as_str().map(|s| s.chars().count()),
            first["snippet"].as_str().map(|s| s.contains('<')),
        ),
        (Some(120), Some(240), Some(false))
    );
}

// ── Failure handling ────────────────────────────────────────────────────────

#[tokio::test]
async fn an_upstream_timeout_should_return_the_unavailable_result() {
    let harness = start(Options {
        timeout: Duration::from_millis(200),
        ..Options::default()
    })
    .await;
    Mock::given(method("POST"))
        .and(path("/v2/search"))
        .respond_with(
            ResponseTemplate::new(200)
                .set_body_json(firecrawl_response(&[("t", "https://example.org/", "d")]))
                .set_delay(Duration::from_secs(2)),
        )
        .mount(&harness.upstream)
        .await;

    let result = harness.search("slow").await;

    assert_eq!(
        (result["isError"].clone(), output_of(&result)),
        (
            json!(false),
            json!({ "results": [], "note": "Web search is unavailable right now." })
        )
    );
}

#[tokio::test]
async fn an_upstream_error_body_should_never_be_echoed() {
    let harness = start(Options::default()).await;
    Mock::given(method("POST"))
        .and(path("/v2/search"))
        .respond_with(
            ResponseTemplate::new(500)
                .set_body_string("{\"success\":false,\"error\":\"UPSTREAM-SECRET-DETAIL\"}"),
        )
        .mount(&harness.upstream)
        .await;

    let result = harness.search("boom").await;
    let text = result["content"][0]["text"].as_str().unwrap_or_default();

    assert_eq!(
        (
            text.contains("UPSTREAM-SECRET-DETAIL"),
            output_of(&result)["results"].clone()
        ),
        (false, json!([]))
    );
}

// ── Auth and origin ─────────────────────────────────────────────────────────

fn search_message() -> Value {
    json!({
        "jsonrpc": "2.0", "id": 1, "method": "tools/call",
        "params": { "name": "search", "arguments": { "query": "x" } },
    })
}

#[tokio::test]
async fn a_request_without_the_bearer_should_be_rejected() {
    let harness = start(Options::default()).await;
    mount_ok(&harness, &[], 0).await;

    let (status, _) = harness.post(None, &search_message()).await;

    assert_eq!(status, 401);
    harness.upstream.verify().await;
}

#[tokio::test]
async fn a_request_with_a_wrong_bearer_should_be_rejected() {
    let harness = start(Options::default()).await;
    mount_ok(&harness, &[], 0).await;

    let wrong = format!("Bearer {}x", &TOKEN[..TOKEN.len() - 1]);
    let (status, _) = harness.post(Some(&wrong), &search_message()).await;

    assert_eq!(status, 401);
    harness.upstream.verify().await;
}

#[tokio::test]
async fn a_request_with_an_origin_header_should_be_refused() {
    let harness = start(Options::default()).await;
    let response = harness
        .http
        .post(format!("{}/mcp", harness.base))
        .header("authorization", bearer())
        .header("origin", "https://attacker.example")
        .body(search_message().to_string())
        .send()
        .await
        .expect("send");

    assert_eq!(response.status().as_u16(), 403);
}

#[tokio::test]
async fn health_probes_should_not_need_the_bearer() {
    let harness = start(Options::default()).await;
    let response = harness
        .http
        .get(format!("{}/healthz", harness.base))
        .send()
        .await
        .expect("send");

    assert_eq!(response.status().as_u16(), 200);
}

// ── Protocol surface ────────────────────────────────────────────────────────

#[tokio::test]
async fn tools_list_should_expose_exactly_one_tool_with_one_string_property() {
    let harness = start(Options::default()).await;
    let (status, body) = harness
        .post(
            Some(&bearer()),
            &json!({ "jsonrpc": "2.0", "id": 2, "method": "tools/list" }),
        )
        .await;
    let parsed: Value = serde_json::from_str(&body).expect("json");
    let tools = parsed["result"]["tools"]
        .as_array()
        .cloned()
        .unwrap_or_default();
    let schema = &tools[0]["inputSchema"];

    assert_eq!(
        (
            status,
            tools.len(),
            tools[0]["name"].clone(),
            keys(&schema["properties"]),
            schema["properties"]["query"]["type"].clone(),
            schema["required"].clone(),
        ),
        (
            200,
            1,
            json!("search"),
            ["query".to_owned()].into_iter().collect(),
            json!("string"),
            json!(["query"]),
        )
    );
}

#[tokio::test]
async fn initialize_should_echo_a_supported_protocol_version() {
    let harness = start(Options::default()).await;
    let (_, body) = harness
        .post(
            Some(&bearer()),
            &json!({
                "jsonrpc": "2.0", "id": 0, "method": "initialize",
                "params": {
                    "protocolVersion": "2025-06-18",
                    "capabilities": {},
                    "clientInfo": { "name": "uar", "version": "1" },
                },
            }),
        )
        .await;
    let parsed: Value = serde_json::from_str(&body).expect("json");

    assert_eq!(
        (
            parsed["result"]["protocolVersion"].clone(),
            parsed["result"]["serverInfo"]["name"].clone(),
            parsed["result"]["capabilities"]["tools"].is_object(),
        ),
        (json!("2025-06-18"), json!("site-websearch"), true)
    );
}

#[tokio::test]
async fn a_notification_should_get_202_and_no_body() {
    let harness = start(Options::default()).await;
    let (status, body) = harness
        .post(
            Some(&bearer()),
            &json!({ "jsonrpc": "2.0", "method": "notifications/initialized" }),
        )
        .await;

    assert_eq!((status, body.as_str()), (202, ""));
}

#[tokio::test]
async fn a_non_string_method_should_be_an_invalid_request() {
    let harness = start(Options::default()).await;
    let (status, body) = harness
        .post(
            Some(&bearer()),
            &json!({ "jsonrpc": "2.0", "id": 4, "method": 5 }),
        )
        .await;
    let parsed: Value = serde_json::from_str(&body).expect("json");

    assert_eq!(
        (status, parsed["error"]["code"].clone()),
        (400, json!(-32600))
    );
}

#[tokio::test]
async fn an_unknown_tool_should_be_a_json_rpc_error_and_not_call_upstream() {
    let harness = start(Options::default()).await;
    mount_ok(&harness, &[], 0).await;
    let (_, body) = harness
        .post(
            Some(&bearer()),
            &json!({
                "jsonrpc": "2.0", "id": 3, "method": "tools/call",
                "params": { "name": "scrape", "arguments": { "url": "https://example.org/" } },
            }),
        )
        .await;
    let parsed: Value = serde_json::from_str(&body).expect("json");

    assert_eq!(parsed["error"]["code"], json!(-32602));
    harness.upstream.verify().await;
}

// ── Daily cap (16.2.3) ──────────────────────────────────────────────────────

#[tokio::test]
async fn past_the_daily_cap_upstream_should_be_called_zero_times() {
    let harness = start(Options {
        daily_cap: 2,
        ..Options::default()
    })
    .await;
    mount_ok(&harness, &[("t", "https://example.org/", "d")], 2).await;

    let _ = harness.search("one").await;
    let _ = harness.search("two").await;
    let third = harness.search("three").await;

    assert_eq!(
        output_of(&third),
        json!({ "results": [], "note": "Web search is unavailable right now." })
    );
    harness.upstream.verify().await;
}

#[tokio::test]
async fn the_cap_should_reset_at_midnight_utc() {
    let clock = ManualClock::at(NEXT_MIDNIGHT - 1);
    let harness = start(Options {
        daily_cap: 1,
        clock: clock.clone(),
        ..Options::default()
    })
    .await;
    mount_ok(&harness, &[("t", "https://example.org/", "d")], 2).await;

    let before = harness.search("first").await;
    let refused = harness.search("second, same day").await;
    clock.set(NEXT_MIDNIGHT);
    let after = harness.search("third, next day").await;

    let counts: Vec<usize> = [&before, &refused, &after]
        .iter()
        .map(|r| output_of(r)["results"].as_array().map_or(0, Vec::len))
        .collect();
    assert_eq!(counts, vec![1, 0, 1]);
    harness.upstream.verify().await;
}

// ── Logs ────────────────────────────────────────────────────────────────────

#[tokio::test]
async fn logs_should_never_contain_the_key_the_bearer_or_the_query() {
    let capture = LogCapture::default();
    let writer = capture.clone();
    let subscriber = tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::new(
            "info,site_websearch=trace",
        ))
        .with_writer(move || writer.clone())
        .with_ansi(false)
        .finish();
    let _guard = tracing::subscriber::set_default(subscriber);

    let harness = start(Options {
        daily_cap: 1,
        ..Options::default()
    })
    .await;
    mount_ok(&harness, &[("t", "https://example.org/", "d")], 1).await;
    let query = "very-private-visitor-words";
    let _ = harness.search(query).await;
    let _ = harness.search(query).await;
    let _ = harness
        .post(
            Some("Bearer wrong-token-for-log-test-000000000"),
            &search_message(),
        )
        .await;

    let logs = capture.contents();
    assert!(logs.contains("outcome"), "no log lines captured: {logs}");
    assert!(
        !logs.contains(query) && !logs.contains(FAKE_KEY) && !logs.contains(TOKEN),
        "a secret or the query reached the logs: {logs}"
    );
}
