// TJ-ARCH-MOB-001 compliant
//! site-websearch: the one web-search MCP tool of the public KnowMe site
//! agent (OpenSpec change `site-web-search`).
//!
//! Layers: `interface` (MCP over HTTP, guard) -> `application` (the search
//! use case and its ports) -> `domain` (query, projection, cap) <-
//! `infrastructure` (Firecrawl client, daily counter).

pub mod application;
pub mod config;
pub mod domain;
pub mod infrastructure;
pub mod interface;

use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use axum::Router;

use crate::application::search::SearchService;
use crate::config::Config;
use crate::infrastructure::counter::{Clock, DailyCounter, SystemClock};
use crate::infrastructure::firecrawl::{
    ClientError, FIRECRAWL_ORIGIN, FirecrawlClient, FirecrawlKey, UPSTREAM_TIMEOUT,
};
use crate::interface::auth::McpAuth;
use crate::interface::state::AppState;

#[derive(Debug, thiserror::Error)]
pub enum StartupError {
    #[error(transparent)]
    Client(#[from] ClientError),
}

/// Everything the app is built from. [`AppParts::from_config`] is the
/// production wiring; tests build one directly to point the client at a fake
/// upstream, shorten the timeout, or move the clock.
pub struct AppParts {
    pub firecrawl_key: FirecrawlKey,
    pub mcp_auth: McpAuth,
    pub daily_cap: u32,
    pub cap_state_file: Option<PathBuf>,
    pub firecrawl_origin: String,
    pub upstream_timeout: Duration,
    pub clock: Arc<dyn Clock>,
}

impl AppParts {
    pub fn from_config(config: Config) -> Self {
        Self {
            firecrawl_key: config.firecrawl_key,
            mcp_auth: config.mcp_auth,
            daily_cap: config.daily_cap,
            cap_state_file: config.cap_state_file,
            firecrawl_origin: FIRECRAWL_ORIGIN.to_owned(),
            upstream_timeout: UPSTREAM_TIMEOUT,
            clock: Arc::new(SystemClock),
        }
    }
}

pub fn build_app(parts: AppParts) -> Result<Router, StartupError> {
    let client = FirecrawlClient::new(
        &parts.firecrawl_origin,
        &parts.firecrawl_key,
        parts.upstream_timeout,
    )?;
    let counter = DailyCounter::new(parts.daily_cap, parts.clock, parts.cap_state_file);
    let search = SearchService::new(Arc::new(client), Arc::new(counter));
    Ok(interface::router(
        AppState { search },
        Arc::new(parts.mcp_auth),
    ))
}
