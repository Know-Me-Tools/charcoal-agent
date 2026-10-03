// TJ-ARCH-MOB-001 compliant
//! SurrealDB HTTP client for the token meter (`ns=site`, `db=meter`).
//!
//! Signs in once as the database user (`POST /signin`) and sends SurrealQL
//! to `POST /sql` with the bearer token and the `surreal-ns`/`surreal-db`
//! headers. An expired token (401/403) triggers one fresh sign-in and one
//! retry. Every call has a short timeout: the meter sits in front of every
//! chat turn, and a hung store must fail the turn closed, not hang it.
//! The password is never logged; errors carry statuses, not bodies.

use std::time::Duration;

use axum::body::Bytes;
use reqwest::StatusCode;
use serde_json::{Value, json};
use tokio::sync::Mutex;

use crate::domain::meter::{
    Budgets, MeterResponseError, Periods, ReserveResult, Totals, TurnRecord,
    parse_reserve_response, parse_settle_response, reserve_query, settle_query,
};

const REQUEST_TIMEOUT: Duration = Duration::from_secs(3);
const CONNECT_TIMEOUT: Duration = Duration::from_secs(2);

#[derive(Debug, thiserror::Error)]
pub enum MeterStoreError {
    #[error("meter store unreachable: {0}")]
    Unreachable(#[source] reqwest::Error),
    #[error("meter store returned {0}")]
    Status(StatusCode),
    #[error("meter store URL is invalid")]
    InvalidUrl,
    #[error("meter sign-in returned no token")]
    NoToken,
    #[error(transparent)]
    Response(#[from] MeterResponseError),
}

/// Connection settings; see `config.rs` for the environment names.
#[derive(Clone)]
pub struct MeterStoreConfig {
    /// Base URL without trailing slash, e.g. `http://surrealdb:8000`.
    pub url: String,
    pub namespace: String,
    pub database: String,
    pub user: String,
    pub password: String,
}

impl std::fmt::Debug for MeterStoreConfig {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("MeterStoreConfig")
            .field("url", &self.url)
            .field("namespace", &self.namespace)
            .field("database", &self.database)
            .field("user", &self.user)
            .field("password", &"<redacted>")
            .finish()
    }
}

#[derive(Debug)]
pub struct MeterStore {
    http: reqwest::Client,
    config: MeterStoreConfig,
    token: Mutex<Option<String>>,
}

impl MeterStore {
    pub fn new(config: MeterStoreConfig) -> Result<Self, reqwest::Error> {
        let http = reqwest::Client::builder()
            .connect_timeout(CONNECT_TIMEOUT)
            .timeout(REQUEST_TIMEOUT)
            .redirect(reqwest::redirect::Policy::none())
            .no_proxy()
            .build()?;
        Ok(Self {
            http,
            config,
            token: Mutex::new(None),
        })
    }

    /// Reserves `n` on both period rows in one transaction.
    pub async fn reserve(
        &self,
        periods: &Periods,
        n: u64,
        budgets: Budgets,
    ) -> Result<ReserveResult, MeterStoreError> {
        let body = self.sql(reserve_query(periods, n, budgets), &[]).await?;
        Ok(parse_reserve_response(&body)?)
    }

    /// Settles a turn against its recorded rows and writes its FR-38 record.
    pub async fn settle(&self, record: &TurnRecord) -> Result<Totals, MeterStoreError> {
        let model = record.usage.model.clone().unwrap_or_default();
        let vars = [
            ("model", model.as_str()),
            ("outcome", record.outcome.as_str()),
        ];
        let body = self.sql(settle_query(record), &vars).await?;
        Ok(parse_settle_response(&body)?)
    }

    async fn sql(&self, query: String, vars: &[(&str, &str)]) -> Result<Bytes, MeterStoreError> {
        let token = self.token(false).await?;
        match self.send_sql(&token, &query, vars).await {
            Err(MeterStoreError::Status(StatusCode::UNAUTHORIZED | StatusCode::FORBIDDEN)) => {
                let fresh = self.token(true).await?;
                self.send_sql(&fresh, &query, vars).await
            }
            other => other,
        }
    }

    async fn send_sql(
        &self,
        token: &str,
        query: &str,
        vars: &[(&str, &str)],
    ) -> Result<Bytes, MeterStoreError> {
        // Variables travel as URL query parameters (`$name` in the query).
        let mut url = reqwest::Url::parse(&format!("{}/sql", self.config.url))
            .map_err(|_| MeterStoreError::InvalidUrl)?;
        if !vars.is_empty() {
            url.query_pairs_mut().extend_pairs(vars);
        }
        let response = self
            .http
            .post(url)
            .bearer_auth(token)
            .header("accept", "application/json")
            .header("surreal-ns", &self.config.namespace)
            .header("surreal-db", &self.config.database)
            .body(query.to_owned())
            .send()
            .await
            .map_err(MeterStoreError::Unreachable)?;
        if !response.status().is_success() {
            return Err(MeterStoreError::Status(response.status()));
        }
        response.bytes().await.map_err(MeterStoreError::Unreachable)
    }

    /// The cached token, or a fresh sign-in when `refresh` or none is held.
    async fn token(&self, refresh: bool) -> Result<String, MeterStoreError> {
        let mut held = self.token.lock().await;
        if let Some(token) = held.as_ref().filter(|_| !refresh) {
            return Ok(token.clone());
        }
        let response = self
            .http
            .post(format!("{}/signin", self.config.url))
            .header("accept", "application/json")
            .header("content-type", "application/json")
            .body(
                json!({
                    "ns": self.config.namespace,
                    "db": self.config.database,
                    "user": self.config.user,
                    "pass": self.config.password,
                })
                .to_string(),
            )
            .send()
            .await
            .map_err(MeterStoreError::Unreachable)?;
        if !response.status().is_success() {
            *held = None;
            return Err(MeterStoreError::Status(response.status()));
        }
        let body = response
            .bytes()
            .await
            .map_err(MeterStoreError::Unreachable)?;
        let value: Value = serde_json::from_slice(&body).map_err(|_| MeterStoreError::NoToken)?;
        let token = value
            .get("token")
            .and_then(Value::as_str)
            .ok_or(MeterStoreError::NoToken)?
            .to_owned();
        *held = Some(token.clone());
        Ok(token)
    }
}
