// TJ-ARCH-MOB-001 compliant
//! Per-client-IP GCRA limiter (governor), in memory per replica.

use std::net::IpAddr;
use std::num::NonZeroU32;
use std::time::Duration;

use governor::clock::{Clock, DefaultClock};
use governor::{DefaultKeyedRateLimiter, Quota, RateLimiter};

#[derive(Debug)]
pub struct ClientRateLimiter {
    limiter: DefaultKeyedRateLimiter<IpAddr>,
    clock: DefaultClock,
}

impl ClientRateLimiter {
    pub fn new(per_minute: NonZeroU32, burst: NonZeroU32) -> Self {
        let quota = Quota::per_minute(per_minute).allow_burst(burst);
        Self {
            limiter: RateLimiter::keyed(quota),
            clock: DefaultClock::default(),
        }
    }

    /// `Err(wait)` when `client` is over quota.
    pub fn check(&self, client: IpAddr) -> Result<(), Duration> {
        self.limiter
            .check_key(&client)
            .map_err(|not_until| not_until.wait_time_from(self.clock.now()))
    }

    /// Drops state for clients whose buckets are full again; bounds memory.
    pub fn evict_idle(&self) {
        self.limiter.retain_recent();
        self.limiter.shrink_to_fit();
    }
}
