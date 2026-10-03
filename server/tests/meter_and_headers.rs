// TJ-ARCH-MOB-001 compliant
//! End-to-end tests of the spend meter, the kill switch and the security
//! headers over real loopback sockets; the harness is in `common/mod.rs`.

mod common;

use axum::http::StatusCode;
use common::*;
use knowme_site_server::config::RateLimits;

const FIXTURE_THEME_HASH: &str = "'sha256-2m0LKtL9TkM7m6BmMncU8A6pAb9ikh3OzrtPZXy+uhU='";

async fn error_code(res: reqwest::Response) -> String {
    let body: serde_json::Value = serde_json::from_slice(&res.bytes().await.unwrap()).unwrap();
    body["error"].as_str().unwrap().to_owned()
}

#[tokio::test]
async fn a_completed_turn_should_reserve_first_then_settle_to_its_usage() {
    let h = start(None).await;
    let res = h.chat(r#"{"message":"usage"}"#).send().await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let public = res.text().await.unwrap();
    assert!(public.contains("agui.done"), "{public}");

    let calls = h.meter.calls();
    assert!(calls[0].query.contains("UPSERT"), "reserve comes first");
    assert!(
        calls[0]
            .query
            .contains(&format!("total + {RESERVATION} <= 1000000"))
    );
    assert_eq!(
        (
            calls[0].authorization.as_deref(),
            calls[0].namespace.as_deref(),
            calls[0].database.as_deref()
        ),
        (Some("Bearer meter-token"), Some("site"), Some("meter"))
    );
    let signins = h.meter.signins.lock().unwrap().clone();
    assert_eq!(signins[0]["ns"], "site");
    assert_eq!(signins[0]["db"], "meter");

    let settled = h.meter.settlement(0).await;
    // 1,640 used of 5,000 reserved: both rows go down by 3,360.
    assert!(
        settled.query.contains("SET total += -3360"),
        "{}",
        settled.query
    );
    assert!(settled.query.contains("input_tokens: 1430"));
    assert!(settled.query.contains("output_tokens: 210"));
    assert!(settled.query.contains("excess: 0"));
    assert!(
        !settled.query.contains("ttft_ms: NONE"),
        "time to first token recorded"
    );
    assert_eq!(settled.var("model"), Some("qwen3.8-max"));
    assert_eq!(settled.var("outcome"), Some("completed"));
    // FR-38: no session id and no message text in the record.
    let everything = format!("{settled:?}");
    assert!(!everything.contains(THREAD) && !everything.contains("\"usage\""));
}

#[tokio::test]
async fn a_disconnected_turn_should_keep_its_full_reservation() {
    let h = start(None).await;
    // The default stub holds its second event until released: the run is
    // still going when the visitor goes away.
    let mut res = h.chat(r#"{"message":"hi"}"#).send().await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let _first = tokio::time::timeout(STEP, res.chunk()).await.unwrap();
    drop(res);

    let settled = h.meter.settlement(0).await;
    assert!(
        settled.query.contains("SET total += 0"),
        "{}",
        settled.query
    );
    assert!(settled.query.contains(&format!("charged: {RESERVATION}")));
    assert_eq!(settled.var("outcome"), Some("disconnected"));
}

#[tokio::test]
async fn an_upstream_error_after_admission_should_keep_the_reservation() {
    let h = start(None).await;
    let res = h
        .chat(r#"{"message":"upstream-500"}"#)
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::BAD_GATEWAY);
    let settled = h.meter.settlement(0).await;
    assert!(settled.query.contains("SET total += 0"));
    assert_eq!(settled.var("outcome"), Some("upstream_error"));
}

#[tokio::test]
async fn an_exhausted_budget_should_refuse_with_no_upstream_call() {
    let h = start_with(Options {
        meter_mode: MeterMode::Exhausted,
        ..Options::default()
    })
    .await;
    let res = h.chat(r#"{"message":"hi"}"#).send().await.unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(error_code(res).await, "budget_exhausted");
    assert_eq!(h.stub.count(), 0);
}

#[tokio::test]
async fn a_broken_meter_should_fail_closed_with_no_upstream_call() {
    let h = start_with(Options {
        meter_mode: MeterMode::Down,
        ..Options::default()
    })
    .await;
    let res = h.chat(r#"{"message":"hi"}"#).send().await.unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(error_code(res).await, "meter_unavailable");
    assert_eq!(h.stub.count(), 0);

    // An unreachable store too: nothing listens on the discard port.
    let unreachable = start_with(Options {
        meter_url: Some("http://127.0.0.1:9"),
        ..Options::default()
    })
    .await;
    let res = unreachable
        .chat(r#"{"message":"hi"}"#)
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(error_code(res).await, "meter_unavailable");
    assert_eq!(unreachable.stub.count(), 0);
}

#[tokio::test]
async fn an_expired_meter_token_should_sign_in_again_once() {
    let h = start_with(Options {
        meter_mode: MeterMode::ExpiredToken,
        ..Options::default()
    })
    .await;
    let res = h.chat(r#"{"message":"hi"}"#).send().await.unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    assert_eq!(h.meter.signins.lock().unwrap().len(), 2);
    assert_eq!(h.stub.count(), 1);
}

#[tokio::test]
async fn the_kill_switch_should_refuse_before_the_meter_and_follow_the_file() {
    for content in ["on", "junk", ""] {
        let h = start_with(Options {
            kill_switch: Some(content),
            ..Options::default()
        })
        .await;
        let res = h.chat(r#"{"message":"hi"}"#).send().await.unwrap();
        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE, "{content:?}");
        assert_eq!(error_code(res).await, "kill_switch_on");
        assert_eq!((h.meter.reservations(), h.stub.count()), (0, 0));
    }
    // A missing file is on as well.
    let h = start(None).await;
    std::fs::remove_file(&h.kill_switch).unwrap();
    let off = h.chat(r#"{"message":"hi"}"#).send().await.unwrap();
    assert_eq!(
        off.status(),
        StatusCode::OK,
        "read once at startup: still off"
    );
}

#[tokio::test]
async fn the_per_ip_limiter_should_run_before_the_meter() {
    let h = start(None).await;
    let burst = RateLimits::default().chat_burst.get() as usize;
    for _ in 0..=burst {
        drop(h.chat(r#"{"message":"hi"}"#).send().await.unwrap());
    }
    // The over-limit turn never reached the meter.
    assert_eq!(h.meter.reservations(), burst);
}

#[tokio::test]
async fn forwarded_turns_should_carry_memory_disabled() {
    let h = start(None).await;
    drop(
        h.chat(r#"{"message":"hi","memory_enabled":true}"#)
            .send()
            .await
            .unwrap(),
    );
    assert_eq!(json(&h.stub.last().body)["memory_enabled"], false);
}

#[tokio::test]
async fn responses_should_carry_report_only_csp_with_the_theme_hash_and_permissions_policy() {
    let h = start(None).await;
    let res = h.http.get(format!("{}/", h.base)).send().await.unwrap();
    let headers = res.headers();
    let csp = headers["content-security-policy-report-only"]
        .to_str()
        .unwrap();
    assert!(
        csp.contains(&format!(
            "script-src 'self' 'wasm-unsafe-eval' {FIXTURE_THEME_HASH}"
        )),
        "{csp}"
    );
    assert!(csp.contains("report-uri /api/csp-report"), "{csp}");
    assert!(
        headers.get("content-security-policy").is_none(),
        "not enforced yet"
    );
    assert_eq!(
        headers["reporting-endpoints"],
        "csp-endpoint=\"/api/csp-report\""
    );
    let permissions = headers["permissions-policy"].to_str().unwrap();
    for feature in ["camera=()", "microphone=()", "geolocation=()"] {
        assert!(permissions.contains(feature), "{permissions}");
    }
}

#[tokio::test]
async fn csp_reports_should_be_accepted() {
    let h = start(None).await;
    let res = h
        .http
        .post(format!("{}/api/csp-report", h.base))
        .header("content-type", "application/csp-report")
        .body(r#"{"csp-report":{"effective-directive":"img-src","blocked-uri":"https://x.example/a"}}"#)
        .send()
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::NO_CONTENT);
    let bad = h
        .http
        .post(format!("{}/api/csp-report", h.base))
        .body("not json")
        .send()
        .await
        .unwrap();
    assert_eq!(bad.status(), StatusCode::BAD_REQUEST);
    assert_eq!(h.stub.count(), 0);
}
