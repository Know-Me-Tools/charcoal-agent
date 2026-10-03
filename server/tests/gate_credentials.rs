// TJ-ARCH-MOB-001 compliant
//! Gate mode end to end (gate-site-credentials 1.4): the site server obtains
//! a UAR bearer from a stub gate token endpoint by client credentials and
//! sends it upstream in place of the `X-API-Key`.

mod common;

use std::sync::{Arc, Mutex};

use axum::Router;
use axum::body::Bytes;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::response::Response;
use axum::routing::post;
use common::*;
use knowme_site_server::infrastructure::gate_token::GateConfig;

const CLIENT_ID: &str = "knowme-site";
const CLIENT_SECRET: &str = "gate-client-secret";
/// Gate text that must never reach the visitor.
const GATE_ERROR: &str = r#"{"error":"invalid_client","detail":"gate-internal-detail"}"#;

/// Issues the bearers in `tokens` in order (the last one repeats), or
/// answers 500 with `GATE_ERROR` when `tokens` is empty.
#[derive(Clone)]
struct GateStub {
    tokens: Arc<Vec<&'static str>>,
    calls: Arc<Mutex<Vec<(HeaderMap, String)>>>,
}

impl GateStub {
    fn calls(&self) -> Vec<(HeaderMap, String)> {
        self.calls.lock().unwrap().clone()
    }
}

async fn gate_handler(State(gate): State<GateStub>, headers: HeaderMap, body: Bytes) -> Response {
    let n = {
        let mut calls = gate.calls.lock().unwrap();
        calls.push((headers, String::from_utf8_lossy(&body).into_owned()));
        calls.len()
    };
    let Some(token) = gate.tokens.get(n - 1).or(gate.tokens.last()) else {
        return json_response(StatusCode::INTERNAL_SERVER_ERROR, GATE_ERROR);
    };
    let body = format!(
        r#"{{"access_token":"{token}","token_type":"Bearer","expires_in":900,"scope":""}}"#
    );
    Response::builder()
        .header("content-type", "application/json")
        .body(body.into())
        .unwrap()
}

async fn start_gated(tokens: Vec<&'static str>) -> (Harness, GateStub) {
    let gate = GateStub {
        tokens: Arc::new(tokens),
        calls: Arc::default(),
    };
    let addr = serve(
        Router::new()
            .route("/oauth/token", post(gate_handler))
            .with_state(gate.clone()),
    )
    .await;
    let h = start_with(Options {
        gate: Some(GateConfig {
            token_url: format!("http://{addr}/oauth/token"),
            client_id: CLIENT_ID.to_owned(),
            client_secret: CLIENT_SECRET.to_owned(),
        }),
        ..Options::default()
    })
    .await;
    (h, gate)
}

#[tokio::test]
async fn gate_mode_should_send_a_cached_bearer_and_no_api_key() {
    let (h, gate) = start_gated(vec!["site-token-1"]).await;
    for _ in 0..2 {
        let res = h
            .chat(r#"{"message":"usage"}"#)
            .header("authorization", "Bearer client-jwt")
            .send()
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        drop(res.bytes().await);
        let seen = h.stub.last();
        let auth: Vec<_> = seen.headers.get_all("authorization").iter().collect();
        assert_eq!(auth, vec!["Bearer site-token-1"]);
        assert!(seen.headers.get("x-api-key").is_none());
    }

    // One gate call for both turns, form-encoded client credentials.
    let calls = gate.calls();
    assert_eq!(calls.len(), 1);
    let (headers, body) = &calls[0];
    assert_eq!(
        headers.get("content-type").unwrap(),
        "application/x-www-form-urlencoded"
    );
    assert_eq!(
        body,
        &format!(
            "grant_type=client_credentials&client_id={CLIENT_ID}&client_secret={CLIENT_SECRET}"
        )
    );
}

#[tokio::test]
async fn a_401_from_uar_should_refresh_the_token_and_retry_once() {
    let rejected = REJECTED_BEARER.trim_start_matches("Bearer ");
    let (h, gate) = start_gated(vec![rejected, "site-token-2"]).await;
    let res = h.chat(r#"{"message":"usage"}"#).send().await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    drop(res.bytes().await);

    let seen = h.stub.seen.lock().unwrap().clone();
    let bearers: Vec<_> = seen
        .iter()
        .filter(|s| s.uri == "/api/chat/completion")
        .map(|s| s.headers.get("authorization").unwrap().clone())
        .collect();
    assert_eq!(bearers, vec![REJECTED_BEARER, "Bearer site-token-2"]);
    assert_eq!(gate.calls().len(), 2);
}

#[tokio::test]
async fn a_gate_failure_should_fail_the_turn_with_the_generic_upstream_error() {
    let (h, gate) = start_gated(vec![]).await;
    let res = h.chat(r#"{"message":"usage"}"#).send().await.unwrap();
    assert_eq!(res.status(), StatusCode::BAD_GATEWAY);
    let body = String::from_utf8(res.bytes().await.unwrap().to_vec()).unwrap();
    let json: serde_json::Value = serde_json::from_str(&body).unwrap();
    assert_eq!(json["error"], "upstream_unavailable");
    assert!(!body.contains("gate"), "{body}");
    assert!(!body.contains("invalid_client"), "{body}");
    assert_eq!(gate.calls().len(), 1);
    // UAR was never called without a token.
    assert!(
        h.stub
            .seen
            .lock()
            .unwrap()
            .iter()
            .all(|s| s.uri != "/api/chat/completion")
    );
}
