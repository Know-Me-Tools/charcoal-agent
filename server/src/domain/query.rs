// TJ-ARCH-MOB-001 compliant
//! Per-route query-string allowlist: a client parameter reaches UAR only if
//! its route lists it. Anything else is dropped, not rejected.

/// The forwardable part of `raw`: the `&`-separated pairs whose name is in
/// `allowed`, in their original order and encoding. `None` when none remain.
pub fn allowlisted_query(raw: Option<&str>, allowed: &[&str]) -> Option<String> {
    let kept: Vec<&str> = raw?
        .split('&')
        .filter(|pair| {
            let name = pair.split_once('=').map_or(*pair, |(name, _)| name);
            !name.is_empty() && allowed.contains(&name)
        })
        .collect();
    (!kept.is_empty()).then(|| kept.join("&"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn unlisted_parameters_should_be_dropped() {
        assert_eq!(
            allowlisted_query(Some("agent_id=x&limit=5&debug"), &["limit"]),
            Some("limit=5".to_owned())
        );
        assert_eq!(allowlisted_query(Some("agent_id=x&model=y"), &[]), None);
        assert_eq!(allowlisted_query(None, &["limit"]), None);
    }

    #[test]
    fn names_should_match_exactly_not_by_prefix_or_decoding() {
        assert_eq!(
            allowlisted_query(Some("limitx=1&lim%69t=2&=3&limit"), &["limit"]),
            Some("limit".to_owned())
        );
    }
}
