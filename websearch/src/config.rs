// TJ-ARCH-MOB-001 compliant
//! Runtime configuration, read once from the environment at start-up.
//!
//! - `FIRECRAWL_API_KEY` (required): the Firecrawl key, from Secret
//!   `websearch-firecrawl` key `FIRECRAWL_API_KEY`. Never logged; a missing
//!   or empty value stops start-up with a message that names the variable
//!   only.
//! - `WEBSEARCH_MCP_AUTH` (required): the exact `Authorization` header UAR
//!   sends, `Bearer <token>` with a token of at least 32 characters, from
//!   Secret `uar-secrets` key `WEBSEARCH_MCP_AUTH` (the same value UAR's
//!   `mcp.json` resolves). Never logged.
//! - `WEBSEARCH_DAILY_CAP`: searches per UTC day, default 300 (OD-8). `0`
//!   turns search off (every call returns the "unavailable" result).
//! - `WEBSEARCH_CAP_STATE_FILE`: file that keeps the day's count across a
//!   container restart (an `emptyDir` path in the cluster). Unset keeps the
//!   count in memory only.
//! - `PORT`: listen port, default 8080.
//!
//! The Firecrawl origin and the 10 second timeout are constants, not
//! configuration (`infrastructure::firecrawl`).

use std::path::PathBuf;

use crate::domain::cap::DEFAULT_DAILY_CAP;
use crate::infrastructure::firecrawl::FirecrawlKey;
use crate::interface::auth::{AuthConfigError, McpAuth};

const DEFAULT_PORT: u16 = 8080;

#[derive(Debug, Clone, Copy, PartialEq, Eq, thiserror::Error)]
pub enum ConfigError {
    #[error("FIRECRAWL_API_KEY is not set or empty")]
    MissingFirecrawlKey,
    #[error("WEBSEARCH_MCP_AUTH is not set or empty")]
    MissingMcpAuth,
    #[error(transparent)]
    InvalidMcpAuth(#[from] AuthConfigError),
    #[error("WEBSEARCH_DAILY_CAP must be a whole number from 0 to 100000")]
    InvalidDailyCap,
    #[error("PORT must be a number from 1 to 65535")]
    InvalidPort,
}

/// Upper bound on `WEBSEARCH_DAILY_CAP`, against a typo adding zeros.
const MAX_DAILY_CAP: u32 = 100_000;

#[derive(Debug)]
pub struct Config {
    pub port: u16,
    pub firecrawl_key: FirecrawlKey,
    pub mcp_auth: McpAuth,
    pub daily_cap: u32,
    pub cap_state_file: Option<PathBuf>,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        Self::from_lookup(|name| std::env::var(name).ok())
    }

    /// `lookup` returns the raw value of a variable, if set.
    pub fn from_lookup(lookup: impl Fn(&str) -> Option<String>) -> Result<Self, ConfigError> {
        let firecrawl_key = lookup("FIRECRAWL_API_KEY")
            .as_deref()
            .and_then(FirecrawlKey::new)
            .ok_or(ConfigError::MissingFirecrawlKey)?;
        let auth_raw = lookup("WEBSEARCH_MCP_AUTH")
            .filter(|value| !value.trim().is_empty())
            .ok_or(ConfigError::MissingMcpAuth)?;
        let mcp_auth = McpAuth::parse(&auth_raw)?;
        let daily_cap = match lookup("WEBSEARCH_DAILY_CAP") {
            None => DEFAULT_DAILY_CAP,
            Some(raw) => raw
                .trim()
                .parse::<u32>()
                .ok()
                .filter(|cap| *cap <= MAX_DAILY_CAP)
                .ok_or(ConfigError::InvalidDailyCap)?,
        };
        let port = match lookup("PORT") {
            None => DEFAULT_PORT,
            Some(raw) => raw
                .trim()
                .parse::<u16>()
                .ok()
                .filter(|port| *port != 0)
                .ok_or(ConfigError::InvalidPort)?,
        };
        let cap_state_file = lookup("WEBSEARCH_CAP_STATE_FILE")
            .map(|raw| raw.trim().to_owned())
            .filter(|raw| !raw.is_empty())
            .map(PathBuf::from);
        Ok(Self {
            port,
            firecrawl_key,
            mcp_auth,
            daily_cap,
            cap_state_file,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    const KEY: &str = "fc-test-value-that-must-not-leak";
    const AUTH: &str = "Bearer test-token-0123456789abcdef0123456789";

    fn lookup(pairs: &[(&str, &str)]) -> impl Fn(&str) -> Option<String> {
        let map: HashMap<String, String> = pairs
            .iter()
            .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
            .collect();
        move |name| map.get(name).cloned()
    }

    #[test]
    fn from_lookup_should_fail_without_the_firecrawl_key() {
        let result = Config::from_lookup(lookup(&[("WEBSEARCH_MCP_AUTH", AUTH)]));
        assert_eq!(result.err(), Some(ConfigError::MissingFirecrawlKey));
    }

    #[test]
    fn from_lookup_should_fail_with_an_empty_firecrawl_key() {
        let result = Config::from_lookup(lookup(&[
            ("FIRECRAWL_API_KEY", " "),
            ("WEBSEARCH_MCP_AUTH", AUTH),
        ]));
        assert_eq!(result.err(), Some(ConfigError::MissingFirecrawlKey));
    }

    #[test]
    fn from_lookup_should_fail_without_the_mcp_auth() {
        let result = Config::from_lookup(lookup(&[("FIRECRAWL_API_KEY", KEY)]));
        assert_eq!(result.err(), Some(ConfigError::MissingMcpAuth));
    }

    #[test]
    fn from_lookup_should_default_the_cap_to_300_and_the_port_to_8080() {
        let config = Config::from_lookup(lookup(&[
            ("FIRECRAWL_API_KEY", KEY),
            ("WEBSEARCH_MCP_AUTH", AUTH),
        ]));
        assert_eq!(
            config.map(|c| (c.daily_cap, c.port, c.cap_state_file)),
            Ok((300, 8080, None))
        );
    }

    #[test]
    fn from_lookup_should_reject_a_non_numeric_cap() {
        let result = Config::from_lookup(lookup(&[
            ("FIRECRAWL_API_KEY", KEY),
            ("WEBSEARCH_MCP_AUTH", AUTH),
            ("WEBSEARCH_DAILY_CAP", "lots"),
        ]));
        assert_eq!(result.err(), Some(ConfigError::InvalidDailyCap));
    }

    #[test]
    fn debug_and_errors_should_never_contain_the_secret_values() {
        let config = Config::from_lookup(lookup(&[
            ("FIRECRAWL_API_KEY", KEY),
            ("WEBSEARCH_MCP_AUTH", AUTH),
        ]));
        let printed = format!("{config:?}");
        let error = Config::from_lookup(lookup(&[
            ("FIRECRAWL_API_KEY", KEY),
            ("WEBSEARCH_MCP_AUTH", "Basic not-bearer-secret"),
        ]))
        .err()
        .map(|e| e.to_string())
        .unwrap_or_default();
        assert!(
            !printed.contains(KEY)
                && !printed.contains("test-token")
                && !error.contains("not-bearer-secret")
        );
    }
}
