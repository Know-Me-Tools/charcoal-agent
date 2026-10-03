// TJ-ARCH-MOB-001 compliant
//! Client address resolution for per-IP rate limiting.
//!
//! `X-Forwarded-For` is caller-controlled except for the entries appended by
//! proxies we operate. Each trusted hop appends the address it saw, so with
//! `trusted_hops = N` the client is the N-th entry from the right. Left-most
//! entries are never trusted: a caller can put anything there.
//!
//! In the cluster Envoy Gateway is the single trusted hop (N = 1): it appends
//! the downstream address it saw. Compose has no proxy in front (N = 0), so
//! the TCP peer is used and XFF is ignored entirely.

use std::net::{IpAddr, Ipv6Addr};

pub fn resolve_client_ip(peer: IpAddr, forwarded_for: &[&str], trusted_hops: usize) -> IpAddr {
    if trusted_hops == 0 {
        return peer;
    }
    let entries: Vec<&str> = forwarded_for
        .iter()
        .flat_map(|value| value.split(','))
        .map(str::trim)
        .filter(|entry| !entry.is_empty())
        .collect();
    // Fewer entries than trusted hops means the request did not traverse our
    // proxies as configured; the peer is the only address we can stand behind.
    let Some(index) = entries.len().checked_sub(trusted_hops) else {
        return peer;
    };
    entries[index].parse().unwrap_or(peer)
}

/// The rate-limit bucket for a client address. One IPv6 host normally holds
/// a whole /64, so keying on the full address would give it 2^64 buckets;
/// IPv4-mapped IPv6 collapses to its IPv4 address.
pub fn rate_limit_key(ip: IpAddr) -> IpAddr {
    match ip {
        IpAddr::V4(_) => ip,
        IpAddr::V6(v6) => match v6.to_ipv4_mapped() {
            Some(v4) => IpAddr::V4(v4),
            None => {
                let s = v6.segments();
                IpAddr::V6(Ipv6Addr::new(s[0], s[1], s[2], s[3], 0, 0, 0, 0))
            }
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn ipv6_addresses_in_one_slash_64_should_share_a_bucket() {
        let a: IpAddr = "2001:db8:1:2::1".parse().unwrap();
        let b: IpAddr = "2001:db8:1:2:ffff::9".parse().unwrap();
        let other: IpAddr = "2001:db8:1:3::1".parse().unwrap();
        assert_eq!(rate_limit_key(a), rate_limit_key(b));
        assert_ne!(rate_limit_key(a), rate_limit_key(other));
    }

    #[test]
    fn ipv4_mapped_ipv6_should_key_as_ipv4() {
        let mapped: IpAddr = "::ffff:203.0.113.7".parse().unwrap();
        assert_eq!(
            rate_limit_key(mapped),
            "203.0.113.7".parse::<IpAddr>().unwrap()
        );
    }

    const PEER: IpAddr = IpAddr::V4(std::net::Ipv4Addr::new(10, 0, 0, 9));

    #[test]
    fn zero_hops_should_ignore_forwarded_for() {
        assert_eq!(resolve_client_ip(PEER, &["203.0.113.7"], 0), PEER);
    }

    #[test]
    fn one_hop_should_take_the_right_most_entry_not_the_spoofed_left_one() {
        let ip = resolve_client_ip(PEER, &["1.2.3.4, 203.0.113.7"], 1);
        assert_eq!(ip, "203.0.113.7".parse::<IpAddr>().unwrap());
    }

    #[test]
    fn multiple_header_lines_should_be_read_in_order() {
        let ip = resolve_client_ip(PEER, &["1.2.3.4", "203.0.113.7"], 1);
        assert_eq!(ip, "203.0.113.7".parse::<IpAddr>().unwrap());
    }

    #[test]
    fn missing_or_short_header_should_fall_back_to_peer() {
        assert_eq!(resolve_client_ip(PEER, &[], 1), PEER);
        assert_eq!(resolve_client_ip(PEER, &["203.0.113.7"], 2), PEER);
    }

    #[test]
    fn unparseable_entry_should_fall_back_to_peer() {
        assert_eq!(resolve_client_ip(PEER, &["not-an-ip"], 1), PEER);
    }
}
