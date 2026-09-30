// TJ-ARCH-MOB-001 compliant
//! Runtime configuration, read once from the environment at startup.

use std::num::NonZeroU32;
use std::path::PathBuf;

const DEFAULT_PORT: u16 = 8080;
const DEFAULT_AGENT_ID: &str = "knowme-site";

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum ConfigError {
    #[error("UAR_UPSTREAM is required (e.g. http://uar:6565)")]
    MissingUpstream,
    #[error("UAR_UPSTREAM must be an http:// URL without query or fragment: {0}")]
    InvalidUpstream(String),
    #[error("{name} is not a valid value: {value}")]
    InvalidNumber { name: &'static str, value: String },
    #[error("SITE_PROXY_API_KEY contains characters not allowed in an HTTP header")]
    InvalidApiKey,
    #[error("SITE_AGENT_ID must not be empty")]
    EmptyAgentId,
}

/// Per-client-IP quotas. GCRA: `per_minute` replenish rate, `burst` capacity.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RateLimits {
    pub chat_per_minute: NonZeroU32,
    pub chat_burst: NonZeroU32,
    pub api_per_minute: NonZeroU32,
    pub api_burst: NonZeroU32,
}

impl Default for RateLimits {
    fn default() -> Self {
        // Chat turns cost model tokens; everything else is cheap reads/deletes.
        Self {
            chat_per_minute: NonZeroU32::new(10).unwrap_or(NonZeroU32::MIN),
            chat_burst: NonZeroU32::new(5).unwrap_or(NonZeroU32::MIN),
            api_per_minute: NonZeroU32::new(60).unwrap_or(NonZeroU32::MIN),
            api_burst: NonZeroU32::new(20).unwrap_or(NonZeroU32::MIN),
        }
    }
}

#[derive(Debug, Clone)]
pub struct Config {
    pub port: u16,
    /// Base URL without trailing slash, e.g. `http://uar:6565`.
    pub uar_upstream: String,
    /// Sent as `X-API-Key` on every proxied call. `None` sends no credential.
    pub site_proxy_api_key: Option<String>,
    pub site_agent_id: String,
    /// Proxies in front of this server that append to `X-Forwarded-For`.
    pub trusted_proxy_hops: usize,
    /// External asset mode: serve this compiled bundle instead of the embedded one.
    pub web_root: Option<PathBuf>,
    pub rate_limits: RateLimits,
}

impl Config {
    pub fn from_env() -> Result<Self, ConfigError> {
        Self::from_lookup(|name| std::env::var(name).ok())
    }

    pub fn from_lookup(lookup: impl Fn(&str) -> Option<String>) -> Result<Self, ConfigError> {
        let get = |name: &str| {
            lookup(name)
                .map(|v| v.trim().to_owned())
                .filter(|v| !v.is_empty())
        };

        let uar_upstream =
            parse_upstream(&get("UAR_UPSTREAM").ok_or(ConfigError::MissingUpstream)?)?;
        let site_proxy_api_key = get("SITE_PROXY_API_KEY");
        if site_proxy_api_key
            .as_deref()
            .is_some_and(|k| axum::http::HeaderValue::from_str(k).is_err())
        {
            return Err(ConfigError::InvalidApiKey);
        }
        let site_agent_id = match lookup("SITE_AGENT_ID") {
            None => DEFAULT_AGENT_ID.to_owned(),
            Some(v) if v.trim().is_empty() => return Err(ConfigError::EmptyAgentId),
            Some(v) => v.trim().to_owned(),
        };

        Ok(Self {
            port: parse_number("PORT", get("PORT"), DEFAULT_PORT)?,
            uar_upstream,
            site_proxy_api_key,
            site_agent_id,
            trusted_proxy_hops: parse_number("TRUSTED_PROXY_HOPS", get("TRUSTED_PROXY_HOPS"), 0)?,
            web_root: get("KNOWME_WEB_ROOT").map(PathBuf::from),
            rate_limits: chat_limits(&get)?,
        })
    }
}

/// Chat quota overrides. The limiter is in memory per replica, so a
/// deployment with N replicas sets 1/N of the intended per-client quota.
fn chat_limits(get: &impl Fn(&str) -> Option<String>) -> Result<RateLimits, ConfigError> {
    let defaults = RateLimits::default();
    Ok(RateLimits {
        chat_per_minute: parse_number(
            "CHAT_RATE_PER_MIN",
            get("CHAT_RATE_PER_MIN"),
            defaults.chat_per_minute,
        )?,
        chat_burst: parse_number("CHAT_BURST", get("CHAT_BURST"), defaults.chat_burst)?,
        ..defaults
    })
}

fn parse_upstream(raw: &str) -> Result<String, ConfigError> {
    let invalid = || ConfigError::InvalidUpstream(raw.to_owned());
    let url = reqwest::Url::parse(raw).map_err(|_| invalid())?;
    // The client is built without TLS; https would fail on every request.
    if url.scheme() != "http"
        || url.host_str().is_none()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err(invalid());
    }
    Ok(url.as_str().trim_end_matches('/').to_owned())
}

fn parse_number<T: std::str::FromStr>(
    name: &'static str,
    raw: Option<String>,
    default: T,
) -> Result<T, ConfigError> {
    match raw {
        None => Ok(default),
        Some(value) => value
            .parse()
            .map_err(|_| ConfigError::InvalidNumber { name, value }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn config(vars: &[(&str, &str)]) -> Result<Config, ConfigError> {
        let map: HashMap<String, String> = vars
            .iter()
            .map(|(k, v)| ((*k).into(), (*v).into()))
            .collect();
        Config::from_lookup(|name| map.get(name).cloned())
    }

    #[test]
    fn defaults_should_apply_when_only_upstream_is_set() {
        let cfg = config(&[("UAR_UPSTREAM", "http://uar:6565/")]).unwrap();
        assert_eq!(cfg.rate_limits, RateLimits::default());
        assert_eq!(
            (
                cfg.port,
                cfg.uar_upstream.as_str(),
                cfg.site_agent_id.as_str()
            ),
            (8080, "http://uar:6565", "knowme-site")
        );
        assert_eq!((cfg.trusted_proxy_hops, cfg.site_proxy_api_key), (0, None));
    }

    #[test]
    fn chat_quota_should_be_configurable_and_reject_zero() {
        let cfg = config(&[
            ("UAR_UPSTREAM", "http://uar"),
            ("CHAT_RATE_PER_MIN", "5"),
            ("CHAT_BURST", "3"),
        ])
        .unwrap();
        assert_eq!(
            (
                cfg.rate_limits.chat_per_minute.get(),
                cfg.rate_limits.chat_burst.get()
            ),
            (5, 3)
        );
        assert_eq!(
            cfg.rate_limits.api_per_minute,
            RateLimits::default().api_per_minute
        );
        let zero = config(&[("UAR_UPSTREAM", "http://uar"), ("CHAT_BURST", "0")]);
        assert!(matches!(
            zero,
            Err(ConfigError::InvalidNumber {
                name: "CHAT_BURST",
                ..
            })
        ));
    }

    #[test]
    fn missing_upstream_should_fail() {
        assert_eq!(config(&[]).unwrap_err(), ConfigError::MissingUpstream);
    }

    #[test]
    fn https_upstream_should_fail() {
        assert!(matches!(
            config(&[("UAR_UPSTREAM", "https://uar")]),
            Err(ConfigError::InvalidUpstream(_))
        ));
    }
}
