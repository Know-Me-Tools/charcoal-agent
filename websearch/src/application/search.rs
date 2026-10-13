// TJ-ARCH-MOB-001 compliant
//! The search use case: validate, admit under the daily cap, call the
//! upstream once, project.
//!
//! Order matters: an invalid query is rejected before the cap is touched (it
//! costs nothing), and an exhausted cap returns before the upstream is
//! called (zero upstream requests past the cap).
//!
//! Logging: one line per call with a fixed `outcome` code, the result count
//! and the day's count. Never the query, never upstream text, never a key.

use std::future::Future;
use std::pin::Pin;
use std::sync::Arc;

use crate::domain::cap::Admission;
use crate::domain::query::{QueryError, SearchQuery};
use crate::domain::results::{RawHit, SearchOutput, project};

/// Why the upstream produced no hits. Messages are fixed text: they never
/// carry upstream bodies, URLs or headers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, thiserror::Error)]
pub enum UpstreamError {
    #[error("upstream timed out")]
    Timeout,
    #[error("upstream returned a non-success status")]
    Status,
    #[error("upstream transport failed")]
    Transport,
    #[error("upstream response was too large")]
    TooLarge,
    #[error("upstream response was malformed")]
    Malformed,
    #[error("upstream reported failure")]
    Unsuccessful,
}

impl UpstreamError {
    /// Stable log code.
    pub const fn code(self) -> &'static str {
        match self {
            Self::Timeout => "upstream_timeout",
            Self::Status => "upstream_status",
            Self::Transport => "upstream_transport",
            Self::TooLarge => "upstream_too_large",
            Self::Malformed => "upstream_malformed",
            Self::Unsuccessful => "upstream_unsuccessful",
        }
    }
}

pub type SearchFuture<'a> =
    Pin<Box<dyn Future<Output = Result<Vec<RawHit>, UpstreamError>> + Send + 'a>>;

/// Port: the one upstream search call.
pub trait SearchPort: Send + Sync {
    fn search<'a>(&'a self, query: &'a SearchQuery) -> SearchFuture<'a>;
}

/// Port: the daily cap counter.
pub trait UsageGate: Send + Sync {
    fn try_admit(&self) -> Admission;
}

/// Result of one tool call.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SearchOutcome {
    /// The query failed validation; nothing was counted or called.
    Invalid(QueryError),
    /// Projected results (possibly empty).
    Results(SearchOutput),
    /// The fixed "search unavailable" result: cap reached or upstream
    /// failure.
    Unavailable(SearchOutput),
}

#[derive(Clone)]
pub struct SearchService {
    upstream: Arc<dyn SearchPort>,
    usage: Arc<dyn UsageGate>,
}

impl SearchService {
    pub fn new(upstream: Arc<dyn SearchPort>, usage: Arc<dyn UsageGate>) -> Self {
        Self { upstream, usage }
    }

    pub async fn search(&self, raw_query: &str) -> SearchOutcome {
        let query = match SearchQuery::parse(raw_query) {
            Ok(query) => query,
            Err(err) => {
                tracing::info!(outcome = "invalid_query", reason = %err, "search");
                return SearchOutcome::Invalid(err);
            }
        };
        let used = match self.usage.try_admit() {
            Admission::Admitted { used } => used,
            Admission::Exhausted => {
                tracing::warn!(outcome = "cap_reached", "search");
                return SearchOutcome::Unavailable(SearchOutput::unavailable());
            }
        };
        match self.upstream.search(&query).await {
            Ok(hits) => {
                let output = project(&hits);
                tracing::info!(
                    outcome = "ok",
                    upstream_hits = hits.len(),
                    results = output.results().len(),
                    used_today = used,
                    "search"
                );
                SearchOutcome::Results(output)
            }
            Err(err) => {
                tracing::warn!(outcome = err.code(), used_today = used, "search");
                SearchOutcome::Unavailable(SearchOutput::unavailable())
            }
        }
    }
}
